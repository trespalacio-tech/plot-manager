import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CoachWizard } from '@/lib/coach/wizards';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wizard: CoachWizard;
  onMarkDone?: () => void;
}

export function CoachWizardDialog({
  open,
  onOpenChange,
  wizard,
  onMarkDone,
}: Props): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{wizard.title}</DialogTitle>
          <DialogDescription>{wizard.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {wizard.durationLabel && (
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-600">Duración estimada:</span>{' '}
              {wizard.durationLabel}
            </p>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Materiales
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {wizard.materials.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </section>

          {wizard.safety.length > 0 && (
            <section className="rounded-md border border-amber-300 bg-amber-50 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Seguridad
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {wizard.safety.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Pasos
            </h3>
            <ol className="mt-2 grid gap-3">
              {wizard.steps.map((step, i) => (
                <li
                  key={i}
                  className="rounded-md border border-slate-200 bg-white p-3"
                >
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-700">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {wizard.references.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Referencias
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {wizard.references.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {onMarkDone && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onMarkDone();
              }}
            >
              Ya lo hice
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
