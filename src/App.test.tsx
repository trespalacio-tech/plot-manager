import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayPage } from '@/pages/Today';
import { SettingsPage } from '@/pages/Settings';

function renderAt(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { path: 'hoy', element: <TodayPage /> },
          { path: 'ajustes', element: <SettingsPage /> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
  return render(<RouterProvider router={router} />);
}

describe('AppShell', () => {
  it('muestra la pantalla Hoy con la pregunta del Coach', () => {
    renderAt('/hoy');
    expect(
      screen.getByRole('heading', { level: 1, name: /qué hago hoy/i }),
    ).toBeInTheDocument();
  });

  it('expone todas las pestañas en la navegación', () => {
    renderAt('/hoy');
    for (const label of [
      'Hoy',
      'Cuaderno',
      'Parcelas',
      'Calendario',
      'Aprender',
      'Ajustes',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('la pantalla Ajustes declara almacenamiento local y sin servidor', () => {
    renderAt('/ajustes');
    expect(screen.getByText(/IndexedDB local/i)).toBeInTheDocument();
    expect(screen.getByText(/sin servidor/i)).toBeInTheDocument();
  });
});
