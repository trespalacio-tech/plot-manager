import type { Farm, Parcel } from '@/lib/db/types';
import { OPERATION_LABELS } from '@/lib/notebook/templates';
import { PDF_BASE_STYLES } from '@/lib/notebook/pdfStyles';
import type { YearlyPlan, YearlyPlanItem } from './yearlyPlan';

const PRIORITY_LABEL = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
} as const;

const PRIORITY_COLOR = {
  URGENT: '#b91c1c',
  HIGH: '#c2410c',
  MEDIUM: '#a16207',
  LOW: '#475569',
} as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function formatDateRange(item: YearlyPlanItem): string {
  const start = formatDay(item.startDate);
  const end = formatDay(item.endDate);
  return `${start} → ${end}${item.wrapsYear ? '*' : ''}`;
}

function formatGeneratedAt(d: Date): string {
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildYearlyPlanHtml(
  plan: YearlyPlan,
  parcel: Parcel,
  farm: Farm,
): string {
  const generatedAt = formatGeneratedAt(new Date());
  const totalTasks = plan.items.length;
  const wrapCount = plan.items.filter((i) => i.wrapsYear).length;
  const playbookSet = Array.from(new Set(plan.items.map((i) => i.playbookTitle)));

  const monthsHtml = plan.byMonth
    .map((m) => {
      if (m.items.length === 0) {
        return `
          <section class="month month-empty">
            <h3>${escapeHtml(m.monthLabel)}</h3>
            <p class="empty">Sin tareas previstas.</p>
          </section>`;
      }
      const rows = m.items
        .map(
          (it) => `
            <tr>
              <td class="nowrap">${escapeHtml(formatDateRange(it))}</td>
              <td>
                <div class="task-title">${escapeHtml(it.title)}</div>
                <div class="task-meta">
                  ${escapeHtml(OPERATION_LABELS[it.type] ?? it.type)} ·
                  <span class="prio" style="color:${PRIORITY_COLOR[it.priority]}">
                    ${escapeHtml(PRIORITY_LABEL[it.priority])}
                  </span> ·
                  <span class="src">${escapeHtml(it.playbookTitle)}</span>
                </div>
                <div class="rationale">${escapeHtml(it.rationale)}</div>
                <div class="basis">${escapeHtml(it.scientificBasis)}</div>
              </td>
            </tr>`,
        )
        .join('');
      return `
        <section class="month">
          <h3>${escapeHtml(m.monthLabel)} <span class="count">(${m.items.length})</span></h3>
          <table>
            <thead>
              <tr>
                <th class="col-date">Ventana</th>
                <th>Tarea</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Plan anual ${plan.year} · ${escapeHtml(parcel.name)}</title>
<style>
  ${PDF_BASE_STYLES}
  .summary { grid-template-columns: repeat(3, 1fr); }
  h3 .count { color: #5a5246; font-size: 11px; font-weight: normal; }
  .playbooks {
    border: 1px solid #d9d6cc; border-radius: 6px; padding: 10px 12px;
    background: #fbf9f5; margin-bottom: 12px;
  }
  .playbooks h2 { margin-top: 0; }
  .playbooks ul { margin: 4px 0 0 18px; padding: 0; }
  .month-empty h3 { background: #f5f1e9; color: #73695a; border-color: #bcb7a8; }
  .month-empty .empty { color: #73695a; font-size: 10px; padding: 4px 10px; }
  .col-date { width: 110px; }
  .task-title { font-weight: 600; color: #1c1a16; }
  .task-meta { color: #5a5246; font-size: 10px; margin-top: 1px; }
  .task-meta .prio { font-weight: 600; }
  .task-meta .src { color: #73695a; }
  .rationale { color: #2c2924; margin-top: 3px; }
  .basis { color: #73695a; font-size: 10px; margin-top: 2px; font-style: italic; }
</style>
</head>
<body>
  <h1>Plan anual ${plan.year}</h1>
  <div class="meta">
    <strong>${escapeHtml(parcel.name)}</strong> · ${escapeHtml(farm.name)}
    (${escapeHtml(farm.municipality)}, ${escapeHtml(farm.province)})<br />
    Generado: ${escapeHtml(generatedAt)}
  </div>

  <div class="summary">
    <div class="stat">
      <div class="label">Tareas previstas</div>
      <div class="value">${totalTasks}</div>
    </div>
    <div class="stat">
      <div class="label">Playbooks aplicados</div>
      <div class="value">${playbookSet.length}</div>
    </div>
    <div class="stat">
      <div class="label">Cruzan fin de año</div>
      <div class="value">${wrapCount}</div>
    </div>
  </div>

  ${
    playbookSet.length
      ? `<div class="playbooks">
          <h2>Playbooks aplicados</h2>
          <ul>${playbookSet.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
        </div>`
      : ''
  }

  ${
    totalTasks === 0
      ? `<p class="meta">Esta parcela no tiene playbooks aplicables. Revisa cultivo, especie y estado.</p>`
      : monthsHtml
  }

  <div class="footer">
    Fincas — plan generado a partir de los playbooks regenerativos del
    Coach. Las ventanas DOY son orientativas para el clima de Burgos;
    ajusta a la fenología real de tu parcela cada año. <br />
    * Ventana cruza el cambio de año (la tarea termina en ${plan.year + 1}).
  </div>
</body>
</html>`;
}
