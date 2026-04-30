import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldLogDialog } from '@/components/notebook/FieldLogDialog';
import {
  acknowledgeAlert,
  completeTask,
  dismissTask,
  listAlerts,
  listFarms,
  listParcels,
  listTasks,
  markInProgress,
  postponeTask,
  reopenTask,
  rescheduleTask,
} from '@/lib/db/repos';
import type {
  Alert,
  AlertSeverity,
  Parcel,
  Task,
} from '@/lib/db/types';
import { evaluateCoach } from '@/lib/playbooks';
import { markCoachStale, useAutoCoach } from '@/lib/coach/useAutoCoach';
import { CoachWizardDialog } from '@/components/coach/CoachWizardDialog';
import type { CoachWizard } from '@/lib/coach/wizards';
import { DiagnoseWizardDialog } from '@/components/diagnose/DiagnoseWizardDialog';
import type { DiagnoseHypothesis } from '@/lib/diagnose/types';
import { TaskListRow } from '@/components/coach/TaskListRow';
import { TaskDetailDialog } from '@/components/coach/TaskDetailDialog';
import { PostponeDialog } from '@/components/coach/PostponeDialog';
import { NotificationsBanner } from '@/components/coach/NotificationsBanner';
import { InstallBanner } from '@/components/pwa/InstallBanner';
import { useToast } from '@/components/ui/toast';
import {
  compareTasks,
  taskUrgency,
  URGENCY_BADGE_CLASS,
  URGENCY_LABEL,
  type TaskUrgency,
} from '@/lib/coach/urgency';

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

const SECTION_ORDER: TaskUrgency[] = [
  'OVERDUE',
  'TODAY',
  'SOON',
  'THIS_WEEK',
  'UPCOMING',
  'LATER',
];

export function TodayPage(): JSX.Element {
  const farms = useLiveQuery(() => listFarms(), []);
  const parcels = useLiveQuery(() => listParcels(), []);
  const tasks = useLiveQuery(
    () => listTasks({ status: ['PENDING', 'IN_PROGRESS', 'POSTPONED'] }),
    [],
  );
  const alerts = useLiveQuery(() => listAlerts(), []);
  const auto = useAutoCoach();
  const toast = useToast();

  const [evaluating, setEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const [logOpen, setLogOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | undefined>(undefined);
  const [diagnosePrefill, setDiagnosePrefill] = useState<
    { title: string; description: string } | undefined
  >(undefined);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);

  const [postponeOpen, setPostponeOpen] = useState(false);
  const [postponeTarget, setPostponeTarget] = useState<Task | undefined>(undefined);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeWizard, setActiveWizard] = useState<CoachWizard | undefined>(undefined);
  const [wizardTask, setWizardTask] = useState<Task | undefined>(undefined);

  const [diagnoseOpen, setDiagnoseOpen] = useState(false);

  const [parcelFilter, setParcelFilter] = useState<string>('ALL');

  const parcelMap = useMemo(() => {
    const m = new Map<string, Parcel>();
    (parcels ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [parcels]);

  const allTasks = tasks ?? [];

  const filteredTasks = useMemo(() => {
    if (parcelFilter === 'ALL') return allTasks;
    if (parcelFilter === 'NONE') return allTasks.filter((t) => !t.parcelId);
    return allTasks.filter((t) => t.parcelId === parcelFilter);
  }, [allTasks, parcelFilter]);

  const grouped = useMemo(() => {
    const m = new Map<TaskUrgency, Task[]>();
    SECTION_ORDER.forEach((u) => m.set(u, []));
    filteredTasks.forEach((t) => {
      const u = taskUrgency(t);
      m.get(u)!.push(t);
    });
    m.forEach((list) => list.sort((a, b) => compareTasks(a, b)));
    return m;
  }, [filteredTasks]);

  const counts = useMemo(() => {
    const c: Record<TaskUrgency, number> = {
      OVERDUE: 0,
      TODAY: 0,
      SOON: 0,
      THIS_WEEK: 0,
      UPCOMING: 0,
      LATER: 0,
    };
    filteredTasks.forEach((t) => {
      c[taskUrgency(t)] += 1;
    });
    return c;
  }, [filteredTasks]);

  const parcelsWithTasks = useMemo(() => {
    const ids = new Set<string>();
    let hasUnassigned = false;
    allTasks.forEach((t) => {
      if (t.parcelId) ids.add(t.parcelId);
      else hasUnassigned = true;
    });
    return {
      parcels: (parcels ?? []).filter((p) => ids.has(p.id)),
      hasUnassigned,
    };
  }, [allTasks, parcels]);

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
      markCoachStale();
      const r = await evaluateCoach();
      setLastResult(
        `Coach actualizado: ${r.createdTasks} nuevas, ${r.updatedTasks} revisadas, ${r.skippedTasks} ya hechas, ${r.createdAlerts} avisos.`,
      );
    } finally {
      setEvaluating(false);
    }
  };

  const openDetail = (t: Task) => {
    setActiveTask(t);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setActiveTask(undefined);
  };

  const onShowWizard = (wizard: CoachWizard, t: Task) => {
    setActiveWizard(wizard);
    setWizardTask(t);
    setWizardOpen(true);
    setDetailOpen(false);
  };

  const onComplete = (t: Task) => {
    setCompletingTask(t);
    setLogOpen(true);
    setDetailOpen(false);
  };

  const onAskPostpone = (t: Task) => {
    setPostponeTarget(t);
    setPostponeOpen(true);
    setDetailOpen(false);
  };

  const onConfirmPostpone = async (date: Date, reason?: string) => {
    if (!postponeTarget) return;
    await postponeTask(postponeTarget.id, { newScheduledFor: date, reason });
    setPostponeTarget(undefined);
  };

  const onDismiss = async (t: Task) => {
    await dismissTask(t.id);
    closeDetail();
    toast.show({
      title: 'Tarea descartada',
      description: t.title,
      action: {
        label: 'Deshacer',
        onClick: () => reopenTask(t.id),
      },
    });
  };

  const onReopen = async (t: Task) => {
    await reopenTask(t.id);
    closeDetail();
  };

  const onMarkInProgress = async (t: Task) => {
    await markInProgress(t.id);
    closeDetail();
  };

  const onReschedule = async (t: Task, newDate: Date) => {
    await rescheduleTask(t.id, newDate);
    closeDetail();
  };

  const onAck = async (a: Alert) => {
    await acknowledgeAlert(a.id);
  };

  const actionableCount = counts.OVERDUE + counts.TODAY + counts.SOON;
  const sortedAlerts = alerts ?? [];

  return (
    <PageContainer
      title="¿Qué hago hoy?"
      subtitle="Tu Coach de campo. Tareas y avisos con base agronómica."
    >
      <InstallBanner />
      <NotificationsBanner hasUrgent={counts.OVERDUE + counts.TODAY > 0} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onEvaluate} disabled={evaluating || (parcels?.length ?? 0) === 0}>
            {evaluating ? 'Evaluando…' : 'Actualizar coach'}
          </Button>
          <Button variant="outline" onClick={() => setDiagnoseOpen(true)}>
            Veo algo raro
          </Button>
        </div>
        {auto.evaluating ? (
          <span className="text-xs text-slate-500">Coach calculando tareas…</span>
        ) : (
          lastResult && <span className="text-xs text-slate-500">{lastResult}</span>
        )}
      </div>

      <SummaryCard counts={counts} actionable={actionableCount} total={filteredTasks.length} />

      {(parcelsWithTasks.parcels.length > 1 || parcelsWithTasks.hasUnassigned) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip
            label={`Todas (${allTasks.length})`}
            active={parcelFilter === 'ALL'}
            onClick={() => setParcelFilter('ALL')}
          />
          {parcelsWithTasks.parcels.map((p) => {
            const n = allTasks.filter((t) => t.parcelId === p.id).length;
            return (
              <FilterChip
                key={p.id}
                label={`${p.name} (${n})`}
                active={parcelFilter === p.id}
                onClick={() => setParcelFilter(p.id)}
              />
            );
          })}
          {parcelsWithTasks.hasUnassigned && (
            <FilterChip
              label={`Sin parcela (${allTasks.filter((t) => !t.parcelId).length})`}
              active={parcelFilter === 'NONE'}
              onClick={() => setParcelFilter('NONE')}
            />
          )}
        </div>
      )}

      <section className="mt-6 grid gap-3">
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

      <section className="mt-6 grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tareas ({filteredTasks.length})
        </h2>

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="py-4 text-sm text-slate-600">
              {allTasks.length === 0 ? (
                <>
                  El coach no propone tareas ahora mismo. Pulsa{' '}
                  <strong>Actualizar coach</strong> para recalcular.
                </>
              ) : (
                <>No hay tareas para esta parcela. Cambia el filtro de arriba.</>
              )}
            </CardContent>
          </Card>
        )}

        {SECTION_ORDER.map((u) => {
          const list = grouped.get(u) ?? [];
          if (list.length === 0) return null;
          return (
            <UrgencySection
              key={u}
              urgency={u}
              tasks={list}
              parcelMap={parcelMap}
              onClick={openDetail}
            />
          );
        })}
      </section>

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setActiveTask(undefined);
        }}
        task={activeTask}
        parcel={activeTask?.parcelId ? parcelMap.get(activeTask.parcelId) : undefined}
        onComplete={onComplete}
        onPostpone={onAskPostpone}
        onDismiss={onDismiss}
        onReopen={onReopen}
        onMarkInProgress={onMarkInProgress}
        onReschedule={onReschedule}
        onShowWizard={onShowWizard}
      />

      <PostponeDialog
        open={postponeOpen}
        onOpenChange={(open) => {
          setPostponeOpen(open);
          if (!open) setPostponeTarget(undefined);
        }}
        task={postponeTarget}
        onConfirm={onConfirmPostpone}
      />

      <FieldLogDialog
        open={logOpen}
        onOpenChange={(open) => {
          setLogOpen(open);
          if (!open) {
            setCompletingTask(undefined);
            setDiagnosePrefill(undefined);
          }
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
            : diagnosePrefill
              ? {
                  type: 'MONITORING',
                  title: diagnosePrefill.title,
                  description: diagnosePrefill.description,
                }
              : undefined
        }
      />

      <DiagnoseWizardDialog
        open={diagnoseOpen}
        onOpenChange={setDiagnoseOpen}
        onAnnotate={(h: DiagnoseHypothesis) => {
          setDiagnosePrefill({
            title: `Observación · ${h.title}`,
            description: buildDiagnoseDescription(h),
          });
          setLogOpen(true);
        }}
      />

      {activeWizard && (
        <CoachWizardDialog
          open={wizardOpen}
          onOpenChange={(open) => {
            setWizardOpen(open);
            if (!open) {
              setActiveWizard(undefined);
              setWizardTask(undefined);
            }
          }}
          wizard={activeWizard}
          onMarkDone={
            wizardTask
              ? () => {
                  const t = wizardTask;
                  setWizardTask(undefined);
                  onComplete(t);
                }
              : undefined
          }
        />
      )}
    </PageContainer>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-2.5 py-1 text-xs transition',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function SummaryCard({
  counts,
  actionable,
  total,
}: {
  counts: Record<TaskUrgency, number>;
  actionable: number;
  total: number;
}): JSX.Element {
  const headline = (() => {
    if (total === 0) return 'No hay tareas pendientes para esta vista.';
    if (counts.OVERDUE > 0) {
      return `Hay ${counts.OVERDUE} tarea${counts.OVERDUE === 1 ? '' : 's'} atrasada${counts.OVERDUE === 1 ? '' : 's'}: empieza por ahí.`;
    }
    if (counts.TODAY > 0) {
      return `Hoy tienes ${counts.TODAY} tarea${counts.TODAY === 1 ? '' : 's'} para hacer.`;
    }
    if (counts.SOON > 0) {
      return `${counts.SOON} tarea${counts.SOON === 1 ? '' : 's'} en los próximos 2-3 días.`;
    }
    if (counts.THIS_WEEK > 0) {
      return `${counts.THIS_WEEK} tarea${counts.THIS_WEEK === 1 ? '' : 's'} esta semana.`;
    }
    return 'Sin urgencias inmediatas. Mira más adelante en el calendario.';
  })();

  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-sm font-medium text-slate-800">{headline}</p>
        {total > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SECTION_ORDER.map((u) => {
              const n = counts[u];
              if (n === 0) return null;
              return (
                <span
                  key={u}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${URGENCY_BADGE_CLASS[u]}`}
                >
                  {URGENCY_LABEL[u]}: {n}
                </span>
              );
            })}
          </div>
        )}
        {total > 0 && actionable === 0 && (
          <p className="mt-2 text-xs text-slate-500">
            Nada urgente esta semana — buena ventana para planificar o adelantar trabajo
            preventivo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function UrgencySection({
  urgency,
  tasks,
  parcelMap,
  onClick,
}: {
  urgency: TaskUrgency;
  tasks: Task[];
  parcelMap: Map<string, Parcel>;
  onClick: (t: Task) => void;
}): JSX.Element {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${URGENCY_BADGE_CLASS[urgency]}`}
        >
          {URGENCY_LABEL[urgency]}
        </span>
        <span className="text-xs text-slate-500">{tasks.length}</span>
      </div>
      <div className="grid gap-1.5">
        {tasks.map((t) => (
          <TaskListRow
            key={t.id}
            task={t}
            parcel={t.parcelId ? parcelMap.get(t.parcelId) : undefined}
            onClick={onClick}
            showUrgency={false}
          />
        ))}
      </div>
    </div>
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
