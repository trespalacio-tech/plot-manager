import type { FieldLogEntry, Farm, Parcel } from '@/lib/db/types';
import { OPERATION_LABELS } from './templates';
import { summarizeEntries } from '@/lib/db/repos';

export interface PdfReportOptions {
  parcels?: Parcel[];
  farms?: Farm[];
  periodLabel?: string;
  reportTitle?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildNotebookHtml(
  entries: FieldLogEntry[],
  options: PdfReportOptions = {},
): string {
  const parcelsById = new Map((options.parcels ?? []).map((p) => [p.id, p]));
  const farmsById = new Map((options.farms ?? []).map((f) => [f.id, f]));
  const summary = summarizeEntries(entries);
  const title = options.reportTitle ?? 'Cuaderno de campo';
  const periodLabel = options.periodLabel ?? 'Periodo: todas las anotaciones';
  const generatedAt = formatDateTime(new Date());

  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const farmsSummary = summarizeFarms(parcelsById, farmsById);

  const rows = sorted
    .map((e) => {
      const parcels = e.parcelIds
        .map((id) => parcelsById.get(id)?.name ?? id)
        .join('; ');
      const voided = e.voidedAt
        ? `<span class="badge badge-void">Anulada${
            e.voidedReason ? ` · ${escapeHtml(e.voidedReason)}` : ''
          }</span>`
        : '';
      return `
        <tr class="${e.voidedAt ? 'voided' : ''}">
          <td class="nowrap">${formatDate(e.date)}</td>
          <td>${escapeHtml(OPERATION_LABELS[e.type] ?? e.type)}</td>
          <td>
            <strong>${escapeHtml(e.title)}</strong>${voided}
            ${e.description ? `<div class="desc">${escapeHtml(e.description)}</div>` : ''}
          </td>
          <td>${escapeHtml(parcels)}</td>
          <td class="num">${e.durationMinutes ?? ''}</td>
          <td>${escapeHtml(e.weatherConditions ?? '')}</td>
          <td class="num">${e.costEur != null ? e.costEur.toFixed(2) : ''}</td>
        </tr>
      `;
    })
    .join('');

  const totalHours = Math.floor(summary.totalDurationMinutes / 60);
  const totalMins = summary.totalDurationMinutes % 60;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 24px;
    font-size: 12px;
    line-height: 1.4;
  }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; }
  .meta { color: #475569; font-size: 11px; margin-bottom: 16px; }
  .summary {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    margin: 12px 0 16px;
  }
  .stat {
    border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px;
  }
  .stat .label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: .04em; }
  .stat .value { font-size: 16px; font-weight: 600; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th {
    background: #f1f5f9; text-align: left; padding: 6px 8px;
    border-bottom: 1px solid #94a3b8; font-weight: 600;
  }
  tbody td {
    padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top;
  }
  tbody tr.voided { color: #94a3b8; text-decoration: line-through; }
  .badge {
    display: inline-block; padding: 1px 6px; border-radius: 9999px;
    font-size: 10px; margin-left: 6px; vertical-align: middle;
  }
  .badge-void { background: #fee2e2; color: #b91c1c; }
  .desc { color: #475569; margin-top: 2px; }
  .nowrap { white-space: nowrap; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .footer { margin-top: 24px; color: #64748b; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .farms-list { color: #475569; font-size: 11px; }
  ul { margin: 4px 0 0 18px; padding: 0; }
  @media print {
    body { padding: 0; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    Generado: ${escapeHtml(generatedAt)} · ${escapeHtml(periodLabel)}<br />
    Compatible con Cuaderno Digital de Explotación / SIEX (España).
  </div>

  ${
    farmsSummary.length
      ? `<h2>Fincas y parcelas</h2>
         <div class="farms-list">
           <ul>${farmsSummary
             .map(
               (f) =>
                 `<li><strong>${escapeHtml(f.farm)}</strong> (${escapeHtml(
                   f.location,
                 )}): ${f.parcels.map((p) => escapeHtml(p)).join(', ') || '—'}</li>`,
             )
             .join('')}</ul>
         </div>`
      : ''
  }

  <h2>Resumen</h2>
  <div class="summary">
    <div class="stat"><div class="label">Operaciones</div><div class="value">${summary.count}</div></div>
    <div class="stat"><div class="label">Horas</div><div class="value">${
      summary.totalDurationMinutes > 0
        ? `${totalHours}h ${String(totalMins).padStart(2, '0')}m`
        : '—'
    }</div></div>
    <div class="stat"><div class="label">Coste</div><div class="value">${
      summary.totalCostEur > 0 ? `${summary.totalCostEur.toFixed(2)} €` : '—'
    }</div></div>
    <div class="stat"><div class="label">Tipos distintos</div><div class="value">${
      Object.keys(summary.byType).length
    }</div></div>
  </div>

  <h2>Operaciones</h2>
  ${
    sorted.length === 0
      ? `<p class="meta">Sin anotaciones en este periodo.</p>`
      : `<table>
           <thead>
             <tr>
               <th>Fecha</th>
               <th>Tipo</th>
               <th>Detalle</th>
               <th>Parcelas</th>
               <th class="num">Min</th>
               <th>Meteo</th>
               <th class="num">€</th>
             </tr>
           </thead>
           <tbody>${rows}</tbody>
         </table>`
  }

  <div class="footer">
    Fincas — registro local-first. Las entradas anuladas se conservan para trazabilidad.
  </div>
</body>
</html>`;
}

interface FarmSummary {
  farm: string;
  location: string;
  parcels: string[];
}

function summarizeFarms(
  parcelsById: Map<string, Parcel>,
  farmsById: Map<string, Farm>,
): FarmSummary[] {
  const grouped = new Map<string, FarmSummary>();
  for (const parcel of parcelsById.values()) {
    const farm = farmsById.get(parcel.farmId);
    if (!farm) continue;
    const entry =
      grouped.get(farm.id) ??
      ({
        farm: farm.name,
        location: `${farm.municipality}, ${farm.province}`,
        parcels: [],
      } as FarmSummary);
    entry.parcels.push(parcel.name);
    grouped.set(farm.id, entry);
  }
  return Array.from(grouped.values()).sort((a, b) => a.farm.localeCompare(b.farm));
}

export function openNotebookPdf(html: string): void {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) {
    alert(
      'El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para exportar a PDF.',
    );
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch {
      // user can trigger print from the new window
    }
  }, 250);
}
