import { createHashRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { TodayPage } from '@/pages/Today';
import { NotebookPage } from '@/pages/Notebook';
import { ParcelsPage } from '@/pages/Parcels';
import { CalendarPage } from '@/pages/Calendar';
import { LearnPage } from '@/pages/Learn';
import { SettingsPage } from '@/pages/Settings';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/hoy" replace /> },
      { path: 'hoy', element: <TodayPage /> },
      { path: 'cuaderno', element: <NotebookPage /> },
      { path: 'parcelas', element: <ParcelsPage /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'aprender', element: <LearnPage /> },
      { path: 'ajustes', element: <SettingsPage /> },
    ],
  },
]);
