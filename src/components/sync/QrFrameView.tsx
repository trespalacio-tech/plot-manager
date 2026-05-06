import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  /** Lista de frames a mostrar; rotamos uno cada `intervalMs` ms. */
  frames: string[];
  intervalMs?: number;
  size?: number;
}

/**
 * Pinta un QR (o varios en rotación) sobre canvas. Si hay más de un
 * frame, los va alternando para que el lector los capture todos en
 * pasadas sucesivas.
 */
export function QrFrameView({
  frames,
  intervalMs = 1500,
  size = 280,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (frames.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [frames.length, intervalMs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const text = frames[index];
    if (!text) return;
    void QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e4826', light: '#fbf9f5' },
    });
  }, [frames, index, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-md border border-stone-200" />
      {frames.length > 1 && (
        <p className="text-xs text-stone-500">
          QR {index + 1} de {frames.length} · escanea todos en orden
        </p>
      )}
    </div>
  );
}
