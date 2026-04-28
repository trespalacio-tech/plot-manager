import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db';
import {
  completeTask,
  createFarm,
  createParcel,
  dismissTask,
  listAlerts,
  listTasks,
} from '@/lib/db/repos';
import { evaluateRules } from './engine';
import { soilLowOm } from './catalog';

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

async function seed() {
  const farm = await createFarm({ name: 'F', municipality: 'Burgos', province: 'Burgos' });
  const parcel = await createParcel({
    farmId: farm.id,
    name: 'P1',
    areaHa: 1,
    status: 'TRANSITION',
    statusChangedAt: new Date('2024-04-01'),
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  });
  const sample = {
    id: 's1',
    parcelId: parcel.id,
    samplingDate: new Date('2026-01-10'),
    depthCmFrom: 0,
    depthCmTo: 30,
    samplingMethod: 'COMPOSITE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await getDb().soilSamples.add(sample);
  await getDb().soilAnalyses.add({
    id: 'a1',
    sampleId: sample.id,
    organicMatterPct: 1.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { farm, parcel };
}

describe('engine', () => {
  it('es idempotente: no duplica tareas con mismo sourceRef', async () => {
    const { parcel } = await seed();
    const now = new Date('2026-04-15');
    const r1 = await evaluateRules({ now, rules: [soilLowOm] });
    expect(r1.createdTasks).toBe(1);

    const r2 = await evaluateRules({ now, rules: [soilLowOm] });
    expect(r2.createdTasks).toBe(0);
    expect(r2.updatedTasks).toBe(1);

    const tasks = await listTasks({ parcelId: parcel.id });
    expect(tasks).toHaveLength(1);
  });

  it('respeta tareas DONE: no las recrea', async () => {
    const { parcel } = await seed();
    const now = new Date('2026-04-15');
    await evaluateRules({ now, rules: [soilLowOm] });
    const t = (await listTasks({ parcelId: parcel.id }))[0]!;
    await completeTask(t.id);

    const r = await evaluateRules({ now, rules: [soilLowOm] });
    expect(r.createdTasks).toBe(0);
    expect(r.skippedTasks).toBe(1);

    const all = await listTasks({ parcelId: parcel.id, status: ['PENDING', 'POSTPONED', 'IN_PROGRESS'] });
    expect(all).toHaveLength(0);
  });

  it('respeta tareas DISMISSED: no las recrea', async () => {
    const { parcel } = await seed();
    const now = new Date('2026-04-15');
    await evaluateRules({ now, rules: [soilLowOm] });
    const t = (await listTasks({ parcelId: parcel.id }))[0]!;
    await dismissTask(t.id);

    const r = await evaluateRules({ now, rules: [soilLowOm] });
    expect(r.skippedTasks).toBe(1);
    expect(r.createdTasks).toBe(0);
  });

  it('no duplica alertas con el mismo triggerSource', async () => {
    await seed();
    const now = new Date('2026-02-15');
    await evaluateRules({ now });
    const first = (await listAlerts({ includeAcknowledged: true, includeExpired: true })).length;
    await evaluateRules({ now });
    const second = (await listAlerts({ includeAcknowledged: true, includeExpired: true })).length;
    expect(second).toBe(first);
  });

  it('rellena scheduledFor y dueDate cuando la regla no los aporta', async () => {
    const { parcel } = await seed();
    const now = new Date('2026-04-15');
    await evaluateRules({ now, rules: [soilLowOm] });
    const t = (await listTasks({ parcelId: parcel.id }))[0]!;
    expect(t.scheduledFor).toBeInstanceOf(Date);
    expect(t.dueDate).toBeInstanceOf(Date);
    expect(t.scheduledFor!.getTime()).toBe(now.getTime());
    // soilLowOm con MO 1.0% es MEDIUM (umbral HIGH es < 1.0) → 45 días
    const days = (t.dueDate!.getTime() - t.scheduledFor!.getTime()) / (24 * 3600 * 1000);
    expect(days).toBe(45);
  });
});
