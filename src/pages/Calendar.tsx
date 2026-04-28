import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  completeTask,
  dismissTask,
  getTask,
  listFarms,
  listFieldLogEntries,
  listParcels,
  listTasks,
  markInProgress,
  postponeTask,
  reopenTask,
  rescheduleTask,
} from '@/lib/db/repos';
import type { Parcel, Task, TaskPriority } from '@/lib/db/types';
import { OPERATION_LABELS } from '@/lib/notebook/templates';
import { evaluateCoach } from '@/lib/playbooks';
import { markCoachStale, useAutoCoach } from '@/lib/coach/useAutoCoach';
import { TaskListRow } from '@/components/coach/TaskListRow';
import { TaskDetailDialog } from '@/components/coach/TaskDetailDialog';
import { PostponeDialog } from '@/components/coach/PostponeDialog';
import { CoachWizardDialog } from '@/components/coach/CoachWizardDialog';
import { FieldLogDialog } from '@/components/notebook/FieldLogDialog';
import type { CoachWizard } from '@/lib/coach/wizards';

type View = 'MONTH' | 'WEEK';

interface DayItem {
  kind: 'task' | 'log';
  id: string;
  title: string;
  parcelId?: string;
  priority?: TaskPriority;
  type: string;
  done?: boolean;
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-slate-400',
};

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeekMon(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7;
  return addDays(x, -dow);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarPage(): JSX.Element {
  const [view, setView] = useState<View>('MONTH');
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()));
  const [farmFilter, setFarmFilter] = useState<string>('ALL');
  const [parcelFilter, setParcelFilter] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

  const farms = useLiveQuery(() => listFarms(), []);
  const parcels = useLiveQuery(() => listParcels(), []);
  const tasks = useLiveQuery(() => listTasks(), []);
  const auto = useAutoCoach();
  const [recalculating, setRecalculating] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [postponeTarget, setPostponeTarget] = useState<Task | undefined>(undefined);
  const [logOpen, setLogOpen] = useState(false);
  const [completingTask, setCompletingTask] = useState<Task | undefined>(undefined);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeWizard, setActiveWizard] = useState<CoachWizard | undefined>(undefined);
  const [wizardTask, setWizardTask] = useState<Task | undefined>(undefined);

  const onRecalculate = async () => {
    setRecalculating(true);
    try {
      markCoachStale();
      await evaluateCoach();
    } finally {
      setRecalculating(false);
    }
  };

  const range = useMemo(() => {
    if (view === 'MONTH') {
      const monthStart = startOfMonth(cursor);
      const monthEnd = endOfMonth(cursor);
      const gridStart = startOfWeekMon(monthStart);
      const gridEnd = addDays(startOfWeekMon(monthEnd), 6);
      return { from: gridStart, to: gridEnd, monthStart, monthEnd };
    }
    const weekStart = startOfWeekMon(cursor);
    return {
      from: weekStart,
      to: addDays(weekStart, 6),
      monthStart: startOfMonth(cursor),
      monthEnd: endOfMonth(cursor),
    };
  }, [view, cursor]);

  const logEntries = useLiveQuery(
    () =>
      listFieldLogEntries({
        dateFrom: range.from,
        dateTo: addDays(range.to, 1),
      }),
    [range.from.getTime(), range.to.getTime()],
  );

  const parcelsByFarm = useMemo(() => {
    if (farmFilter === 'ALL') return parcels ?? [];
    return (parcels ?? []).filter((p) => p.farmId === farmFilter);
  }, [parcels, farmFilter]);

  const parcelMap = useMemo(() => {
    const m = new Map<string, Parcel>();
    (parcels ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [parcels]);

  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    (tasks ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  const allowedParcelIds = useMemo(() => {
    if (parcelFilter !== 'ALL') return new Set([parcelFilter]);
    if (farmFilter !== 'ALL') {
      return new Set(parcelsByFarm.map((p) => p.id));
    }
    return undefined;
  }, [parcelFilter, farmFilter, parcelsByFarm]);

  const itemsByDay = useMemo(() => {
    const m = new Map<string, DayItem[]>();
    const pushItem = (date: Date, item: DayItem) => {
      const k = dayKey(date);
      const list = m.get(k);
      if (list) list.push(item);
      else m.set(k, [item]);
    };
    (tasks ?? []).forEach((t) => {
      const when = (t.scheduledFor ?? t.dueDate) as Date | undefined;
      if (!when) return;
      if (when < range.from || when > addDays(range.to, 1)) return;
      if (allowedParcelIds && t.parcelId && !allowedParcelIds.has(t.parcelId)) return;
      if (allowedParcelIds && !t.parcelId) return;
      pushItem(when, {
        kind: 'task',
        id: t.id,
        title: t.title,
        parcelId: t.parcelId,
        priority: t.priority,
        type: t.type,
        done: t.status === 'DONE' || t.status === 'DISMISSED',
      });
    });
    (logEntries ?? []).forEach((e) => {
      if (allowedParcelIds && !e.parcelIds.some((p) => allowedParcelIds.has(p))) return;
      pushItem(e.date, {
        kind: 'log',
        id: e.id,
        title: e.title,
        parcelId: e.parcelIds[0],
        type: e.type,
      });
    });
    return m;
  }, [tasks, logEntries, range.from, range.to, allowedParcelIds]);

  const periodLabel =
    view === 'MONTH'
      ? `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
      : `Semana del ${range.from.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
        })} al ${range.to.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`;

  const onPrev = () => {
    const d = new Date(cursor);
    if (view === 'MONTH') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCursor(d);
    setSelectedDay(undefined);
  };
  const onNext = () => {
    const d = new Date(cursor);
    if (view === 'MONTH') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCursor(d);
    setSelectedDay(undefined);
  };
  const onToday = () => {
    setCursor(startOfDay(new Date()));
    setSelectedDay(undefined);
  };

  const openTaskById = async (id: string) => {
    const fresh = (await getTask(id)) ?? taskMap.get(id);
    if (!fresh) return;
    setActiveTask(fresh);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setActiveTask(undefined);
  };

  const onComplete = (t: Task) => {
    setCompletingTask(t);
    setLogOpen(true);
    closeDetail();
  };

  const onAskPostpone = (t: Task) => {
    setPostponeTarget(t);
    setPostponeOpen(true);
    closeDetail();
  };

  const onConfirmPostpone = async (date: Date, reason?: string) => {
    if (!postponeTarget) return;
    await postponeTask(postponeTarget.id, { newScheduledFor: date, reason });
    setPostponeTarget(undefined);
  };

  const onDismiss = async (t: Task) => {
    if (!confirm(`¿Descartar «${t.title}»? No volverá a aparecer para esta parcela.`)) return;
    await dismissTask(t.id);
    closeDetail();
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

  const onShowWizard = (wizard: CoachWizard, t: Task) => {
    setActiveWizard(wizard);
    setWizardTask(t);
    setWizardOpen(true);
    setDetailOpen(false);
  };

  return (
    <PageContainer
      title="Calendario"
      subtitle="Tareas del Coach y operaciones del cuaderno por día."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} aria-label="Anterior">
            ←
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} aria-label="Siguiente">
            →
          </Button>
          <span className="ml-2 text-sm font-medium capitalize text-slate-700">
            {periodLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRecalculate}
            disabled={recalculating || auto.evaluating || (parcels?.length ?? 0) === 0}
          >
            {recalculating || auto.evaluating ? 'Calculando…' : 'Recalcular coach'}
          </Button>
          <Select value={view} onValueChange={(v) => setView(v as View)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTH">Mes</SelectItem>
              <SelectItem value="WEEK">Semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          value={farmFilter}
          onValueChange={(v) => {
            setFarmFilter(v);
            setParcelFilter('ALL');
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Finca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las fincas</SelectItem>
            {(farms ?? []).map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={parcelFilter} onValueChange={setParcelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Parcela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las parcelas</SelectItem>
            {parcelsByFarm.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === 'MONTH' ? (
        <MonthGrid
          gridStart={range.from}
          monthStart={range.monthStart}
          itemsByDay={itemsByDay}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      ) : (
        <WeekList
          weekStart={range.from}
          itemsByDay={itemsByDay}
          parcelMap={parcelMap}
          taskMap={taskMap}
          onTaskClick={(id) => void openTaskById(id)}
        />
      )}

      {view === 'MONTH' && selectedDay && (
        <DayDetails
          day={selectedDay}
          items={itemsByDay.get(dayKey(selectedDay)) ?? []}
          parcelMap={parcelMap}
          taskMap={taskMap}
          onTaskClick={(id) => void openTaskById(id)}
        />
      )}

      {view === 'MONTH' && !selectedDay && (
        <p className="mt-4 text-xs text-slate-500">
          Pulsa un día para ver el detalle de tareas y operaciones.
        </p>
      )}

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
            ? { type: completingTask.type, title: completingTask.title }
            : undefined
        }
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

function MonthGrid({
  gridStart,
  monthStart,
  itemsByDay,
  selectedDay,
  onSelectDay,
}: {
  gridStart: Date;
  monthStart: Date;
  itemsByDay: Map<string, DayItem[]>;
  selectedDay?: Date;
  onSelectDay: (d: Date) => void;
}): JSX.Element {
  const today = startOfDay(new Date());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) cells.push(addDays(gridStart, i));
  return (
    <div>
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-slate-500">
        {WEEKDAY_LABELS.map((l) => (
          <div key={l} className="py-1">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200">
        {cells.map((d) => {
          const inMonth = d.getMonth() === monthStart.getMonth();
          const items = itemsByDay.get(dayKey(d)) ?? [];
          const isToday = sameDay(d, today);
          const isSelected = selectedDay && sameDay(d, selectedDay);
          const taskItems = items.filter((i) => i.kind === 'task');
          const logCount = items.filter((i) => i.kind === 'log').length;
          return (
            <button
              type="button"
              key={dayKey(d)}
              onClick={() => onSelectDay(d)}
              className={[
                'flex min-h-[68px] flex-col items-stretch gap-1 bg-white p-1.5 text-left transition',
                inMonth ? 'text-slate-900' : 'text-slate-400',
                isSelected ? 'ring-2 ring-brand-500' : 'hover:bg-brand-50',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                  isToday ? 'bg-brand-600 text-white' : '',
                ].join(' ')}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {taskItems.slice(0, 4).map((it) => (
                  <span
                    key={it.id}
                    aria-hidden
                    className={[
                      'h-1.5 w-1.5 rounded-full',
                      it.done ? 'bg-slate-300' : PRIORITY_DOT[it.priority ?? 'LOW'],
                    ].join(' ')}
                  />
                ))}
                {taskItems.length > 4 && (
                  <span className="text-[10px] text-slate-500">
                    +{taskItems.length - 4}
                  </span>
                )}
              </div>
              {logCount > 0 && (
                <span className="text-[10px] text-emerald-700">{logCount} ✎</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        <Legend dotClass="bg-red-500" label="Urgente" />
        <Legend dotClass="bg-orange-500" label="Alta" />
        <Legend dotClass="bg-amber-500" label="Media" />
        <Legend dotClass="bg-slate-400" label="Baja" />
        <span className="text-emerald-700">✎ operación cuaderno</span>
      </div>
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}

function WeekList({
  weekStart,
  itemsByDay,
  parcelMap,
  taskMap,
  onTaskClick,
}: {
  weekStart: Date;
  itemsByDay: Map<string, DayItem[]>;
  parcelMap: Map<string, Parcel>;
  taskMap: Map<string, Task>;
  onTaskClick: (id: string) => void;
}): JSX.Element {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="grid gap-2">
      {days.map((d) => {
        const items = itemsByDay.get(dayKey(d)) ?? [];
        const isToday = sameDay(d, today);
        return (
          <Card key={dayKey(d)} className={isToday ? 'border-brand-400' : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">
                {d.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                })}
                {isToday && <span className="ml-2 text-xs text-brand-600">hoy</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {items.length === 0 ? (
                <p className="text-xs text-slate-500">Sin elementos.</p>
              ) : (
                <DayItemsList
                  items={items}
                  parcelMap={parcelMap}
                  taskMap={taskMap}
                  onTaskClick={onTaskClick}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DayDetails({
  day,
  items,
  parcelMap,
  taskMap,
  onTaskClick,
}: {
  day: Date;
  items: DayItem[];
  parcelMap: Map<string, Parcel>;
  taskMap: Map<string, Task>;
  onTaskClick: (id: string) => void;
}): JSX.Element {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm capitalize">
          {day.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin tareas ni operaciones.</p>
        ) : (
          <DayItemsList
            items={items}
            parcelMap={parcelMap}
            taskMap={taskMap}
            onTaskClick={onTaskClick}
          />
        )}
      </CardContent>
    </Card>
  );
}

function DayItemsList({
  items,
  parcelMap,
  taskMap,
  onTaskClick,
}: {
  items: DayItem[];
  parcelMap: Map<string, Parcel>;
  taskMap: Map<string, Task>;
  onTaskClick: (id: string) => void;
}): JSX.Element {
  const taskItems = items.filter((i) => i.kind === 'task');
  const logItems = items.filter((i) => i.kind === 'log');
  return (
    <div className="grid gap-1.5">
      {taskItems.map((it) => {
        const t = taskMap.get(it.id);
        if (!t) return null;
        return (
          <TaskListRow
            key={`task-${it.id}`}
            task={t}
            parcel={t.parcelId ? parcelMap.get(t.parcelId) : undefined}
            onClick={() => onTaskClick(it.id)}
          />
        );
      })}
      {logItems.map((it) => {
        const parcel = it.parcelId ? parcelMap.get(it.parcelId) : undefined;
        return (
          <div
            key={`log-${it.id}`}
            className="flex items-start gap-2 rounded-md border border-slate-200 bg-emerald-50/40 p-2 text-xs"
          >
            <span aria-label="Operación cuaderno" className="mt-0.5 text-emerald-700">
              ✎
            </span>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{it.title}</div>
              <div className="text-[11px] text-slate-500">
                {OPERATION_LABELS[it.type as keyof typeof OPERATION_LABELS] ?? it.type}
                {parcel ? ` · ${parcel.name}` : ''}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

