import { describe, expect, it } from 'vitest';
import type { FieldLogEntry, Parcel } from '@/lib/db/types';
import { entriesToCsv } from './csv';

function entry(partial: Partial<FieldLogEntry>): FieldLogEntry {
  const now = new Date('2026-04-15');
  return {
    id: 'e1',
    createdAt: now,
    updatedAt: now,
    date: new Date('2026-04-15'),
    parcelIds: ['p1'],
    type: 'PRUNING',
    title: 'Poda',
    ...partial,
  } as FieldLogEntry;
}

function parcel(id: string, name: string): Parcel {
  return {
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    farmId: 'f1',
    name,
    areaHa: 1,
    status: 'TRANSITION',
    statusChangedAt: new Date(),
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  } as Parcel;
}

describe('entriesToCsv', () => {
  it('genera cabecera y filas con el formato esperado', () => {
    const csv = entriesToCsv(
      [
        entry({
          date: new Date('2026-04-01'),
          title: 'Poda verde',
          description: 'Pedir tijeras nuevas',
          parcelIds: ['p1', 'p2'],
          durationMinutes: 90,
          weatherConditions: 'soleado',
          costEur: 42.5,
        }),
      ],
      { parcels: [parcel('p1', 'Parcela norte'), parcel('p2', 'Parcela sur')] },
    );
    const [header, row] = csv.split('\n');
    expect(header).toBe(
      'fecha,tipo,titulo,descripcion,parcelas,duracion_min,condiciones_meteo,coste_eur,anulada,motivo_anulacion',
    );
    expect(row).toBe(
      '2026-04-01,Poda,Poda verde,Pedir tijeras nuevas,Parcela norte; Parcela sur,90,soleado,42.50,,',
    );
  });

  it('escapa comas, comillas y saltos de línea', () => {
    const csv = entriesToCsv([
      entry({
        title: 'Poda "dura", vigor alto',
        description: 'linea1\nlinea2',
      }),
    ]);
    const row = csv.split('\n').slice(1).join('\n');
    expect(row).toContain('"Poda ""dura"", vigor alto"');
    expect(row).toContain('"linea1\nlinea2"');
  });

  it('marca entradas anuladas', () => {
    const csv = entriesToCsv([
      entry({
        voidedAt: new Date('2026-04-16'),
        voidedReason: 'duplicada',
      }),
    ]);
    const row = csv.split('\n')[1]!;
    expect(row).toMatch(/sí,duplicada$/);
  });
});
