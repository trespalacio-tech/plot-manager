import { getDb, type FincasDB } from '@/lib/db/db';
import { APP_VERSION } from '@/lib/version';
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_TABLES,
  type BackupSnapshot,
  type BackupTableName,
} from './types';
import { serializeRowDeep } from './serialize';

export interface ExportOptions {
  includeBlobs?: boolean;
  db?: FincasDB;
}

export async function exportAllToSnapshot(
  options: ExportOptions = {},
): Promise<BackupSnapshot> {
  const includeBlobs = options.includeBlobs ?? true;
  const db = options.db ?? getDb();
  const counts = {} as Record<BackupTableName, number>;
  const data = {} as Record<BackupTableName, unknown[]>;

  for (const tableName of BACKUP_TABLES) {
    const rows = await db.table(tableName).toArray();
    const serialized: unknown[] = [];
    for (const row of rows) {
      serialized.push(await serializeRowDeep(row, { includeBlobs }));
    }
    data[tableName] = serialized;
    counts[tableName] = serialized.length;
  }

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    includesBlobs: includeBlobs,
    counts,
    data,
  };
}

export function snapshotToJsonString(snapshot: BackupSnapshot): string {
  return JSON.stringify(snapshot);
}

export function downloadSnapshot(snapshot: BackupSnapshot, filename?: string): void {
  const json = snapshotToJsonString(snapshot);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? defaultBackupFilename(snapshot);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function defaultBackupFilename(snapshot: BackupSnapshot): string {
  const stamp = snapshot.exportedAt.replace(/[:.]/g, '-');
  return `fincas-backup-${stamp}.json`;
}
