import { getDb, type FincasDB } from '../db';
import type { Parcel, ParcelStatus, ParcelStatusHistory } from '../types';
import { newId } from './ids';
import { recordDelete, recordPut } from '@/lib/sync/log';

export type ParcelInput = Omit<Parcel, 'id' | 'createdAt' | 'updatedAt' | 'statusChangedAt'> & {
  statusChangedAt?: Date;
};
export type ParcelPatch = Partial<Omit<Parcel, 'id' | 'createdAt'>>;

export function parcelCascadeTables(db: FincasDB) {
  return [
    db.parcels,
    db.parcelStatusHistory,
    db.varieties,
    db.plants,
    db.soilSamples,
    db.soilAnalyses,
    db.fieldLogEntries,
    db.inputApplications,
    db.coverCrops,
    db.biodiversityFeatures,
    db.transitionPlans,
    db.milestones,
    db.phenologyObservations,
    db.pestMonitorings,
    db.harvests,
    db.tasks,
    db.alerts,
  ];
}

export async function listParcels(): Promise<Parcel[]> {
  return getDb().parcels.orderBy('name').toArray();
}

export async function listParcelsByFarm(farmId: string): Promise<Parcel[]> {
  return getDb().parcels.where('farmId').equals(farmId).sortBy('name');
}

export async function getParcel(id: string): Promise<Parcel | undefined> {
  return getDb().parcels.get(id);
}

export async function createParcel(input: ParcelInput): Promise<Parcel> {
  const now = new Date();
  const parcel: Parcel = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    statusChangedAt: input.statusChangedAt ?? now,
    ...input,
  };
  const db = getDb();
  let history: ParcelStatusHistory | undefined;
  await db.transaction('rw', [db.parcels, db.parcelStatusHistory], async () => {
    await db.parcels.add(parcel);
    history = {
      id: newId(),
      parcelId: parcel.id,
      toStatus: parcel.status,
      changedAt: parcel.statusChangedAt,
      createdAt: now,
      updatedAt: now,
    };
    await db.parcelStatusHistory.add(history);
  });
  await recordPut({ table: 'parcels', recordId: parcel.id, patch: parcel });
  if (history) {
    await recordPut({
      table: 'parcelStatusHistory',
      recordId: history.id,
      patch: history,
    });
  }
  return parcel;
}

export async function updateParcel(id: string, patch: ParcelPatch): Promise<void> {
  const final = { ...patch, updatedAt: new Date() };
  await getDb().parcels.update(id, final);
  await recordPut({ table: 'parcels', recordId: id, patch: final });
}

export async function changeParcelStatus(
  id: string,
  toStatus: ParcelStatus,
  reason?: string,
): Promise<void> {
  const db = getDb();
  await db.transaction('rw', [db.parcels, db.parcelStatusHistory], async () => {
    const current = await db.parcels.get(id);
    if (!current) throw new Error(`Parcel ${id} not found`);
    if (current.status === toStatus) return;
    const now = new Date();
    await db.parcels.update(id, {
      status: toStatus,
      statusChangedAt: now,
      updatedAt: now,
    });
    const history: ParcelStatusHistory = {
      id: newId(),
      parcelId: id,
      fromStatus: current.status,
      toStatus,
      changedAt: now,
      reason,
      createdAt: now,
      updatedAt: now,
    };
    await db.parcelStatusHistory.add(history);
  });
}

export async function cascadeDeleteParcels(
  db: FincasDB,
  parcelIds: string[],
): Promise<void> {
  if (parcelIds.length === 0) return;

  await db.parcelStatusHistory.where('parcelId').anyOf(parcelIds).delete();
  await db.varieties.where('parcelId').anyOf(parcelIds).delete();
  await db.plants.where('parcelId').anyOf(parcelIds).delete();

  const samples = await db.soilSamples.where('parcelId').anyOf(parcelIds).toArray();
  const sampleIds = samples.map((s) => s.id);
  if (sampleIds.length) {
    await db.soilAnalyses.where('sampleId').anyOf(sampleIds).delete();
    await db.soilSamples.bulkDelete(sampleIds);
  }

  const parcelIdSet = new Set(parcelIds);
  const affectedEntries = await db.fieldLogEntries
    .where('parcelIds')
    .anyOf(parcelIds)
    .toArray();
  const entriesToDelete: string[] = [];
  for (const entry of affectedEntries) {
    const remaining = entry.parcelIds.filter((p) => !parcelIdSet.has(p));
    if (remaining.length === 0) {
      entriesToDelete.push(entry.id);
    } else if (remaining.length !== entry.parcelIds.length) {
      await db.fieldLogEntries.update(entry.id, {
        parcelIds: remaining,
        updatedAt: new Date(),
      });
    }
  }
  if (entriesToDelete.length) {
    await db.inputApplications
      .where('fieldLogEntryId')
      .anyOf(entriesToDelete)
      .delete();
    await db.fieldLogEntries.bulkDelete(entriesToDelete);
  }

  await db.coverCrops.where('parcelId').anyOf(parcelIds).delete();
  await db.biodiversityFeatures.where('parcelId').anyOf(parcelIds).delete();

  const plans = await db.transitionPlans.where('parcelId').anyOf(parcelIds).toArray();
  const planIds = plans.map((p) => p.id);
  if (planIds.length) {
    await db.milestones.where('transitionPlanId').anyOf(planIds).delete();
    await db.transitionPlans.bulkDelete(planIds);
  }

  await db.phenologyObservations.where('parcelId').anyOf(parcelIds).delete();
  await db.pestMonitorings.where('parcelId').anyOf(parcelIds).delete();
  await db.harvests.where('parcelId').anyOf(parcelIds).delete();
  await db.tasks.where('parcelId').anyOf(parcelIds).delete();
  await db.alerts.where('parcelId').anyOf(parcelIds).delete();

  await db.parcels.bulkDelete(parcelIds);
}

export async function deleteParcel(id: string): Promise<void> {
  const db = getDb();
  await db.transaction('rw', parcelCascadeTables(db), async () => {
    await cascadeDeleteParcels(db, [id]);
  });
  // Por simplicidad: la op de DELETE de la parcela basta para que el peer
  // borre la fila. La cascada local de tareas/análisis/etc. se replicará
  // como ops independientes en una iteración posterior; mientras tanto
  // si el peer recibe el DELETE de la parcela y la suya tiene tareas
  // huérfanas, el listado las oculta porque el join falla.
  await recordDelete({ table: 'parcels', recordId: id });
}
