import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt';

export function InstallCard(): JSX.Element | null {
  const { canPrompt, installed, platform, promptInstall } = useInstallPrompt();
  const [feedback, setFeedback] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  if (installed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instalación</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-emerald-700">
          La app está instalada en este dispositivo. Ábrela como cualquier otra desde el
          icono de Fincas.
        </CardContent>
      </Card>
    );
  }

  const onInstall = async () => {
    setBusy(true);
    setFeedback(undefined);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') setFeedback('Instalación aceptada.');
      else if (outcome === 'dismissed') setFeedback('Instalación cancelada.');
      else setFeedback('El navegador no ofreció el diálogo de instalación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instalar la app</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-700">
        <p>
          Instalada en pantalla de inicio funciona como una app: arranca rápido, ocupa
          poco y permite notificaciones en segundo plano cuando el navegador lo soporta.
          Tus datos siguen siendo locales.
        </p>

        {canPrompt && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onInstall()} disabled={busy}>
              {busy ? 'Instalando…' : 'Instalar Fincas'}
            </Button>
          </div>
        )}

        {!canPrompt && platform.isIOS && <IOSInstructions />}

        {!canPrompt && platform.isAndroid && (
          <p className="text-xs text-slate-500">
            Si no ves el botón, abre el menú del navegador (los tres puntos) y elige{' '}
            <strong>Instalar app</strong> o <strong>Añadir a pantalla de inicio</strong>.
            En Chrome a veces tarda unos segundos en estar disponible tras abrir la web.
          </p>
        )}

        {!canPrompt && !platform.isIOS && !platform.isAndroid && (
          <p className="text-xs text-slate-500">
            En navegador de escritorio busca el icono de instalación a la derecha de la
            barra de direcciones, o usa el menú del navegador →{' '}
            <strong>Instalar Fincas</strong>.
          </p>
        )}

        {feedback && <p className="text-xs text-slate-500">{feedback}</p>}
      </CardContent>
    </Card>
  );
}

function IOSInstructions(): JSX.Element {
  return (
    <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
      <p className="font-medium">Instalar en iPhone / iPad</p>
      <ol className="mt-1 ml-4 list-decimal space-y-0.5">
        <li>
          Asegúrate de estar en <strong>Safari</strong> (no Chrome ni Firefox: en iOS
          solo Safari puede instalar PWAs).
        </li>
        <li>
          Pulsa el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba) en
          la barra inferior.
        </li>
        <li>
          Desplázate y elige <strong>Añadir a pantalla de inicio</strong>.
        </li>
        <li>Confirma el nombre y pulsa Añadir.</li>
      </ol>
    </div>
  );
}
