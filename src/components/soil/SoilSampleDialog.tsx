import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import {
  soilAnalysisSchema,
  soilSampleSchema,
} from '@/lib/validators/soil';
import {
  createSoilRecord,
  type SoilRecord,
  updateSoilRecord,
} from '@/lib/db/repos';
import { markCoachStale } from '@/lib/coach/useAutoCoach';

const combinedSchema = z.object({
  sample: soilSampleSchema,
  analysis: soilAnalysisSchema,
});

type FormValues = z.infer<typeof combinedSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelId: string;
  existing?: SoilRecord;
  onSaved?: () => void;
}

function toDateInput(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultValues(existing?: SoilRecord): FormValues {
  const s = existing?.sample;
  const a = existing?.analysis;
  return {
    sample: {
      samplingDate: (s?.samplingDate ?? new Date()) as unknown as Date,
      depthCmFrom: s?.depthCmFrom ?? 0,
      depthCmTo: s?.depthCmTo ?? 30,
      samplingMethod: s?.samplingMethod ?? 'COMPOSITE',
      samplePointsCount: s?.samplePointsCount,
      labName: s?.labName ?? '',
      labReportId: s?.labReportId ?? '',
      notes: s?.notes ?? '',
    },
    analysis: {
      textureSandPct: a?.textureSandPct,
      textureSiltPct: a?.textureSiltPct,
      textureClayPct: a?.textureClayPct,
      bulkDensityGCm3: a?.bulkDensityGCm3,
      waterHoldingCapacityPct: a?.waterHoldingCapacityPct,
      infiltrationRateMmH: a?.infiltrationRateMmH,
      aggregateStabilityPct: a?.aggregateStabilityPct,
      phWater: a?.phWater,
      phKcl: a?.phKcl,
      ecDsM: a?.ecDsM,
      organicMatterPct: a?.organicMatterPct ?? 0,
      totalNitrogenPct: a?.totalNitrogenPct,
      cecMeq100g: a?.cecMeq100g,
      pOlsenPpm: a?.pOlsenPpm,
      pBrayPpm: a?.pBrayPpm,
      kExchangeablePpm: a?.kExchangeablePpm,
      caExchangeablePpm: a?.caExchangeablePpm,
      mgExchangeablePpm: a?.mgExchangeablePpm,
      naExchangeablePpm: a?.naExchangeablePpm,
      fePpm: a?.fePpm,
      mnPpm: a?.mnPpm,
      znPpm: a?.znPpm,
      cuPpm: a?.cuPpm,
      bPpm: a?.bPpm,
      totalCarbonatesPct: a?.totalCarbonatesPct,
      activeLimestonePct: a?.activeLimestonePct,
      microbialBiomassCMgKg: a?.microbialBiomassCMgKg,
      basalRespirationMgCo2KgDay: a?.basalRespirationMgCo2KgDay,
      earthwormsCountM2: a?.earthwormsCountM2,
      haneyTestScore: a?.haneyTestScore,
    },
  };
}

export function SoilSampleDialog({
  open,
  onOpenChange,
  parcelId,
  existing,
  onSaved,
}: Props): JSX.Element {
  const editing = Boolean(existing);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(
    existing?.sample.labReportFileBlob ? existing.sample.labReportId ?? 'Informe adjunto' : null,
  );
  const [clearFile, setClearFile] = useState(false);

  const defaults = defaultValues(existing);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: defaults as any,
  });

  const samplingMethod = watch('sample.samplingMethod');

  const onSubmit = handleSubmit(async (data) => {
    const file = fileRef.current?.files?.[0];
    let blob: Blob | undefined = existing?.sample.labReportFileBlob;
    if (clearFile) blob = undefined;
    if (file) blob = file;

    const sampleInput = {
      parcelId,
      samplingDate: data.sample.samplingDate,
      depthCmFrom: data.sample.depthCmFrom,
      depthCmTo: data.sample.depthCmTo,
      samplingMethod: data.sample.samplingMethod,
      samplePointsCount: data.sample.samplePointsCount,
      labName: data.sample.labName || undefined,
      labReportId: data.sample.labReportId || undefined,
      labReportFileBlob: blob,
      notes: data.sample.notes || undefined,
    };

    const analysisInput = { ...data.analysis };

    if (editing && existing) {
      await updateSoilRecord(existing.sample.id, sampleInput, analysisInput);
    } else {
      await createSoilRecord(sampleInput, analysisInput);
    }
    markCoachStale();
    onSaved?.();
    reset();
    setFileName(null);
    setClearFile(false);
    onOpenChange(false);
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : null);
    setClearFile(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar análisis de suelo' : 'Nuevo análisis de suelo'}
          </DialogTitle>
          <DialogDescription>
            Introduce los datos de laboratorio. Los campos opcionales se pueden dejar en
            blanco — solo MO es obligatoria.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Muestra</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fecha de muestreo" error={errors.sample?.samplingDate?.message}>
                <Input
                  type="date"
                  defaultValue={toDateInput(defaults.sample.samplingDate as Date)}
                  {...register('sample.samplingDate', { valueAsDate: true })}
                />
              </Field>
              <Field
                label="Método"
                error={(errors.sample as any)?.samplingMethod?.message}
              >
                <Select
                  value={samplingMethod}
                  onValueChange={(v) =>
                    setValue('sample.samplingMethod', v as any, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPOSITE">Compuesta</SelectItem>
                    <SelectItem value="ZONAL">Zonal</SelectItem>
                    <SelectItem value="GRID">Malla</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Profundidad desde (cm)" error={(errors.sample as any)?.depthCmFrom?.message}>
                <Input type="number" step="1" {...register('sample.depthCmFrom', { valueAsNumber: true })} />
              </Field>
              <Field label="Profundidad hasta (cm)" error={(errors.sample as any)?.depthCmTo?.message}>
                <Input type="number" step="1" {...register('sample.depthCmTo', { valueAsNumber: true })} />
              </Field>
              <Field label="Nº puntos" error={(errors.sample as any)?.samplePointsCount?.message}>
                <Input
                  type="number"
                  step="1"
                  {...register('sample.samplePointsCount', { setValueAs: numberOrUndef })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Laboratorio" error={(errors.sample as any)?.labName?.message}>
                <Input {...register('sample.labName')} />
              </Field>
              <Field label="Referencia informe" error={(errors.sample as any)?.labReportId?.message}>
                <Input {...register('sample.labReportId')} />
              </Field>
            </div>
            <div>
              <Label>Informe PDF</Label>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={onFileChange}
                  className="text-sm"
                />
                {fileName && !clearFile && (
                  <span className="text-xs text-slate-600">{fileName}</span>
                )}
                {existing?.sample.labReportFileBlob && !clearFile && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      setClearFile(true);
                      setFileName(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                  >
                    Eliminar adjunto
                  </button>
                )}
              </div>
            </div>
            <Field label="Notas" error={(errors.sample as any)?.notes?.message}>
              <Textarea rows={2} {...register('sample.notes')} />
            </Field>
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Valores del análisis</h3>

            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Textura y físicos
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Num label="Arena %" path="analysis.textureSandPct" register={register} errors={errors} />
              <Num label="Limo %" path="analysis.textureSiltPct" register={register} errors={errors} />
              <Num label="Arcilla %" path="analysis.textureClayPct" register={register} errors={errors} />
              <Num label="Densidad aparente (g/cm³)" path="analysis.bulkDensityGCm3" register={register} errors={errors} step="0.01" />
              <Num label="Retención agua %" path="analysis.waterHoldingCapacityPct" register={register} errors={errors} />
              <Num label="Estabilidad agregados %" path="analysis.aggregateStabilityPct" register={register} errors={errors} />
            </div>

            <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Químicos básicos
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Num label="pH agua" path="analysis.phWater" register={register} errors={errors} step="0.1" />
              <Num label="pH KCl" path="analysis.phKcl" register={register} errors={errors} step="0.1" />
              <Num label="CE (dS/m)" path="analysis.ecDsM" register={register} errors={errors} step="0.01" />
              <Num
                label="Materia orgánica % *"
                path="analysis.organicMatterPct"
                register={register}
                errors={errors}
                step="0.01"
                required
              />
              <Num label="N total %" path="analysis.totalNitrogenPct" register={register} errors={errors} step="0.001" />
              <Num label="CIC (meq/100 g)" path="analysis.cecMeq100g" register={register} errors={errors} step="0.1" />
            </div>

            <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Macronutrientes (ppm)
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Num label="P Olsen" path="analysis.pOlsenPpm" register={register} errors={errors} />
              <Num label="P Bray" path="analysis.pBrayPpm" register={register} errors={errors} />
              <Num label="K interc." path="analysis.kExchangeablePpm" register={register} errors={errors} />
              <Num label="Ca interc." path="analysis.caExchangeablePpm" register={register} errors={errors} />
              <Num label="Mg interc." path="analysis.mgExchangeablePpm" register={register} errors={errors} />
              <Num label="Na interc." path="analysis.naExchangeablePpm" register={register} errors={errors} />
            </div>

            <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Micronutrientes (ppm)
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Num label="Fe" path="analysis.fePpm" register={register} errors={errors} />
              <Num label="Mn" path="analysis.mnPpm" register={register} errors={errors} />
              <Num label="Zn" path="analysis.znPpm" register={register} errors={errors} />
              <Num label="Cu" path="analysis.cuPpm" register={register} errors={errors} />
              <Num label="B" path="analysis.bPpm" register={register} errors={errors} />
            </div>

            <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Carbonatos
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Num label="Carbonatos totales %" path="analysis.totalCarbonatesPct" register={register} errors={errors} step="0.1" />
              <Num label="Caliza activa %" path="analysis.activeLimestonePct" register={register} errors={errors} step="0.1" />
            </div>

            <h4 className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Biología (opcional)
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <Num label="Biomasa microbiana C (mg/kg)" path="analysis.microbialBiomassCMgKg" register={register} errors={errors} />
              <Num label="Respiración basal (mg CO₂/kg·día)" path="analysis.basalRespirationMgCo2KgDay" register={register} errors={errors} />
              <Num label="Lombrices (ind/m²)" path="analysis.earthwormsCountM2" register={register} errors={errors} />
              <Num label="Haney score" path="analysis.haneyTestScore" register={register} errors={errors} step="0.1" />
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editing ? 'Guardar cambios' : 'Guardar análisis'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

type NumProps = {
  label: string;
  path: string;
  register: any;
  errors: any;
  step?: string;
  required?: boolean;
};

function Num({ label, path, register, errors, step = '0.01', required }: NumProps) {
  const err = getNestedError(errors, path);
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        step={step}
        {...register(path, required ? { valueAsNumber: true } : { setValueAs: numberOrUndef })}
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

function getNestedError(errors: any, path: string): string | undefined {
  const parts = path.split('.');
  let cur: any = errors;
  for (const p of parts) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur?.message;
}

function numberOrUndef(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}
