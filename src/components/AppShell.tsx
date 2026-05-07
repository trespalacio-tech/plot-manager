import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Calendar as CalendarIcon,
  GraduationCap,
  LayoutGrid,
  Library,
  MoreHorizontal,
  Settings as SettingsIcon,
  Sun,
  Sprout,
  type LucideIcon,
} from 'lucide-react';
import { installAutoBackupOnClose } from '@/lib/backup';
import { useTaskNotifications } from '@/lib/coach/useTaskNotifications';
import { useLivePeers } from '@/lib/sync/useLiveSync';
import { useLiveSyncToasts } from '@/lib/sync/useLiveSyncToasts';
import { ConfirmProvider } from '@/components/ui/confirm';
import { ToastProvider } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Tab = {
  to: string;
  label: string;
  Icon: LucideIcon;
};

// Las 4 primeras viven en el bottom nav (uso diario). Las 3 últimas
// caben en un menú "Más" para no apretar 7 iconos en pantallas de 360px.
// En desktop el sidebar las muestra todas.
const PRIMARY_TABS: Tab[] = [
  { to: '/hoy', label: 'Hoy', Icon: Sun },
  { to: '/cuaderno', label: 'Cuaderno', Icon: BookOpen },
  { to: '/parcelas', label: 'Parcelas', Icon: LayoutGrid },
  { to: '/calendario', label: 'Calendario', Icon: CalendarIcon },
];
const SECONDARY_TABS: Tab[] = [
  { to: '/aprender', label: 'Aprender', Icon: GraduationCap },
  { to: '/catalogos', label: 'Catálogos', Icon: Library },
  { to: '/ajustes', label: 'Ajustes', Icon: SettingsIcon },
];
const tabs: Tab[] = [...PRIMARY_TABS, ...SECONDARY_TABS];

export function AppShell(): JSX.Element {
  useEffect(() => installAutoBackupOnClose(), []);
  useTaskNotifications();
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppShellInner />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AppShellInner(): JSX.Element {
  // Vigila conexiones live para disparar toasts y revalidar al volver
  // de background. Vive aquí para tener acceso al ToastProvider.
  useLiveSyncToasts();
  const livePeers = useLivePeers();
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-stone-200 md:bg-bone-100">
        <div className="flex items-center gap-2 px-5 py-6">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-bone-50"
          >
            <Sprout className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-base font-semibold tracking-tight text-stone-900">
              Fincas
            </div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-stone-500">
              Regenerativa
            </div>
          </div>
          {livePeers.length > 0 && (
            <span
              title={`${livePeers.length} dispositivo${livePeers.length === 1 ? '' : 's'} en directo`}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-800"
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600"
              />
              {livePeers.length}
            </span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-4">
          {tabs.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-brand-600 text-bone-50 shadow-soft'
                    : 'text-stone-700 hover:bg-bone-200/60 hover:text-stone-900',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-5 pb-5 text-[11px] leading-snug text-stone-500">
          Local-first · tus datos viven en este dispositivo.
        </div>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav(): JSX.Element {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const isInSecondary = SECONDARY_TABS.some((t) => location.pathname.startsWith(t.to));

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-stone-200 bg-bone-50/95 backdrop-blur md:hidden"
      >
        {PRIMARY_TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors',
                isActive ? 'text-brand-700' : 'text-stone-500 hover:text-stone-700',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-brand-600"
                  />
                )}
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={[
            'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors',
            isInSecondary ? 'text-brand-700' : 'text-stone-500 hover:text-stone-700',
          ].join(' ')}
          aria-label="Más opciones"
        >
          {isInSecondary && (
            <span
              aria-hidden
              className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-brand-600"
            />
          )}
          <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
          <span>Más</span>
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Más opciones</DialogTitle>
            <DialogDescription>Secciones secundarias.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-1.5">
            {SECONDARY_TABS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-600 text-bone-50'
                        : 'text-stone-700 hover:bg-bone-100',
                    ].join(' ')
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
