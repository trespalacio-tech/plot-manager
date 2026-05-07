import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm';
import { getDb } from '@/lib/db/db';
import { ensureIdentity } from '@/lib/sync/identity';
import { liveSync } from '@/lib/sync/live';
import { opsCount } from '@/lib/sync/log';
import type { PeerRecord } from '@/lib/sync/types';
import { useLivePeers } from '@/lib/sync/useLiveSync';
import { PairingDialog } from './PairingDialog';

type PairingTarget =
  | { mode: 'new-offerer' }
  | { mode: 'new-answerer' }
  | { mode: 'resync-offerer'; peer: PeerRecord }
  | { mode: 'resync-answerer'; peer: PeerRecord };

export function DevicesCard(): JSX.Element {
  const confirm = useConfirm();
  const [target, setTarget] = useState<PairingTarget | null>(null);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [opsTotal, setOpsTotal] = useState<number | undefined>(undefined);

  const peers = useLiveQuery(() => getDb().peers.toArray(), []) as
    | PeerRecord[]
    | undefined;
  const livePeerIds = new Set(useLivePeers());

  useEffect(() => {
    let cancelled = false;
    ensureIdentity()
      .then((id) => {
        if (!cancelled) setDeviceId(id.deviceId);
      })
      .catch(() => {
        /* ignoramos */
      });
    opsCount()
      .then((n) => {
        if (!cancelled) setOpsTotal(n);
      })
      .catch(() => {
        /* ignoramos */
      });
    return () => {
      cancelled = true;
    };
  }, [peers]);

  const onForget = async (peer: PeerRecord) => {
    const ok = await confirm({
      title: `Olvidar dispositivo «${peer.name ?? peer.id}»`,
      description:
        'Se perderá el registro de la última sincronización. La próxima vez tendrás que repetir el pairing por QR. Tus datos no se borran.',
      confirmText: 'Olvidar',
      destructive: true,
    });
    if (!ok) return;
    liveSync.disconnect(peer.id);
    await getDb().peers.delete(peer.id);
  };

  const role = target?.mode.includes('offerer') ? 'offerer' : 'answerer';
  const expectedPeer =
    target?.mode === 'resync-offerer' || target?.mode === 'resync-answerer'
      ? target.peer
      : undefined;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos vinculados</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-stone-700">
          <p>
            Sincronización P2P entre tus dispositivos sin nube. Los datos viajan
            cifrados de extremo a extremo directamente por WebRTC tras escanear un
            QR. No hay servidor, no hay cuentas.
          </p>
          <p className="rounded-md border border-stone-200 bg-bone-100 px-3 py-2 text-[11px] leading-snug text-stone-600">
            ⓘ <strong>Sync en directo</strong> mientras ambas pestañas estén abiertas:
            tras pairing por QR, los cambios se propagan al instante. Si cierras una
            pestaña y vuelves a abrirla, repite QR para reconectar (WebRTC no persiste
            conexiones entre cargas de página).
          </p>
          {deviceId && (
            <p className="text-xs text-stone-500">
              Este dispositivo: <code className="font-mono">{deviceId}</code>
              {opsTotal !== undefined && <> · {opsTotal} cambios registrados</>}
            </p>
          )}

          {!peers || peers.length === 0 ? (
            <p className="rounded-md border border-stone-200 bg-bone-100 px-3 py-2 text-xs text-stone-600">
              Aún no has vinculado ningún dispositivo. Pulsa <strong>Vincular</strong>{' '}
              en uno y <strong>Aceptar QR</strong> en el otro para emparejarlos por QR.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {peers.map((p) => {
                const isLive = livePeerIds.has(p.id);
                return (
                  <li
                    key={p.id}
                    className="grid gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-stone-900">
                          {p.name ?? <code className="font-mono">{p.id}</code>}
                        </span>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-800">
                            <span
                              aria-hidden
                              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-600"
                            />
                            En vivo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500">
                        {isLive
                          ? 'Cambios se sincronizan al instante mientras ambas pestañas estén abiertas.'
                          : p.lastSyncAt
                            ? `Última sync: ${formatRelativeTime(p.lastSyncAt)}`
                            : 'Sin sincronizar todavía'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {isLive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => liveSync.disconnect(p.id)}
                        >
                          Desconectar
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              setTarget({ mode: 'resync-offerer', peer: p })
                            }
                          >
                            Sincronizar (mostrar QR)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setTarget({ mode: 'resync-answerer', peer: p })
                            }
                          >
                            Aceptar QR
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void onForget(p)}
                      >
                        Olvidar
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-stone-200 pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
              Vincular un dispositivo nuevo
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTarget({ mode: 'new-offerer' })}>
                Mostrar QR (este dispositivo)
              </Button>
              <Button
                variant="outline"
                onClick={() => setTarget({ mode: 'new-answerer' })}
              >
                Aceptar QR (escanear otro)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {target && (
        <PairingDialog
          open={target !== null}
          onOpenChange={(open) => {
            if (!open) setTarget(null);
          }}
          role={role}
          expectedPeerId={expectedPeer?.id}
          expectedPeerLabel={expectedPeer?.name ?? expectedPeer?.id}
        />
      )}
    </>
  );
}

function formatRelativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'hace unos segundos';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return d.toLocaleDateString('es-ES');
}
