import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db';
import {
  completeTask,
  createFarm,
  createParcel,
  dismissTask,
  listTasks,
} from '@/lib/db/repos';
import { applicablePlaybooks, evaluatePlaybooks } from './engine';
import { ALL_PLAYBOOKS } from './catalog';
import { doy, doyInWindow } from './types';

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

async function seedApple(status: 'DESIGN' | 'TRANSITION' | 'REGENERATIVE' = 'TRANSITION') {
  const farm = await createFarm({ name: 'F', municipality: 'Burgos', province: 'Burgos' });
  const parcel = await createParcel({
    farmId: farm.id,
    name: 'P1',
    areaHa: 1,
    status,
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  });
  return { farm, parcel };
}

describe('doyInWindow', () => {
  it('ventanas dentro del mismo año', () => {
    expect(doyInWindow(100, 50, 150)).toBe(true);
    expect(doyInWindow(49, 50, 150)).toBe(false);
    expect(doyInWindow(151, 50, 150)).toBe(false);
  });
  it('ventanas que cruzan fin de año', () => {
    expect(doyInWindow(355, 340, 20)).toBe(true);
    expect(doyInWindow(5, 340, 20)).toBe(true);
    expect(doyInWindow(100, 340, 20)).toBe(false);
  });
});

describe('applicablePlaybooks', () => {
  it('filtra por cultivo y estado', async () => {
    const { parcel } = await seedApple('TRANSITION');
    const out = applicablePlaybooks(parcel);
    expect(out.map((p) => p.id)).toEqual(['apple-transition-burgos']);
  });

  it('viñedo en régimen regenerativo solo trae su playbook', async () => {
    const farm = await createFarm({ name: 'F', municipality: 'Burgos', province: 'Burgos' });
    const parcel = await createParcel({
      farmId: farm.id,
      name: 'Vid',
      areaHa: 1,
      status: 'REGENERATIVE',
      cropType: 'VINEYARD',
      irrigation: 'DRIP',
    });
    const out = applicablePlaybooks(parcel);
    expect(out.map((p) => p.id)).toEqual(['vine-tempranillo-regenerative-burgos']);
  });

  it('MIXED hereda playbooks de ambos cultivos', async () => {
    const farm = await createFarm({ name: 'F', municipality: 'Burgos', province: 'Burgos' });
    const parcel = await createParcel({
      farmId: farm.id,
      name: 'Mix',
      areaHa: 1,
      status: 'TRANSITION',
      cropType: 'MIXED',
      irrigation: 'DRIP',
    });
    const out = applicablePlaybooks(parcel);
    expect(out.map((p) => p.id).sort()).toEqual([
      'apple-transition-burgos',
      'vine-tempranillo-transition-burgos',
    ]);
  });
});

describe('evaluatePlaybooks', () => {
  it('crea solo las tareas cuyo DOY cae en la ventana', async () => {
    const { parcel } = await seedApple('TRANSITION');
    const now = new Date(2026, 2, 10); // 10 marzo
    const r = await evaluatePlaybooks({ now });
    expect(r.createdTasks).toBeGreaterThan(0);
    const tasks = await listTasks({ parcelId: parcel.id });
    for (const t of tasks) {
      expect(t.source).toBe('PLAYBOOK');
      expect(t.sourceRef).toMatch(/^apple-transition-burgos:/);
    }
  });

  it('es idempotente: misma fecha no duplica', async () => {
    const now = new Date(2026, 2, 10);
    await seedApple('TRANSITION');
    const r1 = await evaluatePlaybooks({ now });
    const r2 = await evaluatePlaybooks({ now });
    expect(r2.createdTasks).toBe(0);
    expect(r2.updatedTasks).toBe(r1.createdTasks);
  });

  it('no recrea tareas DONE/DISMISSED', async () => {
    const now = new Date(2026, 2, 10);
    const { parcel } = await seedApple('TRANSITION');
    await evaluatePlaybooks({ now });
    const tasks = await listTasks({ parcelId: parcel.id });
    await completeTask(tasks[0]!.id);
    await dismissTask(tasks[1]!.id);

    const r = await evaluatePlaybooks({ now });
    expect(r.skippedTasks).toBe(2);
  });

  it('todas las tareas del catálogo tienen ventanas DOY válidas', () => {
    for (const pb of ALL_PLAYBOOKS) {
      for (const t of pb.tasks) {
        expect(t.windowStartDoy).toBeGreaterThan(0);
        expect(t.windowStartDoy).toBeLessThanOrEqual(366);
        expect(t.windowEndDoy).toBeGreaterThan(0);
        expect(t.windowEndDoy).toBeLessThanOrEqual(366);
      }
    }
  });

  it('helper doy() coincide con fechas reales', () => {
    // 1 de enero = 1, 31 de diciembre = 365
    expect(doy(1, 1)).toBe(1);
    expect(doy(3, 1)).toBe(60);
    expect(doy(12, 31)).toBe(365);
  });
});
