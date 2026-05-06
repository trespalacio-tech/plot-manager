import { getDb } from '../db';
import type { Task, TaskStatus } from '../types';
import { newId, nowStamps } from './ids';
import { recordPut } from '@/lib/sync/log';

async function logUpdate(id: string, patch: object): Promise<void> {
  await recordPut({ table: 'tasks', recordId: id, patch });
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: TaskStatus;
};
export type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt'>>;

export interface TaskFilter {
  parcelId?: string;
  status?: TaskStatus | TaskStatus[];
  sourceRef?: string;
}

export async function listTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const db = getDb();
  let rows = await db.tasks.toArray();
  if (filter.parcelId) rows = rows.filter((t) => t.parcelId === filter.parcelId);
  if (filter.sourceRef) rows = rows.filter((t) => t.sourceRef === filter.sourceRef);
  if (filter.status) {
    const allowed = Array.isArray(filter.status) ? filter.status : [filter.status];
    rows = rows.filter((t) => allowed.includes(t.status));
  }
  rows.sort((a, b) => {
    const pr = priorityOrder(b.priority) - priorityOrder(a.priority);
    if (pr !== 0) return pr;
    const ad = a.scheduledFor?.getTime() ?? a.dueDate?.getTime() ?? a.createdAt.getTime();
    const bd = b.scheduledFor?.getTime() ?? b.dueDate?.getTime() ?? b.createdAt.getTime();
    return ad - bd;
  });
  return rows;
}

function priorityOrder(p: Task['priority']): number {
  switch (p) {
    case 'URGENT':
      return 4;
    case 'HIGH':
      return 3;
    case 'MEDIUM':
      return 2;
    case 'LOW':
      return 1;
  }
}

export async function getTask(id: string): Promise<Task | undefined> {
  return getDb().tasks.get(id);
}

export async function createTask(input: TaskInput): Promise<Task> {
  const task: Task = {
    id: newId(),
    ...nowStamps(),
    ...input,
    status: input.status ?? 'PENDING',
  };
  await getDb().tasks.add(task);
  await logUpdate(task.id, task);
  return task;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  const final = { ...patch, updatedAt: new Date() };
  await getDb().tasks.update(id, final);
  await logUpdate(id, final);
}

export async function completeTask(
  id: string,
  completedFieldLogEntryId?: string,
): Promise<void> {
  const now = new Date();
  const patch = {
    status: 'DONE' as TaskStatus,
    completedAt: now,
    completedFieldLogEntryId,
    updatedAt: now,
  };
  await getDb().tasks.update(id, patch);
  await logUpdate(id, patch);
}

export interface PostponeOptions {
  reason?: string;
  newScheduledFor?: Date;
  newDueDate?: Date;
}

export async function postponeTask(
  id: string,
  optionsOrReason?: string | PostponeOptions,
): Promise<void> {
  const now = new Date();
  const opts: PostponeOptions =
    typeof optionsOrReason === 'string'
      ? { reason: optionsOrReason }
      : (optionsOrReason ?? {});
  const patch: TaskPatch = {
    status: 'POSTPONED',
    postponeReason: opts.reason,
    updatedAt: now,
  };
  if (opts.newScheduledFor) patch.scheduledFor = opts.newScheduledFor;
  if (opts.newDueDate) patch.dueDate = opts.newDueDate;
  await getDb().tasks.update(id, patch);
  await logUpdate(id, patch);
}

export async function rescheduleTask(
  id: string,
  newScheduledFor: Date,
  newDueDate?: Date,
): Promise<void> {
  const now = new Date();
  const patch: TaskPatch = {
    scheduledFor: newScheduledFor,
    status: 'PENDING',
    postponeReason: undefined,
    updatedAt: now,
  };
  if (newDueDate) patch.dueDate = newDueDate;
  await getDb().tasks.update(id, patch);
  await logUpdate(id, patch);
}

export async function markInProgress(id: string): Promise<void> {
  const patch = { status: 'IN_PROGRESS' as TaskStatus, updatedAt: new Date() };
  await getDb().tasks.update(id, patch);
  await logUpdate(id, patch);
}

export async function dismissTask(id: string): Promise<void> {
  const patch = { status: 'DISMISSED' as TaskStatus, updatedAt: new Date() };
  await getDb().tasks.update(id, patch);
  await logUpdate(id, patch);
}

export async function reopenTask(id: string): Promise<void> {
  const patch = {
    status: 'PENDING' as TaskStatus,
    postponeReason: undefined,
    updatedAt: new Date(),
  };
  await getDb().tasks.update(id, patch);
  await logUpdate(id, patch);
}
