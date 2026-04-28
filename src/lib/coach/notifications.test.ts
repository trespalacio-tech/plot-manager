import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Task } from '@/lib/db/types';
import {
  getNotificationPrefs,
  NOTIFY_THROTTLE_MS,
  pickTasksToNotify,
  setNotificationPrefs,
} from './notifications';

const NOW = new Date('2026-04-24T08:00:00');

function task(partial: Partial<Task>): Task {
  return {
    id: partial.id ?? 't1',
    createdAt: partial.createdAt ?? NOW,
    updatedAt: partial.updatedAt ?? NOW,
    source: partial.source ?? 'PLAYBOOK',
    type: partial.type ?? 'PRUNING',
    title: partial.title ?? 'X',
    rationale: partial.rationale ?? 'r',
    priority: partial.priority ?? 'MEDIUM',
    status: partial.status ?? 'PENDING',
    ...partial,
  } as Task;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('notification prefs', () => {
  it('valores por defecto cuando no hay nada guardado', () => {
    const p = getNotificationPrefs();
    expect(p.enabled).toBe(false);
    expect(p.dismissedBanner).toBe(false);
    expect(p.lastNotifiedAt).toEqual({});
  });

  it('persiste cambios y permite combinar parches', () => {
    setNotificationPrefs({ enabled: true });
    expect(getNotificationPrefs().enabled).toBe(true);
    setNotificationPrefs({ lastNotifiedAt: { 'task-1': 123 } });
    const final = getNotificationPrefs();
    expect(final.enabled).toBe(true);
    expect(final.lastNotifiedAt).toEqual({ 'task-1': 123 });
  });
});

describe('pickTasksToNotify', () => {
  it('selecciona OVERDUE y TODAY y descarta el resto', () => {
    const overdue = task({ id: 'a', dueDate: new Date('2026-04-20') });
    const today = task({ id: 'b', scheduledFor: NOW });
    const soon = task({ id: 'c', scheduledFor: new Date('2026-04-26') });
    const later = task({ id: 'd', scheduledFor: new Date('2026-05-10') });
    const picked = pickTasksToNotify([soon, later, today, overdue], getNotificationPrefs(), NOW);
    expect(picked.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('atrasadas van antes que las de hoy y dentro ordena por fecha', () => {
    const overdueA = task({ id: 'a', dueDate: new Date('2026-04-22') });
    const overdueB = task({ id: 'b', dueDate: new Date('2026-04-20') });
    const todayA = task({ id: 'c', scheduledFor: new Date('2026-04-24T05:00') });
    const todayB = task({ id: 'd', scheduledFor: new Date('2026-04-24T22:00') });
    const picked = pickTasksToNotify([todayB, overdueA, todayA, overdueB], getNotificationPrefs(), NOW);
    // Tomamos solo las 3 primeras (MAX_NOTIFICATIONS_PER_RUN = 3).
    expect(picked.map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('descarta tareas notificadas dentro del throttle', () => {
    const t = task({ id: 'a', dueDate: new Date('2026-04-20') });
    const prefs = setNotificationPrefs({
      lastNotifiedAt: { a: NOW.getTime() - NOTIFY_THROTTLE_MS / 2 },
    });
    expect(pickTasksToNotify([t], prefs, NOW)).toHaveLength(0);
  });

  it('vuelve a incluir la tarea cuando el throttle expira', () => {
    const t = task({ id: 'a', dueDate: new Date('2026-04-20') });
    const prefs = setNotificationPrefs({
      lastNotifiedAt: { a: NOW.getTime() - NOTIFY_THROTTLE_MS - 1000 },
    });
    expect(pickTasksToNotify([t], prefs, NOW).map((x) => x.id)).toEqual(['a']);
  });

  it('descarta tareas DONE/DISMISSED/POSTPONED', () => {
    const done = task({ id: 'a', dueDate: new Date('2026-04-20'), status: 'DONE' });
    const dismissed = task({ id: 'b', dueDate: new Date('2026-04-20'), status: 'DISMISSED' });
    const postponed = task({ id: 'c', scheduledFor: NOW, status: 'POSTPONED' });
    expect(
      pickTasksToNotify([done, dismissed, postponed], getNotificationPrefs(), NOW),
    ).toHaveLength(0);
  });
});
