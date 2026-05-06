import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './toast';

function Harness({
  onAction,
  duration,
}: {
  onAction?: () => void;
  duration?: number;
}) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        toast.show({
          title: 'Tarea descartada',
          description: 'Poda de invierno',
          durationMs: duration,
          action: onAction
            ? { label: 'Deshacer', onClick: onAction }
            : undefined,
        })
      }
    >
      Trigger
    </button>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('muestra el toast tras dispararlo', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByText('Tarea descartada')).toBeInTheDocument();
    expect(screen.getByText('Poda de invierno')).toBeInTheDocument();
  });

  it('llama a la acción y desaparece al pulsar Deshacer', () => {
    const undo = vi.fn();
    render(
      <ToastProvider>
        <Harness onAction={undo} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    fireEvent.click(screen.getByText('Deshacer'));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('auto-dismiss tras durationMs', () => {
    render(
      <ToastProvider>
        <Harness duration={3000} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByText('Tarea descartada')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3001);
    });
    expect(screen.queryByText('Tarea descartada')).not.toBeInTheDocument();
  });

  it('botón cerrar elimina el toast', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(screen.queryByText('Tarea descartada')).not.toBeInTheDocument();
  });
});
