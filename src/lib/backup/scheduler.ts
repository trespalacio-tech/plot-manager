import { listAutoBackups, recordAutoBackup } from './auto';

const MIN_INTERVAL_MS = 30 * 60 * 1000;
let pending = false;

export async function maybeRecordAutoBackup(
  options: { minIntervalMs?: number; force?: boolean } = {},
): Promise<boolean> {
  if (pending) return false;
  const minInterval = options.minIntervalMs ?? MIN_INTERVAL_MS;
  pending = true;
  try {
    if (!options.force) {
      const list = await listAutoBackups();
      const latest = list[0];
      if (latest && Date.now() - latest.createdAt.getTime() < minInterval) {
        return false;
      }
    }
    await recordAutoBackup();
    return true;
  } finally {
    pending = false;
  }
}

export function installAutoBackupOnClose(): () => void {
  const handler = () => {
    if (document.visibilityState === 'hidden') {
      void maybeRecordAutoBackup().catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', handler);
  window.addEventListener('pagehide', handler);
  return () => {
    document.removeEventListener('visibilitychange', handler);
    window.removeEventListener('pagehide', handler);
  };
}
