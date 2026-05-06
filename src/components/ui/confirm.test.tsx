import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmProvider, useConfirm, usePrompt } from './confirm';

function ConfirmHarness() {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await confirm({
          title: '¿Borrar la parcela?',
          description: 'No se puede deshacer.',
          confirmText: 'Borrar parcela',
          destructive: true,
        });
        document.body.setAttribute('data-result', String(ok));
      }}
    >
      Trigger
    </button>
  );
}

function PromptHarness() {
  const prompt = usePrompt();
  return (
    <button
      type="button"
      onClick={async () => {
        const value = await prompt({
          title: 'Anular entrada',
          inputLabel: 'Motivo de anulación',
          required: true,
        });
        document.body.setAttribute('data-prompt', value ?? 'NULL');
      }}
    >
      Trigger
    </button>
  );
}

describe('ConfirmProvider', () => {
  it('useConfirm resuelve true al confirmar', async () => {
    render(
      <ConfirmProvider>
        <ConfirmHarness />
      </ConfirmProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    expect(await screen.findByText('¿Borrar la parcela?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Borrar parcela'));
    // microtask flush
    await Promise.resolve();
    await Promise.resolve();
    expect(document.body.getAttribute('data-result')).toBe('true');
  });

  it('useConfirm resuelve false al cancelar', async () => {
    render(
      <ConfirmProvider>
        <ConfirmHarness />
      </ConfirmProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    expect(await screen.findByText('¿Borrar la parcela?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancelar'));
    await Promise.resolve();
    await Promise.resolve();
    expect(document.body.getAttribute('data-result')).toBe('false');
  });

  it('usePrompt devuelve el texto introducido', async () => {
    render(
      <ConfirmProvider>
        <PromptHarness />
      </ConfirmProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    const input = await screen.findByLabelText(/motivo de anulación/i);
    fireEvent.change(input, { target: { value: 'duplicada' } });
    fireEvent.click(screen.getByText('Aceptar'));
    await Promise.resolve();
    await Promise.resolve();
    expect(document.body.getAttribute('data-prompt')).toBe('duplicada');
  });

  it('usePrompt con required deshabilita Aceptar si está vacío', async () => {
    render(
      <ConfirmProvider>
        <PromptHarness />
      </ConfirmProvider>,
    );
    fireEvent.click(screen.getByText('Trigger'));
    await screen.findByLabelText(/motivo/i);
    const acceptBtn = screen.getByRole('button', { name: 'Aceptar' });
    expect(acceptBtn).toBeDisabled();
  });

  it('useConfirm fuera del provider lanza error claro', () => {
    expect(() => render(<ConfirmHarness />)).toThrow(/ConfirmProvider/);
  });
});
