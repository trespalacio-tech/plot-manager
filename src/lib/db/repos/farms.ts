import { getDb } from '../db';
import type { Farm } from '../types';
import { newId, nowStamps } from './ids';
import { cascadeDeleteParcels, parcelCascadeTables } from './parcels';
import { recordDelete, recordPut } from '@/lib/sync/log';

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
  await recordPut({ table: 'farms', recordId: farm.id, patch: farm });
  return farm;
}

export async function updateFarm(id: string, patch: FarmPatch): Promise<void> {
  const final = { ...patch, updatedAt: new Date() };
  await getDb().farms.update(id, final);
  await recordPut({ table: 'farms', recordId: id, patch: final });
}

export async function deleteFarm(id: string): Promise<void> {
  const db = getDb();
  await db.transaction('rw', [db.farms, ...parcelCascadeTables(db)], async () => {
    const parcels = await db.parcels.where('farmId').equals(id).toArray();
    const parcelIds = parcels.map((p) => p.id);
    await cascadeDeleteParcels(db, parcelIds);
    await db.biodiversityFeatures.where('farmId').equals(id).delete();
    await db.farms.delete(id);
  });
  // Las cascadas también dejan sus propias ops; aquí registramos la del farm.
  await recordDelete({ table: 'farms', recordId: id });
}
