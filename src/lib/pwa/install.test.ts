import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectPlatform,
  dismissInstallHint,
  isInstallHintDismissed,
  clearInstallHintDismissal,
} from './install';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  localStorage.clear();
});

describe('detectPlatform', () => {
  it('detecta Android', () => {
    const p = detectPlatform(ANDROID_UA, () => false, false);
    expect(p.isAndroid).toBe(true);
    expect(p.isIOS).toBe(false);
    expect(p.isStandalone).toBe(false);
  });

  it('detecta iPhone', () => {
    const p = detectPlatform(IPHONE_UA, () => false, false);
    expect(p.isIOS).toBe(true);
    expect(p.isAndroid).toBe(false);
  });

  it('marca standalone si display-mode coincide', () => {
    const p = detectPlatform(DESKTOP_UA, () => true, false);
    expect(p.isStandalone).toBe(true);
  });

  it('marca standalone si navigator.standalone (iOS)', () => {
    const p = detectPlatform(IPHONE_UA, () => false, true);
    expect(p.isStandalone).toBe(true);
  });

  it('escritorio no es ni iOS ni Android', () => {
    const p = detectPlatform(DESKTOP_UA, () => false, false);
    expect(p.isAndroid).toBe(false);
    expect(p.isIOS).toBe(false);
  });
});

describe('install hint dismissal', () => {
  it('no marcado por defecto', () => {
    expect(isInstallHintDismissed()).toBe(false);
  });

  it('persiste el descarte en localStorage', () => {
    dismissInstallHint(1_000_000);
    expect(isInstallHintDismissed(1_000_000)).toBe(true);
    expect(isInstallHintDismissed(1_000_000 + 60_000)).toBe(true);
  });

  it('caduca tras 7 días', () => {
    const t0 = 1_000_000;
    dismissInstallHint(t0);
    const eightDaysLater = t0 + 8 * 24 * 60 * 60 * 1000;
    expect(isInstallHintDismissed(eightDaysLater)).toBe(false);
  });

  it('clearInstallHintDismissal lo borra', () => {
    dismissInstallHint(1_000);
    clearInstallHintDismissal();
    expect(isInstallHintDismissed(1_000)).toBe(false);
  });
});
