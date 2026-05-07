/**
 * Theme manager: auto (sigue al sistema), light o dark.
 *
 * - `auto`: aplica `dark` cuando el SO lo prefiere; reacciona al cambio
 *   en vivo vía matchMedia.
 * - `light`/`dark`: override del usuario, ignora la preferencia del SO.
 *
 * El estado persiste en localStorage. Hay un script gemelo en index.html
 * que aplica la clase ANTES del primer paint para evitar el "flash" de
 * tema claro al cargar una pestaña en modo oscuro.
 */

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'fincas:theme';

export function readStoredMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'auto') return raw;
  } catch {
    /* noop */
  }
  return 'auto';
}

function persistMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveActiveScheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

function applyClass(scheme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (scheme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

/**
 * Cambia el modo persistido y aplica el cambio en vivo.
 * Si el modo es `auto`, también re-engancha el listener al matchMedia.
 */
export function setThemeMode(mode: ThemeMode): void {
  persistMode(mode);
  applyClass(resolveActiveScheme(mode));
  rebindAutoListener(mode);
}

let unbindAuto: (() => void) | undefined;

function rebindAutoListener(mode: ThemeMode): void {
  unbindAuto?.();
  unbindAuto = undefined;
  if (mode !== 'auto') return;
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => applyClass(systemPrefersDark() ? 'dark' : 'light');
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    unbindAuto = () => mql.removeEventListener('change', onChange);
  } else if (typeof mql.addListener === 'function') {
    // Safari < 14
    mql.addListener(onChange);
    unbindAuto = () => mql.removeListener(onChange);
  }
}

/** Llamar una vez en el arranque de la app (desde main.tsx). */
export function initTheme(): void {
  const mode = readStoredMode();
  applyClass(resolveActiveScheme(mode));
  rebindAutoListener(mode);
}
