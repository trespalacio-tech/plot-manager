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
import { DIAGNOSE_TREE } from '@/lib/diagnose';
import type {
  DiagnoseConfidence,
  DiagnoseHypothesis,
  DiagnoseQuestion,
} from '@/lib/diagnose/types';
import { getInput } from '@/lib/catalogs';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnnotate?: (hypothesis: DiagnoseHypothesis) => void;
}

interface HistoryEntry {
  questionId: string;
  optionLabel: string;
}

const CONFIDENCE_LABEL: Record<DiagnoseConfidence, string> = {
  LOW: 'Confianza baja',
  MEDIUM: 'Confianza media',
  HIGH: 'Confianza alta',
};

const CONFIDENCE_CLASS: Record<DiagnoseConfidence, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-green-100 text-green-800',
};

export function DiagnoseWizardDialog({
  open,
  onOpenChange,
  onAnnotate,
}: Props): JSX.Element {
  const [currentNode, setCurrentNode] = useState<string>(DIAGNOSE_TREE.rootNodeId);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hypothesisId, setHypothesisId] = useState<string | undefined>(undefined);

  const reset = () => {
    setCurrentNode(DIAGNOSE_TREE.rootNodeId);
    setHistory([]);
    setHypothesisId(undefined);
  };

  const onClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const goBack = () => {
    if (hypothesisId) {
      setHypothesisId(undefined);
      return;
    }
    if (history.length === 0) return;
    const previous = history.slice(0, -1);
    setHistory(previous);
    const lastNode = previous.length === 0
      ? DIAGNOSE_TREE.rootNodeId
      : findNodeAfter(previous);
    setCurrentNode(lastNode);
  };

  const question: DiagnoseQuestion | undefined = hypothesisId
    ? undefined
    : DIAGNOSE_TREE.questions[currentNode];

  const hypothesis: DiagnoseHypothesis | undefined = hypothesisId
    ? DIAGNOSE_TREE.hypotheses[hypothesisId]
    : undefined;

  const inputDetails = useMemo(() => {
    if (!hypothesis?.inputIds) return [];
    return hypothesis.inputIds
      .map((id) => getInput(id))
      .filter((i): i is NonNullable<typeof i> => Boolean(i));
  }, [hypothesis]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Veo algo raro</DialogTitle>
          <DialogDescription>
            Diagnóstico guiado. La app no prescribe: orienta y recuerda los límites de la
            herramienta. Si la confianza es baja, consulta a un técnico antes de actuar.
          </DialogDescription>
        </DialogHeader>

        {history.length > 0 && (
          <ol className="grid gap-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {history.map((h, i) => (
              <li key={`${h.questionId}-${i}`}>
                <span className="font-medium text-slate-700">{i + 1}.</span> {h.optionLabel}
              </li>
            ))}
          </ol>
        )}

        {question && (
          <div className="grid gap-3">
            <p className="text-base font-medium text-slate-900">{question.prompt}</p>
            {question.hint && (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-2 text-xs text-slate-600">
                {question.hint}
              </p>
            )}
            <div className="grid gap-2">
              {question.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setHistory((prev) => [
                      ...prev,
                      { questionId: question.id, optionLabel: opt.label },
                    ]);
                    if (opt.hypothesisId) {
                      setHypothesisId(opt.hypothesisId);
                    } else if (opt.nextNode) {
                      setCurrentNode(opt.nextNode);
                    }
                  }}
                  className="rounded-md border border-slate-200 bg-white p-3 text-left text-sm text-slate-800 transition hover:border-brand-400 hover:bg-brand-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {hypothesis && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {hypothesis.title}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_CLASS[hypothesis.confidence]}`}
              >
                {CONFIDENCE_LABEL[hypothesis.confidence]}
              </span>
            </div>
            <p className="text-sm text-slate-700">{hypothesis.description}</p>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monitoreo recomendado
              </h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {hypothesis.monitoring.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Opciones de manejo (lista blanca ecológica)
              </h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {hypothesis.managementOptions.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>

            {inputDetails.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Insumos del catálogo
                </h4>
                <ul className="mt-1 grid gap-1 text-sm text-slate-700">
                  {inputDetails.map((inp) => (
                    <li
                      key={inp.id}
                      className="rounded border border-slate-200 bg-white p-2"
                    >
                      <span className="font-medium">{inp.name}</span>
                      {inp.restrictions && (
                        <span className="block text-xs text-slate-500">
                          Restricciones: {inp.restrictions}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hypothesis.whenToConsultExpert && (
              <section className="rounded-md border border-amber-300 bg-amber-50 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Cuándo consultar a un técnico
                </h4>
                <p className="mt-1 text-sm text-amber-900">
                  {hypothesis.whenToConsultExpert}
                </p>
              </section>
            )}

            {hypothesis.references && hypothesis.references.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Referencias
                </h4>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {hypothesis.references.map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <DialogFooter className="flex-wrap">
          <Button variant="ghost" onClick={() => onClose(false)}>
            Cerrar
          </Button>
          {(history.length > 0 || hypothesis) && (
            <Button variant="outline" onClick={goBack}>
              Atrás
            </Button>
          )}
          {hypothesis && (
            <Button variant="outline" onClick={reset}>
              Empezar de nuevo
            </Button>
          )}
          {hypothesis && onAnnotate && (
            <Button
              onClick={() => {
                onAnnotate(hypothesis);
                onClose(false);
              }}
            >
              Anotar observación
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function findNodeAfter(history: HistoryEntry[]): string {
  // Reproduce la cadena para saber qué node corresponde a la última pregunta visitada
  let node = DIAGNOSE_TREE.rootNodeId;
  for (let i = 0; i < history.length; i += 1) {
    const q = DIAGNOSE_TREE.questions[node];
    if (!q) break;
    const chosen = q.options.find((o) => o.label === history[i]!.optionLabel);
    if (!chosen?.nextNode) break;
    node = chosen.nextNode;
  }
  return node;
}
