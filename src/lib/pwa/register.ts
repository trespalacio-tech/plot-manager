import { registerSW } from 'virtual:pwa-register';

export function registerPWA(): void {
  if (typeof window === 'undefined') return;
  registerSW({ immediate: true });
}
