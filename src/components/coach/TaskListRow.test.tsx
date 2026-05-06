import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Parcel, Task } from '@/lib/db/types';
import { TaskListRow } from './TaskListRow';

function task(partial: Partial<Task> = {}): Task {
  const now = new Date('2026-04-29T08:00:00');
  return {
    id: 't1',
    createdAt: now,
    updatedAt: now,
    source: 'PLAYBOOK',
    type: 'PRUNING',
    title: 'Poda de invierno',
    rationale: 'r',
    priority: 'HIGH',
    status: 'PENDING',
    ...partial,
  } as Task;
}

const parcel: Parcel = {
  id: 'p1',
  farmId: 'f1',
  name: 'La Nava',
  areaHa: 1,
  status: 'TRANSITION',
  statusChangedAt: new Date(),
  cropType: 'NUT_TREE',
  primarySpecies: 'almendro',
  irrigation: 'RAINFED',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskListRow', () => {
  it('muestra el título de la tarea y el nombre de la parcela', () => {
    render(<TaskListRow task={task()} parcel={parcel} onClick={() => {}} />);
    expect(screen.getByText('Poda de invierno')).toBeInTheDocument();
    expect(screen.getByText(/La Nava/)).toBeInTheDocument();
  });

  it('marca el título tachado cuando la tarea está hecha', () => {
    render(
      <TaskListRow
        task={task({ status: 'DONE' })}
        parcel={parcel}
        onClick={() => {}}
      />,
    );
    const title = screen.getByText('Poda de invierno');
    expect(title.className).toMatch(/line-through/);
  });

  it('llama onClick con la tarea al pulsar la fila', () => {
    const onClick = vi.fn();
    const t = task();
    render(<TaskListRow task={t} parcel={parcel} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(t);
  });

  it('indica "sin parcela" cuando no se pasa parcela', () => {
    render(<TaskListRow task={task()} onClick={() => {}} />);
    expect(screen.getByText(/sin parcela/i)).toBeInTheDocument();
  });

  it('renderiza badge de IN_PROGRESS', () => {
    render(
      <TaskListRow
        task={task({ status: 'IN_PROGRESS' })}
        parcel={parcel}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/en curso/i)).toBeInTheDocument();
  });

  it('renderiza badge de POSTPONED', () => {
    render(
      <TaskListRow
        task={task({ status: 'POSTPONED' })}
        parcel={parcel}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/pospuesta/i)).toBeInTheDocument();
  });
});
