import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getNotificationPrefs,
  notificationPermission,
  requestNotificationPermission,
  setNotificationPrefs,
} from '@/lib/coach/notifications';
import { useInstallPrompt } from '@/lib/pwa/useInstallPrompt';
import { isInstallHintDismissed } from '@/lib/pwa/install';

interface Props {
  hasUrgent: boolean;
}

export function NotificationsBanner({ hasUrgent }: Props): JSX.Element | null {
  const initialPrefs = getNotificationPrefs();
  const initialPerm = notificationPermission();
  const [perm, setPerm] = useState(initialPerm);
  const [dismissed, setDismissed] = useState(initialPrefs.dismissedBanner);
  const [busy, setBusy] = useState(false);

  // Cede paso al InstallBanner si éste se va a mostrar: no apilamos
  // dos avisos a la vez en Hoy. Aparecemos cuando install ya esté
  // resuelto (instalada, descartado o no aplica).
  const install = useInstallPrompt();
  const installBannerVisible =
    !install.installed &&
    (install.canPrompt || install.platform.isIOS) &&
    !isInstallHintDismissed();

  if (installBannerVisible) return null;
  if (!hasUrgent) return null;
  if (dismissed) return null;
  if (perm === 'unsupported' || perm === 'denied' || perm === 'granted') return null;

  const onEnable = async () => {
    setBusy(true);
    try {
      const result = await requestNotificationPermission();
      setPerm(result);
      if (result === 'granted') {
        setNotificationPrefs({ enabled: true, dismissedBanner: true });
      }
      setDismissed(true);
    } finally {
      setBusy(false);
    }
  };

  const onDismiss = () => {
    setNotificationPrefs({ dismissedBanner: true });
    setDismissed(true);
  };

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm">
      <span className="text-sky-900">
        Activa las notificaciones para que el Coach te avise de tareas atrasadas y de hoy
        aunque cierres la app.
      </span>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void onEnable()} disabled={busy}>
          {busy ? 'Activando…' : 'Activar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={busy}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}
