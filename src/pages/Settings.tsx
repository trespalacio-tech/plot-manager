import { PageContainer } from '@/components/PageContainer';
import { APP_VERSION } from '@/lib/version';

export function SettingsPage(): JSX.Element {
  return (
    <PageContainer title="Ajustes" subtitle="Privacidad, copia de seguridad y acerca de.">
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm text-slate-700">
        <dt className="font-medium text-slate-900">Versión</dt>
        <dd>{APP_VERSION}</dd>
        <dt className="font-medium text-slate-900">Almacenamiento</dt>
        <dd>IndexedDB local — tus datos nunca salen de este dispositivo.</dd>
        <dt className="font-medium text-slate-900">Sincronización</dt>
        <dd>
          Manual mediante exportar/importar JSON. Sin servidor, sin cuentas, sin
          telemetría.
        </dd>
      </dl>
    </PageContainer>
  );
}
