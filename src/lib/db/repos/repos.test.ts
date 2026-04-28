import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from '../db';
import { newId, nowStamps } from './ids';
import {
  changeParcelStatus,
  createFarm,
  createFieldLogEntry,
  createParcel,
  createSoilRecord,
  createTask,
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

describe('cascade delete', () => {
  async function seedParcelWithChildren(farmId: string, name: string) {
    const parcel = await createParcel({
      farmId,
      name,
      areaHa: 1,
      status: 'TRANSITION',
      cropType: 'FRUIT_TREE',
      irrigation: 'DRIP',
    });
    const db = getDb();
    const stamps = nowStamps();
    await db.varieties.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      species: 'apple',
      cultivar: 'Reineta',
      isPollinator: false,
      plantsCount: 10,
    });
    await db.plants.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      varietyId: newId(),
      status: 'HEALTHY',
    });
    await createSoilRecord(
      {
        parcelId: parcel.id,
        samplingDate: new Date('2026-04-01'),
        depthCmFrom: 0,
        depthCmTo: 30,
        samplingMethod: 'COMPOSITE',
      },
      { organicMatterPct: 1.5 },
    );
    await db.coverCrops.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      sowingDate: new Date('2026-04-01'),
    });
    await db.biodiversityFeatures.add({
      id: newId(),
      ...stamps,
      farmId,
      parcelId: parcel.id,
      type: 'HEDGEROW',
      installationDate: new Date('2026-03-01'),
    });
    const plan = {
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      startDate: new Date('2026-04-01'),
      targetEndDate: new Date('2029-04-01'),
      currentYear: 1,
    };
    await db.transitionPlans.add(plan);
    await db.milestones.add({
      id: newId(),
      ...stamps,
      transitionPlanId: plan.id,
      yearOfPlan: 1,
      title: 'Test',
      description: 'Hito de prueba',
      targetDate: new Date('2026-09-01'),
    });
    await db.phenologyObservations.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      date: new Date('2026-04-15'),
      bbchStage: 65,
    });
    await db.pestMonitorings.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      date: new Date('2026-04-15'),
      pestOrDisease: 'mosca',
      method: 'VISUAL_COUNT',
      actionRequired: false,
    });
    await db.harvests.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      date: new Date('2026-09-15'),
      quantityKg: 100,
    });
    await createTask({
      parcelId: parcel.id,
      source: 'USER',
      type: 'PRUNING',
      title: 'Tarea',
      rationale: 'Test',
      priority: 'MEDIUM',
    });
    await db.alerts.add({
      id: newId(),
      ...stamps,
      parcelId: parcel.id,
      title: 'Aviso',
      message: 'Test',
      severity: 'INFO',
      triggerSource: 'TEST',
    });
    return parcel;
  }

  it('deleteParcel borra todas las tablas hijas', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const parcel = await seedParcelWithChildren(farm.id, 'P1');
    await createFieldLogEntry({
      date: new Date('2026-04-15'),
      parcelIds: [parcel.id],
      type: 'PRUNING',
      title: 'Solo en P1',
    });
    await deleteParcel(parcel.id);
    const db = getDb();
    expect(await db.parcels.count()).toBe(0);
    expect(await db.varieties.count()).toBe(0);
    expect(await db.plants.count()).toBe(0);
    expect(await db.soilSamples.count()).toBe(0);
    expect(await db.soilAnalyses.count()).toBe(0);
    expect(await db.coverCrops.count()).toBe(0);
    expect(await db.biodiversityFeatures.count()).toBe(0);
    expect(await db.transitionPlans.count()).toBe(0);
    expect(await db.milestones.count()).toBe(0);
    expect(await db.phenologyObservations.count()).toBe(0);
    expect(await db.pestMonitorings.count()).toBe(0);
    expect(await db.harvests.count()).toBe(0);
    expect(await db.tasks.count()).toBe(0);
    expect(await db.alerts.count()).toBe(0);
    expect(await db.fieldLogEntries.count()).toBe(0);
    expect(await db.farms.count()).toBe(1);
  });

  it('deleteParcel mantiene fieldLogEntries multi-parcela quitando la parcela borrada', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    const p1 = await createParcel({
      farmId: farm.id,
      name: 'P1',
      areaHa: 1,
      status: 'TRANSITION',
      cropType: 'FRUIT_TREE',
      irrigation: 'DRIP',
    });
    const p2 = await createParcel({
      farmId: farm.id,
      name: 'P2',
      areaHa: 1,
      status: 'TRANSITION',
      cropType: 'FRUIT_TREE',
      irrigation: 'DRIP',
    });
    const entry = await createFieldLogEntry({
      date: new Date('2026-04-15'),
      parcelIds: [p1.id, p2.id],
      type: 'PRUNING',
      title: 'Compartida',
    });
    await deleteParcel(p1.id);
    const after = await getDb().fieldLogEntries.get(entry.id);
    expect(after?.parcelIds).toEqual([p2.id]);
  });

  it('deleteFarm borra toda su jerarquía (parcelas y nietos)', async () => {
    const farm = await createFarm({
      name: 'F',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    await seedParcelWithChildren(farm.id, 'P1');
    await seedParcelWithChildren(farm.id, 'P2');
    const db = getDb();
    await db.biodiversityFeatures.add({
      id: newId(),
      ...nowStamps(),
      farmId: farm.id,
      type: 'POND',
      installationDate: new Date('2026-03-01'),
    });
    await deleteFarm(farm.id);
    expect(await db.farms.count()).toBe(0);
    expect(await db.parcels.count()).toBe(0);
    expect(await db.tasks.count()).toBe(0);
    expect(await db.alerts.count()).toBe(0);
    expect(await db.harvests.count()).toBe(0);
    expect(await db.biodiversityFeatures.count()).toBe(0);
  });
});
