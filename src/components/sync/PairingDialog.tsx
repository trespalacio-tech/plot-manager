import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ensureIdentity } from '@/lib/sync/identity';
import { encodeToFrames } from '@/lib/sync/transport/qrCodec';
import {
  createAnswerer,
  createOfferer,
  type AnswererSession,
  type OffererSession,
  type SessionDescription,
} from '@/lib/sync/transport/webrtc';
import { runSyncSession, type SyncProgress, type SyncStats } from '@/lib/sync/engine';
import { QrFrameView } from './QrFrameView';
import { QrScanView } from './QrScanView';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Iniciador o receptor del pairing. */
  role: 'offerer' | 'answerer';
  /**
   * Si se pasa, sólo se completa la sincronización si el peer remoto
   * tiene este deviceId. Útil al re-sincronizar con un peer ya
   * vinculado: si por error escaneas el QR de otro dispositivo, falla
   * antes de mezclar datos.
   */
  expectedPeerId?: string;
  /** Etiqueta del peer esperado, para mostrar en la UI. */
  expectedPeerLabel?: string;
}

type Step =
  | 'preparing'
  | 'show-offer'
  | 'scan-answer'
  | 'scan-offer'
  | 'show-answer'
  | 'connecting'
  | 'syncing'
  | 'done'
  | 'error';

interface PairingPayload {
  v: 1;
  deviceId: string;
  publicKeyJwk: JsonWebKey;
  sdp: SessionDescription;
}

export function PairingDialog({
  open,
  onOpenChange,
  role,
  expectedPeerId,
  expectedPeerLabel,
}: Props): JSX.Element {
  const toast = useToast();
  const [step, setStep] = useState<Step>('preparing');
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [offerFrames, setOfferFrames] = useState<string[]>([]);
  const [answerFrames, setAnswerFrames] = useState<string[]>([]);
  const [progress, setProgress] = useState<SyncProgress | undefined>(undefined);
  const [stats, setStats] = useState<SyncStats | undefined>(undefined);

  const offererRef = useRef<OffererSession | null>(null);
  const answererRef = useRef<AnswererSession | null>(null);

  // Reset al abrir / cerrar
  useEffect(() => {
    if (!open) {
      offererRef.current?.close();
      answererRef.current?.close();
      offererRef.current = null;
      answererRef.current = null;
      setStep('preparing');
      setErrorMsg(undefined);
      setOfferFrames([]);
      setAnswerFrames([]);
      setProgress(undefined);
      setStats(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const ident = await ensureIdentity();
        if (role === 'offerer') {
          const session = await createOfferer();
          if (cancelled) {
            session.close();
            return;
          }
          offererRef.current = session;
          const payload: PairingPayload = {
            v: 1,
            deviceId: ident.deviceId,
            publicKeyJwk: ident.publicKeyJwk,
            sdp: session.offer,
          };
          setOfferFrames(encodeToFrames(payload));
          setStep('show-offer');
        } else {
          setStep('scan-offer');
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : String(e));
          setStep('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, role]);

  const onOfferScanned = async (value: unknown) => {
    try {
      const payload = value as PairingPayload;
      if (!payload || payload.v !== 1 || !payload.sdp) {
        throw new Error('payload-invalido');
      }
      if (expectedPeerId && payload.deviceId !== expectedPeerId) {
        throw new Error(
          `Este QR es de otro dispositivo (${payload.deviceId}). Esperaba ${expectedPeerLabel ?? expectedPeerId}.`,
        );
      }
      const ident = await ensureIdentity();
      const session = await createAnswerer(payload.sdp);
      answererRef.current = session;
      const answerPayload: PairingPayload = {
        v: 1,
        deviceId: ident.deviceId,
        publicKeyJwk: ident.publicKeyJwk,
        sdp: session.answer,
      };
      setAnswerFrames(encodeToFrames(answerPayload));
      setStep('show-answer');
      // En paralelo, esperamos al canal y arrancamos el sync.
      void session
        .channelReady()
        .then((ch) => {
          setStep('syncing');
          return runSyncSession(ch, {
            expectedPeerId: expectedPeerId ?? payload.deviceId,
            onProgress: setProgress,
          });
        })
        .then((s) => {
          setStats(s);
          setStep('done');
          toast.show({
            title: 'Sincronización completa',
            description: `${s.appliedOps} cambios aplicados desde el otro dispositivo`,
            variant: 'success',
          });
        })
        .catch((e: unknown) => {
          setErrorMsg(e instanceof Error ? e.message : String(e));
          setStep('error');
        });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep('error');
    }
  };

  const onAnswerScanned = async (value: unknown) => {
    try {
      const payload = value as PairingPayload;
      if (!payload || payload.v !== 1 || !payload.sdp) {
        throw new Error('payload-invalido');
      }
      if (expectedPeerId && payload.deviceId !== expectedPeerId) {
        throw new Error(
          `Este QR es de otro dispositivo (${payload.deviceId}). Esperaba ${expectedPeerLabel ?? expectedPeerId}.`,
        );
      }
      const session = offererRef.current;
      if (!session) throw new Error('no-offerer-session');
      setStep('connecting');
      const channel = await session.acceptAnswer(payload.sdp);
      setStep('syncing');
      const s = await runSyncSession(channel, {
        expectedPeerId: payload.deviceId,
        onProgress: setProgress,
      });
      setStats(s);
      setStep('done');
      toast.show({
        title: 'Sincronización completa',
        description: `${s.appliedOps} cambios aplicados desde el otro dispositivo`,
        variant: 'success',
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStep('error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expectedPeerId
              ? `Sincronizar con ${expectedPeerLabel ?? expectedPeerId}`
              : role === 'offerer'
                ? 'Vincular nuevo dispositivo'
                : 'Aceptar QR de otro dispositivo'}
          </DialogTitle>
          <DialogDescription>
            {step === 'preparing' && 'Preparando conexión sin servidor…'}
            {step === 'show-offer' &&
              'Paso 1/3 · Escanea este QR desde el otro dispositivo (Ajustes → Dispositivos → Conectar).'}
            {step === 'scan-offer' &&
              'Paso 1/3 · Escanea el QR del dispositivo iniciador.'}
            {step === 'show-answer' &&
              'Paso 2/3 · Muestra este QR al iniciador para que lo escanee.'}
            {step === 'scan-answer' &&
              'Paso 2/3 · Escanea el QR de respuesta del otro dispositivo.'}
            {step === 'connecting' && 'Conectando…'}
            {step === 'syncing' && 'Paso 3/3 · Sincronizando datos…'}
            {step === 'done' && '¡Listo!'}
            {step === 'error' && 'No se pudo completar la conexión.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {step === 'show-offer' && offerFrames.length > 0 && (
            <>
              <QrFrameView frames={offerFrames} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('scan-answer')}
              >
                Ya he escaneado: ahora muéstrame el QR de respuesta
              </Button>
            </>
          )}

          {step === 'scan-answer' && (
            <QrScanView onComplete={(v) => void onAnswerScanned(v)} />
          )}

          {step === 'scan-offer' && (
            <QrScanView onComplete={(v) => void onOfferScanned(v)} />
          )}

          {step === 'show-answer' && answerFrames.length > 0 && (
            <>
              <QrFrameView frames={answerFrames} />
              <p className="text-xs text-stone-500">
                Esperando a que el otro dispositivo lo escanee y se establezca la
                conexión…
              </p>
            </>
          )}

          {(step === 'connecting' || step === 'syncing') && (
            <div className="grid gap-1.5 text-sm text-stone-700">
              <p>
                {step === 'connecting'
                  ? 'Estableciendo canal cifrado P2P…'
                  : `Fase: ${progress?.phase ?? 'inicio'}`}
              </p>
              {progress && (
                <p className="text-xs text-stone-500">
                  Enviadas: {progress.sentOps} · recibidas: {progress.receivedOps} ·
                  aplicadas: {progress.appliedOps}
                </p>
              )}
            </div>
          )}

          {step === 'done' && stats && (
            <div className="rounded-md border border-brand-300 bg-brand-50 p-3 text-sm text-brand-900">
              <p className="font-medium">Sincronización con éxito</p>
              <p className="mt-1 text-xs">
                Peer: <code className="font-mono">{stats.peerDeviceId}</code>
                <br />
                Enviadas: {stats.sentOps} · recibidas: {stats.receivedOps} · aplicadas:{' '}
                {stats.appliedOps}
                <br />
                Duración: {Math.round(stats.durationMs / 1000)} s
              </p>
            </div>
          )}

          {step === 'error' && errorMsg && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
              {errorMsg}
            </div>
          )}

          <p className="rounded-md bg-bone-100 px-3 py-2 text-[11px] leading-snug text-stone-600">
            🔒 Tus datos viajan cifrados de extremo a extremo (DTLS de WebRTC)
            directamente entre tus dispositivos. No pasan por ningún servidor.
            Solo escanea estos QR desde TU otro dispositivo.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {step === 'done' ? 'Cerrar' : 'Cancelar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
