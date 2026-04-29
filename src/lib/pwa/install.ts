// Helpers para detectar plataforma y estado de instalación de la PWA.
// Sin React: facilitan tests y reuso desde cualquier capa.

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

export interface PlatformHints {
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
}

export function detectPlatform(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  matchStandalone: () => boolean = defaultMatchStandalone,
  iosStandalone: boolean = defaultIosStandalone(),
): PlatformHints {
  const ua = userAgent.toLowerCase();
  // iOS detection: incluye iPad moderno que se anuncia como Mac.
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (typeof navigator !== 'undefined' &&
      /macintosh/.test(ua) &&
      'ontouchend' in (typeof document !== 'undefined' ? document : ({} as Document)));
  const isAndroid = /android/.test(ua);
  const isStandalone = matchStandalone() || iosStandalone;
  return { isIOS, isAndroid, isStandalone };
}

function defaultMatchStandalone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

function defaultIosStandalone(): boolean {
  if (typeof navigator === 'undefined') return false;
  // iOS Safari expone navigator.standalone (no estándar).
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

const DISMISS_KEY = 'pwa:installHint:dismissedAt';
const HINT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // re-mostrar tras 7 días

export function isInstallHintDismissed(now: number = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return now - ts < HINT_TTL_MS;
  } catch {
    return false;
  }
}

export function dismissInstallHint(now: number = Date.now()): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(now));
  } catch {
    /* ignore */
  }
}

export function clearInstallHintDismissal(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
}
