import { getDb } from '../db';
import type { Task, TaskStatus } from '../types';
import { newId, nowStamps } from './ids';

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
    status: input.status ?? 'PENDING',
    ...input,
  };
  await getDb().tasks.add(task);
  return task;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<void> {
  await getDb().tasks.update(id, { ...patch, updatedAt: new Date() });
}

export async function completeTask(
  id: string,
  completedFieldLogEntryId?: string,
): Promise<void> {
  const now = new Date();
  await getDb().tasks.update(id, {
    status: 'DONE',
    completedAt: now,
    completedFieldLogEntryId,
    updatedAt: now,
  });
}

export async function postponeTask(id: string, reason?: string): Promise<void> {
  const now = new Date();
  await getDb().tasks.update(id, {
    status: 'POSTPONED',
    postponeReason: reason,
    updatedAt: now,
  });
}

export async function dismissTask(id: string): Promise<void> {
  await getDb().tasks.update(id, { status: 'DISMISSED', updatedAt: new Date() });
}

export async function reopenTask(id: string): Promise<void> {
  await getDb().tasks.update(id, { status: 'PENDING', updatedAt: new Date() });
}
