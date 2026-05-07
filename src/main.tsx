import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { registerPWA } from '@/lib/pwa/register';
import { initTheme } from '@/lib/theme/theme';
import './index.css';

// Re-aplicar el tema desde el módulo (el script de index.html ya
// previene el flash; aquí enganchamos el listener al matchMedia para
// reaccionar a cambios del sistema en vivo).
initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

registerPWA();
