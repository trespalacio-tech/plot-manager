import { getDb } from '@/lib/db/db';
import { ensureIdentity } from './identity';
import {
  applyRemoteOp,
  isOpKnown,
  localVectorClock,
  opsSince,
} from './log';
import type { Op, PeerRecord, VectorClock } from './types';

/**
 * Protocolo de sincronización sobre un DataChannel ya conectado.
 *
 * Ambos peers ejecutan `runSyncSession(channel)` simultáneamente. El
 * protocolo es simétrico: cada uno envía HELLO con su vector clock y
 * espera el del otro; intercambia ops faltantes en lotes; señaliza DONE
 * cuando ya no le queda nada por mandar.
 *
 * Mensajes:
 *  - HELLO        { kind, deviceId, vectorClock }
 *  - REQUEST_OPS  { kind, since }   // since[deviceId] = lastSeq visto
 *  - OPS_BATCH    { kind, ops, more }
 *  - DONE         { kind }
 *
 * El JSON viaja en texto plano por el DataChannel (DTLS ya cifra).
 * Tamaño máximo recomendado por mensaje: 16 KB → batches de 50 ops.
 */

const BATCH_SIZE = 50;
const SESSION_TIMEOUT_MS = 60_000;

type Msg =
  | { kind: 'HELLO'; deviceId: string; vectorClock: VectorClock }
  | { kind: 'REQUEST_OPS'; since: VectorClock }
  | { kind: 'OPS_BATCH'; ops: Op[]; more: boolean }
  | { kind: 'DONE' };

export interface SyncStats {
  peerDeviceId: string;
  sentOps: number;
  receivedOps: number;
  appliedOps: number;
  durationMs: number;
}

export interface SyncProgress {
  phase: 'hello' | 'sending' | 'receiving' | 'done';
  sentOps: number;
  receivedOps: number;
  appliedOps: number;
}

export interface SyncOptions {
  /** Callback periódico de progreso (UI). */
  onProgress?: (p: SyncProgress) => void;
  /** Si se conoce, autorizamos solo a este peer (anti-MITM básico). */
  expectedPeerId?: string;
}

/**
 * Ejecuta una sesión completa de sync. La promesa resuelve con stats
 * cuando ambos lados han enviado DONE; rechaza si timeout o el peer
 * no es el esperado.
 */
export async function runSyncSession(
  channel: RTCDataChannel,
  options: SyncOptions = {},
): Promise<SyncStats> {
  const ident = await ensureIdentity();
  const startedAt = Date.now();

  const stats = { sentOps: 0, receivedOps: 0, appliedOps: 0 };
  let phase: SyncProgress['phase'] = 'hello';
  const reportProgress = () => {
    options.onProgress?.({ phase, ...stats });
  };
  reportProgress();

  // Buffer de mensajes entrantes parseados.
  const incoming: Msg[] = [];
  const waiters: Array<(msg: Msg) => void> = [];

  channel.onmessage = (e) => {
    try {
      const msg = JSON.parse(String(e.data)) as Msg;
      const next = waiters.shift();
      if (next) next(msg);
      else incoming.push(msg);
    } catch {
      // mensaje malformado: ignoramos
    }
  };

  const recv = (): Promise<Msg> =>
    new Promise<Msg>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('sync-timeout')),
        SESSION_TIMEOUT_MS,
      );
      const wrap = (m: Msg) => {
        clearTimeout(timeout);
        resolve(m);
      };
      const queued = incoming.shift();
      if (queued) wrap(queued);
      else waiters.push(wrap);
    });

  const send = (m: Msg) => {
    channel.send(JSON.stringify(m));
  };

  // 1. HELLO bidireccional
  send({
    kind: 'HELLO',
    deviceId: ident.deviceId,
    vectorClock: await localVectorClock(),
  });
  const hello = await recv();
  if (hello.kind !== 'HELLO') throw new Error('expected-hello');
  if (options.expectedPeerId && hello.deviceId !== options.expectedPeerId) {
    throw new Error('peer-id-mismatch');
  }
  const peerDeviceId = hello.deviceId;
  const peerVC: VectorClock = hello.vectorClock;

  // 2. Cada lado pide al otro lo que le falta
  phase = 'sending';
  reportProgress();
  send({ kind: 'REQUEST_OPS', since: await localVectorClock() });
  const req = await recv();
  if (req.kind !== 'REQUEST_OPS') throw new Error('expected-request');

  // 3. Le mandamos las ops que necesita en batches
  await sendOpsAfter(req.since, send, stats, reportProgress);
  send({ kind: 'OPS_BATCH', ops: [], more: false });

  // 4. Recibimos sus ops (puede llegar antes; recv los va consumiendo)
  phase = 'receiving';
  reportProgress();
  let receivedDone = false;
  while (!receivedDone) {
    const m = await recv();
    if (m.kind === 'OPS_BATCH') {
      stats.receivedOps += m.ops.length;
      for (const op of m.ops) {
        if (await isOpKnown(op.id)) continue;
        const changed = await applyRemoteOp(op);
        if (changed) stats.appliedOps += 1;
      }
      if (!m.more) receivedDone = true;
      reportProgress();
    } else if (m.kind === 'DONE') {
      receivedDone = true;
    } else {
      // mensajes inesperados se ignoran para no romper la sesión
    }
  }

  // 5. DONE bidireccional
  send({ kind: 'DONE' });
  await waitForDone(recv);

  phase = 'done';
  reportProgress();

  // 6. Persistir peer + último seq visto
  await upsertPeer(peerDeviceId, peerVC[peerDeviceId] ?? 0);

  return {
    peerDeviceId,
    sentOps: stats.sentOps,
    receivedOps: stats.receivedOps,
    appliedOps: stats.appliedOps,
    durationMs: Date.now() - startedAt,
  };
}

async function sendOpsAfter(
  since: VectorClock,
  send: (m: Msg) => void,
  stats: { sentOps: number },
  reportProgress: () => void,
): Promise<void> {
  // Recolectamos por deviceId todas las ops > since[deviceId]
  const allDeviceIds = await listAllDeviceIds();
  for (const deviceId of allDeviceIds) {
    const sinceSeq = since[deviceId] ?? 0;
    const opsToSend = await opsSince(deviceId, sinceSeq);
    for (let i = 0; i < opsToSend.length; i += BATCH_SIZE) {
      const chunk = opsToSend.slice(i, i + BATCH_SIZE);
      const isLast = i + BATCH_SIZE >= opsToSend.length;
      send({ kind: 'OPS_BATCH', ops: chunk, more: !isLast });
      stats.sentOps += chunk.length;
      reportProgress();
    }
  }
}

async function listAllDeviceIds(): Promise<string[]> {
  const db = getDb();
  // Truco: leemos todos los ops y agrupamos. Para escalas grandes
  // convendría un índice por deviceId. Mantengo simplicidad para ahora.
  const all = await db.ops.toArray();
  const set = new Set<string>();
  for (const op of all) set.add(op.deviceId);
  return Array.from(set);
}

async function waitForDone(recv: () => Promise<Msg>): Promise<void> {
  // El peer puede haber terminado antes; consumimos hasta ver DONE.
  while (true) {
    const m = await recv();
    if (m.kind === 'DONE') return;
    // ignoramos cualquier OPS_BATCH residual
  }
}

async function upsertPeer(
  peerDeviceId: string,
  lastSeenSeq: number,
): Promise<void> {
  const db = getDb();
  const existing = await db.peers.get(peerDeviceId);
  const now = new Date();
  if (existing) {
    await db.peers.put({
      ...existing,
      lastSyncAt: now,
      lastSeenSeq: Math.max(existing.lastSeenSeq, lastSeenSeq),
      updatedAt: now,
    });
  } else {
    const peer: PeerRecord = {
      id: peerDeviceId,
      publicKeyJwk: { kty: 'unknown' } as JsonWebKey, // se completa al pairing real
      lastSeenSeq,
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await db.peers.put(peer);
  }
}
