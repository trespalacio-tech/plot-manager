import { describe, expect, it } from 'vitest';
import { farmSchema } from './farm';
import { parcelSchema } from './parcel';

describe('farmSchema', () => {
  it('acepta una finca mínima válida', () => {
    const result = farmSchema.safeParse({
      name: 'Finca La Nava',
      municipality: 'Aranda de Duero',
      province: 'Burgos',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = farmSchema.safeParse({
      name: '  ',
      municipality: 'X',
      province: 'Burgos',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza latitudes fuera de rango', () => {
    const result = farmSchema.safeParse({
      name: 'F',
      municipality: 'X',
      province: 'Burgos',
      centerLat: 200,
    });
    expect(result.success).toBe(false);
  });
});

describe('parcelSchema', () => {
  const base = {
    name: 'P1',
    areaHa: 2.3,
    status: 'DESIGN',
    cropType: 'VINEYARD',
    irrigation: 'RAINFED',
  } as const;

  it('acepta una parcela mínima válida', () => {
    expect(parcelSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza superficie 0 o negativa', () => {
    expect(
      parcelSchema.safeParse({ ...base, areaHa: 0 }).success,
    ).toBe(false);
    expect(
      parcelSchema.safeParse({ ...base, areaHa: -1 }).success,
    ).toBe(false);
  });

  it('rechaza estado desconocido', () => {
    expect(
      parcelSchema.safeParse({ ...base, status: 'LEGACY' }).success,
    ).toBe(false);
  });

  it('rechaza año de plantación absurdo', () => {
    expect(
      parcelSchema.safeParse({ ...base, plantingYear: 1500 }).success,
    ).toBe(false);
  });
});
