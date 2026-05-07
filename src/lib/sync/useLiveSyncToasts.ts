import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '@/lib/db/db';
import { useToast } from '@/components/ui/toast';
import { liveSync } from './live';
import type { PeerRecord } from './types';

/**
 * Vigila las transiciones de peers vivos (offline → online y al revés)
 * y dispara toasts globales para que el usuario sepa cuándo otro de
 * sus dispositivos se conecta o cae.
 *
 * Además, al volver al foreground (visibilitychange), fuerza una
 * relectura del estado: el set in-memory del LiveSyncManager puede
 * haberse quedado obsoleto si el JS se suspendió en background.
 *
 * Diseñado para montarse UNA sola vez en AppShell.
 */
export function useLiveSyncToasts(): void {
  const toast = useToast();
  const peers = useLiveQuery(() => getDb().peers.toArray(), []) as
    | PeerRecord[]
    | undefined;
  const previousLive = useRef<Set<string>>(new Set());
  // Evita disparar el toast inicial cuando la pestaña carga con peers
  // ya conectados desde una sesión previa: solo notificamos transiciones.
  const initialized = useRef(false);

  useEffect(() => {
    const computeAndNotify = () => {
      const current = new Set(liveSync.livePeers());
      if (!initialized.current) {
        previousLive.current = current;
        initialized.current = true;
        return;
      }
      // Conectados ahora que no estaban antes.
      for (const id of current) {
        if (previousLive.current.has(id)) continue;
        const peer = peers?.find((p) => p.id === id);
        toast.show({
          title: 'Dispositivo conectado',
          description: `${peer?.name ?? id} en directo.`,
          variant: 'success',
          durationMs: 3500,
        });
      }
      // Desconectados ahora que estaban antes.
      for (const id of previousLive.current) {
        if (current.has(id)) continue;
        const peer = peers?.find((p) => p.id === id);
        toast.show({
          title: 'Dispositivo desconectado',
          description: `Sincronización con ${peer?.name ?? id} pausada.`,
          variant: 'warning',
          durationMs: 4000,
        });
      }
      previousLive.current = current;
    };

    const unsub = liveSync.subscribe(computeAndNotify);
    // Inicialización sin disparar toasts.
    computeAndNotify();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // El navegador puede haber matado canales mientras estábamos
        // en background. Reevaluamos el estado real para que el badge
        // y los toasts reflejen lo que de verdad hay.
        computeAndNotify();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [peers, toast]);
}
