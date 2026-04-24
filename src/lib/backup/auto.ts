import Dexie, { type Table } from 'dexie';
import type { AutoBackupRecord, BackupSnapshot } from './types';
import { exportAllToSnapshot } from './export';

export const AUTO_BACKUP_LIMIT = 7;

export class AutoBackupDB extends Dexie {
  autoBackups!: Table<AutoBackupRecord, string>;

  constructor(name = 'fincas-auto-backups') {
    super(name);
    this.version(1).stores({ autoBackups: 'id, createdAt' });
  }
}

let _autoDb: AutoBackupDB | null = null;

export function getAutoBackupDb(): AutoBackupDB {
  if (!_autoDb) _autoDb = new AutoBackupDB();
  return _autoDb;
}

export function resetAutoBackupDbForTests(name?: string): AutoBackupDB {
  if (_autoDb) _autoDb.close();
  _autoDb = new AutoBackupDB(name ?? `fincas-auto-test-${crypto.randomUUID()}`);
  return _autoDb;
}

function approximateSize(snapshot: BackupSnapshot): number {
  return JSON.stringify(snapshot).length;
}

export interface RecordAutoBackupOptions {
  snapshot?: BackupSnapshot;
  limit?: number;
}

export async function recordAutoBackup(
  options: RecordAutoBackupOptions = {},
): Promise<AutoBackupRecord> {
  const limit = options.limit ?? AUTO_BACKUP_LIMIT;
  const snapshot =
    options.snapshot ?? (await exportAllToSnapshot({ includeBlobs: false }));
  const record: AutoBackupRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    appVersion: snapshot.appVersion,
    payload: snapshot,
    sizeBytes: approximateSize(snapshot),
  };
  const db = getAutoBackupDb();
  await db.autoBackups.add(record);
  await trimAutoBackups(limit);
  return record;
}

export async function listAutoBackups(): Promise<AutoBackupRecord[]> {
  const db = getAutoBackupDb();
  const all = await db.autoBackups.toArray();
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAutoBackup(id: string): Promise<AutoBackupRecord | undefined> {
  return getAutoBackupDb().autoBackups.get(id);
}

export async function deleteAutoBackup(id: string): Promise<void> {
  await getAutoBackupDb().autoBackups.delete(id);
}

export async function clearAutoBackups(): Promise<void> {
  await getAutoBackupDb().autoBackups.clear();
}

async function trimAutoBackups(limit: number): Promise<void> {
  const list = await listAutoBackups();
  if (list.length <= limit) return;
  const toDelete = list.slice(limit);
  await getAutoBackupDb().autoBackups.bulkDelete(toDelete.map((r) => r.id));
}
