import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from '../db';
import {
  changeParcelStatus,
  createFarm,
  createParcel,
  deleteFarm,
  deleteParcel,
  listFarms,
  listParcelsByFarm,
} from '.';

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

describe('farms repo', () => {
  it('crea y lista fincas por orden alfabético', async () => {
    await createFarm({
      name: 'Z Vega',
      municipality: 'Aranda de Duero',
      province: 'Burgos',
    });
    await createFarm({
      name: 'A La Nava',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const farms = await listFarms();
    expect(farms.map((f) => f.name)).toEqual(['A La Nava', 'Z Vega']);
  });

  it('borrar finca elimina en cascada sus parcelas y su historial', async () => {
    const farm = await createFarm({
      name: 'Test',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    await createParcel({
      farmId: farm.id,
      name: 'P1',
      areaHa: 1,
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
    });
    await deleteFarm(farm.id);
    expect(await getDb().farms.count()).toBe(0);
    expect(await getDb().parcels.count()).toBe(0);
    expect(await getDb().parcelStatusHistory.count()).toBe(0);
  });
});

describe('parcels repo', () => {
  it('al crear parcela añade una entrada de historial de estado', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const p = await createParcel({
      farmId: farm.id,
      name: 'P',
      areaHa: 2,
      status: 'TRANSITION',
      cropType: 'VINEYARD',
      irrigation: 'DRIP',
    });
    const history = await getDb()
      .parcelStatusHistory.where('parcelId')
      .equals(p.id)
      .toArray();
    expect(history).toHaveLength(1);
    expect(history[0]!.toStatus).toBe('TRANSITION');
    expect(history[0]!.fromStatus).toBeUndefined();
  });

  it('cambiar estado añade entrada de historial y actualiza la parcela', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const p = await createParcel({
      farmId: farm.id,
      name: 'P',
      areaHa: 1,
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
    });
    await changeParcelStatus(p.id, 'TRANSITION', 'Probando transición');
    const updated = await getDb().parcels.get(p.id);
    expect(updated?.status).toBe('TRANSITION');
    const history = await getDb()
      .parcelStatusHistory.where('parcelId')
      .equals(p.id)
      .sortBy('changedAt');
    expect(history).toHaveLength(2);
    expect(history[1]!.fromStatus).toBe('DESIGN');
    expect(history[1]!.toStatus).toBe('TRANSITION');
    expect(history[1]!.reason).toBe('Probando transición');
  });

  it('cambiar a mismo estado no añade historial ni actualiza', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const p = await createParcel({
      farmId: farm.id,
      name: 'P',
      areaHa: 1,
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
    });
    await changeParcelStatus(p.id, 'DESIGN');
    const count = await getDb()
      .parcelStatusHistory.where('parcelId')
      .equals(p.id)
      .count();
    expect(count).toBe(1);
  });

  it('lista parcelas de una finca filtrando por farmId', async () => {
    const f1 = await createFarm({
      name: 'F1',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const f2 = await createFarm({
      name: 'F2',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    await createParcel({
      farmId: f1.id,
      name: 'P1',
      areaHa: 1,
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
    });
    await createParcel({
      farmId: f2.id,
      name: 'P2',
      areaHa: 1,
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
    });
    expect((await listParcelsByFarm(f1.id)).map((p) => p.name)).toEqual(['P1']);
    expect((await listParcelsByFarm(f2.id)).map((p) => p.name)).toEqual(['P2']);
  });

  it('borrar parcela limpia su historial', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const p = await createParcel({
      farmId: farm.id,
      name: 'P',
      areaHa: 1,
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
    });
    await deleteParcel(p.id);
    expect(await getDb().parcels.count()).toBe(0);
    expect(await getDb().parcelStatusHistory.count()).toBe(0);
  });
});
