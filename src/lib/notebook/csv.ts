import type { FieldLogEntry, Parcel } from '@/lib/db/types';
import { OPERATION_LABELS } from './templates';

const CSV_HEADERS = [
  'fecha',
  'tipo',
  'titulo',
  'descripcion',
  'parcelas',
  'duracion_min',
  'condiciones_meteo',
  'coste_eur',
  'anulada',
  'motivo_anulacion',
];

function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface EntriesToCsvOptions {
  parcels?: Parcel[];
}

export function entriesToCsv(
  entries: FieldLogEntry[],
  options: EntriesToCsvOptions = {},
): string {
  const byId = new Map((options.parcels ?? []).map((p) => [p.id, p.name] as const));
  const rows = [CSV_HEADERS.join(',')];
  for (const e of entries) {
    const parcelNames = e.parcelIds
      .map((id) => byId.get(id) ?? id)
      .join('; ');
    const cells = [
      formatDate(e.date),
      OPERATION_LABELS[e.type] ?? e.type,
      e.title,
      e.description ?? '',
      parcelNames,
      e.durationMinutes != null ? String(e.durationMinutes) : '',
      e.weatherConditions ?? '',
      e.costEur != null ? e.costEur.toFixed(2) : '',
      e.voidedAt ? 'sí' : '',
      e.voidedReason ?? '',
    ];
    rows.push(cells.map(escapeField).join(','));
  }
  return rows.join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
