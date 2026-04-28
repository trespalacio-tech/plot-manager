import type { Parcel, Task } from '@/lib/db/types';
import { describeUrgency, taskUrgency } from './urgency';
import { mirrorEnabled, mirrorLastNotified } from './swSync';

const STATE_KEY = 'coach:notifications';
export const NOTIFY_THROTTLE_MS = 12 * 60 * 60 * 1000;
export const MAX_NOTIFICATIONS_PER_RUN = 3;

export interface NotificationPrefs {
  enabled: boolean;
  dismissedBanner: boolean;
  lastNotifiedAt: Record<string, number>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  dismissedBanner: false,
  lastNotifiedAt: {},
};

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function getNotificationPrefs(): NotificationPrefs {
  const s = safeStorage();
  if (!s) return { ...DEFAULT_PREFS };
  try {
    const raw = s.getItem(STATE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      enabled: !!parsed.enabled,
      dismissedBanner: !!parsed.dismissedBanner,
      lastNotifiedAt: { ...(parsed.lastNotifiedAt ?? {}) },
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setNotificationPrefs(patch: Partial<NotificationPrefs>): NotificationPrefs {
  const previous = getNotificationPrefs();
  const next = { ...previous, ...patch };
  const s = safeStorage();
  if (s) {
    try {
      s.setItem(STATE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  if (patch.enabled !== undefined && patch.enabled !== previous.enabled) {
    void mirrorEnabled(next.enabled);
  }
  if (patch.lastNotifiedAt !== undefined) {
    void mirrorLastNotified(next.lastNotifiedAt);
  }
  return next;
}

export function notificationsAvailable(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsAvailable()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsAvailable()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Selecciona tareas que merece avisar ahora: OVERDUE/TODAY no notificadas en las últimas 12 h. */
export function pickTasksToNotify(
  tasks: Task[],
  prefs: NotificationPrefs,
  now: Date = new Date(),
): Task[] {
  const cutoff = now.getTime() - NOTIFY_THROTTLE_MS;
  const eligible = tasks.filter((t) => {
    if (t.status !== 'PENDING' && t.status !== 'IN_PROGRESS') return false;
    const u = taskUrgency(t, now);
    if (u !== 'OVERDUE' && u !== 'TODAY') return false;
    const last = prefs.lastNotifiedAt[t.id];
    if (last && last > cutoff) return false;
    return true;
  });
  // Atrasadas primero, luego HOY; dentro de cada bloque, fecha más temprana.
  eligible.sort((a, b) => {
    const ua = taskUrgency(a, now);
    const ub = taskUrgency(b, now);
    if (ua !== ub) return ua === 'OVERDUE' ? -1 : 1;
    const ad = (a.dueDate ?? a.scheduledFor ?? a.createdAt).getTime();
    const bd = (b.dueDate ?? b.scheduledFor ?? b.createdAt).getTime();
    return ad - bd;
  });
  return eligible.slice(0, MAX_NOTIFICATIONS_PER_RUN);
}

interface ShowOptions {
  parcels?: Map<string, Parcel>;
  now?: Date;
}

function buildBody(task: Task, parcelName: string | undefined, now: Date): string {
  const urgency = describeUrgency(task, now).label;
  const where = parcelName ?? 'sin parcela';
  return `${where} · ${urgency}`;
}

async function showOne(task: Task, body: string): Promise<void> {
  if (!notificationsAvailable() || Notification.permission !== 'granted') return;
  const data = { taskId: task.id, type: 'coach-task', url: `#/hoy` };
  const opts: NotificationOptions = {
    body,
    tag: `coach-task-${task.id}`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data,
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(task.title, opts);
        return;
      }
    }
    new Notification(task.title, opts);
  } catch {
    /* ignore */
  }
}

export async function notifyUrgentTasks(
  tasks: Task[],
  options: ShowOptions = {},
): Promise<number> {
  const prefs = getNotificationPrefs();
  if (!prefs.enabled) return 0;
  if (!notificationsAvailable() || Notification.permission !== 'granted') return 0;
  const now = options.now ?? new Date();
  const picked = pickTasksToNotify(tasks, prefs, now);
  if (picked.length === 0) return 0;
  const parcels = options.parcels;
  for (const t of picked) {
    const parcelName = t.parcelId ? parcels?.get(t.parcelId)?.name : undefined;
    await showOne(t, buildBody(t, parcelName, now));
  }
  const updated = { ...prefs.lastNotifiedAt };
  for (const t of picked) updated[t.id] = now.getTime();
  setNotificationPrefs({ lastNotifiedAt: updated });
  return picked.length;
}

/** Muestra una notificación de prueba inmediata (ignora throttle). */
export async function sendTestNotification(): Promise<boolean> {
  if (!notificationsAvailable() || Notification.permission !== 'granted') return false;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification('Notificación de prueba', {
          body: 'Las notificaciones del Coach están activas.',
          tag: 'coach-test',
          icon: '/pwa-192x192.png',
        });
        return true;
      }
    }
    new Notification('Notificación de prueba', {
      body: 'Las notificaciones del Coach están activas.',
      tag: 'coach-test',
    });
    return true;
  } catch {
    return false;
  }
}
