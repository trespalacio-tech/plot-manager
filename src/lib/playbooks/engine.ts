import { listParcels } from '@/lib/db/repos';
import type { Parcel } from '@/lib/db/types';
import {
  applyTaskProposal,
  emptyResult,
  evaluateRules,
  type EvaluateResult,
} from '@/lib/rules/engine';
import type { TaskProposal } from '@/lib/rules/types';
import { ALL_PLAYBOOKS } from './catalog';
import type { Playbook } from './types';
import { doyInWindow } from './types';

export interface PlaybookEvaluateOptions {
  now?: Date;
  parcels?: Parcel[];
  playbooks?: Playbook[];
}

export function applicablePlaybooks(
  parcel: Parcel,
  playbooks: Playbook[] = ALL_PLAYBOOKS,
): Playbook[] {
  return playbooks.filter(
    (p) =>
      matchesCrop(parcel, p) &&
      p.applicableStatuses.includes(parcel.status) &&
      (p.region === 'BURGOS'),
  );
}

function matchesCrop(parcel: Parcel, playbook: Playbook): boolean {
  if (playbook.cropType === parcel.cropType) return true;
  if (parcel.cropType === 'MIXED') return true;
  return false;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

export async function evaluatePlaybooks(
  options: PlaybookEvaluateOptions = {},
): Promise<EvaluateResult> {
  const now = options.now ?? new Date();
  const parcels = options.parcels ?? (await listParcels());
  const playbooks = options.playbooks ?? ALL_PLAYBOOKS;
  const result = emptyResult();
  const today = dayOfYear(now);

  for (const parcel of parcels) {
    const matches = applicablePlaybooks(parcel, playbooks);
    for (const playbook of matches) {
      for (const task of playbook.tasks) {
        if (!doyInWindow(today, task.windowStartDoy, task.windowEndDoy)) continue;
        const proposal: TaskProposal = {
          kind: 'TASK',
          subKey: task.id,
          operationType: task.type,
          title: task.title,
          rationale: task.rationale,
          scientificBasis: task.scientificBasis,
          guidanceKey: task.guidanceKey,
          priority: task.priority,
        };
        await applyTaskProposal(playbook.id, 'PLAYBOOK', parcel, proposal, result);
      }
    }
  }
  return result;
}

export interface CoachEvaluateOptions {
  now?: Date;
}

export async function evaluateCoach(
  options: CoachEvaluateOptions = {},
): Promise<EvaluateResult> {
  const now = options.now ?? new Date();
  const parcels = await listParcels();
  const rulesResult = await evaluateRules({ now, parcels });
  const playbooksResult = await evaluatePlaybooks({ now, parcels });
  return {
    createdTasks: rulesResult.createdTasks + playbooksResult.createdTasks,
    updatedTasks: rulesResult.updatedTasks + playbooksResult.updatedTasks,
    skippedTasks: rulesResult.skippedTasks + playbooksResult.skippedTasks,
    createdAlerts: rulesResult.createdAlerts + playbooksResult.createdAlerts,
  };
}
