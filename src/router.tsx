import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayPage } from '@/pages/Today';
import { ParcelsPage } from '@/pages/Parcels';

// Páginas pesadas o secundarias bajo lazy: NO bloquean el primer paint
// de Hoy ni el listado de parcelas (que es donde el usuario aterriza).
//   - Calendar: arrastra react-router internals + reformateo masivo.
//   - Notebook: arrastra date pickers y CSV.
//   - Catalogs / Learn / Settings: pantallas raras visitadas.
//   - Backup en Settings: 80 KB de zip/json.
//   - FarmDetail / ParcelDetail: usan Leaflet (~150 KB) y Recharts.
const NotebookPage = lazy(() =>
  import('@/pages/Notebook').then((m) => ({ default: m.NotebookPage })),
);
const CalendarPage = lazy(() =>
  import('@/pages/Calendar').then((m) => ({ default: m.CalendarPage })),
);
const LearnPage = lazy(() =>
  import('@/pages/Learn').then((m) => ({ default: m.LearnPage })),
);
const CatalogsPage = lazy(() =>
  import('@/pages/Catalogs').then((m) => ({ default: m.CatalogsPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })),
);
const FarmDetailPage = lazy(() =>
  import('@/pages/FarmDetail').then((m) => ({ default: m.FarmDetailPage })),
);
const ParcelDetailPage = lazy(() =>
  import('@/pages/ParcelDetail').then((m) => ({ default: m.ParcelDetailPage })),
);

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-stone-500">
          Cargando…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/hoy" replace /> },
      { path: 'hoy', element: <TodayPage /> },
      {
        path: 'cuaderno',
        element: (
          <LazyRoute>
            <NotebookPage />
          </LazyRoute>
        ),
      },
      { path: 'parcelas', element: <ParcelsPage /> },
      {
        path: 'parcelas/:farmId',
        element: (
          <LazyRoute>
            <FarmDetailPage />
          </LazyRoute>
        ),
      },
      {
        path: 'parcelas/:farmId/:parcelId',
        element: (
          <LazyRoute>
            <ParcelDetailPage />
          </LazyRoute>
        ),
      },
      {
        path: 'calendario',
        element: (
          <LazyRoute>
            <CalendarPage />
          </LazyRoute>
        ),
      },
      {
        path: 'aprender',
        element: (
          <LazyRoute>
            <LearnPage />
          </LazyRoute>
        ),
      },
      {
        path: 'catalogos',
        element: (
          <LazyRoute>
            <CatalogsPage />
          </LazyRoute>
        ),
      },
      {
        path: 'ajustes',
        element: (
          <LazyRoute>
            <SettingsPage />
          </LazyRoute>
        ),
      },
    ],
  },
]);
