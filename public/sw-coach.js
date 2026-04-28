// Periodic Background Sync handler for the Coach.
// Plain ES5/ES2017-safe JS injected into the Workbox-generated service worker
// via vite-plugin-pwa's `workbox.importScripts`.
//
// Triggers on the `periodicsync` event with tag `coach-tasks-check` and shows
// browser notifications for OVERDUE / TODAY tasks. Designed to work offline,
// without any backend.

/* eslint-disable no-restricted-globals */

const COACH_PERIODIC_TAG = 'coach-tasks-check';
const COACH_THROTTLE_MS = 12 * 60 * 60 * 1000;
const COACH_MAX_PER_RUN = 3;
const FINCAS_DB_NAME = 'fincas';
const COACH_SW_DB_NAME = 'coach-sw';
const COACH_SW_DB_VERSION = 1;
const COACH_SW_STORE = 'state';

function openIdb(name, version, upgrade) {
  return new Promise((resolve, reject) => {
    const req = version ? indexedDB.open(name, version) : indexedDB.open(name);
    if (upgrade) {
      req.onupgradeneeded = () => upgrade(req.result);
    }
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('idb-blocked'));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function reqResult(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function openCoachSwDb() {
  return openIdb(COACH_SW_DB_NAME, COACH_SW_DB_VERSION, (db) => {
    if (!db.objectStoreNames.contains(COACH_SW_STORE)) {
      db.createObjectStore(COACH_SW_STORE);
    }
  });
}

async function readCoachState() {
  const db = await openCoachSwDb();
  try {
    const tx = db.transaction(COACH_SW_STORE, 'readonly');
    const store = tx.objectStore(COACH_SW_STORE);
    const enabled = await reqResult(store.get('enabled'));
    const lastNotified = await reqResult(store.get('lastNotified'));
    return {
      enabled: enabled === true,
      lastNotified: lastNotified && typeof lastNotified === 'object' ? lastNotified : {},
    };
  } finally {
    db.close();
  }
}

async function writeLastNotified(updated) {
  const db = await openCoachSwDb();
  try {
    const tx = db.transaction(COACH_SW_STORE, 'readwrite');
    tx.objectStore(COACH_SW_STORE).put(updated, 'lastNotified');
    await txDone(tx);
  } finally {
    db.close();
  }
}

async function readAllTasks() {
  // Open without forcing a version: we only read. If the DB doesn't exist yet,
  // IndexedDB creates it empty (which is fine — there are no tasks).
  const db = await openIdb(FINCAS_DB_NAME);
  try {
    if (!db.objectStoreNames.contains('tasks')) return [];
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    return await reqResult(store.getAll());
  } finally {
    db.close();
  }
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function urgency(task, now) {
  if (task.status === 'POSTPONED') return 'LATER';
  const today = startOfDay(now);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  if (due) {
    const dueDay = startOfDay(due);
    if (dueDay.getTime() < today.getTime()) return 'OVERDUE';
  }
  const start = task.scheduledFor ? new Date(task.scheduledFor) : null;
  const anchor = start || due;
  if (!anchor) return 'LATER';
  const anchorDay = startOfDay(anchor);
  const diffDays = Math.round((anchorDay.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 0) return 'TODAY';
  if (diffDays <= 3) return 'SOON';
  if (diffDays <= 7) return 'THIS_WEEK';
  if (diffDays <= 14) return 'UPCOMING';
  return 'LATER';
}

function describe(task, now) {
  const today = startOfDay(now);
  if (task.dueDate) {
    const due = startOfDay(new Date(task.dueDate));
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return 'Atrasada ' + Math.abs(diff) + ' d';
    if (diff === 0) return 'Vence hoy';
    if (diff === 1) return 'Vence mañana';
  }
  if (task.scheduledFor) {
    const start = startOfDay(new Date(task.scheduledFor));
    const diff = Math.round((start.getTime() - today.getTime()) / 86400000);
    if (diff <= 0) return 'Empieza hoy';
    if (diff === 1) return 'Empieza mañana';
  }
  return 'Para hoy';
}

function pickTasks(tasks, lastNotified, now) {
  const cutoff = now.getTime() - COACH_THROTTLE_MS;
  const eligible = [];
  for (const t of tasks) {
    if (t.status !== 'PENDING' && t.status !== 'IN_PROGRESS') continue;
    const u = urgency(t, now);
    if (u !== 'OVERDUE' && u !== 'TODAY') continue;
    const last = lastNotified[t.id];
    if (last && last > cutoff) continue;
    eligible.push({ task: t, urgency: u });
  }
  eligible.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'OVERDUE' ? -1 : 1;
    const ad = new Date(a.task.dueDate || a.task.scheduledFor || a.task.createdAt).getTime();
    const bd = new Date(b.task.dueDate || b.task.scheduledFor || b.task.createdAt).getTime();
    return ad - bd;
  });
  return eligible.slice(0, COACH_MAX_PER_RUN).map((e) => e.task);
}

async function runCoachCheck() {
  const state = await readCoachState();
  if (!state.enabled) return;
  const tasks = await readAllTasks();
  if (!tasks.length) return;
  const now = new Date();
  const picked = pickTasks(tasks, state.lastNotified, now);
  if (!picked.length) return;
  for (const t of picked) {
    try {
      await self.registration.showNotification(t.title, {
        body: describe(t, now),
        tag: 'coach-task-' + t.id,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: { taskId: t.id, type: 'coach-task' },
      });
    } catch (_e) {
      // Ignore individual notification failures; throttle still updates below.
    }
  }
  const updated = Object.assign({}, state.lastNotified);
  for (const t of picked) updated[t.id] = now.getTime();
  await writeLastNotified(updated);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== COACH_PERIODIC_TAG) return;
  event.waitUntil(runCoachCheck().catch(() => undefined));
});

// Allow the page to trigger a check on demand (useful for "test in background").
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'coach-run-check') {
    event.waitUntil(runCoachCheck().catch(() => undefined));
  }
});
