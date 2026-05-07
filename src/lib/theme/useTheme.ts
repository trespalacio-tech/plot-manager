import { useEffect, useState } from 'react';
import {
  readStoredMode,
  resolveActiveScheme,
  setThemeMode,
  systemPrefersDark,
  type ThemeMode,
} from './theme';

/**
 * Hook para el toggle de tema. Devuelve modo persistido + esquema
 * efectivo y un setter que persiste y aplica el cambio.
 */
export function useTheme(): {
  mode: ThemeMode;
  scheme: 'light' | 'dark';
  setMode: (m: ThemeMode) => void;
} {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode());
  const [scheme, setScheme] = useState<'light' | 'dark'>(() =>
    resolveActiveScheme(readStoredMode()),
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const refresh = () => {
      setScheme(mode === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : mode);
    };
    refresh();
    if (mode === 'auto') {
      const onChange = () => refresh();
      mql.addEventListener?.('change', onChange);
      return () => mql.removeEventListener?.('change', onChange);
    }
  }, [mode]);

  const update = (m: ThemeMode) => {
    setMode(m);
    setThemeMode(m);
  };

  return { mode, scheme, setMode: update };
}
