import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayPage } from '@/pages/Today';
import { NotebookPage } from '@/pages/Notebook';
import { ParcelsPage } from '@/pages/Parcels';
import { CalendarPage } from '@/pages/Calendar';
import { LearnPage } from '@/pages/Learn';
import { SettingsPage } from '@/pages/Settings';

const FarmDetailPage = lazy(() =>
  import('@/pages/FarmDetail').then((m) => ({ default: m.FarmDetailPage })),
);

function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-slate-500">
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
      { path: 'cuaderno', element: <NotebookPage /> },
      { path: 'parcelas', element: <ParcelsPage /> },
      {
        path: 'parcelas/:farmId',
        element: (
          <LazyRoute>
            <FarmDetailPage />
          </LazyRoute>
        ),
      },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'aprender', element: <LearnPage /> },
      { path: 'ajustes', element: <SettingsPage /> },
    ],
  },
]);
