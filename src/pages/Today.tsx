import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import { getDb } from '@/lib/db';

export function TodayPage(): JSX.Element {
  const farmCount = useLiveQuery(() => getDb().farms.count(), []);
  const parcelCount = useLiveQuery(() => getDb().parcels.count(), []);

  if (farmCount === 0) {
    return (
      <PageContainer
        title="Bienvenido a Fincas"
        subtitle="Gestión regenerativa de frutales y viñedo, local y sin servidor."
      >
        <section className="rounded-lg border border-dashed border-brand-300 bg-brand-50 p-6">
          <h2 className="text-lg font-semibold text-brand-700">
            Empezamos por tu primera finca
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Crea una finca con nombre y municipio. Después podrás añadir parcelas y
            elegir su estado (diseño, transición o régimen regenerativo). En cuanto
            la app conozca tu cultivo, el Coach te propondrá qué hacer cada día con
            su justificación agronómica.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/parcelas">Crear mi primera finca</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="¿Qué hago hoy?" subtitle="Tu Coach de campo.">
      <section className="rounded-lg border border-dashed border-brand-300 bg-brand-50 p-6 text-sm text-slate-700">
        <p className="font-medium text-brand-700">
          Todavía no hay tareas propuestas.
        </p>
        <p className="mt-2">
          Tienes {farmCount ?? '…'} finca{(farmCount ?? 0) === 1 ? '' : 's'} y{' '}
          {parcelCount ?? '…'} parcela{(parcelCount ?? 0) === 1 ? '' : 's'}. A partir
          del Sprint 5, el motor de reglas y los playbooks regionales empezarán a
          sugerir tareas aquí mismo, con su base científica.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/parcelas">Ir a parcelas</Link>
          </Button>
        </div>
      </section>
    </PageContainer>
  );
}
