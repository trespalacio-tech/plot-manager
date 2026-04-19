import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldLogDialog } from '@/components/notebook/FieldLogDialog';
import {
  acknowledgeAlert,
  completeTask,
  dismissTask,
  listAlerts,
  listFarms,
  listParcels,
  listTasks,
  postponeTask,
  reopenTask,
} from '@/lib/db/repos';
import type {
  Alert,
  AlertSeverity,
  Parcel,
  Task,
  TaskPriority,
} from '@/lib/db/types';
import { OPERATION_LABELS } from '@/lib/notebook/templates';
import { evaluateRules } from '@/lib/rules';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-slate-100 text-slate-700',
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  CRITICAL: 'Crítica',
  WARNING: 'Atención',
  INFO: 'Info',
};

const SEVERITY_CLASS: Record<AlertSeverity, string> = {
  CRITICAL: 'border-red-300 bg-red-50',
  WARNING: 'border-amber-300 bg-amber-50',
  INFO: 'border-sky-300 bg-sky-50',
};

export function TodayPage(): JSX.Element {
  const farms = useLiveQuery(() => listFarms(), []);
  const parcels = useLiveQuery(() => listParcels(), []);
  const tasks = useLiveQuery(
    () => listTasks({ status: ['PENDING', 'IN_PROGRESS', 'POSTPONED'] }),
    [],
  );
  const alerts = useLiveQuery(() => listAlerts(), []);

  const [evaluating, setEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | undefined>(undefined);

  const parcelMap = useMemo(() => {
    const m = new Map<string, Parcel>();
    (parcels ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [parcels]);

  if (farms && farms.length === 0) {
    return (
      <PageContainer
        title="Bienvenido a Fincas"
        subtitle="Gestión regenerativa de frutales y viñedo, local y sin servidor."
      >
        <Card>
          <CardContent className="py-6 text-sm text-slate-700">
            <p className="font-medium text-brand-700">Empezamos por tu primera finca.</p>
            <p className="mt-2">
              Crea una finca con nombre y municipio y luego añade parcelas. En cuanto la app
              conozca tu cultivo, el Coach propondrá aquí qué hacer cada día con su base
              agronómica.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/parcelas">Crear mi primera finca</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const onEvaluate = async () => {
    setEvaluating(true);
    try {
      const r = await evaluateRules();
      setLastResult(
        `Coach actualizado: ${r.createdTasks} nuevas, ${r.updatedTasks} revisadas, ${r.skippedTasks} ya hechas, ${r.createdAlerts} avisos.`,
      );
    } finally {
      setEvaluating(false);
    }
  };

  const onComplete = (t: Task) => {
    setCompletingTask(t);
    setDialogOpen(true);
  };

  const onPostpone = async (t: Task) => {
    const reason = prompt('Motivo (opcional):') ?? undefined;
    await postponeTask(t.id, reason);
  };

  const onDismiss = async (t: Task) => {
    if (!confirm(`¿Descartar «${t.title}»? No volverá a aparecer para esta parcela.`)) return;
    await dismissTask(t.id);
  };

  const onReopen = async (t: Task) => {
    await reopenTask(t.id);
  };

  const onAck = async (a: Alert) => {
    await acknowledgeAlert(a.id);
  };

  const sortedTasks = tasks ?? [];
  const sortedAlerts = alerts ?? [];

  return (
    <PageContainer
      title="¿Qué hago hoy?"
      subtitle="Tu Coach de campo. Tareas y avisos con base agronómica."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button onClick={onEvaluate} disabled={evaluating || (parcels?.length ?? 0) === 0}>
          {evaluating ? 'Evaluando…' : 'Actualizar coach'}
        </Button>
        {lastResult && <span className="text-xs text-slate-500">{lastResult}</span>}
      </div>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Avisos ({sortedAlerts.length})
        </h2>
        {sortedAlerts.length === 0 && (
          <Card>
            <CardContent className="py-4 text-sm text-slate-600">
              Sin avisos activos.
            </CardContent>
          </Card>
        )}
        {sortedAlerts.map((a) => (
          <AlertCard
            key={a.id}
            alert={a}
            parcel={a.parcelId ? parcelMap.get(a.parcelId) : undefined}
            onAck={() => onAck(a)}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tareas ({sortedTasks.length})
        </h2>
        {sortedTasks.length === 0 && (
          <Card>
            <CardContent className="py-4 text-sm text-slate-600">
              El coach no propone tareas ahora mismo. Pulsa <strong>Actualizar coach</strong>{' '}
              para recalcular.
            </CardContent>
          </Card>
        )}
        {sortedTasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            parcel={t.parcelId ? parcelMap.get(t.parcelId) : undefined}
            onComplete={() => onComplete(t)}
            onPostpone={() => onPostpone(t)}
            onDismiss={() => onDismiss(t)}
            onReopen={() => onReopen(t)}
          />
        ))}
      </section>

      <FieldLogDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setCompletingTask(undefined);
        }}
        parcels={parcels ?? []}
        defaultParcelId={completingTask?.parcelId}
        onSaved={async (entry) => {
          if (completingTask) {
            await completeTask(completingTask.id, entry.id);
          }
        }}
        prefill={
          completingTask
            ? {
                type: completingTask.type,
                title: completingTask.title,
              }
            : undefined
        }
      />
    </PageContainer>
  );
}

function TaskCard({
  task,
  parcel,
  onComplete,
  onPostpone,
  onDismiss,
  onReopen,
}: {
  task: Task;
  parcel?: Parcel;
  onComplete: () => void;
  onPostpone: () => void;
  onDismiss: () => void;
  onReopen: () => void;
}) {
  const [showBasis, setShowBasis] = useState(false);
  const due = task.dueDate ?? task.scheduledFor;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{task.title}</CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[task.priority]}`}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {OPERATION_LABELS[task.type]}
            </span>
            {task.status === 'POSTPONED' && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                Pospuesta
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-slate-500">
          {parcel ? parcel.name : 'Sin parcela'}
          {due && <> · vence {due.toLocaleDateString('es-ES')}</>}
        </div>
        <p className="mt-2 text-sm text-slate-700">{task.rationale}</p>
        {task.scientificBasis && (
          <div className="mt-2">
            <button
              className="text-xs font-medium text-brand-700 hover:underline"
              onClick={() => setShowBasis((v) => !v)}
            >
              {showBasis ? 'Ocultar base científica' : 'Ver base científica'}
            </button>
            {showBasis && (
              <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600">
                {task.scientificBasis}
              </p>
            )}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {task.status === 'POSTPONED' ? (
            <Button size="sm" onClick={onReopen}>
              Reactivar
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={onComplete}>
                Hecho
              </Button>
              <Button variant="outline" size="sm" onClick={onPostpone}>
                Posponer
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({
  alert,
  parcel,
  onAck,
}: {
  alert: Alert;
  parcel?: Parcel;
  onAck: () => void;
}) {
  return (
    <Card className={`border ${SEVERITY_CLASS[alert.severity]}`}>
      <CardContent className="py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="font-medium text-slate-900">{alert.title}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onAck}>
            Visto
          </Button>
        </div>
        <div className="text-xs text-slate-500">{parcel ? parcel.name : 'General'}</div>
        <p className="mt-1 text-sm text-slate-700">{alert.message}</p>
      </CardContent>
    </Card>
  );
}
