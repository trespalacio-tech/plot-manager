import { useEffect, useState } from 'react';
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
import type { Parcel, Task } from '@/lib/db/types';
import { OPERATION_LABELS } from '@/lib/notebook/templates';
import {
  describeUrgency,
  taskUrgency,
  URGENCY_BADGE_CLASS,
  URGENCY_LABEL,
} from '@/lib/coach/urgency';
import {
  COACH_WIZARDS,
  getWizard,
  wizardKeyForType,
  type CoachWizard,
} from '@/lib/coach/wizards';

const PRIORITY_LABEL = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
} as const;

const PRIORITY_CLASS = {
  URGENT: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-slate-100 text-slate-700',
} as const;

const STATUS_LABEL = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  POSTPONED: 'Pospuesta',
  DONE: 'Hecha',
  DISMISSED: 'Descartada',
} as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  parcel?: Parcel;
  onComplete: (task: Task) => void;
  onPostpone: (task: Task) => void;
  onDismiss: (task: Task) => void;
  onReopen: (task: Task) => void;
  onMarkInProgress: (task: Task) => void;
  onReschedule: (task: Task, newScheduledFor: Date) => Promise<void> | void;
  onShowWizard: (wizard: CoachWizard, task: Task) => void;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function wizardForTask(task: Task): CoachWizard | undefined {
  if (task.guidanceKey) {
    const w = getWizard(task.guidanceKey);
    if (w) return w;
  }
  const fallback = wizardKeyForType(task.type);
  return fallback ? COACH_WIZARDS[fallback] : undefined;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  parcel,
  onComplete,
  onPostpone,
  onDismiss,
  onReopen,
  onMarkInProgress,
  onReschedule,
  onShowWizard,
}: Props): JSX.Element | null {
  const [iso, setIso] = useState<string>('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (task?.scheduledFor) setIso(toIsoDate(task.scheduledFor));
    else if (task?.dueDate) setIso(toIsoDate(task.dueDate));
    else setIso(toIsoDate(new Date()));
  }, [task?.id, task?.scheduledFor, task?.dueDate]);

  if (!task) return null;

  const urgency = taskUrgency(task);
  const description = describeUrgency(task);
  const wizard = wizardForTask(task);
  const isFinal = task.status === 'DONE' || task.status === 'DISMISSED';

  const onSaveDate = async () => {
    if (!iso) return;
    setRescheduling(true);
    try {
      await onReschedule(task, fromIsoDate(iso));
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">{task.title}</DialogTitle>
          <DialogDescription>
            {parcel?.name ?? 'Sin parcela'} · {OPERATION_LABELS[task.type]}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE_CLASS[urgency]}`}
            >
              {URGENCY_LABEL[urgency]} · {description.label}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[task.priority]}`}
            >
              {PRIORITY_LABEL[task.priority]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {STATUS_LABEL[task.status]}
            </span>
          </div>

          <p className="text-sm text-slate-700">{task.rationale}</p>

          {task.scientificBasis && (
            <details className="rounded-md border border-slate-200 bg-slate-50 p-2">
              <summary className="cursor-pointer text-xs font-medium text-brand-700">
                Base científica
              </summary>
              <p className="mt-1 text-xs text-slate-700">{task.scientificBasis}</p>
            </details>
          )}

          {task.postponeReason && (
            <p className="rounded-md bg-amber-50 p-2 text-xs text-slate-700">
              <strong>Pospuesta:</strong> {task.postponeReason}
            </p>
          )}

          {!isFinal && (
            <div className="grid gap-1.5 rounded-md border border-slate-200 p-2">
              <Label htmlFor="reschedule-date" className="text-xs">
                Reprogramar
              </Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="reschedule-date"
                  type="date"
                  value={iso}
                  onChange={(e) => setIso(e.target.value)}
                  className="max-w-[180px]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  disabled={rescheduling || !iso}
                  onClick={() => void onSaveDate()}
                >
                  {rescheduling ? 'Guardando…' : 'Mover a esta fecha'}
                </Button>
              </div>
              {task.dueDate && (
                <p className="text-[11px] text-slate-500">
                  Ventana cierra el{' '}
                  {task.dueDate.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  .
                </p>
              )}
            </div>
          )}

          {wizard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowWizard(wizard, task)}
            >
              Cómo hacerlo paso a paso
            </Button>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          {isFinal ? (
            <Button type="button" onClick={() => onReopen(task)}>
              Reabrir
            </Button>
          ) : (
            <>
              {task.status !== 'IN_PROGRESS' && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => onMarkInProgress(task)}
                >
                  Marcar en curso
                </Button>
              )}
              <Button
                variant="ghost"
                type="button"
                onClick={() => onDismiss(task)}
              >
                Descartar
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => onPostpone(task)}
              >
                Posponer…
              </Button>
              <Button type="button" onClick={() => onComplete(task)}>
                Hecho
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
