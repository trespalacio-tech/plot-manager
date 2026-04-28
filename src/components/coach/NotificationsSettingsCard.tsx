import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getNotificationPrefs,
  notificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  setNotificationPrefs,
} from '@/lib/coach/notifications';
import {
  periodicSyncStatus,
  requestImmediateCoachCheck,
  tryRegisterPeriodicSync,
  unregisterPeriodicSync,
  type PeriodicSyncStatus,
} from '@/lib/coach/swSync';

type Perm = NotificationPermission | 'unsupported';

function statusLabel(perm: Perm, enabled: boolean): { tone: string; text: string } {
  if (perm === 'unsupported')
    return { tone: 'text-slate-500', text: 'Tu navegador no soporta notificaciones.' };
  if (perm === 'denied')
    return {
      tone: 'text-red-700',
      text: 'Permiso denegado. Cámbialo en los ajustes del navegador para esta app.',
    };
  if (perm === 'default')
    return {
      tone: 'text-amber-700',
      text: 'Aún no has dado permiso al navegador.',
    };
  if (!enabled)
    return {
      tone: 'text-slate-600',
      text: 'Permiso concedido pero las notificaciones están desactivadas.',
    };
  return { tone: 'text-emerald-700', text: 'Activas. Te avisaremos de tareas atrasadas y de hoy.' };
}

function periodicLabel(s: PeriodicSyncStatus | undefined, enabled: boolean): string {
  if (!enabled) return '';
  if (!s) return 'Comprobando soporte de segundo plano…';
  switch (s) {
    case 'unsupported':
      return 'Tu navegador no soporta avisos en segundo plano. Solo recibirás notificaciones mientras la app esté abierta.';
    case 'permission-denied':
      return 'El navegador no permite ejecutar comprobaciones en segundo plano (instala la PWA o concede el permiso para activarlas).';
    case 'permission-prompt':
      return 'Disponible en segundo plano si instalas la app y das permiso al pulsar «Activar segundo plano».';
    case 'registered':
      return 'Comprobación periódica registrada: el Coach revisará cada ~12 h aunque la app esté cerrada.';
    case 'error':
      return 'No se pudo registrar la comprobación en segundo plano. Las notificaciones siguen funcionando con la app abierta.';
  }
}

export function NotificationsSettingsCard(): JSX.Element {
  const [perm, setPerm] = useState<Perm>(() => notificationPermission());
  const [enabled, setEnabled] = useState<boolean>(() => getNotificationPrefs().enabled);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | undefined>(undefined);
  const [periodic, setPeriodic] = useState<PeriodicSyncStatus | undefined>(undefined);

  useEffect(() => {
    setPerm(notificationPermission());
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPeriodic(undefined);
      return;
    }
    let cancelled = false;
    void periodicSyncStatus().then((s) => {
      if (!cancelled) setPeriodic(s);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const onEnable = async () => {
    setBusy(true);
    setFeedback(undefined);
    try {
      const result = await requestNotificationPermission();
      setPerm(result);
      if (result === 'granted') {
        setNotificationPrefs({ enabled: true, dismissedBanner: true });
        setEnabled(true);
        const sync = await tryRegisterPeriodicSync();
        setPeriodic(sync);
        setFeedback(
          sync === 'registered'
            ? 'Notificaciones activadas (también en segundo plano).'
            : 'Notificaciones activadas.',
        );
      } else if (result === 'denied') {
        setFeedback('El navegador denegó el permiso.');
      }
    } finally {
      setBusy(false);
    }
  };

  const onDisable = async () => {
    setNotificationPrefs({ enabled: false });
    setEnabled(false);
    await unregisterPeriodicSync();
    setPeriodic(undefined);
    setFeedback('Notificaciones desactivadas.');
  };

  const onEnableBackground = async () => {
    setBusy(true);
    try {
      const sync = await tryRegisterPeriodicSync();
      setPeriodic(sync);
      setFeedback(
        sync === 'registered'
          ? 'Comprobación en segundo plano activada.'
          : sync === 'permission-denied'
            ? 'El navegador denegó el permiso de segundo plano.'
            : sync === 'unsupported'
              ? 'Este navegador no permite segundo plano.'
              : 'No se pudo activar el segundo plano.',
      );
    } finally {
      setBusy(false);
    }
  };

  const onTest = async () => {
    setBusy(true);
    try {
      const ok = await sendTestNotification();
      // Si hay periodic sync activo, pídele también una pasada real para validar el camino del SW.
      if (ok && periodic === 'registered') {
        await requestImmediateCoachCheck();
      }
      setFeedback(ok ? 'Notificación enviada.' : 'No se pudo enviar la prueba.');
    } finally {
      setBusy(false);
    }
  };

  const status = statusLabel(perm, enabled);
  const canTest = perm === 'granted' && enabled;
  const canRegisterBackground =
    enabled && (periodic === 'permission-prompt' || periodic === 'error');
  const periodicHint = periodicLabel(periodic, enabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-700">
        <p>
          Te avisamos en el navegador cuando una tarea está atrasada o vence hoy. Las
          notificaciones se disparan localmente mientras la app esté abierta (o como
          PWA instalada en segundo plano según el dispositivo).
        </p>
        <p className={`text-xs ${status.tone}`}>{status.text}</p>
        {periodicHint && <p className="text-xs text-slate-500">{periodicHint}</p>}
        <div className="flex flex-wrap gap-2">
          {perm !== 'unsupported' && perm !== 'denied' && !enabled && (
            <Button onClick={() => void onEnable()} disabled={busy}>
              {busy ? 'Pidiendo permiso…' : 'Activar notificaciones'}
            </Button>
          )}
          {enabled && (
            <Button variant="outline" onClick={() => void onDisable()} disabled={busy}>
              Desactivar
            </Button>
          )}
          {canRegisterBackground && (
            <Button
              variant="outline"
              onClick={() => void onEnableBackground()}
              disabled={busy}
            >
              Activar segundo plano
            </Button>
          )}
          {canTest && (
            <Button variant="outline" onClick={() => void onTest()} disabled={busy}>
              Probar notificación
            </Button>
          )}
        </div>
        {feedback && <p className="text-xs text-slate-500">{feedback}</p>}
      </CardContent>
    </Card>
  );
}
