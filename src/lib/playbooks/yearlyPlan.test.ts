import { describe, expect, it } from 'vitest';
import type { Parcel } from '@/lib/db/types';
import type { Playbook } from './types';
import { doy } from './types';
import { buildYearlyPlan } from './yearlyPlan';

const baseParcel: Parcel = {
  id: 'p1',
  farmId: 'f1',
  name: 'Test',
  areaHa: 1,
  status: 'TRANSITION',
  statusChangedAt: new Date(),
  cropType: 'NUT_TREE',
  primarySpecies: 'almendro',
  irrigation: 'RAINFED',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const pb: Playbook = {
  id: 'almond-test',
  title: 'Almendro test',
  description: '',
  cropType: 'NUT_TREE',
  species: 'almendro',
  applicableStatuses: ['TRANSITION', 'REGENERATIVE'],
  region: 'BURGOS',
  tasks: [
    {
      id: 'spring',
      type: 'PRUNING',
      title: 'Poda primavera',
      rationale: 'r',
      scientificBasis: 'b',
      windowStartDoy: doy(3, 15),
      windowEndDoy: doy(4, 30),
      priority: 'HIGH',
    },
    {
      id: 'autumn-wrap',
      type: 'COVER_CROP_SOWING',
      title: 'Siembra que cruza año',
      rationale: 'r',
      scientificBasis: 'b',
      windowStartDoy: doy(11, 20),
      windowEndDoy: doy(2, 5),
      priority: 'MEDIUM',
    },
  ],
};

describe('buildYearlyPlan', () => {
  it('proyecta cada tarea aplicable a un año natural concreto', () => {
    const plan = buildYearlyPlan(baseParcel, 2027, [pb]);
    expect(plan.year).toBe(2027);
    expect(plan.items).toHaveLength(2);
    expect(plan.items[0]!.taskId).toBe('spring');
    expect(plan.items[0]!.startDate.getFullYear()).toBe(2027);
    expect(plan.items[0]!.startDate.getMonth()).toBe(2); // marzo
  });

  it('marca wrapsYear y proyecta endDate al año siguiente', () => {
    const plan = buildYearlyPlan(baseParcel, 2027, [pb]);
    const wrap = plan.items.find((i) => i.taskId === 'autumn-wrap')!;
    expect(wrap.wrapsYear).toBe(true);
    expect(wrap.startDate.getFullYear()).toBe(2027);
    expect(wrap.endDate.getFullYear()).toBe(2028);
  });

  it('agrupa por mes 1-12 sin huecos', () => {
    const plan = buildYearlyPlan(baseParcel, 2027, [pb]);
    expect(plan.byMonth).toHaveLength(12);
    const march = plan.byMonth.find((m) => m.month === 3)!;
    expect(march.items.map((i) => i.taskId)).toEqual(['spring']);
    const nov = plan.byMonth.find((m) => m.month === 11)!;
    expect(nov.items.map((i) => i.taskId)).toEqual(['autumn-wrap']);
    // Mes sin tareas existe igualmente con items vacío.
    const jul = plan.byMonth.find((m) => m.month === 7)!;
    expect(jul.items).toEqual([]);
  });

  it('respeta el filtro de especie del motor', () => {
    const otraEspecie: Parcel = { ...baseParcel, primarySpecies: 'pistacho' };
    const plan = buildYearlyPlan(otraEspecie, 2027, [pb]);
    expect(plan.items).toHaveLength(0);
  });
});
