import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt';
import { dismissInstallHint, isInstallHintDismissed } from '@/lib/pwa/install';

export function InstallBanner(): JSX.Element | null {
  const { canPrompt, installed, platform, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState<boolean>(() => isInstallHintDismissed());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDismissed(isInstallHintDismissed());
  }, []);

  if (installed || dismissed) return null;
  // Solo mostrar si podemos disparar el prompt (Android/Chrome) o si es iOS Safari.
  if (!canPrompt && !platform.isIOS) return null;

  const onInstall = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted' || outcome === 'dismissed') {
        dismissInstallHint();
        setDismissed(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = () => {
    dismissInstallHint();
    setDismissed(true);
  };

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
      <span className="text-emerald-900">
        Instala Fincas como app: arranca rápido y permite avisos del Coach en segundo
        plano.
      </span>
      <div className="flex gap-2">
        {canPrompt ? (
          <Button size="sm" onClick={() => void onInstall()} disabled={busy}>
            {busy ? 'Instalando…' : 'Instalar'}
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to="/ajustes">Cómo instalar</Link>
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={busy}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}
