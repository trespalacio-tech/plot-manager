import { NavLink, Outlet } from 'react-router-dom';

type Tab = {
  to: string;
  label: string;
  icon: string;
};

const tabs: Tab[] = [
  { to: '/hoy', label: 'Hoy', icon: '☀' },
  { to: '/cuaderno', label: 'Cuaderno', icon: '✎' },
  { to: '/parcelas', label: 'Parcelas', icon: '▦' },
  { to: '/calendario', label: 'Calendario', icon: '▤' },
  { to: '/aprender', label: 'Aprender', icon: '?' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙' },
];

export function AppShell(): JSX.Element {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-slate-200 md:bg-brand-50">
        <div className="px-4 py-5 text-lg font-semibold text-brand-700">Fincas</div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded px-3 py-2 text-sm',
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-700 hover:bg-brand-100',
                ].join(' ')
              }
            >
              <span aria-hidden className="w-5 text-center">
                {tab.icon}
              </span>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs',
                isActive ? 'text-brand-600' : 'text-slate-500',
              ].join(' ')
            }
          >
            <span aria-hidden className="text-base leading-none">
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
