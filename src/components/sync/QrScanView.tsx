import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { FrameAssembler } from '@/lib/sync/transport/qrCodec';

interface Props {
  onComplete: (value: unknown) => void;
  onError?: (msg: string) => void;
}

/**
 * Activa la cámara y escanea QRs continuamente, alimentando un
 * FrameAssembler hasta tener todos los frames de la sesión.
 */
export function QrScanView({ onComplete, onError }: Props): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const assemblerRef = useRef(new FrameAssembler());
  const [progress, setProgress] = useState({ received: 0, total: 0 });
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;

    const scanner = new QrScanner(
      video,
      (result) => {
        if (cancelled) return;
        try {
          const value = assemblerRef.current.push(result.data);
          setProgress(assemblerRef.current.progress);
          if (value !== undefined) {
            // Detener scanner antes de notificar para liberar la cámara.
            scanner.stop();
            scanner.destroy();
            onComplete(value);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg === 'different-session') {
            // Reset y permite escanear otra sesión limpia
            assemblerRef.current.reset();
            setProgress({ received: 0, total: 0 });
            setError('QR de otra sesión: he reiniciado el escaneo.');
          } else {
            setError(`Error al leer QR: ${msg}`);
            onError?.(msg);
          }
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
      },
    );
    scannerRef.current = scanner;
    scanner.start().catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`No se pudo iniciar la cámara: ${msg}`);
      onError?.(msg);
    });

    return () => {
      cancelled = true;
      scanner.stop();
      scanner.destroy();
    };
  }, [onComplete, onError]);

  return (
    <div className="flex flex-col items-center gap-2">
      <video
        ref={videoRef}
        className="aspect-square w-full max-w-[320px] rounded-md bg-stone-900 object-cover"
        muted
        playsInline
      />
      {progress.total > 0 ? (
        <p className="text-xs text-stone-600">
          Frames {progress.received} / {progress.total}
          {progress.received < progress.total && ' · sigue apuntando'}
        </p>
      ) : (
        <p className="text-xs text-stone-500">Apunta al QR del otro dispositivo</p>
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
