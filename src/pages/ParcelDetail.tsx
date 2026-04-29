import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SoilPanel } from '@/components/soil/SoilPanel';
import { FieldLogDialog } from '@/components/notebook/FieldLogDialog';
import { DiagnoseWizardDialog } from '@/components/diagnose/DiagnoseWizardDialog';
import { getFarm, getParcel, listParcels } from '@/lib/db/repos';
import type { CropType, IrrigationType, ParcelStatus } from '@/lib/db/types';
import type { DiagnoseHypothesis } from '@/lib/diagnose/types';

const statusLabels: Record<ParcelStatus, string> = {
  DESIGN: 'Diseño',
  TRANSITION: 'Transición',
  REGENERATIVE: 'Regenerativa',
};

const cropLabels: Record<CropType, string> = {
  FRUIT_TREE: 'Frutal',
  NUT_TREE: 'Frutos secos',
  VINEYARD: 'Viñedo',
  MIXED: 'Mixto',
};

const irrigationLabels: Record<IrrigationType, string> = {
  RAINFED: 'Secano',
  DRIP: 'Goteo',
  MICROSPRINKLER: 'Microaspersión',
  FLOOD: 'Inundación',
};

export function ParcelDetailPage(): JSX.Element {
  const { farmId, parcelId } = useParams<{ farmId: string; parcelId: string }>();
  const parcel = useLiveQuery(
    () => (parcelId ? getParcel(parcelId) : Promise.resolve(undefined)),
    [parcelId],
  );
  const farm = useLiveQuery(
    () => (farmId ? getFarm(farmId) : Promise.resolve(undefined)),
    [farmId],
  );
  const parcels = useLiveQuery(() => listParcels(), []);
  const [diagnoseOpen, setDiagnoseOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logPrefill, setLogPrefill] = useState<
    { title: string; description: string } | undefined
  >(undefined);

  if (!parcelId || !farmId)
    return <PageContainer title="Parcela" subtitle="Parcela no encontrada." />;
  if (parcel === undefined || farm === undefined)
    return <PageContainer title="Parcela" subtitle="Cargando…" />;
  if (!parcel || !farm)
    return <PageContainer title="Parcela" subtitle="Parcela no encontrada." />;

  return (
    <PageContainer
      title={parcel.name}
      subtitle={`${farm.name} · ${statusLabels[parcel.status]} · ${cropLabels[parcel.cropType]}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/parcelas/${farmId}`} className="text-sm text-brand-700 hover:underline">
          ← Volver a {farm.name}
        </Link>
        <Button variant="outline" size="sm" onClick={() => setDiagnoseOpen(true)}>
          Veo algo raro
        </Button>
      </div>

      <Tabs defaultValue="suelo">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="suelo">Suelo</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <Info label="Superficie" value={`${parcel.areaHa.toFixed(2)} ha`} />
              <Info label="Cultivo" value={cropLabels[parcel.cropType]} />
              <Info label="Estado" value={statusLabels[parcel.status]} />
              <Info label="Riego" value={irrigationLabels[parcel.irrigation]} />
              {parcel.plantingYear && (
                <Info label="Año plantación" value={String(parcel.plantingYear)} />
              )}
              {parcel.slopePct != null && (
                <Info label="Pendiente" value={`${parcel.slopePct}%`} />
              )}
              {parcel.aspect && <Info label="Orientación" value={parcel.aspect} />}
              {parcel.spacingRowM && parcel.spacingPlantM && (
                <Info
                  label="Marco (fila × planta)"
                  value={`${parcel.spacingRowM} × ${parcel.spacingPlantM} m`}
                />
              )}
              {parcel.rowOrientationDeg != null && (
                <Info label="Orientación filas" value={`${parcel.rowOrientationDeg}°`} />
              )}
              {parcel.code && <Info label="Código" value={parcel.code} />}
              {parcel.notes && (
                <div className="sm:col-span-2">
                  <Info label="Notas" value={parcel.notes} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suelo">
          <SoilPanel parcelId={parcel.id} cropType={parcel.cropType} />
        </TabsContent>
      </Tabs>

      <DiagnoseWizardDialog
        open={diagnoseOpen}
        onOpenChange={setDiagnoseOpen}
        onAnnotate={(h: DiagnoseHypothesis) => {
          setLogPrefill({
            title: `Observación · ${h.title}`,
            description: buildDiagnoseDescription(h),
          });
          setLogOpen(true);
        }}
      />

      <FieldLogDialog
        open={logOpen}
        onOpenChange={(open) => {
          setLogOpen(open);
          if (!open) setLogPrefill(undefined);
        }}
        parcels={parcels ?? []}
        defaultParcelId={parcel.id}
        prefill={
          logPrefill
            ? {
                type: 'MONITORING',
                title: logPrefill.title,
                description: logPrefill.description,
              }
            : undefined
        }
      />
    </PageContainer>
  );
}

function buildDiagnoseDescription(h: DiagnoseHypothesis): string {
  const parts: string[] = [];
  parts.push(`Hipótesis (${h.confidence}): ${h.title}`);
  parts.push('');
  parts.push(h.description);
  if (h.monitoring.length) {
    parts.push('');
    parts.push('Monitoreo recomendado:');
    h.monitoring.forEach((m) => parts.push(`- ${m}`));
  }
  if (h.managementOptions.length) {
    parts.push('');
    parts.push('Manejo posible (lista blanca ecológica):');
    h.managementOptions.forEach((m) => parts.push(`- ${m}`));
  }
  if (h.whenToConsultExpert) {
    parts.push('');
    parts.push(`Consulta técnica: ${h.whenToConsultExpert}`);
  }
  return parts.join('\n');
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-slate-900">{value}</div>
    </div>
  );
}
