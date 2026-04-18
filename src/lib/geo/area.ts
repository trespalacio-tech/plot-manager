import area from '@turf/area';
import type { Polygon } from 'geojson';

export function polygonAreaHa(polygon: Polygon): number {
  const squareMeters = area(polygon);
  return squareMeters / 10_000;
}

export function ringToPolygon(coords: [number, number][]): Polygon {
  if (coords.length < 3) {
    throw new Error('A polygon needs at least 3 vertices.');
  }
  const closed =
    coords[0]![0] === coords[coords.length - 1]![0] &&
    coords[0]![1] === coords[coords.length - 1]![1]
      ? coords
      : [...coords, coords[0]!];
  return { type: 'Polygon', coordinates: [closed] };
}
