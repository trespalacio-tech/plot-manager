import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  initTheme,
  readStoredMode,
  resolveActiveScheme,
  setThemeMode,
  systemPrefersDark,
} from './theme';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  mockMatchMedia(false);
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('readStoredMode', () => {
  it('por defecto es auto si no hay valor', () => {
    expect(readStoredMode()).toBe('auto');
  });

  it('lee dark/light/auto cuando están guardados', () => {
    localStorage.setItem('fincas:theme', 'dark');
    expect(readStoredMode()).toBe('dark');
    localStorage.setItem('fincas:theme', 'light');
    expect(readStoredMode()).toBe('light');
    localStorage.setItem('fincas:theme', 'auto');
    expect(readStoredMode()).toBe('auto');
  });

  it('ignora valores inválidos', () => {
    localStorage.setItem('fincas:theme', 'rosa-fluor');
    expect(readStoredMode()).toBe('auto');
  });
});

describe('resolveActiveScheme', () => {
  it('auto + sistema light → light', () => {
    mockMatchMedia(false);
    expect(resolveActiveScheme('auto')).toBe('light');
  });

  it('auto + sistema dark → dark', () => {
    mockMatchMedia(true);
    expect(resolveActiveScheme('auto')).toBe('dark');
  });

  it('light/dark explícitos ignoran al sistema', () => {
    mockMatchMedia(true);
    expect(resolveActiveScheme('light')).toBe('light');
    mockMatchMedia(false);
    expect(resolveActiveScheme('dark')).toBe('dark');
  });
});

describe('systemPrefersDark', () => {
  it('refleja el matchMedia', () => {
    mockMatchMedia(true);
    expect(systemPrefersDark()).toBe(true);
    mockMatchMedia(false);
    expect(systemPrefersDark()).toBe(false);
  });
});

describe('setThemeMode + initTheme', () => {
  it('setThemeMode persiste y aplica clase dark', () => {
    setThemeMode('dark');
    expect(localStorage.getItem('fincas:theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setThemeMode("light") quita clase dark', () => {
    document.documentElement.classList.add('dark');
    setThemeMode('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initTheme con preferencia guardada=dark aplica clase', () => {
    localStorage.setItem('fincas:theme', 'dark');
    initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initTheme con auto + sistema dark aplica clase', () => {
    mockMatchMedia(true);
    initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initTheme con auto + sistema light no aplica clase', () => {
    mockMatchMedia(false);
    initTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
