import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SoilSampleDialog } from './SoilSampleDialog';
import { useConfirm } from '@/components/ui/confirm';
import {
  deleteSoilRecord,
  listSoilRecordsByParcel,
  type SoilRecord,
} from '@/lib/db/repos';
import type { CropType, SoilAnalysis } from '@/lib/db/types';
import {
  interpretSoilAnalysis,
  organicCarbonFromOM,
  PARAM_LABELS,
  type InterpretationLevel,
  type Recommendation,
  type SoilInterpretation,
} from '@/lib/agronomy/soil';

interface Props {
  parcelId: string;
  cropType: CropType;
}

const CHART_PARAMS: Array<keyof SoilAnalysis> = [
  'organicMatterPct',
  'phWater',
  'ecDsM',
  'pOlsenPpm',
  'kExchangeablePpm',
  'totalNitrogenPct',
  'cecMeq100g',
  'activeLimestonePct',
  'bulkDensityGCm3',
  'earthwormsCountM2',
];

export function SoilPanel({ parcelId, cropType }: Props): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SoilRecord | undefined>(undefined);
  const [chartParam, setChartParam] = useState<string>('organicMatterPct');
  const confirm = useConfirm();

  const records = useLiveQuery(
    () => listSoilRecordsByParcel(parcelId),
    [parcelId],
  );

  const latest = records && records.length > 0 ? records[records.length - 1] : undefined;
  const baseline = records && records.length > 0 ? records[0] : undefined;
  const interpretation = useMemo(
    () =>
      latest ? interpretSoilAnalysis(latest.analysis, { cropType }) : undefined,
    [latest, cropType],
  );

  const chartData = useMemo(() => {
    if (!records) return [];
    return records
      .map((r) => {
        const rawValue = (r.analysis as any)[chartParam];
        if (typeof rawValue !== 'number') return null;
        return {
          date: r.sample.samplingDate.getTime(),
          dateLabel: formatDate(r.sample.samplingDate),
          value: rawValue,
          id: r.sample.id,
        };
      })
      .filter((v): v is { date: number; dateLabel: string; value: number; id: string } => v !== null);
  }, [records, chartParam]);

  const baselineValue =
    baseline && typeof (baseline.analysis as any)[chartParam] === 'number'
      ? ((baseline.analysis as any)[chartParam] as number)
      : undefined;

  const onOpenNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const onEdit = (r: SoilRecord) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const onDelete = async (r: SoilRecord) => {
    const ok = await confirm({
      title: `Borrar el análisis del ${formatDate(r.sample.samplingDate)}`,
      description: 'Se borrarán también los resultados de los parámetros analizados.',
      confirmText: 'Borrar análisis',
      destructive: true,
    });
    if (!ok) return;
    await deleteSoilRecord(r.sample.id);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Análisis de suelo</h2>
          <p className="text-sm text-slate-600">
            Rangos adaptados a suelos calizos de Burgos. La línea base es el primer
            análisis registrado.
          </p>
        </div>
        <Button onClick={onOpenNew}>Nuevo análisis</Button>
      </div>

      {records === undefined && <p className="text-sm text-slate-500">Cargando…</p>}

      {records && records.length === 0 && (
        <EmptyState onAdd={onOpenNew} />
      )}

      {records && records.length > 0 && latest && interpretation && (
        <>
          <InterpretationSummary
            interpretation={interpretation}
            sampleDate={latest.sample.samplingDate}
          />

          <RecommendationsCard recommendations={interpretation.recommendations} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Evolución temporal</CardTitle>
              <div className="min-w-[220px]">
                <Select value={chartParam} onValueChange={setChartParam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_PARAMS.map((p) => (
                      <SelectItem key={p as string} value={p as string}>
                        {PARAM_LABELS[p as string] ?? (p as string)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Sin datos para este parámetro en los análisis existentes.
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {baselineValue !== undefined && (
                        <ReferenceLine
                          y={baselineValue}
                          stroke="#94a3b8"
                          strokeDasharray="4 4"
                          label={{ value: 'Línea base', fontSize: 11, fill: '#475569' }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2f6b3a"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[...records].reverse().map((r) => (
                <SampleRow
                  key={r.sample.id}
                  record={r}
                  onEdit={() => onEdit(r)}
                  onDelete={() => onDelete(r)}
                />
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <SoilSampleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        parcelId={parcelId}
        existing={editing}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="py-8 text-center">
        <p className="text-sm text-slate-700">
          Todavía no hay análisis de suelo en esta parcela. El módulo de suelo es la
          base del manejo regenerativo: carga tu primer informe para empezar a evaluar
          la evolución.
        </p>
        <div className="mt-4">
          <Button onClick={onAdd}>Cargar primer análisis</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InterpretationSummary({
  interpretation,
  sampleDate,
}: {
  interpretation: SoilInterpretation;
  sampleDate: Date;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Interpretación del análisis más reciente</span>
          <span className="text-xs font-normal text-slate-500">
            {formatDate(sampleDate)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-3 text-xs">
          <SummaryBadge level="OK" count={interpretation.summary.ok} />
          <SummaryBadge level="WATCH" count={interpretation.summary.watch} />
          <SummaryBadge level="ACTION" count={interpretation.summary.action} />
        </div>
        {interpretation.params.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sin parámetros suficientes para interpretar. Añade al menos pH, MO, caliza
            activa.
          </p>
        ) : (
          <ul className="grid gap-2">
            {interpretation.params.map((p) => (
              <li
                key={p.key}
                className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <LevelDot level={p.level} />
                    <span className="font-medium text-slate-900">{p.label}</span>
                    {p.value !== undefined && (
                      <span className="text-slate-600">
                        {p.value} {p.unit ?? ''}
                      </span>
                    )}
                    {p.band && (
                      <span className="text-xs text-slate-500">({p.band})</span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-slate-700">{p.message}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationsCard({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendaciones generadas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {recommendations.map((r) => (
          <div
            key={r.id}
            className="rounded-md border border-brand-200 bg-brand-50 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-brand-900">{r.title}</span>
              <PriorityBadge priority={r.priority} />
            </div>
            <p className="mt-1 text-brand-900/90">{r.rationale}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SampleRow({
  record,
  onEdit,
  onDelete,
}: {
  record: SoilRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { sample, analysis } = record;
  const oc =
    analysis.organicMatterPct !== undefined
      ? organicCarbonFromOM(analysis.organicMatterPct).toFixed(2)
      : '—';
  const pdfBlob = sample.labReportFileBlob;
  const pdfUrl = useMemo(
    () => (pdfBlob ? URL.createObjectURL(pdfBlob) : undefined),
    [pdfBlob],
  );
  useEffect(() => {
    if (!pdfUrl) return;
    return () => URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div>
        <div className="font-medium text-slate-900">{formatDate(sample.samplingDate)}</div>
        <div className="text-xs text-slate-600">
          {sample.depthCmFrom}–{sample.depthCmTo} cm · MO{' '}
          {analysis.organicMatterPct.toFixed(2)}% · C orgánico {oc}%
          {sample.labName ? ` · ${sample.labName}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-brand-700 hover:underline"
          >
            Ver PDF
          </a>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Borrar
        </Button>
      </div>
    </div>
  );
}

function SummaryBadge({ level, count }: { level: InterpretationLevel; count: number }) {
  const styles: Record<InterpretationLevel, string> = {
    OK: 'bg-emerald-100 text-emerald-800',
    WATCH: 'bg-amber-100 text-amber-800',
    ACTION: 'bg-red-100 text-red-800',
  };
  const labels: Record<InterpretationLevel, string> = {
    OK: 'OK',
    WATCH: 'Vigilar',
    ACTION: 'Acción',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium ${styles[level]}`}>
      {labels[level]} · {count}
    </span>
  );
}

function LevelDot({ level }: { level: InterpretationLevel }) {
  const color: Record<InterpretationLevel, string> = {
    OK: 'bg-emerald-500',
    WATCH: 'bg-amber-500',
    ACTION: 'bg-red-500',
  };
  return <span className={`h-2.5 w-2.5 rounded-full ${color[level]}`} aria-hidden />;
}

function PriorityBadge({ priority }: { priority: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const styles: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-amber-100 text-amber-800',
    HIGH: 'bg-red-100 text-red-800',
  };
  const labels: Record<string, string> = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[priority]}`}>
      Prioridad {labels[priority]}
    </span>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
}
