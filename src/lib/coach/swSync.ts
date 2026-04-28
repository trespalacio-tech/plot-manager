// Pequeña base IndexedDB que comparten la página y el service worker
// (`public/sw-coach.js`). Almacena el flag `enabled` y el throttle por tarea
// que el SW necesita cuando se dispara `periodicsync` con la app cerrada.

const DB_NAME = 'coach-sw';
const DB_VERSION = 1;
const STORE = 'state';
export const COACH_PERIODIC_TAG = 'coach-tasks-check';
export const COACH_PERIODIC_MIN_INTERVAL_MS = 12 * 60 * 60 * 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb-unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function get<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function mirrorEnabled(enabled: boolean): Promise<void> {
  try {
    await put('enabled', enabled);
  } catch {
    /* sin IDB → no hay periodic sync de todas formas */
  }
}

export async function mirrorLastNotified(map: Record<string, number>): Promise<void> {
  try {
    await put('lastNotified', map);
  } catch {
    /* ignore */
  }
}

export async function readMirroredEnabled(): Promise<boolean> {
  try {
    return (await get<boolean>('enabled')) === true;
  } catch {
    return false;
  }
}

export type PeriodicSyncStatus =
  | 'unsupported'
  | 'permission-denied'
  | 'permission-prompt'
  | 'registered'
  | 'error';

export async function periodicSyncStatus(): Promise<PeriodicSyncStatus> {
  if (typeof navigator === 'undefined') return 'unsupported';
  if (!('serviceWorker' in navigator)) return 'unsupported';
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !('periodicSync' in reg)) return 'unsupported';
  try {
    const tags = await (reg as ServiceWorkerRegistration & {
      periodicSync: { getTags: () => Promise<string[]> };
    }).periodicSync.getTags();
    if (tags.includes(COACH_PERIODIC_TAG)) return 'registered';
  } catch {
    /* fallthrough */
  }
  if (!('permissions' in navigator)) return 'permission-prompt';
  try {
    const perm = await navigator.permissions.query({
      name: 'periodic-background-sync' as PermissionName,
    });
    if (perm.state === 'denied') return 'permission-denied';
    if (perm.state === 'prompt') return 'permission-prompt';
    return 'permission-prompt';
  } catch {
    return 'permission-prompt';
  }
}

/**
 * Intenta registrar el periodic sync. Falla silenciosamente si el navegador
 * no lo soporta o el permiso no se concede; en ese caso seguiremos teniendo
 * notificaciones cuando la app esté abierta vía `useTaskNotifications`.
 */
export async function tryRegisterPeriodicSync(): Promise<PeriodicSyncStatus> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator))
    return 'unsupported';
  const reg = await navigator.serviceWorker.ready;
  if (!('periodicSync' in reg)) return 'unsupported';
  try {
    await (reg as ServiceWorkerRegistration & {
      periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    }).periodicSync.register(COACH_PERIODIC_TAG, {
      minInterval: COACH_PERIODIC_MIN_INTERVAL_MS,
    });
    return 'registered';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/denied|NotAllowed/i.test(msg)) return 'permission-denied';
    return 'error';
  }
}

export async function unregisterPeriodicSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !('periodicSync' in reg)) return;
  try {
    await (reg as ServiceWorkerRegistration & {
      periodicSync: { unregister: (tag: string) => Promise<void> };
    }).periodicSync.unregister(COACH_PERIODIC_TAG);
  } catch {
    /* ignore */
  }
}

/** Pide al SW que haga una pasada de comprobación inmediata (útil en "Probar"). */
export async function requestImmediateCoachCheck(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !reg.active) return false;
  reg.active.postMessage({ type: 'coach-run-check' });
  return true;
}
