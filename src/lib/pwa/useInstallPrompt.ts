import { useCallback, useEffect, useState } from 'react';
import {
  detectPlatform,
  type BeforeInstallPromptEvent,
  type PlatformHints,
} from './install';

export interface InstallPromptState {
  /** El navegador ha disparado `beforeinstallprompt`: podemos ofrecer "Instalar". */
  canPrompt: boolean;
  /** La app ya corre instalada (display-mode: standalone o navigator.standalone). */
  installed: boolean;
  platform: PlatformHints;
  /** Llama a `prompt()` del evento guardado. Devuelve la elección del usuario. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => detectPlatform().isStandalone);
  const [platform, setPlatform] = useState<PlatformHints>(() => detectPlatform());

  useEffect(() => {
    setPlatform(detectPlatform());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);

    const mql = window.matchMedia?.('(display-mode: standalone)');
    const onChange = () => setInstalled(detectPlatform().isStandalone);
    mql?.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
      mql?.removeEventListener?.('change', onChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable' as const;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      return choice.outcome;
    } catch {
      setDeferred(null);
      return 'unavailable' as const;
    }
  }, [deferred]);

  return {
    canPrompt: !!deferred,
    installed,
    platform,
    promptInstall,
  };
}
