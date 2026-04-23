import { useMemo, useState } from 'react';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildBibliography,
  GLOSSARY,
  LEARN_SHEETS,
  type LearnSheet,
} from '@/lib/learn';
import { COACH_WIZARDS, type CoachWizard } from '@/lib/coach/wizards';
import { CoachWizardDialog } from '@/components/coach/CoachWizardDialog';

const CATEGORY_LABELS: Record<LearnSheet['category'], string> = {
  SUELO: 'Suelo',
  CUBIERTAS: 'Cubiertas',
  PLAGAS: 'Plagas',
  TRANSICION: 'Transición',
  AGUA: 'Agua',
  BIODIVERSIDAD: 'Biodiversidad',
};

const CATEGORY_CLASS: Record<LearnSheet['category'], string> = {
  SUELO: 'bg-amber-100 text-amber-800',
  CUBIERTAS: 'bg-green-100 text-green-800',
  PLAGAS: 'bg-red-100 text-red-800',
  TRANSICION: 'bg-sky-100 text-sky-800',
  AGUA: 'bg-blue-100 text-blue-800',
  BIODIVERSIDAD: 'bg-violet-100 text-violet-800',
};

export function LearnPage(): JSX.Element {
  const [sheetQuery, setSheetQuery] = useState('');
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [openSheet, setOpenSheet] = useState<LearnSheet | undefined>(undefined);
  const [activeWizard, setActiveWizard] = useState<CoachWizard | undefined>(undefined);

  const filteredSheets = useMemo(() => {
    const q = sheetQuery.trim().toLowerCase();
    if (!q) return LEARN_SHEETS;
    return LEARN_SHEETS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        CATEGORY_LABELS[s.category].toLowerCase().includes(q),
    );
  }, [sheetQuery]);

  const filteredGlossary = useMemo(() => {
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q),
    );
  }, [glossaryQuery]);

  const bibliography = useMemo(() => buildBibliography(), []);
  const wizardList = useMemo(() => Object.values(COACH_WIZARDS), []);

  return (
    <PageContainer
      title="Aprender"
      subtitle="Fichas, glosario, wizards operativos y bibliografía. Material de consulta sin conexión."
    >
      <Tabs defaultValue="fichas">
        <TabsList className="flex-wrap">
          <TabsTrigger value="fichas">Fichas ({LEARN_SHEETS.length})</TabsTrigger>
          <TabsTrigger value="wizards">Wizards ({wizardList.length})</TabsTrigger>
          <TabsTrigger value="glosario">Glosario ({GLOSSARY.length})</TabsTrigger>
          <TabsTrigger value="bibliografia">Bibliografía</TabsTrigger>
        </TabsList>

        <TabsContent value="fichas" className="grid gap-3">
          <Input
            placeholder="Buscar fichas por título, contenido o categoría…"
            value={sheetQuery}
            onChange={(e) => setSheetQuery(e.target.value)}
          />
          {filteredSheets.length === 0 && (
            <Card>
              <CardContent className="py-4 text-sm text-slate-600">
                Sin resultados.
              </CardContent>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredSheets.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => setOpenSheet(s)}
                className="text-left"
              >
                <Card className="h-full transition hover:border-brand-400">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_CLASS[s.category]}`}
                      >
                        {CATEGORY_LABELS[s.category]}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-slate-700">
                    {s.summary}
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="wizards" className="grid gap-3 sm:grid-cols-2">
          {wizardList.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setActiveWizard(w)}
              className="text-left"
            >
              <Card className="h-full transition hover:border-brand-400">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{w.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-slate-700">
                  {w.subtitle}
                </CardContent>
              </Card>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="glosario" className="grid gap-3">
          <Input
            placeholder="Buscar término…"
            value={glossaryQuery}
            onChange={(e) => setGlossaryQuery(e.target.value)}
          />
          {filteredGlossary.length === 0 && (
            <Card>
              <CardContent className="py-4 text-sm text-slate-600">
                Sin resultados.
              </CardContent>
            </Card>
          )}
          <dl className="grid gap-2">
            {filteredGlossary.map((g) => (
              <div
                key={g.term}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <dt className="text-sm font-semibold text-slate-900">{g.term}</dt>
                <dd className="mt-1 text-sm text-slate-700">{g.definition}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>

        <TabsContent value="bibliografia" className="grid gap-2">
          <p className="text-xs text-slate-500">
            Fuentes citadas por reglas, fichas y wizards. Generado automáticamente.
          </p>
          <ul className="grid gap-2">
            {bibliography.map((b) => (
              <li
                key={b.citation}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <p className="text-sm text-slate-800">{b.citation}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Citado en: {b.sources.join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      {openSheet && (
        <SheetDialog sheet={openSheet} onClose={() => setOpenSheet(undefined)} />
      )}

      {activeWizard && (
        <CoachWizardDialog
          open={Boolean(activeWizard)}
          onOpenChange={(open) => {
            if (!open) setActiveWizard(undefined);
          }}
          wizard={activeWizard}
        />
      )}
    </PageContainer>
  );
}

function SheetDialog({
  sheet,
  onClose,
}: {
  sheet: LearnSheet;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{sheet.title}</h2>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_CLASS[sheet.category]}`}
            >
              {CATEGORY_LABELS[sheet.category]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-700">{sheet.summary}</p>
        <div className="mt-4 grid gap-3">
          {sheet.body.map((b, i) => (
            <section
              key={i}
              className="rounded-md border border-slate-200 bg-white p-3"
            >
              <h3 className="text-sm font-semibold text-slate-900">{b.heading}</h3>
              <p className="mt-1 text-sm text-slate-700">{b.text}</p>
            </section>
          ))}
        </div>
        {sheet.references.length > 0 && (
          <section className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Referencias
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {sheet.references.map((r, i) => (
                <li key={i}>· {r}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
