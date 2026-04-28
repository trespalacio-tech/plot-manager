import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { listParcels, listTasks } from '@/lib/db/repos';
import type { Parcel } from '@/lib/db/types';
import {
  getNotificationPrefs,
  notificationsAvailable,
  notifyUrgentTasks,
} from './notifications';

const POLL_MS = 30 * 60 * 1000;

/**
 * Mientras la app esté abierta, cada 30 min revisa si hay tareas atrasadas o
 * de hoy y dispara notificaciones del navegador (con throttle por tarea).
 * Es no-op si el usuario no ha activado las notificaciones o no las concedió.
 */
export function useTaskNotifications(): void {
  const tasks = useLiveQuery(
    () => listTasks({ status: ['PENDING', 'IN_PROGRESS'] }),
    [],
  );
  const parcels = useLiveQuery(() => listParcels(), []);

  const parcelMap = useMemo(() => {
    const m = new Map<string, Parcel>();
    (parcels ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [parcels]);

  useEffect(() => {
    if (!notificationsAvailable()) return;
    if (!tasks) return;
    const prefs = getNotificationPrefs();
    if (!prefs.enabled || Notification.permission !== 'granted') return;

    void notifyUrgentTasks(tasks, { parcels: parcelMap });
    const interval = window.setInterval(() => {
      void notifyUrgentTasks(tasks, { parcels: parcelMap });
    }, POLL_MS);
    return () => window.clearInterval(interval);
  }, [tasks, parcelMap]);
}
