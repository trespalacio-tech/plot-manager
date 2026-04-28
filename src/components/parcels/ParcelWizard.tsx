import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Polygon } from 'geojson';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parcelSchema, type ParcelFormValues } from '@/lib/validators/parcel';
import { createParcel } from '@/lib/db/repos';
import { markCoachStale } from '@/lib/coach/useAutoCoach';
import { ParcelMap } from '@/components/map/ParcelMap';
import type { CropType, IrrigationType, Parcel, ParcelStatus } from '@/lib/db/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  farmCenter?: [number, number];
  existingParcels?: Parcel[];
  onCreated?: (parcel: Parcel) => void;
}

type Step = 1 | 2 | 3 | 4;

const cropLabels: Record<CropType, string> = {
  FRUIT_TREE: 'Frutal',
  VINEYARD: 'Viñedo',
  MIXED: 'Mixto',
};

const statusLabels: Record<ParcelStatus, string> = {
  DESIGN: 'Diseño y establecimiento',
  TRANSITION: 'En transición a regenerativa',
  REGENERATIVE: 'En régimen regenerativo',
};

const irrigationLabels: Record<IrrigationType, string> = {
  RAINFED: 'Secano',
  DRIP: 'Goteo',
  MICROSPRINKLER: 'Microaspersión',
  FLOOD: 'A manta',
};

function numberOrUndef(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

const nextStepsByStatus: Record<ParcelStatus, string> = {
  DESIGN:
    'Al guardar, la app te propondrá un primer análisis de suelo y un pequeño plan de establecimiento con su base científica.',
  TRANSITION:
    'Al guardar, iniciaré un plan de transición a 3 años con hitos anuales (análisis de suelo de control, cubierta vegetal, auditoría final).',
  REGENERATIVE:
    'Al guardar, cargaré el playbook regenerativo del cultivo con su calendario anual de tareas.',
};

export function ParcelWizard({
  open,
  onOpenChange,
  farmId,
  farmCenter,
  existingParcels,
  onCreated,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [geometry, setGeometry] = useState<Polygon | undefined>(undefined);

  const {
    register,
    setValue,
    watch,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ParcelFormValues>({
    resolver: zodResolver(parcelSchema),
    defaultValues: {
      name: '',
      status: 'DESIGN',
      cropType: 'FRUIT_TREE',
      irrigation: 'RAINFED',
      areaHa: 0,
    },
    mode: 'onBlur',
  });

  const status = watch('status');
  const cropType = watch('cropType');
  const irrigation = watch('irrigation');
  const areaHa = watch('areaHa');
  const name = watch('name');

  const mapParcels = useMemo(
    () => (existingParcels ?? []).map((p) => ({ id: p.id, name: p.name, geometry: p.geometry })),
    [existingParcels],
  );

  const close = (openNext: boolean) => {
    onOpenChange(openNext);
    if (!openNext) {
      setStep(1);
      setGeometry(undefined);
      reset();
    }
  };

  const onCreate = handleSubmit(async (data) => {
    const created = await createParcel({
      farmId,
      name: data.name,
      code: data.code,
      geometry,
      areaHa: data.areaHa,
      slopePct: data.slopePct,
      aspect: data.aspect,
      status: data.status,
      cropType: data.cropType,
      plantingYear: data.plantingYear,
      spacingRowM: data.spacingRowM,
      spacingPlantM: data.spacingPlantM,
      rowOrientationDeg: data.rowOrientationDeg,
      irrigation: data.irrigation,
      notes: data.notes,
    });
    markCoachStale();
    onCreated?.(created);
    close(false);
  });

  const onFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (step < 4) {
      void goNext();
    } else {
      void onCreate();
    }
  };

  const goNext = async () => {
    if (step === 1) {
      const ok = await trigger(['name', 'status', 'cropType']);
      if (!ok) return;
    }
    if (step === 2) {
      const ok = await trigger(['areaHa']);
      if (!ok) return;
    }
    if (step === 3) {
      const ok = await trigger([
        'plantingYear',
        'irrigation',
        'spacingRowM',
        'spacingPlantM',
        'notes',
      ]);
      if (!ok) return;
    }
    setStep((s) => (Math.min(4, s + 1) as Step));
  };

  const goBack = () => setStep((s) => (Math.max(1, s - 1) as Step));

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva parcela · paso {step} de 4</DialogTitle>
          <DialogDescription>
            La app se adaptará al estado que elijas (Diseño, Transición o Régimen
            regenerativo).
          </DialogDescription>
        </DialogHeader>

        <div onKeyDown={onFormKeyDown} className="grid gap-4">
          {step === 1 && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre de la parcela</Label>
                <Input id="name" {...register('name')} autoFocus />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="code">Código (opcional)</Label>
                <Input id="code" {...register('code')} />
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label>Cultivo</Label>
                  <Select
                    value={cropType}
                    onValueChange={(v) => setValue('cropType', v as CropType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(cropLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Estado</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setValue('status', v as ParcelStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="rounded-md bg-brand-50 p-3 text-xs text-slate-700">
                <strong>Estado {statusLabels[status]}:</strong>{' '}
                {status === 'DESIGN' &&
                  'plantación nueva o muy joven. Foco en diagnóstico, diseño y primeros 1–2 años.'}
                {status === 'TRANSITION' &&
                  'plan plurianual con hitos para pasar de manejo convencional a regenerativo.'}
                {status === 'REGENERATIVE' &&
                  'consolidada. Optimización continua con el playbook regenerativo.'}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <p className="text-sm text-slate-600">
                Dibuja la parcela tocando los vértices en el mapa. La superficie se
                calcula automáticamente. Si prefieres, introduce la superficie a mano.
              </p>
              <ParcelMap
                mode="draw"
                parcels={mapParcels}
                center={farmCenter}
                onChange={(value) => {
                  if (value) {
                    setGeometry(value.geometry);
                    setValue('areaHa', Number(value.areaHa.toFixed(4)), {
                      shouldValidate: true,
                    });
                  } else {
                    setGeometry(undefined);
                  }
                }}
              />
              <div className="grid gap-1.5 sm:grid-cols-3 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="areaHa">Superficie (ha)</Label>
                  <Input
                    id="areaHa"
                    type="number"
                    step="0.0001"
                    {...register('areaHa', { valueAsNumber: true })}
                  />
                  {errors.areaHa && (
                    <p className="text-xs text-red-600">{errors.areaHa.message}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="slopePct">Pendiente (%)</Label>
                  <Input
                    id="slopePct"
                    type="number"
                    step="0.1"
                    {...register('slopePct', { setValueAs: numberOrUndef })}
                  />
                  {errors.slopePct && (
                    <p className="text-xs text-red-600">{errors.slopePct.message}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="rowOrientationDeg">Orientación filas (°)</Label>
                  <Input
                    id="rowOrientationDeg"
                    type="number"
                    step="1"
                    {...register('rowOrientationDeg', { setValueAs: numberOrUndef })}
                  />
                  {errors.rowOrientationDeg && (
                    <p className="text-xs text-red-600">
                      {errors.rowOrientationDeg.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3">
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="plantingYear">Año de plantación</Label>
                  <Input
                    id="plantingYear"
                    type="number"
                    {...register('plantingYear', { setValueAs: numberOrUndef })}
                  />
                  {errors.plantingYear && (
                    <p className="text-xs text-red-600">{errors.plantingYear.message}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label>Riego</Label>
                  <Select
                    value={irrigation}
                    onValueChange={(v) => setValue('irrigation', v as IrrigationType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(irrigationLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="spacingRowM">Marco entre filas (m)</Label>
                  <Input
                    id="spacingRowM"
                    type="number"
                    step="0.1"
                    {...register('spacingRowM', { setValueAs: numberOrUndef })}
                  />
                  {errors.spacingRowM && (
                    <p className="text-xs text-red-600">{errors.spacingRowM.message}</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="spacingPlantM">Marco entre plantas (m)</Label>
                  <Input
                    id="spacingPlantM"
                    type="number"
                    step="0.1"
                    {...register('spacingPlantM', { setValueAs: numberOrUndef })}
                  />
                  {errors.spacingPlantM && (
                    <p className="text-xs text-red-600">{errors.spacingPlantM.message}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Textarea id="notes" rows={3} {...register('notes')} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-3 text-sm">
              <div className="rounded-md border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{name || '(sin nombre)'}</p>
                <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-slate-700">
                  <dt className="font-medium">Estado</dt>
                  <dd>{statusLabels[status]}</dd>
                  <dt className="font-medium">Cultivo</dt>
                  <dd>{cropLabels[cropType]}</dd>
                  <dt className="font-medium">Superficie</dt>
                  <dd>{areaHa?.toFixed?.(4) ?? areaHa} ha</dd>
                  <dt className="font-medium">Riego</dt>
                  <dd>{irrigationLabels[irrigation]}</dd>
                  <dt className="font-medium">Polígono</dt>
                  <dd>{geometry ? 'dibujado en el mapa' : 'sin geometría (solo ha)'}</dd>
                </dl>
              </div>
              <p className="rounded-md bg-brand-50 p-3 text-slate-700">
                {nextStepsByStatus[status]}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={step === 1 ? () => close(false) : goBack}
            >
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={() => void goNext()}>
                Siguiente
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => void onCreate()}
              >
                Crear parcela
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
