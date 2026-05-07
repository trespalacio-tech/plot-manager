import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';
import { FincasDB } from '@/lib/db/db';
import {
  applyDelete,
  applyPut,
  buildPutFields,
  deserializeValue,
} from './merge';
import type { Op } from './types';

/**
 * Test de convergencia REAL.
 *
 * El engine.test.ts existente usa un solo navegador (una sola BD)
 * porque jsdom + fake-indexeddb son globales. Aquí simulamos DOS peers
 * abriendo dos instancias de FincasDB con nombres distintos. Cada peer
 * tiene su propio deviceId, sus propias mutaciones, y al final movemos
 * sus ops entre ellos a mano (lo que en producción hace el sync engine
 * sobre un DataChannel) y verificamos que ambos terminan con el mismo
 * estado de farms/parcels/tasks.
 *
 * Esto NO testea el WebRTC ni el QR — esas piezas necesitan un
 * navegador real. Pero sí verifica que la lógica de op-log + merge
 * converge correctamente cuando dos peers tienen edits divergentes.
 */

const dbs: FincasDB[] = [];

function makeDb(label: string): FincasDB {
  const db = new FincasDB(`fincas-conv-${label}-${crypto.randomUUID()}`);
  dbs.push(db);
  return db;
}

beforeEach(() => {
  // No reseteamos el global. Cada test crea las suyas.
});

afterEach(async () => {
  while (dbs.length) {
    const db = dbs.pop()!;
    db.close();
    await Dexie.delete(db.name);
  }
});

interface PeerHandle {
  db: FincasDB;
  deviceId: string;
  nextSeq: () => number;
}

function makePeer(label: string): PeerHandle {
  const db = makeDb(label);
  let seq = 1;
  return {
    db,
    deviceId: `dev-${label}`,
    nextSeq: () => seq++,
  };
}

function buildOp(
  peer: PeerHandle,
  table: 'farms' | 'parcels' | 'tasks',
  recordId: string,
  patch: Record<string, unknown>,
  ts: number,
  kind: 'PUT' | 'DELETE' = 'PUT',
): Op {
  const seq = peer.nextSeq();
  return {
    id: `${peer.deviceId}:${seq}`,
    deviceId: peer.deviceId,
    seq,
    ts,
    table,
    recordId,
    kind,
    fields: kind === 'PUT' ? buildPutFields(patch, ts) : undefined,
  };
}

async function applyOpDirect(db: FincasDB, op: Op): Promise<void> {
  const table = db.table(op.table);
  const current = await table.get(op.recordId);
  if (op.kind === 'PUT') {
    const opDeserialized: Op = {
      ...op,
      fields: op.fields
        ? Object.fromEntries(
            Object.entries(op.fields).map(([k, v]) => [
              k,
              { value: deserializeValue(v.value), ts: v.ts },
            ]),
          )
        : undefined,
    };
    const res = applyPut<any>(current, opDeserialized);
    if (res.changed) await table.put({ ...res.record, id: op.recordId });
  } else {
    const res = applyDelete<any>(current, op);
    if (res.changed && res.record) {
      await table.put({ ...res.record, id: op.recordId });
    }
  }
}

async function exchangeOps(a: PeerHandle, b: PeerHandle, ops: Op[]): Promise<void> {
  // Cada op se aplica en ambos peers (en producción A enviaría sus ops
  // a B y viceversa; aquí lo modelamos como un broadcast a ambos para
  // garantizar que el resultado final se compara en igualdad).
  for (const op of ops) {
    if (op.deviceId !== a.deviceId) await applyOpDirect(a.db, op);
    if (op.deviceId !== b.deviceId) await applyOpDirect(b.db, op);
  }
}

describe('Convergencia real entre dos peers', () => {
  it('un peer crea finca, otro la recibe y queda igual', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    const op = buildOp(A, 'farms', 'F1', {
      name: 'Trespalacios',
      municipality: 'Aranda',
      province: 'Burgos',
    }, 1000);
    // Lo aplica el peer A localmente (simula createFarm).
    await applyOpDirect(A.db, op);
    // Y se transmite a B.
    await exchangeOps(A, B, [op]);
    const farmA = await A.db.farms.get('F1');
    const farmB = await B.db.farms.get('F1');
    expect(farmB?.name).toBe(farmA?.name);
    expect(farmB?.municipality).toBe(farmA?.municipality);
  });

  it('edits concurrentes en campos distintos del mismo registro: ambos persisten', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    // Estado inicial común
    const init = buildOp(A, 'farms', 'F1', {
      name: 'F',
      municipality: 'Aranda',
      province: 'Burgos',
      altitudeM: 800,
    }, 1000);
    await applyOpDirect(A.db, init);
    await exchangeOps(A, B, [init]);

    // Sin conexión, A cambia altitudeM y B cambia municipality.
    const opA = buildOp(A, 'farms', 'F1', { altitudeM: 920 }, 2000);
    const opB = buildOp(B, 'farms', 'F1', { municipality: 'Roa' }, 2100);
    await applyOpDirect(A.db, opA);
    await applyOpDirect(B.db, opB);

    // Sincronizan.
    await exchangeOps(A, B, [opA, opB]);

    const farmA = await A.db.farms.get('F1');
    const farmB = await B.db.farms.get('F1');
    expect(farmA?.altitudeM).toBe(920);
    expect(farmA?.municipality).toBe('Roa');
    expect(farmB?.altitudeM).toBe(920);
    expect(farmB?.municipality).toBe('Roa');
    expect(farmA?.name).toBe(farmB?.name);
  });

  it('edit del mismo campo: gana el ts mayor (LWW)', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    const init = buildOp(A, 'farms', 'F1', { name: 'F', municipality: 'X', province: 'Burgos' }, 1000);
    await applyOpDirect(A.db, init);
    await exchangeOps(A, B, [init]);
    const opA = buildOp(A, 'farms', 'F1', { name: 'A-name' }, 2000);
    const opB = buildOp(B, 'farms', 'F1', { name: 'B-name' }, 3000); // más tarde
    await applyOpDirect(A.db, opA);
    await applyOpDirect(B.db, opB);
    await exchangeOps(A, B, [opA, opB]);
    const fa = await A.db.farms.get('F1');
    const fb = await B.db.farms.get('F1');
    expect(fa?.name).toBe('B-name');
    expect(fb?.name).toBe('B-name');
  });

  it('aplicar la misma op dos veces no cambia el estado (idempotencia)', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    const op = buildOp(A, 'tasks', 'T1', {
      title: 'X', priority: 'LOW', status: 'PENDING', source: 'USER', type: 'OTHER', rationale: 'r',
    }, 5000);
    await applyOpDirect(A.db, op);
    await applyOpDirect(B.db, op);
    await applyOpDirect(B.db, op); // duplicado
    const t = await B.db.tasks.get('T1');
    expect(t?.title).toBe('X');
  });

  it('orden de aplicación no afecta al resultado final', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    const ops: Op[] = [
      buildOp(A, 'farms', 'F1', { name: 'init', municipality: 'X', province: 'Burgos' }, 1000),
      buildOp(B, 'farms', 'F1', { name: 'B1', altitudeM: 700 }, 2000),
      buildOp(A, 'farms', 'F1', { altitudeM: 850 }, 3000),
      buildOp(B, 'farms', 'F1', { name: 'B2' }, 4000),
    ];
    // A aplica en orden ascendente.
    for (const op of ops) await applyOpDirect(A.db, op);
    // B aplica en orden DESCENDENTE — pero LWW es por ts, no por orden de llegada.
    for (const op of [...ops].reverse()) await applyOpDirect(B.db, op);
    const fa = await A.db.farms.get('F1');
    const fb = await B.db.farms.get('F1');
    expect(fb?.name).toBe(fa?.name);
    expect(fb?.altitudeM).toBe(fa?.altitudeM);
    expect(fb?.municipality).toBe(fa?.municipality);
  });

  it('delete y put concurrentes: el más reciente gana', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    const init = buildOp(A, 'tasks', 'T1', {
      title: 'X', priority: 'LOW', status: 'PENDING', source: 'USER', type: 'OTHER', rationale: 'r',
    }, 1000);
    await applyOpDirect(A.db, init);
    await exchangeOps(A, B, [init]);

    // A borra; B edita más tarde → el edit debe "resucitar".
    const delA = buildOp(A, 'tasks', 'T1', {}, 2000, 'DELETE');
    const updB = buildOp(B, 'tasks', 'T1', { title: 'X-actualizado' }, 3000);
    await applyOpDirect(A.db, delA);
    await applyOpDirect(B.db, updB);
    await exchangeOps(A, B, [delA, updB]);

    const tA = await A.db.tasks.get('T1');
    const tB = await B.db.tasks.get('T1');
    expect(tA?._deletedAt).toBeUndefined();
    expect(tB?._deletedAt).toBeUndefined();
    expect(tA?.title).toBe('X-actualizado');
    expect(tB?.title).toBe('X-actualizado');
  });

  it('tres edits encadenados de tres timestamps distintos: convergencia', async () => {
    const A = makePeer('A');
    const B = makePeer('B');
    const init = buildOp(A, 'parcels', 'P1', {
      farmId: 'F1', name: 'init', areaHa: 1, status: 'TRANSITION',
      cropType: 'NUT_TREE', primarySpecies: 'almendro', irrigation: 'RAINFED',
    }, 1000);
    await applyOpDirect(A.db, init);
    await exchangeOps(A, B, [init]);

    const e1 = buildOp(A, 'parcels', 'P1', { areaHa: 2 }, 2000);
    const e2 = buildOp(B, 'parcels', 'P1', { areaHa: 3 }, 3000);
    const e3 = buildOp(A, 'parcels', 'P1', { areaHa: 4 }, 4000);

    await applyOpDirect(A.db, e1);
    await applyOpDirect(B.db, e2);
    await applyOpDirect(A.db, e3);
    await exchangeOps(A, B, [e1, e2, e3]);

    const pA = await A.db.parcels.get('P1');
    const pB = await B.db.parcels.get('P1');
    expect(pA?.areaHa).toBe(4);
    expect(pB?.areaHa).toBe(4);
  });
});
