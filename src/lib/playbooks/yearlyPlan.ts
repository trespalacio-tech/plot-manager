import type { Parcel, TaskPriority } from '@/lib/db/types';
import { ALL_PLAYBOOKS } from './catalog';
import { applicablePlaybooks } from './engine';
import { dateFromDoy, type Playbook, type PlaybookTask } from './types';

export interface YearlyPlanItem {
  /** Identificador único dentro del plan: `${playbookId}::${task.id}`. */
  id: string;
  playbookId: string;
  playbookTitle: string;
  taskId: string;
  type: PlaybookTask['type'];
  title: string;
  rationale: string;
  scientificBasis: string;
  guidanceKey?: string;
  priority: TaskPriority;
  startDate: Date;
  endDate: Date;
  /** True si la ventana cruza el fin de año (nov→feb, etc.). */
  wrapsYear: boolean;
}

export interface YearlyPlanMonth {
  /** 1-12. */
  month: number;
  monthLabel: string;
  items: YearlyPlanItem[];
}

export interface YearlyPlan {
  year: number;
  parcelId: string;
  items: YearlyPlanItem[];
  byMonth: YearlyPlanMonth[];
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Proyecta todas las tareas de los playbooks aplicables a la parcela
 * sobre el año natural `year` (1 enero - 31 diciembre). Cada tarea se
 * ancla al mes en el que arranca su ventana DOY, aunque la ventana
 * termine en enero del año siguiente (`wrapsYear: true`).
 *
 * Es una función pura: no toca la base de datos, no crea Tasks. Sirve
 * para previsualizar el calendario completo del año (PDF, planificación)
 * sin depender de la evaluación incremental del Coach.
 */
export function buildYearlyPlan(
  parcel: Parcel,
  year: number,
  playbooks: Playbook[] = ALL_PLAYBOOKS,
): YearlyPlan {
  const matches = applicablePlaybooks(parcel, playbooks);
  const items: YearlyPlanItem[] = [];

  for (const pb of matches) {
    for (const task of pb.tasks) {
      const wraps = task.windowStartDoy > task.windowEndDoy;
      const startDate = dateFromDoy(year, task.windowStartDoy);
      const endDate = wraps
        ? dateFromDoy(year + 1, task.windowEndDoy)
        : dateFromDoy(year, task.windowEndDoy);
      items.push({
        id: `${pb.id}::${task.id}`,
        playbookId: pb.id,
        playbookTitle: pb.title,
        taskId: task.id,
        type: task.type,
        title: task.title,
        rationale: task.rationale,
        scientificBasis: task.scientificBasis,
        guidanceKey: task.guidanceKey,
        priority: task.priority,
        startDate,
        endDate,
        wrapsYear: wraps,
      });
    }
  }

  items.sort((a, b) => {
    const t = a.startDate.getTime() - b.startDate.getTime();
    if (t !== 0) return t;
    return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  });

  const byMonthMap = new Map<number, YearlyPlanItem[]>();
  for (let m = 1; m <= 12; m += 1) byMonthMap.set(m, []);
  for (const it of items) {
    const m = it.startDate.getMonth() + 1;
    byMonthMap.get(m)!.push(it);
  }
  const byMonth: YearlyPlanMonth[] = [];
  for (let m = 1; m <= 12; m += 1) {
    byMonth.push({
      month: m,
      monthLabel: MONTH_NAMES[m - 1]!,
      items: byMonthMap.get(m)!,
    });
  }

  return {
    year,
    parcelId: parcel.id,
    items,
    byMonth,
  };
}

export function monthLabel(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}
