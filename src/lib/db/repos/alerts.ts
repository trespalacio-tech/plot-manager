import { getDb } from '../db';
import type { Alert, AlertSeverity } from '../types';
import { newId, nowStamps } from './ids';
import { recordDelete, recordPut } from '@/lib/sync/log';

export type AlertInput = Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'acknowledgedAt'>;

export interface AlertFilter {
  parcelId?: string;
  severity?: AlertSeverity | AlertSeverity[];
  triggerSource?: string;
  includeAcknowledged?: boolean;
  includeExpired?: boolean;
}

export async function listAlerts(filter: AlertFilter = {}): Promise<Alert[]> {
  const db = getDb();
  let rows = await db.alerts.toArray();
  if (filter.parcelId) rows = rows.filter((a) => a.parcelId === filter.parcelId);
  if (filter.triggerSource) rows = rows.filter((a) => a.triggerSource === filter.triggerSource);
  if (filter.severity) {
    const allowed = Array.isArray(filter.severity) ? filter.severity : [filter.severity];
    rows = rows.filter((a) => allowed.includes(a.severity));
  }
  if (!filter.includeAcknowledged) rows = rows.filter((a) => !a.acknowledgedAt);
  if (!filter.includeExpired) {
    const now = Date.now();
    rows = rows.filter((a) => !a.expiresAt || a.expiresAt.getTime() > now);
  }
  rows.sort((a, b) => {
    const sv = severityOrder(b.severity) - severityOrder(a.severity);
    if (sv !== 0) return sv;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  return rows;
}

function severityOrder(s: AlertSeverity): number {
  switch (s) {
    case 'CRITICAL':
      return 3;
    case 'WARNING':
      return 2;
    case 'INFO':
      return 1;
  }
}

export async function createAlert(input: AlertInput): Promise<Alert> {
  const alert: Alert = { id: newId(), ...nowStamps(), ...input };
  await getDb().alerts.add(alert);
  await recordPut({ table: 'alerts', recordId: alert.id, patch: alert });
  return alert;
}

export async function acknowledgeAlert(id: string): Promise<void> {
  const now = new Date();
  const patch = { acknowledgedAt: now, updatedAt: now };
  await getDb().alerts.update(id, patch);
  await recordPut({ table: 'alerts', recordId: id, patch });
}

export async function deleteAlert(id: string): Promise<void> {
  await getDb().alerts.delete(id);
  await recordDelete({ table: 'alerts', recordId: id });
}
