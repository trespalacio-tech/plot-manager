import { describe, expect, it } from 'vitest';
import type { Farm, Parcel } from '@/lib/db/types';
import type { YearlyPlan } from './yearlyPlan';
import { buildYearlyPlanHtml } from './yearlyPlanPdf';

const farm: Farm = {
  id: 'f1',
  name: 'Finca <Test>', // probamos también escape HTML
  municipality: 'Aranda',
  province: 'Burgos',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const parcel: Parcel = {
  id: 'p1',
  farmId: 'f1',
  name: "Parcela & 'norte'",
  areaHa: 1,
  status: 'TRANSITION',
  statusChangedAt: new Date('2026-01-01'),
  cropType: 'NUT_TREE',
  primarySpecies: 'almendro',
  irrigation: 'RAINFED',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const plan: YearlyPlan = {
  year: 2026,
  parcelId: 'p1',
  items: [
    {
      id: 'almond-burgos::almond-leaf-fall-copper',
      playbookId: 'almond-burgos',
      playbookTitle: 'Almendro extra-tardío',
      taskId: 'almond-leaf-fall-copper',
      type: 'DISEASE_TREATMENT',
      title: 'Cobre a caída de hoja',
      rationale: 'Caldo bordelés 600-900 g/hl',
      scientificBasis: 'Vargas & Romero (2012)',
      priority: 'URGENT',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-12-05'),
      wrapsYear: false,
    },
  ],
  byMonth: [],
};
// rellenamos byMonth con la sola entry en noviembre
for (let m = 1; m <= 12; m += 1) {
  plan.byMonth.push({
    month: m,
    monthLabel: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m - 1]!,
    items: m === 11 ? plan.items : [],
  });
}

describe('buildYearlyPlanHtml', () => {
  const html = buildYearlyPlanHtml(plan, parcel, farm);

  it('genera un documento HTML5 válido con título y meta', () => {
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<title>Plan anual 2026 · Parcela &amp; &#39;norte&#39;</title>');
  });

  it('escapa caracteres HTML del nombre de parcela y finca', () => {
    expect(html).toContain('Parcela &amp; &#39;norte&#39;');
    expect(html).toContain('Finca &lt;Test&gt;');
    expect(html).not.toContain("'norte'"); // raw apostrophe shouldn't leak
    expect(html).not.toContain('Finca <Test>'); // raw < shouldn't leak
  });

  it('incluye resumen con totales calculados', () => {
    expect(html).toContain('Tareas previstas');
    expect(html).toContain('>1<'); // 1 tarea
    expect(html).toContain('Playbooks aplicados');
  });

  it('renderiza la sección del mes con la tarea', () => {
    expect(html).toContain('Noviembre');
    expect(html).toContain('Cobre a caída de hoja');
    expect(html).toContain('Caldo bordelés 600-900 g/hl');
  });

  it('marca como vacíos los meses sin tareas', () => {
    expect(html).toContain('Sin tareas previstas');
  });

  it('cierra body y html', () => {
    expect(html.trim().endsWith('</html>')).toBe(true);
  });
});
