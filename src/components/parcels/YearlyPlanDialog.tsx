import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Farm, Parcel, TaskPriority } from '@/lib/db/types';
import { OPERATION_LABELS } from '@/lib/notebook/templates';
import { openNotebookPdf } from '@/lib/notebook/pdf';
import { buildYearlyPlan, type YearlyPlanItem } from '@/lib/playbooks/yearlyPlan';
import { buildYearlyPlanHtml } from '@/lib/playbooks/yearlyPlanPdf';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: Parcel;
  farm: Farm;
}

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
  LOW: 'bg-stone-100 text-stone-700',
};

function yearOptions(currentYear: number): number[] {
  return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function YearlyPlanDialog({
  open,
  onOpenChange,
  parcel,
  farm,
}: Props): JSX.Element {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);

  const plan = useMemo(() => buildYearlyPlan(parcel, year), [parcel, year]);

  const onExport = () => {
    const html = buildYearlyPlanHtml(plan, parcel, farm);
    openNotebookPdf(html);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Plan anual de {parcel.name}</DialogTitle>
          <DialogDescription>
            Calendario completo de tareas propuestas por los playbooks aplicables a
            esta parcela. Las ventanas DOY son orientativas para Burgos; ajústalas
            a la fenología real de tu parcela.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-600">Año:</span>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions(thisYear).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-stone-500">
              {plan.items.length} tareas · {new Set(plan.items.map((i) => i.playbookId)).size} playbooks
            </span>
          </div>
          <Button size="sm" onClick={onExport} disabled={plan.items.length === 0}>
            Exportar PDF
          </Button>
        </div>

        {plan.items.length === 0 ? (
          <div className="rounded-md border border-stone-200 bg-bone-100 p-4 text-sm text-stone-700">
            Esta parcela no tiene playbooks aplicables aún. Revisa que el{' '}
            <strong>cultivo</strong>, la <strong>especie principal</strong> (si
            es frutos secos) y el <strong>estado</strong> coincidan con algún
            playbook disponible.
          </div>
        ) : (
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
            {plan.byMonth.map((m) =>
              m.items.length === 0 ? null : (
                <section key={m.month} className="grid gap-1.5">
                  <h3 className="rounded-md border-l-4 border-brand-500 bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">
                    {m.monthLabel}
                    <span className="ml-2 text-xs font-normal text-stone-500">
                      {m.items.length}
                    </span>
                  </h3>
                  <ul className="grid gap-1.5">
                    {m.items.map((it) => (
                      <PlanItemRow key={it.id} item={it} />
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={onExport} disabled={plan.items.length === 0}>
            Exportar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanItemRow({ item }: { item: YearlyPlanItem }): JSX.Element {
  return (
    <li className="rounded-md border border-stone-200 bg-white p-2.5 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tabular-nums text-stone-500">
            {formatDay(item.startDate)} → {formatDay(item.endDate)}
            {item.wrapsYear && <span className="ml-0.5 text-amber-700">*</span>}
          </span>
          <span className="font-medium text-stone-900">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_CLASS[item.priority]}`}
          >
            {PRIORITY_LABEL[item.priority]}
          </span>
          <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-700">
            {OPERATION_LABELS[item.type] ?? item.type}
          </span>
        </div>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-stone-700">
        {item.rationale}
      </p>
      <p className="mt-0.5 text-[11px] italic text-stone-500">
        {item.scientificBasis}
      </p>
      <p className="mt-0.5 text-[10px] text-stone-400">{item.playbookTitle}</p>
    </li>
  );
}
