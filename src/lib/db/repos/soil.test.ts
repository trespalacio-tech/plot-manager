import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from '../db';
import {
  createFarm,
  createParcel,
  createSoilRecord,
  deleteSoilRecord,
  getSoilRecord,
  listSoilRecordsByParcel,
  updateSoilRecord,
} from '.';

async function setup() {
  const farm = await createFarm({
    name: 'F',
    municipality: 'Burgos',
    province: 'Burgos',
  });
  const parcel = await createParcel({
    farmId: farm.id,
    name: 'P',
    areaHa: 1,
    status: 'TRANSITION',
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  });
  return { farm, parcel };
}

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

describe('soil repo', () => {
  it('crea muestra + análisis atómicamente y los devuelve emparejados', async () => {
    const { parcel } = await setup();
    const rec = await createSoilRecord(
      {
        parcelId: parcel.id,
        samplingDate: new Date('2026-03-01'),
        depthCmFrom: 0,
        depthCmTo: 30,
        samplingMethod: 'COMPOSITE',
      },
      { organicMatterPct: 1.4, phWater: 8.1 },
    );
    expect(rec.sample.id).toBeDefined();
    expect(rec.analysis.sampleId).toBe(rec.sample.id);
    const fetched = await getSoilRecord(rec.sample.id);
    expect(fetched?.analysis.organicMatterPct).toBe(1.4);
  });

  it('lista los análisis de una parcela ordenados por fecha', async () => {
    const { parcel } = await setup();
    await createSoilRecord(
      { parcelId: parcel.id, samplingDate: new Date('2026-01-10'), depthCmFrom: 0, depthCmTo: 30, samplingMethod: 'COMPOSITE' },
      { organicMatterPct: 1.2 },
    );
    await createSoilRecord(
      { parcelId: parcel.id, samplingDate: new Date('2024-09-01'), depthCmFrom: 0, depthCmTo: 30, samplingMethod: 'COMPOSITE' },
      { organicMatterPct: 0.9 },
    );
    const list = await listSoilRecordsByParcel(parcel.id);
    expect(list.map((r) => r.analysis.organicMatterPct)).toEqual([0.9, 1.2]);
  });

  it('actualiza muestra y análisis en el mismo transaction', async () => {
    const { parcel } = await setup();
    const rec = await createSoilRecord(
      { parcelId: parcel.id, samplingDate: new Date('2026-03-01'), depthCmFrom: 0, depthCmTo: 30, samplingMethod: 'COMPOSITE' },
      { organicMatterPct: 1.4 },
    );
    await updateSoilRecord(rec.sample.id, { labName: 'Itacyl' }, { organicMatterPct: 2.0 });
    const fetched = await getSoilRecord(rec.sample.id);
    expect(fetched?.sample.labName).toBe('Itacyl');
    expect(fetched?.analysis.organicMatterPct).toBe(2.0);
  });

  it('borra muestra y análisis emparejados', async () => {
    const { parcel } = await setup();
    const rec = await createSoilRecord(
      { parcelId: parcel.id, samplingDate: new Date('2026-03-01'), depthCmFrom: 0, depthCmTo: 30, samplingMethod: 'COMPOSITE' },
      { organicMatterPct: 1.4 },
    );
    await deleteSoilRecord(rec.sample.id);
    expect(await getDb().soilSamples.count()).toBe(0);
    expect(await getDb().soilAnalyses.count()).toBe(0);
  });
});
