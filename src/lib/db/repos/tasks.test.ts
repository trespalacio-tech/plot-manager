import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from '../db';
import {
  completeTask,
  createFarm,
  createParcel,
  createTask,
  dismissTask,
  listTasks,
  markInProgress,
  postponeTask,
  reopenTask,
  rescheduleTask,
  updateTask,
} from '.';

async function setup() {
  const farm = await createFarm({ name: 'F', municipality: 'Burgos', province: 'Burgos' });
  const parcel = await createParcel({
    farmId: farm.id,
    name: 'P1',
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

describe('tasks repo', () => {
  it('ordena por prioridad y luego por fecha programada', async () => {
    const { parcel } = await setup();
    await createTask({
      parcelId: parcel.id,
      source: 'RULE_ENGINE',
      type: 'COMPOSTING',
      title: 'C',
      rationale: 'r',
      priority: 'LOW',
      scheduledFor: new Date('2026-04-01'),
    });
    await createTask({
      parcelId: parcel.id,
      source: 'RULE_ENGINE',
      type: 'COMPOSTING',
      title: 'A',
      rationale: 'r',
      priority: 'URGENT',
      scheduledFor: new Date('2026-05-01'),
    });
    await createTask({
      parcelId: parcel.id,
      source: 'RULE_ENGINE',
      type: 'COMPOSTING',
      title: 'B',
      rationale: 'r',
      priority: 'URGENT',
      scheduledFor: new Date('2026-04-15'),
    });
    const rows = await listTasks();
    expect(rows.map((t) => t.title)).toEqual(['B', 'A', 'C']);
  });

  it('filtra por parcela, estado y sourceRef', async () => {
    const { parcel } = await setup();
    await createTask({
      parcelId: parcel.id,
      source: 'RULE_ENGINE',
      sourceRef: 'soil-low-om:p1',
      type: 'COMPOSTING',
      title: 'MO',
      rationale: 'r',
      priority: 'HIGH',
    });
    await createTask({
      parcelId: parcel.id,
      source: 'USER',
      type: 'PRUNING',
      title: 'Poda',
      rationale: 'r',
      priority: 'MEDIUM',
      status: 'DONE',
    });
    expect(
      (await listTasks({ sourceRef: 'soil-low-om:p1' })).map((t) => t.title),
    ).toEqual(['MO']);
    expect((await listTasks({ status: 'DONE' })).map((t) => t.title)).toEqual(['Poda']);
    expect((await listTasks({ status: ['PENDING', 'IN_PROGRESS'] })).map((t) => t.title)).toEqual([
      'MO',
    ]);
  });

  it('completa, pospone, descarta y reabre', async () => {
    const { parcel } = await setup();
    const t = await createTask({
      parcelId: parcel.id,
      source: 'RULE_ENGINE',
      type: 'PRUNING',
      title: 'Poda',
      rationale: 'r',
      priority: 'MEDIUM',
    });
    await completeTask(t.id, 'fl-1');
    let stored = (await listTasks({ status: 'DONE' }))[0]!;
    expect(stored.completedAt).toBeInstanceOf(Date);
    expect(stored.completedFieldLogEntryId).toBe('fl-1');

    await reopenTask(t.id);
    stored = (await listTasks({ status: 'PENDING' }))[0]!;
    expect(stored.status).toBe('PENDING');

    await postponeTask(t.id, 'lluvia');
    stored = (await listTasks({ status: 'POSTPONED' }))[0]!;
    expect(stored.postponeReason).toBe('lluvia');

    await dismissTask(t.id);
    stored = (await listTasks({ status: 'DISMISSED' }))[0]!;
    expect(stored.status).toBe('DISMISSED');
  });

  it('postponeTask acepta nueva fecha y motivo', async () => {
    const { parcel } = await setup();
    const t = await createTask({
      parcelId: parcel.id,
      source: 'PLAYBOOK',
      type: 'PRUNING',
      title: 'Poda verde',
      rationale: 'r',
      priority: 'MEDIUM',
      scheduledFor: new Date('2026-04-01'),
    });
    const newDate = new Date('2026-04-20');
    await postponeTask(t.id, { newScheduledFor: newDate, reason: 'lluvia' });
    const stored = await getDb().tasks.get(t.id);
    expect(stored?.status).toBe('POSTPONED');
    expect(stored?.postponeReason).toBe('lluvia');
    expect(stored?.scheduledFor?.getTime()).toBe(newDate.getTime());
  });

  it('rescheduleTask mueve la fecha y deja la tarea PENDING limpia', async () => {
    const { parcel } = await setup();
    const t = await createTask({
      parcelId: parcel.id,
      source: 'PLAYBOOK',
      type: 'MULCHING',
      title: 'Acolchado',
      rationale: 'r',
      priority: 'HIGH',
      scheduledFor: new Date('2026-05-01'),
    });
    await postponeTask(t.id, 'falta material');
    const newDate = new Date('2026-05-15');
    await rescheduleTask(t.id, newDate);
    const stored = await getDb().tasks.get(t.id);
    expect(stored?.status).toBe('PENDING');
    expect(stored?.scheduledFor?.getTime()).toBe(newDate.getTime());
    expect(stored?.postponeReason).toBeUndefined();
  });

  it('markInProgress marca tarea como IN_PROGRESS', async () => {
    const { parcel } = await setup();
    const t = await createTask({
      parcelId: parcel.id,
      source: 'USER',
      type: 'MONITORING',
      title: 'Monitoreo',
      rationale: 'r',
      priority: 'LOW',
    });
    await markInProgress(t.id);
    const stored = await getDb().tasks.get(t.id);
    expect(stored?.status).toBe('IN_PROGRESS');
  });

  it('updateTask aplica parche y actualiza updatedAt', async () => {
    const { parcel } = await setup();
    const t = await createTask({
      parcelId: parcel.id,
      source: 'USER',
      type: 'OTHER',
      title: 'X',
      rationale: 'r',
      priority: 'LOW',
    });
    const before = t.updatedAt.getTime();
    await new Promise((r) => setTimeout(r, 2));
    await updateTask(t.id, { title: 'Y', priority: 'HIGH' });
    const stored = await getDb().tasks.get(t.id);
    expect(stored?.title).toBe('Y');
    expect(stored?.priority).toBe('HIGH');
    expect(stored!.updatedAt.getTime()).toBeGreaterThan(before);
  });
});
