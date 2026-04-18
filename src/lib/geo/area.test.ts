import { describe, expect, it } from 'vitest';
import { polygonAreaHa, ringToPolygon } from './area';

describe('polygonAreaHa', () => {
  it('calcula ~1 ha para un cuadrado de 100 m × 100 m', () => {
    // ~100 m en latitud a nivel del mar ≈ 0.0008983°
    // ~100 m en longitud a 42.3° ≈ 0.001213°
    const lat0 = 42.3439;
    const lng0 = -3.6969;
    const dLat = 0.0008983;
    const dLng = 0.001213;
    const ring = ringToPolygon([
      [lng0, lat0],
      [lng0 + dLng, lat0],
      [lng0 + dLng, lat0 + dLat],
      [lng0, lat0 + dLat],
    ]);
    const ha = polygonAreaHa(ring);
    expect(ha).toBeGreaterThan(0.95);
    expect(ha).toBeLessThan(1.05);
  });

  it('ringToPolygon rechaza polígonos con menos de 3 vértices', () => {
    expect(() => ringToPolygon([])).toThrow();
    expect(() =>
      ringToPolygon([
        [0, 0],
        [1, 1],
      ]),
    ).toThrow();
  });

  it('ringToPolygon cierra automáticamente el polígono si no viene cerrado', () => {
    const poly = ringToPolygon([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    const ring = poly.coordinates[0]!;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});
