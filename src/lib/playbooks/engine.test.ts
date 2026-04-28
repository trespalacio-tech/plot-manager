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
import { doy, doyInWindow, nextWindowDates } from './types';

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

describe('nextWindowDates', () => {
  it('ventana del año en curso si aún no termina', () => {
    const now = new Date(2026, 1, 1); // 1 feb 2026
    const w = nextWindowDates(now, doy(3, 15), doy(5, 15));
    expect(w.start.getFullYear()).toBe(2026);
    expect(w.start.getMonth()).toBe(2); // marzo
    expect(w.end.getMonth()).toBe(4); // mayo
  });

  it('si la ventana ya pasó, salta al año siguiente', () => {
    const now = new Date(2026, 10, 1); // 1 nov 2026
    const w = nextWindowDates(now, doy(3, 15), doy(5, 15));
    expect(w.start.getFullYear()).toBe(2027);
    expect(w.end.getFullYear()).toBe(2027);
  });

  it('ventanas que cruzan fin de año: end en el año siguiente', () => {
    const now = new Date(2026, 9, 1); // 1 oct 2026
    const w = nextWindowDates(now, doy(11, 15), doy(2, 15));
    expect(w.start.getFullYear()).toBe(2026);
    expect(w.end.getFullYear()).toBe(2027);
  });
});

describe('evaluatePlaybooks', () => {
  it('genera todas las tareas del playbook con scheduledFor y dueDate', async () => {
    const { parcel } = await seedApple('TRANSITION');
    const now = new Date(2026, 2, 10); // 10 marzo
    const r = await evaluatePlaybooks({ now });
    expect(r.createdTasks).toBeGreaterThan(0);
    const tasks = await listTasks({ parcelId: parcel.id });
    expect(tasks.length).toBe(r.createdTasks);
    for (const t of tasks) {
      expect(t.source).toBe('PLAYBOOK');
      expect(t.sourceRef).toMatch(/^apple-transition-burgos:/);
      expect(t.scheduledFor).toBeInstanceOf(Date);
      expect(t.dueDate).toBeInstanceOf(Date);
      // dueDate >= scheduledFor (incluso ventanas que cruzan año)
      expect(t.dueDate!.getTime()).toBeGreaterThanOrEqual(t.scheduledFor!.getTime());
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

  it('genera nuevas tareas al año siguiente cuando las del año actual están hechas', async () => {
    const { parcel } = await seedApple('TRANSITION');
    const now2026 = new Date(2026, 2, 10);
    await evaluatePlaybooks({ now: now2026 });
    const created = await listTasks({ parcelId: parcel.id });
    expect(created.length).toBeGreaterThan(0);
    // Marca todas como hechas.
    for (const t of created) await completeTask(t.id);

    // Avanzamos un año: como cada tarea anual usa subKey con sufijo de año,
    // las completadas no bloquean la generación de nuevas para el ciclo siguiente.
    const now2027 = new Date(2027, 2, 10);
    const r = await evaluatePlaybooks({ now: now2027 });
    expect(r.createdTasks).toBeGreaterThan(0);

    const all = await listTasks({ parcelId: parcel.id });
    const pending = all.filter((t) => t.status === 'PENDING');
    // Todas las tareas pendientes son del nuevo ciclo: ningún subKey se repite.
    const subKeys = new Set(pending.map((t) => t.sourceRef));
    expect(subKeys.size).toBe(pending.length);
    // Las tareas completadas siguen ahí, distintas de las nuevas pendientes.
    expect(all.length).toBe(created.length + r.createdTasks);
  });

  it('helper doy() coincide con fechas reales', () => {
    // 1 de enero = 1, 31 de diciembre = 365
    expect(doy(1, 1)).toBe(1);
    expect(doy(3, 1)).toBe(60);
    expect(doy(12, 31)).toBe(365);
  });
});
