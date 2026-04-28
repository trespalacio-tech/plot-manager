import type { Parcel, Task } from '@/lib/db/types';
import { OPERATION_LABELS } from '@/lib/notebook/templates';
import {
  describeUrgency,
  taskUrgency,
  URGENCY_BADGE_CLASS,
} from '@/lib/coach/urgency';

const PRIORITY_DOT = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-slate-400',
} as const;

interface Props {
  task: Task;
  parcel?: Parcel;
  onClick: (task: Task) => void;
  showUrgency?: boolean;
}

export function TaskListRow({
  task,
  parcel,
  onClick,
  showUrgency = true,
}: Props): JSX.Element {
  const urgency = taskUrgency(task);
  const description = describeUrgency(task);
  const isFinal = task.status === 'DONE' || task.status === 'DISMISSED';
  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className="flex w-full items-start gap-2 rounded-md border border-slate-200 bg-white p-2 text-left text-sm shadow-sm transition hover:bg-brand-50/40 hover:shadow"
    >
      <span
        aria-hidden
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
          isFinal ? 'bg-slate-300' : PRIORITY_DOT[task.priority]
        }`}
      />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={[
              'font-medium',
              isFinal ? 'text-slate-500 line-through' : 'text-slate-900',
            ].join(' ')}
          >
            {task.title}
          </span>
          {showUrgency && !isFinal && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${URGENCY_BADGE_CLASS[urgency]}`}
            >
              {description.label}
            </span>
          )}
          {task.status === 'IN_PROGRESS' && (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
              En curso
            </span>
          )}
          {task.status === 'POSTPONED' && (
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
              Pospuesta
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          {OPERATION_LABELS[task.type]}
          {parcel ? ` · ${parcel.name}` : ' · sin parcela'}
        </div>
      </div>
    </button>
  );
}
