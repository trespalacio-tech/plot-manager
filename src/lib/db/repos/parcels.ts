import { getDb } from '../db';
import type { Parcel, ParcelStatus, ParcelStatusHistory } from '../types';
import { newId } from './ids';

export type ParcelInput = Omit<Parcel, 'id' | 'createdAt' | 'updatedAt' | 'statusChangedAt'> & {
  statusChangedAt?: Date;
};
export type ParcelPatch = Partial<Omit<Parcel, 'id' | 'createdAt'>>;

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
  await db.transaction('rw', [db.parcels, db.parcelStatusHistory], async () => {
    await db.parcels.add(parcel);
    const history: ParcelStatusHistory = {
      id: newId(),
      parcelId: parcel.id,
      toStatus: parcel.status,
      changedAt: parcel.statusChangedAt,
      createdAt: now,
      updatedAt: now,
    };
    await db.parcelStatusHistory.add(history);
  });
  return parcel;
}

export async function updateParcel(id: string, patch: ParcelPatch): Promise<void> {
  await getDb().parcels.update(id, { ...patch, updatedAt: new Date() });
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

export async function deleteParcel(id: string): Promise<void> {
  const db = getDb();
  await db.transaction(
    'rw',
    [db.parcels, db.parcelStatusHistory, db.varieties],
    async () => {
      await db.parcelStatusHistory.where('parcelId').equals(id).delete();
      await db.varieties.where('parcelId').equals(id).delete();
      await db.parcels.delete(id);
    },
  );
}
