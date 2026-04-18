import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ParcelMap } from '@/components/map/ParcelMap';
import { FarmDialog } from '@/components/farms/FarmDialog';
import { ParcelWizard } from '@/components/parcels/ParcelWizard';
import {
  deleteFarm,
  deleteParcel,
  getFarm,
  listParcelsByFarm,
} from '@/lib/db/repos';
import type { CropType, ParcelStatus } from '@/lib/db/types';

const statusLabels: Record<ParcelStatus, string> = {
  DESIGN: 'Diseño',
  TRANSITION: 'Transición',
  REGENERATIVE: 'Regenerativa',
};

const cropLabels: Record<CropType, string> = {
  FRUIT_TREE: 'Frutal',
  VINEYARD: 'Viñedo',
  MIXED: 'Mixto',
};

export function FarmDetailPage(): JSX.Element {
  const { farmId } = useParams<{ farmId: string }>();
  const [editFarmOpen, setEditFarmOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const farm = useLiveQuery(() => (farmId ? getFarm(farmId) : undefined), [farmId]);
  const parcels = useLiveQuery(
    () => (farmId ? listParcelsByFarm(farmId) : Promise.resolve([])),
    [farmId],
  );

  if (!farmId) return <PageContainer title="Finca" subtitle="Finca no encontrada." />;
  if (farm === undefined)
    return <PageContainer title="Finca" subtitle="Cargando…" />;
  if (farm === null || farm === undefined)
    return <PageContainer title="Finca" subtitle="Finca no encontrada." />;

  const center: [number, number] | undefined =
    farm.centerLat != null && farm.centerLng != null
      ? [farm.centerLat, farm.centerLng]
      : undefined;

  const mapParcels =
    parcels?.map((p) => ({ id: p.id, name: p.name, geometry: p.geometry })) ?? [];

  const onDeleteFarm = async () => {
    if (
      !confirm(
        `¿Borrar la finca «${farm.name}» y todas sus parcelas? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await deleteFarm(farm.id);
    window.location.hash = '#/parcelas';
  };

  return (
    <PageContainer
      title={farm.name}
      subtitle={[farm.municipality, farm.province].filter(Boolean).join(', ')}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/parcelas" className="text-sm text-brand-700 hover:underline">
          ← Volver a fincas
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-600">
          {parcels === undefined
            ? 'Cargando parcelas…'
            : `${parcels.length} parcela${parcels.length === 1 ? '' : 's'}`}
          {farm.altitudeM != null && ` · ${farm.altitudeM} m`}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditFarmOpen(true)}>
            Editar finca
          </Button>
          <Button variant="outline" onClick={onDeleteFarm}>
            Borrar finca
          </Button>
          <Button onClick={() => setWizardOpen(true)}>Nueva parcela</Button>
        </div>
      </div>

      <section className="mb-6">
        <ParcelMap mode="view" parcels={mapParcels} center={center} />
      </section>

      {parcels && parcels.length === 0 && (
        <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
          Todavía no hay parcelas. Pulsa <strong>Nueva parcela</strong> para crear la
          primera: el asistente se adapta al estado que elijas.
        </p>
      )}

      {parcels && parcels.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {parcels.map((p) => (
            <li key={p.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{p.name}</span>
                    <span className="text-xs font-normal text-slate-500">
                      {statusLabels[p.status]}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {cropLabels[p.cropType]} · {p.areaHa.toFixed(2)} ha
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    {p.irrigation === 'RAINFED' ? 'Secano' : p.irrigation}
                    {p.plantingYear ? ` · plantado ${p.plantingYear}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/parcelas/${farm.id}/${p.id}`}
                      className="text-xs text-brand-700 hover:underline"
                    >
                      Ver detalle
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`¿Borrar la parcela «${p.name}»?`)) return;
                        await deleteParcel(p.id);
                      }}
                    >
                      Borrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <FarmDialog
        open={editFarmOpen}
        onOpenChange={setEditFarmOpen}
        farm={farm}
      />
      <ParcelWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        farmId={farm.id}
        farmCenter={center}
        existingParcels={parcels ?? []}
      />
    </PageContainer>
  );
}
