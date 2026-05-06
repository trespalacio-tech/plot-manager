import { afterEach, describe, expect, it } from 'vitest';
import { FincasDB } from './db';
import type { Farm, Parcel } from './types';

function newDb() {
  return new FincasDB(`fincas-test-${crypto.randomUUID()}`);
}

const dbs: FincasDB[] = [];

afterEach(async () => {
  while (dbs.length) {
    const db = dbs.pop()!;
    db.close();
    await indexedDB.deleteDatabase(db.name);
  }
});

describe('FincasDB', () => {
  it('abre y expone todas las tablas del esquema base', async () => {
    const db = newDb();
    dbs.push(db);
    await db.open();
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'alerts',
        'biodiversityFeatures',
        'coverCrops',
        'farms',
        'fieldLogEntries',
        'harvests',
        'identity',
        'inputApplications',
        'milestones',
        'ops',
        'parcelStatusHistory',
        'parcels',
        'peers',
        'pestMonitorings',
        'phenologyObservations',
        'plants',
        'soilAnalyses',
        'soilSamples',
        'tasks',
        'transitionPlans',
        'varieties',
      ].sort(),
    );
  });

  it('permite crear y leer una finca y una parcela relacionada', async () => {
    const db = newDb();
    dbs.push(db);
    const now = new Date();
    const farm: Farm = {
      id: crypto.randomUUID(),
      name: 'Finca La Nava',
      municipality: 'Aranda de Duero',
      province: 'Burgos',
      createdAt: now,
      updatedAt: now,
    };
    const parcel: Parcel = {
      id: crypto.randomUUID(),
      farmId: farm.id,
      name: 'Parcela 1',
      areaHa: 2.3,
      status: 'DESIGN',
      statusChangedAt: now,
      cropType: 'VINEYARD',
      irrigation: 'RAINFED',
      createdAt: now,
      updatedAt: now,
    };
    await db.farms.add(farm);
    await db.parcels.add(parcel);

    const parcelsInFarm = await db.parcels
      .where('farmId')
      .equals(farm.id)
      .toArray();
    expect(parcelsInFarm).toHaveLength(1);
    expect(parcelsInFarm[0]!.name).toBe('Parcela 1');
  });

  it('usa índice multiValor sobre fieldLogEntries.parcelIds', async () => {
    const db = newDb();
    dbs.push(db);
    const id = crypto.randomUUID();
    const now = new Date();
    await db.fieldLogEntries.add({
      id,
      date: now,
      parcelIds: ['p1', 'p2'],
      type: 'MONITORING',
      title: 'Revisión trampas',
      createdAt: now,
      updatedAt: now,
    });
    const hits = await db.fieldLogEntries
      .where('parcelIds')
      .equals('p2')
      .toArray();
    expect(hits).toHaveLength(1);
    expect(hits[0]!.id).toBe(id);
  });
});
