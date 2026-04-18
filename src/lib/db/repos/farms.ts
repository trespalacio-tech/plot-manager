import { getDb } from '../db';
import type { Farm } from '../types';
import { newId, nowStamps } from './ids';

export type FarmInput = Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>;
export type FarmPatch = Partial<FarmInput>;

export async function listFarms(): Promise<Farm[]> {
  return getDb().farms.orderBy('name').toArray();
}

export async function getFarm(id: string): Promise<Farm | undefined> {
  return getDb().farms.get(id);
}

export async function createFarm(input: FarmInput): Promise<Farm> {
  const farm: Farm = { id: newId(), ...nowStamps(), ...input };
  await getDb().farms.add(farm);
  return farm;
}

export async function updateFarm(id: string, patch: FarmPatch): Promise<void> {
  await getDb().farms.update(id, { ...patch, updatedAt: new Date() });
}

export async function deleteFarm(id: string): Promise<void> {
  const db = getDb();
  await db.transaction(
    'rw',
    [db.farms, db.parcels, db.parcelStatusHistory, db.varieties],
    async () => {
      const parcels = await db.parcels.where('farmId').equals(id).toArray();
      const parcelIds = parcels.map((p) => p.id);
      if (parcelIds.length) {
        await db.parcelStatusHistory.where('parcelId').anyOf(parcelIds).delete();
        await db.varieties.where('parcelId').anyOf(parcelIds).delete();
        await db.parcels.bulkDelete(parcelIds);
      }
      await db.farms.delete(id);
    },
  );
}
