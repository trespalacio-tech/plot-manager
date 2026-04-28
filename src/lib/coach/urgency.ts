import type { Task, TaskPriority } from '@/lib/db/types';

export type TaskUrgency =
  | 'OVERDUE'
  | 'TODAY'
  | 'SOON'
  | 'THIS_WEEK'
  | 'UPCOMING'
  | 'LATER';

export const URGENCY_LABEL: Record<TaskUrgency, string> = {
  OVERDUE: 'Atrasada',
  TODAY: 'Hoy',
  SOON: 'En 2-3 días',
  THIS_WEEK: 'Esta semana',
  UPCOMING: 'Próximas 2 semanas',
  LATER: 'Más adelante',
};

export const URGENCY_BADGE_CLASS: Record<TaskUrgency, string> = {
  OVERDUE: 'bg-red-600 text-white',
  TODAY: 'bg-orange-500 text-white',
  SOON: 'bg-amber-500 text-white',
  THIS_WEEK: 'bg-amber-100 text-amber-800',
  UPCOMING: 'bg-sky-100 text-sky-800',
  LATER: 'bg-slate-100 text-slate-700',
};

const MS_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dueAnchor(task: Pick<Task, 'scheduledFor' | 'dueDate'>): Date | undefined {
  // Para urgencia, lo que cuenta es la fecha más temprana que invita a actuar.
  // scheduledFor es "cuándo empezar"; dueDate es "cuándo se cierra la ventana".
  return task.scheduledFor ?? task.dueDate;
}

export function taskUrgency(
  task: Pick<Task, 'scheduledFor' | 'dueDate' | 'status'>,
  now: Date = new Date(),
): TaskUrgency {
  if (task.status === 'POSTPONED') return 'LATER';
  const due = task.dueDate;
  const start = task.scheduledFor;
  const today = startOfDay(now);
  if (due) {
    const dueDay = startOfDay(due);
    const diff = (dueDay.getTime() - today.getTime()) / MS_DAY;
    if (diff < 0) return 'OVERDUE';
  }
  const anchor = start ?? due;
  if (!anchor) return 'LATER';
  const anchorDay = startOfDay(anchor);
  const diff = (anchorDay.getTime() - today.getTime()) / MS_DAY;
  if (diff <= 0) return 'TODAY';
  if (diff <= 3) return 'SOON';
  if (diff <= 7) return 'THIS_WEEK';
  if (diff <= 14) return 'UPCOMING';
  return 'LATER';
}

export const URGENCY_ORDER: TaskUrgency[] = [
  'OVERDUE',
  'TODAY',
  'SOON',
  'THIS_WEEK',
  'UPCOMING',
  'LATER',
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/** Compara tareas por urgencia, luego por prioridad, luego por fecha más temprana. */
export function compareTasks(
  a: Pick<Task, 'scheduledFor' | 'dueDate' | 'priority' | 'status' | 'createdAt'>,
  b: Pick<Task, 'scheduledFor' | 'dueDate' | 'priority' | 'status' | 'createdAt'>,
  now: Date = new Date(),
): number {
  const ua = URGENCY_ORDER.indexOf(taskUrgency(a, now));
  const ub = URGENCY_ORDER.indexOf(taskUrgency(b, now));
  if (ua !== ub) return ua - ub;
  const pa = PRIORITY_RANK[a.priority];
  const pb = PRIORITY_RANK[b.priority];
  if (pa !== pb) return pb - pa;
  const da = (dueAnchor(a) ?? a.createdAt).getTime();
  const db = (dueAnchor(b) ?? b.createdAt).getTime();
  return da - db;
}

export interface UrgencyDescription {
  label: string;
  daysFromNow: number;
}

export function describeUrgency(
  task: Pick<Task, 'scheduledFor' | 'dueDate' | 'status'>,
  now: Date = new Date(),
): UrgencyDescription {
  const today = startOfDay(now);
  const due = task.dueDate;
  if (due) {
    const dueDay = startOfDay(due);
    const diff = Math.round((dueDay.getTime() - today.getTime()) / MS_DAY);
    if (diff < 0) return { label: `Atrasada ${Math.abs(diff)} d`, daysFromNow: diff };
    if (diff === 0) return { label: 'Vence hoy', daysFromNow: 0 };
    if (diff === 1) return { label: 'Vence mañana', daysFromNow: 1 };
    if (diff <= 14) return { label: `Vence en ${diff} d`, daysFromNow: diff };
  }
  const start = task.scheduledFor;
  if (start) {
    const startDay = startOfDay(start);
    const diff = Math.round((startDay.getTime() - today.getTime()) / MS_DAY);
    if (diff <= 0) return { label: 'Empieza hoy', daysFromNow: 0 };
    if (diff === 1) return { label: 'Empieza mañana', daysFromNow: 1 };
    if (diff <= 30) return { label: `En ${diff} d`, daysFromNow: diff };
    return {
      label: start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      daysFromNow: diff,
    };
  }
  return { label: 'Sin fecha', daysFromNow: Number.POSITIVE_INFINITY };
}
