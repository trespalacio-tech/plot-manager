import { getDb } from '@/lib/db/db';
import { ensureIdentity } from './identity';
import type { Op, SyncableTable } from './types';
import { SYNCABLE_TABLES } from './types';
import { buildPutFields } from './merge';

/**
 * Backfill one-shot: por cada fila existente en las tablas syncable,
 * genera una Op PUT inicial para que el sync pueda transferirla a un
 * peer recién pareado.
 *
 * Diseño:
 *  - Idempotente: si ya hay ops para esa fila, no se duplica (lo
 *    detectamos por la combinación deviceId+recordId+table).
 *  - Marca el flag `coachBackfill` en `localStorage` cuando termina,
 *    para no volver a recorrer todas las filas en cada arranque.
 *  - El timestamp de la op se toma del `updatedAt` de la fila si lo
 *    tiene; en caso contrario, ahora. Así dos dispositivos que hagan
 *    backfill de la misma fila convergen al ts más antiguo.
 */

const BACKFILL_FLAG_KEY = 'coach:opLogBackfill';

interface BackfillStats {
  scanned: number;
  emitted: number;
  skipped: number;
  byTable: Record<string, number>;
}

function readFlag(): boolean {
  try {
    return localStorage.getItem(BACKFILL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function writeFlag(): void {
  try {
    localStorage.setItem(BACKFILL_FLAG_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function _resetBackfillFlagForTests(): void {
  try {
    localStorage.removeItem(BACKFILL_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

interface RowWithTimestamps {
  id: string;
  updatedAt?: Date;
  createdAt?: Date;
}

function tsForRow(row: RowWithTimestamps): number {
  if (row.updatedAt instanceof Date) return row.updatedAt.getTime();
  if (row.createdAt instanceof Date) return row.createdAt.getTime();
  return Date.now();
}

/**
 * Recorre todas las tablas syncable y emite una Op PUT por fila si
 * todavía no existe ninguna op para ese registro. Llamarlo una vez
 * tras instalar el op-log; protección con flag en localStorage.
 *
 * @param force fuerza recorrer aunque el flag ya esté marcado.
 */
export async function runOpLogBackfill(force = false): Promise<BackfillStats> {
  const stats: BackfillStats = { scanned: 0, emitted: 0, skipped: 0, byTable: {} };
  if (!force && readFlag()) return stats;

  const db = getDb();
  const ident = await ensureIdentity();

  // Pre-índice de qué (table+recordId) ya tienen op del propio device
  // para no duplicar. Las ops remotas (otro deviceId) se aceptan: el
  // backfill local no debería tocarlas.
  const existing = await db.ops
    .where('deviceId')
    .equals(ident.deviceId)
    .toArray();
  const indexed = new Set<string>();
  for (const op of existing) indexed.add(`${op.table}:${op.recordId}`);

  // Contador único compartido entre tablas: cada op generada se lleva
  // un seq propio, sin reset. Persistimos identity una sola vez al final.
  let nextSeq = ident.nextSeq;
  const allOpsToAdd: Op[] = [];

  for (const table of SYNCABLE_TABLES) {
    const dexieTable = db.table(table);
    const rows = (await dexieTable.toArray()) as RowWithTimestamps[];
    stats.scanned += rows.length;
    let emittedForTable = 0;
    for (const row of rows) {
      if (!row.id) continue;
      const key = `${table}:${row.id}`;
      if (indexed.has(key)) {
        stats.skipped += 1;
        continue;
      }
      const ts = tsForRow(row);
      const op: Op = {
        id: `${ident.deviceId}:${nextSeq}`,
        deviceId: ident.deviceId,
        seq: nextSeq,
        ts,
        table: table as SyncableTable,
        recordId: row.id,
        kind: 'PUT',
        fields: buildPutFields(row as unknown as Record<string, unknown>, ts),
      };
      allOpsToAdd.push(op);
      nextSeq += 1;
      emittedForTable += 1;
    }
    if (emittedForTable > 0) {
      stats.byTable[table] = emittedForTable;
      stats.emitted += emittedForTable;
    }
  }

  if (allOpsToAdd.length > 0) {
    await db.transaction('rw', [db.ops, db.identity], async () => {
      await db.ops.bulkAdd(allOpsToAdd);
      await db.identity.update('self', { nextSeq });
    });
  }

  writeFlag();
  return stats;
}
