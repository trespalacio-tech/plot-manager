import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db/db';
import { _resetBackfillFlagForTests, runOpLogBackfill } from './backfill';
import { _resetIdentityCacheForTests, ensureIdentity } from './identity';
import { opsByTable, opsCount } from './log';

beforeEach(() => {
  resetDbForTests();
  _resetIdentityCacheForTests();
  _resetBackfillFlagForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

async function seedRowsWithoutOps() {
  // Insertamos filas DIRECTAMENTE en Dexie sin pasar por los repos.
  // Simula el estado de una BD pre-Sprint 15 (filas sin ops).
  const db = getDb();
  const now = new Date('2026-01-01T00:00:00Z');
  await db.farms.add({
    id: 'F1',
    name: 'Finca antigua',
    municipality: 'Aranda',
    province: 'Burgos',
    createdAt: now,
    updatedAt: now,
  });
  await db.parcels.add({
    id: 'P1',
    farmId: 'F1',
    name: 'Parcela antigua',
    areaHa: 1,
    status: 'TRANSITION',
    statusChangedAt: now,
    cropType: 'NUT_TREE',
    primarySpecies: 'almendro',
    irrigation: 'RAINFED',
    createdAt: now,
    updatedAt: now,
  });
}

describe('runOpLogBackfill', () => {
  it('emite una Op PUT por cada fila existente sin op', async () => {
    await ensureIdentity();
    await seedRowsWithoutOps();
    expect(await opsCount()).toBe(0);

    const stats = await runOpLogBackfill();
    expect(stats.emitted).toBe(2);
    expect(stats.byTable.farms).toBe(1);
    expect(stats.byTable.parcels).toBe(1);

    const farmOps = await opsByTable('farms');
    expect(farmOps).toHaveLength(1);
    expect(farmOps[0]!.kind).toBe('PUT');
    expect(farmOps[0]!.recordId).toBe('F1');
    // El ts toma updatedAt original (2026-01-01).
    expect(farmOps[0]!.ts).toBe(new Date('2026-01-01T00:00:00Z').getTime());
  });

  it('idempotente: segunda llamada no emite ops nuevas', async () => {
    await ensureIdentity();
    await seedRowsWithoutOps();
    await runOpLogBackfill();
    const before = await opsCount();
    const stats2 = await runOpLogBackfill();
    expect(stats2.emitted).toBe(0);
    expect(stats2.scanned).toBe(0); // flag ya activo, no recorre
    expect(await opsCount()).toBe(before);
  });

  it('force=true vuelve a recorrer pero NO duplica ops por fila', async () => {
    await ensureIdentity();
    await seedRowsWithoutOps();
    await runOpLogBackfill();
    const stats = await runOpLogBackfill(true);
    expect(stats.scanned).toBeGreaterThan(0);
    expect(stats.emitted).toBe(0);
    expect(stats.skipped).toBe(2);
  });

  it('respeta seq monótono: la siguiente mutación arranca tras el backfill', async () => {
    await ensureIdentity();
    await seedRowsWithoutOps();
    await runOpLogBackfill();
    const ident = await getDb().identity.get('self');
    // 2 ops emitidas → nextSeq debe ser 3 (arranca en 1).
    expect(ident?.nextSeq).toBe(3);
  });
});
