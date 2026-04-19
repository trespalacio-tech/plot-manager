import { getDb } from '../db';
import type { FieldLogEntry, OperationType } from '../types';
import { newId, nowStamps } from './ids';

export type FieldLogInput = Omit<FieldLogEntry, 'id' | 'createdAt' | 'updatedAt' | 'voidedAt' | 'voidedReason'>;
export type FieldLogPatch = Partial<Omit<FieldLogEntry, 'id' | 'createdAt' | 'voidedAt' | 'voidedReason'>>;

export interface FieldLogFilter {
  parcelId?: string;
  type?: OperationType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  includeVoided?: boolean;
}

export async function listFieldLogEntries(
  filter: FieldLogFilter = {},
): Promise<FieldLogEntry[]> {
  const db = getDb();
  let collection;
  if (filter.parcelId) {
    collection = db.fieldLogEntries.where('parcelIds').equals(filter.parcelId);
  } else if (filter.dateFrom || filter.dateTo) {
    const from = filter.dateFrom ?? new Date(0);
    const to = filter.dateTo ?? new Date('2999-12-31');
    collection = db.fieldLogEntries.where('date').between(from, to, true, true);
  } else {
    collection = db.fieldLogEntries.toCollection();
  }
  let rows = await collection.toArray();

  if (filter.type) rows = rows.filter((r) => r.type === filter.type);
  if (filter.dateFrom) rows = rows.filter((r) => r.date >= filter.dateFrom!);
  if (filter.dateTo) rows = rows.filter((r) => r.date <= filter.dateTo!);
  if (!filter.includeVoided) rows = rows.filter((r) => !r.voidedAt);
  if (filter.search) {
    const q = filter.search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q) ||
          (r.weatherConditions ?? '').toLowerCase().includes(q),
      );
    }
  }
  rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  return rows;
}

export async function getFieldLogEntry(id: string): Promise<FieldLogEntry | undefined> {
  return getDb().fieldLogEntries.get(id);
}

export async function createFieldLogEntry(input: FieldLogInput): Promise<FieldLogEntry> {
  const entry: FieldLogEntry = { id: newId(), ...nowStamps(), ...input };
  await getDb().fieldLogEntries.add(entry);
  return entry;
}

export async function updateFieldLogEntry(id: string, patch: FieldLogPatch): Promise<void> {
  const db = getDb();
  const existing = await db.fieldLogEntries.get(id);
  if (!existing) throw new Error(`FieldLogEntry ${id} not found`);
  if (existing.voidedAt) throw new Error('No se puede editar una entrada anulada.');
  await db.fieldLogEntries.update(id, { ...patch, updatedAt: new Date() });
}

export async function voidFieldLogEntry(id: string, reason: string): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error('Indica un motivo para anular la entrada.');
  const now = new Date();
  await getDb().fieldLogEntries.update(id, {
    voidedAt: now,
    voidedReason: trimmed,
    updatedAt: now,
  });
}

export interface PeriodSummary {
  count: number;
  totalDurationMinutes: number;
  totalCostEur: number;
  byType: Record<string, number>;
}

export function summarizeEntries(entries: FieldLogEntry[]): PeriodSummary {
  const summary: PeriodSummary = {
    count: 0,
    totalDurationMinutes: 0,
    totalCostEur: 0,
    byType: {},
  };
  for (const e of entries) {
    if (e.voidedAt) continue;
    summary.count += 1;
    summary.totalDurationMinutes += e.durationMinutes ?? 0;
    summary.totalCostEur += e.costEur ?? 0;
    summary.byType[e.type] = (summary.byType[e.type] ?? 0) + 1;
  }
  return summary;
}
