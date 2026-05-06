import { getDb } from '@/lib/db/db';
import { ensureIdentity, reserveNextSeq } from './identity';
import {
  applyDelete,
  applyPut,
  buildPutFields,
  deserializeValue,
} from './merge';
import type { Op, OpKind, SyncableTable } from './types';

/**
 * Operaciones del op-log contra Dexie.
 *
 * `recordOp` se llama desde los repos para registrar que un cambio
 * acaba de hacerse local; queda persistido en `ops` y se le asigna seq.
 *
 * `applyRemoteOp` aplica una op recibida desde otro peer: actualiza la
 * tabla destino con merge LWW por campo y persiste la op en `ops`.
 *
 * Ambos se ejecutan en transacciones que abarcan la tabla destino +
 * `ops` + `identity` para garantizar consistencia.
 */

interface RecordPutOptions {
  table: SyncableTable;
  recordId: string;
  /** Patch o registro completo. Cualquier objeto cuyas claves sean string. */
  patch: object;
}

interface RecordDeleteOptions {
  table: SyncableTable;
  recordId: string;
}

/**
 * Registra una op PUT local. NO escribe en la tabla destino: asume que
 * el repo ya lo hizo. La función responsabiliza solo del op-log.
 *
 * Se diseñó así porque cada repo tiene su lógica específica (defaults,
 * validaciones, índices secundarios) y forzarlos a pasar por aquí
 * obligaría a refactorizar 18 repos. Plan: en Fase 1.4 los wrappers
 * cambian la API mínimamente para llamar `recordOp` después de cada
 * mutación con éxito. El log queda eventualmente consistente con la
 * tabla en una sola transacción Dexie.
 */
export async function recordPut(opts: RecordPutOptions): Promise<Op> {
  const db = getDb();
  await ensureIdentity();
  const ts = Date.now();
  return db.transaction('rw', [db.ops, db.identity], async () => {
    const { deviceId, seq } = await reserveNextSeq();
    const op: Op = {
      id: `${deviceId}:${seq}`,
      deviceId,
      seq,
      ts,
      table: opts.table,
      recordId: opts.recordId,
      kind: 'PUT',
      fields: buildPutFields(opts.patch as Record<string, unknown>, ts),
    };
    await db.ops.add(op);
    return op;
  });
}

export async function recordDelete(opts: RecordDeleteOptions): Promise<Op> {
  const db = getDb();
  await ensureIdentity();
  const ts = Date.now();
  return db.transaction('rw', [db.ops, db.identity], async () => {
    const { deviceId, seq } = await reserveNextSeq();
    const op: Op = {
      id: `${deviceId}:${seq}`,
      deviceId,
      seq,
      ts,
      table: opts.table,
      recordId: opts.recordId,
      kind: 'DELETE',
    };
    await db.ops.add(op);
    return op;
  });
}

/**
 * Aplica una op recibida desde otro peer. Idempotente: si la misma op
 * llega dos veces (mismo id), la segunda es no-op.
 *
 * Devuelve `true` si modificó la tabla, `false` si fue obsoleta.
 */
export async function applyRemoteOp(op: Op): Promise<boolean> {
  const db = getDb();
  // Validaciones básicas: tabla conocida y id válido.
  const table = db.table(op.table);
  if (!table) return false;
  return db.transaction('rw', [table, db.ops], async () => {
    const existingOp = await db.ops.get(op.id);
    if (existingOp) return false;
    const current = await table.get(op.recordId);
    let changed = false;
    if (op.kind === 'PUT') {
      const opWithDeserialized = deserializeFields(op);
      const res = applyPut<any>(current, opWithDeserialized);
      if (res.changed) {
        const next = res.record;
        // No persistimos campos undefined; Dexie sí escribe undefined.
        await table.put({ ...next, id: op.recordId });
        changed = true;
      }
    } else {
      const res = applyDelete<any>(current, op);
      if (res.changed) {
        if (res.record) {
          await table.put({ ...res.record, id: op.recordId });
        }
        changed = true;
      }
    }
    await db.ops.add(op);
    return changed;
  });
}

function deserializeFields(op: Op): Op {
  if (!op.fields) return op;
  const out: Record<string, { value: unknown; ts: number }> = {};
  for (const [k, info] of Object.entries(op.fields)) {
    out[k] = { value: deserializeValue(info.value), ts: info.ts };
  }
  return { ...op, fields: out };
}

/**
 * Devuelve todas las ops emitidas por `deviceId` con seq > `sinceSeq`,
 * ordenadas por seq ascendente.
 */
export async function opsSince(
  deviceId: string,
  sinceSeq: number,
): Promise<Op[]> {
  const db = getDb();
  const rows = await db.ops
    .where('[deviceId+seq]')
    .between([deviceId, sinceSeq + 1], [deviceId, Infinity])
    .toArray();
  rows.sort((a, b) => a.seq - b.seq);
  return rows;
}

/**
 * Vector clock LOCAL: para cada deviceId que conocemos, el último seq
 * que hemos visto (incluido el nuestro propio).
 */
export async function localVectorClock(): Promise<Record<string, number>> {
  const db = getDb();
  const result: Record<string, number> = {};
  // Recorremos por deviceId con un index, agrupando el max seq.
  const all = await db.ops.toArray();
  for (const op of all) {
    const cur = result[op.deviceId] ?? 0;
    if (op.seq > cur) result[op.deviceId] = op.seq;
  }
  return result;
}

export async function isOpKnown(opId: string): Promise<boolean> {
  return (await getDb().ops.get(opId)) !== undefined;
}

/** Para tests / debugging: cuenta de ops totales. */
export async function opsCount(): Promise<number> {
  return getDb().ops.count();
}

export async function opsByTable(
  table: SyncableTable,
): Promise<Op[]> {
  return getDb().ops.where('table').equals(table).toArray();
}

export type { OpKind };
