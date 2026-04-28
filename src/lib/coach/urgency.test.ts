import { describe, expect, it } from 'vitest';
import type { Task } from '@/lib/db/types';
import {
  compareTasks,
  describeUrgency,
  taskUrgency,
} from './urgency';

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

describe('taskUrgency', () => {
  it('marca como OVERDUE las tareas con dueDate anterior a hoy', () => {
    const t = task({ dueDate: new Date('2026-04-20') });
    expect(taskUrgency(t, NOW)).toBe('OVERDUE');
  });

  it('TODAY si scheduledFor es hoy', () => {
    const t = task({ scheduledFor: new Date('2026-04-24T15:00:00') });
    expect(taskUrgency(t, NOW)).toBe('TODAY');
  });

  it('SOON entre 1 y 3 días', () => {
    const t = task({ scheduledFor: new Date('2026-04-26') });
    expect(taskUrgency(t, NOW)).toBe('SOON');
  });

  it('THIS_WEEK entre 4 y 7 días', () => {
    const t = task({ scheduledFor: new Date('2026-04-30') });
    expect(taskUrgency(t, NOW)).toBe('THIS_WEEK');
  });

  it('UPCOMING entre 8 y 14 días', () => {
    const t = task({ scheduledFor: new Date('2026-05-05') });
    expect(taskUrgency(t, NOW)).toBe('UPCOMING');
  });

  it('LATER si la tarea está pospuesta', () => {
    const t = task({ status: 'POSTPONED', scheduledFor: NOW });
    expect(taskUrgency(t, NOW)).toBe('LATER');
  });

  it('LATER si no hay fecha alguna', () => {
    const t = task({});
    expect(taskUrgency(t, NOW)).toBe('LATER');
  });
});

describe('compareTasks', () => {
  it('OVERDUE va antes que TODAY y este antes que SOON', () => {
    const a = task({ id: 'a', dueDate: new Date('2026-04-20') }); // overdue
    const b = task({ id: 'b', scheduledFor: new Date('2026-04-24') }); // today
    const c = task({ id: 'c', scheduledFor: new Date('2026-04-26') }); // soon
    const sorted = [c, a, b].sort((x, y) => compareTasks(x, y, NOW));
    expect(sorted.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('a igual urgencia, prioridad URGENT antes que MEDIUM', () => {
    const a = task({
      id: 'a',
      scheduledFor: new Date('2026-04-26'),
      priority: 'MEDIUM',
    });
    const b = task({
      id: 'b',
      scheduledFor: new Date('2026-04-26'),
      priority: 'URGENT',
    });
    const sorted = [a, b].sort((x, y) => compareTasks(x, y, NOW));
    expect(sorted.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('describeUrgency', () => {
  it('vence hoy / mañana / atrasada', () => {
    expect(describeUrgency(task({ dueDate: new Date('2026-04-24') }), NOW).label).toBe(
      'Vence hoy',
    );
    expect(describeUrgency(task({ dueDate: new Date('2026-04-25') }), NOW).label).toBe(
      'Vence mañana',
    );
    expect(describeUrgency(task({ dueDate: new Date('2026-04-22') }), NOW).label).toBe(
      'Atrasada 2 d',
    );
  });

  it('empieza hoy / en N días', () => {
    expect(
      describeUrgency(task({ scheduledFor: new Date('2026-04-24T18:00') }), NOW).label,
    ).toBe('Empieza hoy');
    expect(describeUrgency(task({ scheduledFor: new Date('2026-04-27') }), NOW).label).toBe(
      'En 3 d',
    );
  });

  it('sin fecha', () => {
    expect(describeUrgency(task({}), NOW).label).toBe('Sin fecha');
  });
});
