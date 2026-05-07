import { Moon, Smartphone, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/lib/theme/useTheme';
import type { ThemeMode } from '@/lib/theme/theme';

interface Choice {
  value: ThemeMode;
  label: string;
  Icon: typeof Sun;
  description: string;
}

const CHOICES: Choice[] = [
  {
    value: 'auto',
    label: 'Automático',
    Icon: Smartphone,
    description: 'Sigue la configuración de tu dispositivo.',
  },
  {
    value: 'light',
    label: 'Claro',
    Icon: Sun,
    description: 'Siempre claro, ignora el sistema.',
  },
  {
    value: 'dark',
    label: 'Oscuro',
    Icon: Moon,
    description: 'Siempre oscuro, ignora el sistema.',
  },
];

export function ThemeCard(): JSX.Element {
  const { mode, scheme, setMode } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tema</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm text-stone-700 dark:text-stone-300">
          La app respeta el modo claro/oscuro del sistema por defecto. Puedes
          forzar uno u otro si prefieres.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {CHOICES.map(({ value, label, Icon, description }) => {
            const active = mode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={[
                  'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors',
                  active
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/30'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-bone-100 dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600 dark:hover:bg-stone-700',
                ].join(' ')}
                aria-pressed={active}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-stone-900 dark:text-stone-100">
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Esquema activo ahora: <strong>{scheme === 'dark' ? 'oscuro' : 'claro'}</strong>.
        </p>
      </CardContent>
    </Card>
  );
}
