import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayPage } from '@/pages/Today';
import { SettingsPage } from '@/pages/Settings';
import { getDb, resetDbForTests } from '@/lib/db';
import { createFarm } from '@/lib/db/repos';

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

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

describe('AppShell', () => {
  it('muestra el onboarding en Hoy cuando no hay fincas', async () => {
    renderAt('/hoy');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /bienvenido a fincas/i }),
      ).toBeInTheDocument();
    });
  });

  it('muestra la pregunta del Coach cuando ya hay una finca', async () => {
    await createFarm({
      name: 'Test',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    renderAt('/hoy');
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /qué hago hoy/i }),
      ).toBeInTheDocument();
    });
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

  it('la pantalla Ajustes declara almacenamiento local y modo sin servidor', async () => {
    renderAt('/ajustes');
    // Anclamos en los <dt> de la sección "Acerca de" — son únicos en
    // la página y resilientes a copy nuevo en otras tarjetas.
    const storageTerm = await screen.findByText('Almacenamiento', {
      selector: 'dt',
    });
    expect(storageTerm.nextElementSibling?.textContent).toMatch(/IndexedDB/i);
    const syncTerm = screen.getByText('Sincronización', { selector: 'dt' });
    expect(syncTerm.nextElementSibling?.textContent?.toLowerCase()).toContain(
      'sin servidor',
    );
  });
});
