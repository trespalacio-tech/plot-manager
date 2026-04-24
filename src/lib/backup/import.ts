import { getDb, type FincasDB } from '@/lib/db/db';
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_TABLES,
  type BackupSnapshot,
  type BackupSummary,
  type BackupTableName,
  type RestoreResult,
} from './types';
import { deserializeRowDeep } from './serialize';

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

export function parseSnapshot(json: string): BackupSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new BackupValidationError(
      `JSON inválido: ${(err as Error).message}`,
    );
  }
  return validateSnapshot(parsed);
}

export function validateSnapshot(value: unknown): BackupSnapshot {
  if (typeof value !== 'object' || value === null) {
    throw new BackupValidationError('El backup no es un objeto JSON.');
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.formatVersion !== 'number') {
    throw new BackupValidationError('Falta formatVersion.');
  }
  if (obj.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new BackupValidationError(
      `formatVersion ${obj.formatVersion} no soportado (máx ${BACKUP_FORMAT_VERSION}).`,
    );
  }
  if (typeof obj.exportedAt !== 'string') {
    throw new BackupValidationError('Falta exportedAt.');
  }
  if (typeof obj.appVersion !== 'string') {
    throw new BackupValidationError('Falta appVersion.');
  }
  if (typeof obj.data !== 'object' || obj.data === null) {
    throw new BackupValidationError('Falta data.');
  }
  const data = obj.data as Record<string, unknown>;
  for (const t of BACKUP_TABLES) {
    if (!Array.isArray(data[t])) {
      throw new BackupValidationError(`Tabla ausente o inválida: ${t}.`);
    }
  }
  return value as BackupSnapshot;
}

export function summarizeSnapshot(snapshot: BackupSnapshot): BackupSummary {
  const counts = {} as Record<BackupTableName, number>;
  let total = 0;
  for (const t of BACKUP_TABLES) {
    const n = snapshot.data[t]?.length ?? 0;
    counts[t] = n;
    total += n;
  }
  return {
    exportedAt: snapshot.exportedAt,
    appVersion: snapshot.appVersion,
    includesBlobs: snapshot.includesBlobs,
    formatVersion: snapshot.formatVersion,
    counts,
    totalRows: total,
  };
}

export interface RestoreOptions {
  db?: FincasDB;
}

export async function restoreSnapshot(
  snapshot: BackupSnapshot,
  options: RestoreOptions = {},
): Promise<RestoreResult> {
  const db = options.db ?? getDb();
  validateSnapshot(snapshot);

  const inserted = {} as Record<BackupTableName, number>;
  let total = 0;

  await db.transaction('rw', db.tables, async () => {
    for (const t of BACKUP_TABLES) {
      await db.table(t).clear();
    }
    for (const t of BACKUP_TABLES) {
      const rows = snapshot.data[t] ?? [];
      const restored = rows.map((r) => deserializeRowDeep(r));
      if (restored.length > 0) {
        await db.table(t).bulkAdd(restored as object[]);
      }
      inserted[t] = restored.length;
      total += restored.length;
    }
  });

  return { inserted, totalInserted: total };
}
