import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db/db';
import {
  createFarm,
  createParcel,
  createTask,
  deleteParcel,
  postponeTask,
  updateFarm,
} from '@/lib/db/repos';
import {
  applyRemoteOp,
  isOpKnown,
  localVectorClock,
  opsByTable,
  opsCount,
  opsSince,
} from './log';
import { ensureIdentity, _resetIdentityCacheForTests } from './identity';
import type { Op } from './types';

beforeEach(() => {
  resetDbForTests();
  _resetIdentityCacheForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

async function setup() {
  const farm = await createFarm({
    name: 'F',
    municipality: 'Aranda',
    province: 'Burgos',
  });
  return { farm };
}

describe('Op-log local', () => {
  it('createFarm registra una op PUT', async () => {
    await setup();
    const ops = await opsByTable('farms');
    expect(ops).toHaveLength(1);
    expect(ops[0]!.kind).toBe('PUT');
    expect(ops[0]!.table).toBe('farms');
    expect(ops[0]!.fields).toBeDefined();
    expect(Object.keys(ops[0]!.fields ?? {})).toContain('name');
  });

  it('updateFarm registra una segunda op con sólo el patch', async () => {
    const { farm } = await setup();
    await updateFarm(farm.id, { altitudeM: 850 });
    const ops = await opsByTable('farms');
    expect(ops).toHaveLength(2);
    expect(ops[1]!.fields?.altitudeM?.value).toBe(850);
    expect(ops[1]!.fields?.name).toBeUndefined();
  });

  it('createParcel + deleteParcel deja PUT y DELETE en el log', async () => {
    const { farm } = await setup();
    const p = await createParcel({
      farmId: farm.id,
      name: 'P1',
      areaHa: 1,
      status: 'TRANSITION',
      cropType: 'NUT_TREE',
      primarySpecies: 'almendro',
      irrigation: 'RAINFED',
    });
    const before = await opsByTable('parcels');
    expect(before.filter((o) => o.kind === 'PUT')).toHaveLength(1);
    await deleteParcel(p.id);
    const after = await opsByTable('parcels');
    expect(after.find((o) => o.kind === 'DELETE')).toBeDefined();
  });

  it('asigna seq monótono dentro del mismo deviceId', async () => {
    const { farm } = await setup();
    await updateFarm(farm.id, { altitudeM: 700 });
    await updateFarm(farm.id, { altitudeM: 800 });
    const ops = await opsByTable('farms');
    const seqs = ops.map((o) => o.seq).sort((a, b) => a - b);
    // Debe haber 3 seqs distintos y consecutivos.
    expect(new Set(seqs).size).toBe(3);
    expect(seqs[2]! - seqs[0]!).toBe(2);
  });

  it('opsSince(deviceId, seq) devuelve solo lo posterior', async () => {
    const ident = await ensureIdentity();
    await setup();
    await updateFarm((await getDb().farms.toCollection().first())!.id, {
      altitudeM: 850,
    });
    const after1 = await opsSince(ident.deviceId, 1);
    expect(after1.length).toBeGreaterThanOrEqual(1);
    expect(after1.every((o) => o.seq > 1)).toBe(true);
  });

  it('localVectorClock refleja el seq máximo por deviceId', async () => {
    const ident = await ensureIdentity();
    await setup();
    const vc = await localVectorClock();
    expect(vc[ident.deviceId]).toBeGreaterThan(0);
  });

  it('applyRemoteOp es idempotente: la misma op dos veces no duplica', async () => {
    const remoteOp: Op = {
      id: 'OTRO_DEVICE:1',
      deviceId: 'OTRO_DEVICE',
      seq: 1,
      ts: Date.now(),
      table: 'farms',
      recordId: 'F-REMOTA',
      kind: 'PUT',
      fields: {
        name: { value: 'Finca remota', ts: Date.now() },
        municipality: { value: 'Aranda', ts: Date.now() },
        province: { value: 'Burgos', ts: Date.now() },
        createdAt: { value: { __date: '2026-01-01T00:00:00.000Z' }, ts: Date.now() },
        updatedAt: { value: { __date: '2026-01-01T00:00:00.000Z' }, ts: Date.now() },
      },
    };
    const first = await applyRemoteOp(remoteOp);
    const second = await applyRemoteOp(remoteOp);
    expect(first).toBe(true);
    expect(second).toBe(false);
    // La fila debe existir en farms con el nombre del op.
    const farm = await getDb().farms.get('F-REMOTA');
    expect(farm?.name).toBe('Finca remota');
    // Y la op queda registrada una sola vez.
    expect(await isOpKnown(remoteOp.id)).toBe(true);
  });

  it('LWW por campo: dos peers editan campos distintos y ambos persisten', async () => {
    const { farm } = await setup();
    const baseOps = await opsByTable('farms');
    const baseTs = baseOps[0]!.ts;
    // Otro peer edita altitudeM en t = baseTs + 100
    const remoteOp: Op = {
      id: 'PEER2:1',
      deviceId: 'PEER2',
      seq: 1,
      ts: baseTs + 100,
      table: 'farms',
      recordId: farm.id,
      kind: 'PUT',
      fields: {
        altitudeM: { value: 999, ts: baseTs + 100 },
      },
    };
    await applyRemoteOp(remoteOp);
    const merged = await getDb().farms.get(farm.id);
    expect(merged?.name).toBe('F'); // local intacto
    expect(merged?.altitudeM).toBe(999); // remoto aplicado
  });

  it('opsCount cuenta todas las ops emitidas', async () => {
    await setup();
    const t = await createTask({
      parcelId: undefined,
      source: 'USER',
      type: 'OTHER',
      title: 'X',
      rationale: 'r',
      priority: 'LOW',
    });
    await postponeTask(t.id, 'lluvia');
    expect(await opsCount()).toBeGreaterThanOrEqual(3); // farm + task + postpone
  });
});
