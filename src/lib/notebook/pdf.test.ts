import { describe, expect, it } from 'vitest';
import type { Farm, FieldLogEntry, Parcel } from '@/lib/db/types';
import { buildNotebookHtml } from './pdf';

function entry(partial: Partial<FieldLogEntry>): FieldLogEntry {
  const now = new Date('2026-04-15');
  return {
    id: 'e1',
    createdAt: now,
    updatedAt: now,
    date: new Date('2026-04-15'),
    parcelIds: ['p1'],
    type: 'PRUNING',
    title: 'Poda verde',
    ...partial,
  } as FieldLogEntry;
}

function parcel(id: string, name: string, farmId = 'f1'): Parcel {
  return {
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    farmId,
    name,
    areaHa: 1,
    status: 'TRANSITION',
    statusChangedAt: new Date(),
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  } as Parcel;
}

function farm(id: string, name: string): Farm {
  return {
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    name,
    municipality: 'Aranda de Duero',
    province: 'Burgos',
  };
}

describe('buildNotebookHtml', () => {
  it('incluye título, periodo y compatibilidad SIEX', () => {
    const html = buildNotebookHtml([], { periodLabel: 'Periodo: abril 2026' });
    expect(html).toContain('Cuaderno de campo');
    expect(html).toContain('Periodo: abril 2026');
    expect(html).toContain('SIEX');
  });

  it('lista las operaciones con tipo en castellano y nombre de parcela', () => {
    const html = buildNotebookHtml(
      [
        entry({
          title: 'Poda verde',
          type: 'PRUNING',
          parcelIds: ['p1'],
          description: 'aclareo',
        }),
      ],
      {
        parcels: [parcel('p1', 'Parcela norte')],
        farms: [farm('f1', 'Finca La Nava')],
      },
    );
    expect(html).toContain('Poda verde');
    expect(html).toContain('Poda');
    expect(html).toContain('Parcela norte');
    expect(html).toContain('Finca La Nava');
    expect(html).toContain('aclareo');
  });

  it('escapa HTML del usuario', () => {
    const html = buildNotebookHtml([
      entry({ title: '<script>x</script>', description: 'A & B' }),
    ]);
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).toContain('A &amp; B');
  });

  it('marca entradas anuladas y muestra el motivo', () => {
    const html = buildNotebookHtml([
      entry({
        title: 'Riego duplicado',
        voidedAt: new Date('2026-04-16'),
        voidedReason: 'duplicada',
      }),
    ]);
    expect(html).toContain('Anulada');
    expect(html).toContain('duplicada');
  });

  it('muestra mensaje cuando no hay anotaciones', () => {
    const html = buildNotebookHtml([]);
    expect(html).toContain('Sin anotaciones');
  });

  it('agrega resumen con totales correctos', () => {
    const html = buildNotebookHtml([
      entry({ id: 'a', durationMinutes: 60, costEur: 10 }),
      entry({ id: 'b', durationMinutes: 30, costEur: 5, type: 'MOWING' }),
    ]);
    expect(html).toContain('1h 30m');
    expect(html).toContain('15.00 €');
  });
});
