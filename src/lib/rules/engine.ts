import {
  createAlert,
  createTask,
  listAlerts,
  listParcels,
  listTasks,
  updateTask,
} from '@/lib/db/repos';
import type { Parcel } from '@/lib/db/types';
import { buildContext } from './context';
import { ALL_RULES } from './catalog';
import type { AlertProposal, Rule, TaskProposal } from './types';

export interface EvaluateResult {
  createdTasks: number;
  updatedTasks: number;
  skippedTasks: number;
  createdAlerts: number;
}

export interface EvaluateOptions {
  now?: Date;
  parcels?: Parcel[];
  rules?: Rule[];
}

function refFor(ruleId: string, parcelId: string, subKey?: string): string {
  return subKey ? `${ruleId}:${parcelId}:${subKey}` : `${ruleId}:${parcelId}`;
}

async function applyTask(
  rule: Rule,
  parcel: Parcel,
  p: TaskProposal,
  result: EvaluateResult,
) {
  const sourceRef = refFor(rule.id, parcel.id, p.subKey);
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
    source: 'RULE_ENGINE',
    sourceRef,
    type: p.operationType,
    title: p.title,
    rationale: p.rationale,
    scientificBasis: p.scientificBasis,
    priority: p.priority,
    scheduledFor: p.scheduledFor,
    dueDate: p.dueDate,
  });
  result.createdTasks += 1;
}

async function applyAlert(
  rule: Rule,
  parcel: Parcel,
  p: AlertProposal,
  result: EvaluateResult,
) {
  const triggerSource = refFor(rule.id, parcel.id, p.subKey);
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
  const result: EvaluateResult = {
    createdTasks: 0,
    updatedTasks: 0,
    skippedTasks: 0,
    createdAlerts: 0,
  };
  for (const parcel of parcels) {
    const ctx = await buildContext(parcel, now);
    for (const rule of rules) {
      const proposals = rule.evaluate(ctx);
      for (const p of proposals) {
        if (p.kind === 'TASK') {
          await applyTask(rule, parcel, p, result);
        } else {
          await applyAlert(rule, parcel, p, result);
        }
      }
    }
  }
  return result;
}
