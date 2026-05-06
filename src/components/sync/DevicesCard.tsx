import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfirm } from '@/components/ui/confirm';
import { getDb } from '@/lib/db/db';
import { ensureIdentity } from '@/lib/sync/identity';
import { opsCount } from '@/lib/sync/log';
import type { PeerRecord } from '@/lib/sync/types';
import { PairingDialog } from './PairingDialog';

export function DevicesCard(): JSX.Element {
  const confirm = useConfirm();
  const [pairingRole, setPairingRole] = useState<'offerer' | 'answerer' | null>(null);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [opsTotal, setOpsTotal] = useState<number | undefined>(undefined);

  const peers = useLiveQuery(() => getDb().peers.toArray(), []) as
    | PeerRecord[]
    | undefined;

  useEffect(() => {
    let cancelled = false;
    ensureIdentity()
      .then((id) => {
        if (!cancelled) setDeviceId(id.deviceId);
      })
      .catch(() => {
        /* sin identidad legible: ignoramos en UI, el card sigue funcional */
      });
    opsCount()
      .then((n) => {
        if (!cancelled) setOpsTotal(n);
      })
      .catch(() => {
        /* idem */
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
    await getDb().peers.delete(peer.id);
  };

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
          {deviceId && (
            <p className="text-xs text-stone-500">
              Este dispositivo: <code className="font-mono">{deviceId}</code>
              {opsTotal !== undefined && <> · {opsTotal} cambios registrados</>}
            </p>
          )}

          {!peers || peers.length === 0 ? (
            <p className="rounded-md border border-stone-200 bg-bone-100 px-3 py-2 text-xs text-stone-600">
              Aún no has vinculado ningún dispositivo. Pulsa <strong>Vincular</strong>{' '}
              en uno y <strong>Conectar</strong> en el otro para emparejarlos por QR.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {peers.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-stone-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900">
                      {p.name ?? <code className="font-mono">{p.id}</code>}
                    </div>
                    <div className="text-xs text-stone-500">
                      {p.lastSyncAt
                        ? `Última sync: ${formatRelativeTime(p.lastSyncAt)}`
                        : 'Sin sincronizar todavía'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void onForget(p)}
                  >
                    Olvidar
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setPairingRole('offerer')}>
              Vincular nuevo dispositivo
            </Button>
            <Button variant="outline" onClick={() => setPairingRole('answerer')}>
              Conectar con dispositivo
            </Button>
          </div>
        </CardContent>
      </Card>

      {pairingRole && (
        <PairingDialog
          open={pairingRole !== null}
          onOpenChange={(open) => {
            if (!open) setPairingRole(null);
          }}
          role={pairingRole}
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
