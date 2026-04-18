import { PageContainer } from '@/components/PageContainer';

export function TodayPage(): JSX.Element {
  return (
    <PageContainer title="¿Qué hago hoy?" subtitle="Tu Coach de campo.">
      <section className="rounded-lg border border-dashed border-brand-300 bg-brand-50 p-6 text-sm text-slate-700">
        <p className="font-medium text-brand-700">Todavía no hay tareas.</p>
        <p className="mt-2">
          Crea tu primera finca y parcela desde la pestaña <strong>Parcelas</strong>. En
          cuanto la app conozca tu cultivo y estado, el motor de reglas te propondrá
          tareas con su justificación agronómica.
        </p>
      </section>
    </PageContainer>
  );
}
