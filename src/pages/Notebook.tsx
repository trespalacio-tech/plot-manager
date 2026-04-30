import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldLogDialog } from '@/components/notebook/FieldLogDialog';
import { usePrompt } from '@/components/ui/confirm';
import {
  listFarms,
  listFieldLogEntries,
  listParcels,
  summarizeEntries,
  voidFieldLogEntry,
} from '@/lib/db/repos';
import type { FieldLogEntry, OperationType, Parcel } from '@/lib/db/types';
import {
  OPERATION_LABELS,
  OPERATION_TYPES,
} from '@/lib/notebook/templates';
import { downloadCsv, entriesToCsv } from '@/lib/notebook/csv';
import { buildNotebookHtml, openNotebookPdf } from '@/lib/notebook/pdf';

type Period = 'day' | 'week' | 'month' | 'all';

function startOfPeriod(period: Period): Date | undefined {
  if (period === 'all') return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === 'day') return d;
  if (period === 'week') {
    const dow = d.getDay(); // 0=Sun
    const diff = dow === 0 ? 6 : dow - 1;
    d.setDate(d.getDate() - diff);
    return d;
  }
  d.setDate(1);
  return d;
}

export function NotebookPage(): JSX.Element {
  const prompt = usePrompt();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldLogEntry | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<OperationType | 'ALL'>('ALL');
  const [parcelFilter, setParcelFilter] = useState<string>('ALL');
  const [period, setPeriod] = useState<Period>('all');
  const [search, setSearch] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);

  const farms = useLiveQuery(() => listFarms(), []);
  const parcels = useLiveQuery(() => listParcels(), []);
  const parcelList: Parcel[] = parcels ?? [];

  const filter = useMemo(
    () => ({
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      parcelId: parcelFilter === 'ALL' ? undefined : parcelFilter,
      dateFrom: startOfPeriod(period),
      search: search || undefined,
      includeVoided,
    }),
    [typeFilter, parcelFilter, period, search, includeVoided],
  );

  const entries = useLiveQuery(
    () => listFieldLogEntries(filter),
    [filter],
  );

  const summary = useMemo(() => summarizeEntries(entries ?? []), [entries]);

  const parcelNames = useMemo(() => {
    const map = new Map<string, string>();
    parcelList.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [parcelList]);

  const onAdd = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const onEdit = (e: FieldLogEntry) => {
    if (e.voidedAt) return;
    setEditing(e);
    setDialogOpen(true);
  };

  const onVoid = async (e: FieldLogEntry) => {
    const reason = await prompt({
      title: `Anular «${e.title}»`,
      description:
        'La entrada se conserva en el historial con esta razón. No se borra para mantener trazabilidad agronómica.',
      inputLabel: 'Motivo de anulación',
      placeholder: 'p. ej. error de tipo, duplicada, fecha incorrecta…',
      confirmText: 'Anular',
      required: true,
    });
    if (!reason) return;
    await voidFieldLogEntry(e.id, reason);
  };

  const onExportCsv = () => {
    const csv = entriesToCsv(entries ?? [], { parcels: parcelList });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `cuaderno-${stamp}.csv`);
  };

  const onExportPdf = () => {
    const periodLabels: Record<Period, string> = {
      day: 'Periodo: hoy',
      week: 'Periodo: semana en curso',
      month: 'Periodo: mes en curso',
      all: 'Periodo: todas las anotaciones',
    };
    const html = buildNotebookHtml(entries ?? [], {
      parcels: parcelList,
      farms: farms ?? [],
      periodLabel: periodLabels[period],
    });
    openNotebookPdf(html);
  };

  const hasData = entries && entries.length > 0;
  const needsBootstrap = farms && farms.length === 0;

  return (
    <PageContainer
      title="Cuaderno de campo"
      subtitle="Registro diario de operaciones. Inmutabilidad blanda: las entradas se anulan, no se borran."
    >
      {needsBootstrap ? (
        <Card>
          <CardContent className="py-6 text-sm text-slate-700">
            Antes de apuntar operaciones necesitas al menos una finca y una parcela.
            Ve a la sección Parcelas para crearlas.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Button onClick={onAdd} disabled={parcelList.length === 0}>
              + Apuntar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onExportCsv}
                disabled={!hasData}
              >
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                onClick={onExportPdf}
                disabled={!hasData}
              >
                Exportar PDF
              </Button>
            </div>
          </div>

          <SummaryCard period={period} summary={summary} />

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-1.5">
                <Label>Periodo</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Hoy</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Tipo</Label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as OperationType | 'ALL')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {OPERATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {OPERATION_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Parcela</Label>
                <Select value={parcelFilter} onValueChange={setParcelFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {parcelList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="título o descripción"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label className="col-span-full flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={includeVoided}
                  onChange={(e) => setIncludeVoided(e.target.checked)}
                />
                Mostrar entradas anuladas
              </label>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-3">
            {entries === undefined && (
              <p className="text-sm text-slate-500">Cargando…</p>
            )}
            {entries && entries.length === 0 && (
              <Card>
                <CardContent className="py-6 text-sm text-slate-600">
                  Sin anotaciones con estos filtros. Prueba a ampliar el periodo o pulsa
                  <strong> + Apuntar</strong>.
                </CardContent>
              </Card>
            )}
            {entries &&
              entries.map((e) => (
                <FieldLogRow
                  key={e.id}
                  entry={e}
                  parcelNames={parcelNames}
                  onEdit={() => onEdit(e)}
                  onVoid={() => onVoid(e)}
                />
              ))}
          </div>

          <FieldLogDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            parcels={parcelList}
            existing={editing}
          />
        </>
      )}
    </PageContainer>
  );
}

function SummaryCard({
  period,
  summary,
}: {
  period: Period;
  summary: ReturnType<typeof summarizeEntries>;
}) {
  const periodLabel: Record<Period, string> = {
    day: 'de hoy',
    week: 'de esta semana',
    month: 'de este mes',
    all: 'totales',
  };
  const hours = Math.floor(summary.totalDurationMinutes / 60);
  const mins = summary.totalDurationMinutes % 60;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen {periodLabel[period]}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Operaciones</div>
          <div className="text-lg font-semibold text-slate-900">{summary.count}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Horas de trabajo</div>
          <div className="text-lg font-semibold text-slate-900">
            {summary.totalDurationMinutes > 0
              ? `${hours}h ${String(mins).padStart(2, '0')}m`
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Coste</div>
          <div className="text-lg font-semibold text-slate-900">
            {summary.totalCostEur > 0 ? `${summary.totalCostEur.toFixed(2)} €` : '—'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldLogRow({
  entry,
  parcelNames,
  onEdit,
  onVoid,
}: {
  entry: FieldLogEntry;
  parcelNames: Map<string, string>;
  onEdit: () => void;
  onVoid: () => void;
}) {
  const voided = Boolean(entry.voidedAt);
  const parcels = entry.parcelIds
    .map((id) => parcelNames.get(id) ?? id)
    .join(' · ');
  const photos = entry.photoBlobs?.length ?? 0;
  const hasVoice = Boolean(entry.voiceNoteBlob);
  return (
    <Card className={voided ? 'opacity-60' : undefined}>
      <CardContent className="grid gap-1 py-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">
              {entry.title}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {OPERATION_LABELS[entry.type]}
            </span>
            {voided && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                Anulada
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">{formatDate(entry.date)}</div>
        </div>
        <div className="text-xs text-slate-600">{parcels}</div>
        {entry.description && (
          <p className="text-sm text-slate-700">{entry.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {entry.durationMinutes != null && (
            <span>{entry.durationMinutes} min</span>
          )}
          {entry.weatherConditions && <span>{entry.weatherConditions}</span>}
          {entry.costEur != null && <span>{entry.costEur.toFixed(2)} €</span>}
          {photos > 0 && <span>📷 {photos}</span>}
          {hasVoice && <span>🎙 nota de voz</span>}
          {voided && entry.voidedReason && (
            <span>Motivo anulación: {entry.voidedReason}</span>
          )}
        </div>
        {!voided && (
          <div className="mt-1 flex gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={onVoid}>
              Anular
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
