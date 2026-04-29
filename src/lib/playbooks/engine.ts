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
import { nextWindowDates } from './types';

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
      matchesSpecies(parcel, p) &&
      p.applicableStatuses.includes(parcel.status) &&
      p.region === 'BURGOS',
  );
}

function matchesCrop(parcel: Parcel, playbook: Playbook): boolean {
  if (playbook.cropType === parcel.cropType) return true;
  if (parcel.cropType === 'MIXED') return true;
  return false;
}

function matchesSpecies(parcel: Parcel, playbook: Playbook): boolean {
  // Sin restricción de especie en el playbook → vale para todas.
  if (!playbook.species) return true;
  // Parcela sin especie declarada → no podemos confirmar; aplicamos
  // por compatibilidad hacia atrás (parcelas creadas antes de NUT_TREE).
  if (!parcel.primarySpecies) return true;
  return parcel.primarySpecies === playbook.species;
}

export async function evaluatePlaybooks(
  options: PlaybookEvaluateOptions = {},
): Promise<EvaluateResult> {
  const now = options.now ?? new Date();
  const parcels = options.parcels ?? (await listParcels());
  const playbooks = options.playbooks ?? ALL_PLAYBOOKS;
  const result = emptyResult();

  for (const parcel of parcels) {
    const matches = applicablePlaybooks(parcel, playbooks);
    for (const playbook of matches) {
      for (const task of playbook.tasks) {
        const window = nextWindowDates(now, task.windowStartDoy, task.windowEndDoy);
        const proposal: TaskProposal = {
          kind: 'TASK',
          // Suffix con el año del inicio de ventana → cada año genera tarea nueva.
          // Sin esto, una tarea anual completada nunca volvería a aparecer.
          subKey: `${task.id}:${window.start.getFullYear()}`,
          operationType: task.type,
          title: task.title,
          rationale: task.rationale,
          scientificBasis: task.scientificBasis,
          guidanceKey: task.guidanceKey,
          priority: task.priority,
          scheduledFor: window.start,
          dueDate: window.end,
        };
        await applyTaskProposal(playbook.id, 'PLAYBOOK', parcel, proposal, result, now);
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
