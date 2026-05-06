import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InstallBanner } from './InstallBanner';

// jsdom no implementa matchMedia. Lo simulamos antes de cada test.
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

function setIosStandalone(value: boolean) {
  Object.defineProperty(window.navigator, 'standalone', {
    writable: true,
    configurable: true,
    value,
  });
}

function clearIosStandalone() {
  // delete property to undefined for tests where iOS doesn't apply
  Object.defineProperty(window.navigator, 'standalone', {
    writable: true,
    configurable: true,
    value: undefined,
  });
}

beforeEach(() => {
  localStorage.clear();
  mockMatchMedia(false);
  clearIosStandalone();
  // Borra los listeners del runtime real entre tests para que el primer
  // render del hook no reciba un beforeinstallprompt residual.
  window.dispatchEvent(new Event('appinstalled'));
});

afterEach(() => {
  localStorage.clear();
});

function renderBanner() {
  return render(
    <MemoryRouter>
      <InstallBanner />
    </MemoryRouter>,
  );
}

describe('InstallBanner', () => {
  it('NO renderiza cuando display-mode es standalone (PWA Android/desktop instalada)', () => {
    mockMatchMedia(true);
    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it('NO renderiza cuando navigator.standalone es true (PWA iOS instalada)', () => {
    setIosStandalone(true);
    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it('NO renderiza si el usuario ya descartó el hint en los últimos 7 días', () => {
    localStorage.setItem('pwa:installHint:dismissedAt', String(Date.now()));
    // forzamos plataforma iOS para que el banner esté en su rama "no canPrompt"
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    });
    const { container } = renderBanner();
    expect(container.firstChild).toBeNull();
  });

  it('renderiza en iOS Safari no instalado y permite navegar a /ajustes', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    });
    renderBanner();
    expect(screen.getByText(/instala fincas como app/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /cómo instalar/i });
    expect(link.getAttribute('href')).toBe('/ajustes');
  });
});
