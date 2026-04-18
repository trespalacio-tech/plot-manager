import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FarmDialog } from '@/components/farms/FarmDialog';
import { getDb } from '@/lib/db';

export function ParcelsPage(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const farms = useLiveQuery(() => getDb().farms.orderBy('name').toArray(), []);
  const parcelsByFarm = useLiveQuery(async () => {
    const all = await getDb().parcels.toArray();
    return all.reduce<Record<string, number>>((acc, p) => {
      acc[p.farmId] = (acc[p.farmId] ?? 0) + 1;
      return acc;
    }, {});
  }, []);

  const empty = farms !== undefined && farms.length === 0;

  return (
    <PageContainer
      title="Parcelas"
      subtitle="Tus fincas y parcelas. Local, sin cuentas, sin servidor."
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {farms === undefined
            ? 'Cargando…'
            : `${farms.length} finca${farms.length === 1 ? '' : 's'}`}
        </p>
        <Button onClick={() => setDialogOpen(true)}>Nueva finca</Button>
      </div>

      {empty && <Onboarding onCreate={() => setDialogOpen(true)} />}

      {!empty && farms && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {farms.map((farm) => (
            <li key={farm.id}>
              <Link to={`/parcelas/${farm.id}`} className="block">
                <Card className="transition hover:border-brand-300 hover:shadow-sm">
                  <CardHeader>
                    <CardTitle>{farm.name}</CardTitle>
                    <CardDescription>
                      {[farm.municipality, farm.province].filter(Boolean).join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600">
                    {parcelsByFarm?.[farm.id] ?? 0} parcela
                    {(parcelsByFarm?.[farm.id] ?? 0) === 1 ? '' : 's'}
                    {farm.altitudeM != null && ` · ${farm.altitudeM} m`}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <FarmDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </PageContainer>
  );
}

function Onboarding({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-lg border border-dashed border-brand-300 bg-brand-50 p-6">
      <h2 className="text-lg font-semibold text-brand-700">
        Vamos a crear tu primera finca
      </h2>
      <p className="mt-2 text-sm text-slate-700">
        Una finca es la unidad de gestión (por ejemplo, «Finca La Nava»). Después
        añadirás parcelas dentro, con su cultivo, estado (diseño / transición /
        régimen regenerativo) y, si quieres, su polígono dibujado en el mapa.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Crea la finca con nombre, municipio y provincia (Burgos por defecto).</li>
        <li>Añade tus parcelas desde el detalle de la finca.</li>
        <li>
          En cuanto la app conozca cultivo y estado, el Coach empezará a proponerte
          tareas en la pestaña <strong>Hoy</strong>, citando su base agronómica.
        </li>
      </ol>
      <div className="mt-4">
        <Button onClick={onCreate}>Crear mi primera finca</Button>
      </div>
    </section>
  );
}
