import { useCallback, useMemo, useState } from 'react';
import {
  MapContainer,
  Polygon as LeafletPolygon,
  Polyline,
  TileLayer,
  CircleMarker,
  useMapEvents,
} from 'react-leaflet';
import type { Polygon } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { polygonAreaHa, ringToPolygon } from '@/lib/geo/area';

const BURGOS_CENTER: [number, number] = [42.3439, -3.6969];

export interface ParcelMapParcel {
  id: string;
  name: string;
  geometry?: Polygon;
}

interface ViewProps {
  mode: 'view';
  parcels: ParcelMapParcel[];
  center?: [number, number];
  zoom?: number;
}

interface DrawProps {
  mode: 'draw';
  parcels?: ParcelMapParcel[];
  center?: [number, number];
  zoom?: number;
  onChange: (value: { geometry: Polygon; areaHa: number } | null) => void;
}

type Props = ViewProps | DrawProps;

export function ParcelMap(props: Props): JSX.Element {
  const center = props.center ?? BURGOS_CENTER;
  const zoom = props.zoom ?? 14;

  return (
    <div className="h-80 w-full overflow-hidden rounded-lg border border-slate-200">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {(props.parcels ?? [])
          .filter((p): p is ParcelMapParcel & { geometry: Polygon } => !!p.geometry)
          .map((p) => (
            <LeafletPolygon
              key={p.id}
              positions={p.geometry.coordinates[0]!.map(
                ([lng, lat]) => [lat, lng] as [number, number],
              )}
              pathOptions={{ color: '#2f6b3a', weight: 2, fillOpacity: 0.15 }}
            />
          ))}
        {props.mode === 'draw' && <DrawLayer onChange={props.onChange} />}
      </MapContainer>
    </div>
  );
}

interface DrawLayerProps {
  onChange: (value: { geometry: Polygon; areaHa: number } | null) => void;
}

function DrawLayer({ onChange }: DrawLayerProps): JSX.Element {
  const [points, setPoints] = useState<[number, number][]>([]);

  useMapEvents({
    click(e) {
      setPoints((prev) => {
        const next: [number, number][] = [...prev, [e.latlng.lat, e.latlng.lng]];
        emit(next);
        return next;
      });
    },
  });

  const emit = useCallback(
    (pts: [number, number][]) => {
      if (pts.length < 3) {
        onChange(null);
        return;
      }
      const lnglat = pts.map(([lat, lng]) => [lng, lat] as [number, number]);
      const polygon = ringToPolygon(lnglat);
      onChange({ geometry: polygon, areaHa: polygonAreaHa(polygon) });
    },
    [onChange],
  );

  const undo = () => {
    setPoints((prev) => {
      const next = prev.slice(0, -1);
      emit(next);
      return next;
    });
  };

  const clear = () => {
    setPoints([]);
    onChange(null);
  };

  const polyline: [number, number][] = useMemo(
    () => (points.length >= 2 ? points : []),
    [points],
  );
  const polygon: [number, number][] = useMemo(
    () => (points.length >= 3 ? [...points, points[0]!] : []),
    [points],
  );

  return (
    <>
      {polygon.length > 0 && (
        <LeafletPolygon
          positions={polygon}
          pathOptions={{ color: '#2f6b3a', weight: 2, fillOpacity: 0.25 }}
        />
      )}
      {polygon.length === 0 && polyline.length > 0 && (
        <Polyline
          positions={polyline}
          pathOptions={{ color: '#2f6b3a', weight: 2, dashArray: '4 4' }}
        />
      )}
      {points.map((pt, i) => (
        <CircleMarker
          key={i}
          center={pt}
          radius={4}
          pathOptions={{ color: '#1e4826', fillColor: '#2f6b3a', fillOpacity: 1 }}
        />
      ))}
      <div className="leaflet-top leaflet-right">
        <div className="leaflet-control flex flex-col gap-1 rounded-md bg-white/95 p-2 shadow">
          <p className="mb-1 text-xs text-slate-600">
            {points.length === 0
              ? 'Toca el mapa para marcar los vértices.'
              : `${points.length} vértice${points.length === 1 ? '' : 's'} · ${
                  points.length < 3 ? 'mínimo 3' : 'polígono cerrado'
                }`}
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={points.length === 0}
            >
              Deshacer
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clear}
              disabled={points.length === 0}
            >
              Borrar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
