import {
  createAlert,
  createTask,
  listAlerts,
  listParcels,
  listTasks,
  updateTask,
} from '@/lib/db/repos';
import type { Parcel, TaskSource } from '@/lib/db/types';
import { buildContext } from './context';
import { ALL_RULES } from './catalog';
import type { AlertProposal, Rule, TaskProposal } from './types';

export interface EvaluateResult {
  createdTasks: number;
  updatedTasks: number;
  skippedTasks: number;
  createdAlerts: number;
}

export function emptyResult(): EvaluateResult {
  return { createdTasks: 0, updatedTasks: 0, skippedTasks: 0, createdAlerts: 0 };
}

export interface EvaluateOptions {
  now?: Date;
  parcels?: Parcel[];
  rules?: Rule[];
}

function refFor(ns: string, parcelId: string, subKey?: string): string {
  return subKey ? `${ns}:${parcelId}:${subKey}` : `${ns}:${parcelId}`;
}

const MS_DAY = 24 * 60 * 60 * 1000;

function defaultDueDays(priority: TaskProposal['priority']): number {
  switch (priority) {
    case 'URGENT':
      return 7;
    case 'HIGH':
      return 21;
    case 'MEDIUM':
      return 45;
    case 'LOW':
      return 90;
  }
}

function withDefaultDates(p: TaskProposal, now: Date): TaskProposal {
  if (p.scheduledFor && p.dueDate) return p;
  const scheduledFor = p.scheduledFor ?? now;
  const dueDate =
    p.dueDate ?? new Date(scheduledFor.getTime() + defaultDueDays(p.priority) * MS_DAY);
  return { ...p, scheduledFor, dueDate };
}

export async function applyTaskProposal(
  ns: string,
  source: TaskSource,
  parcel: Parcel,
  proposal: TaskProposal,
  result: EvaluateResult,
  now: Date = new Date(),
): Promise<void> {
  const p = withDefaultDates(proposal, now);
  const sourceRef = refFor(ns, parcel.id, p.subKey);
  const existing = await listTasks({ sourceRef });
  if (existing.length > 0) {
    const e = existing[0]!;
    if (e.status === 'DONE' || e.status === 'DISMISSED') {
      result.skippedTasks += 1;
      return;
    }
    await updateTask(e.id, {
      title: p.title,
      rationale: p.rationale,
      scientificBasis: p.scientificBasis,
      guidanceKey: p.guidanceKey,
      priority: p.priority,
      scheduledFor: p.scheduledFor,
      dueDate: p.dueDate,
      type: p.operationType,
    });
    result.updatedTasks += 1;
    return;
  }
  await createTask({
    parcelId: parcel.id,
    source,
    sourceRef,
    type: p.operationType,
    title: p.title,
    rationale: p.rationale,
    scientificBasis: p.scientificBasis,
    guidanceKey: p.guidanceKey,
    priority: p.priority,
    scheduledFor: p.scheduledFor,
    dueDate: p.dueDate,
  });
  result.createdTasks += 1;
}

export async function applyAlertProposal(
  ns: string,
  parcel: Parcel,
  p: AlertProposal,
  result: EvaluateResult,
): Promise<void> {
  const triggerSource = refFor(ns, parcel.id, p.subKey);
  const existing = await listAlerts({
    triggerSource,
    includeAcknowledged: true,
    includeExpired: true,
  });
  if (existing.length > 0) return;
  await createAlert({
    parcelId: parcel.id,
    severity: p.severity,
    title: p.title,
    message: p.message,
    triggerSource,
    expiresAt: p.expiresAt,
  });
  result.createdAlerts += 1;
}

export async function evaluateRules(
  options: EvaluateOptions = {},
): Promise<EvaluateResult> {
  const now = options.now ?? new Date();
  const parcels = options.parcels ?? (await listParcels());
  const rules = options.rules ?? ALL_RULES;
  const result = emptyResult();
  for (const parcel of parcels) {
    const ctx = await buildContext(parcel, now);
    for (const rule of rules) {
      const proposals = rule.evaluate(ctx);
      for (const p of proposals) {
        if (p.kind === 'TASK') {
          await applyTaskProposal(rule.id, 'RULE_ENGINE', parcel, p, result, now);
        } else {
          await applyAlertProposal(rule.id, parcel, p, result);
        }
      }
    }
  }
  return result;
}
