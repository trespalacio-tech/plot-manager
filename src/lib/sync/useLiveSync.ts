import { useEffect, useState } from 'react';
import { liveSync } from './live';

/**
 * Suscripción al estado del LiveSyncManager para componentes React.
 * Devuelve la lista de deviceIds actualmente conectados en vivo.
 * Re-renderiza cuando un peer se conecta o desconecta.
 */
export function useLivePeers(): string[] {
  const [peers, setPeers] = useState<string[]>(() => liveSync.livePeers());
  useEffect(() => {
    const unsub = liveSync.subscribe(() => {
      setPeers(liveSync.livePeers());
    });
    // refrescamos al montar por si cambió desde el último render
    setPeers(liveSync.livePeers());
    return unsub;
  }, []);
  return peers;
}
