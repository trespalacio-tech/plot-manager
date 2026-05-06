import LZString from 'lz-string';

/**
 * Codec para meter SDP+ICE en uno o varios QRs.
 *
 * Estrategia:
 *  1. JSON.stringify del payload.
 *  2. compressToEncodedURIComponent → cadena ASCII URL-safe (base64 sin '+/').
 *  3. Si cabe en un solo QR (≤ MAX_PER_FRAME), prefijo `1/1:` + payload.
 *  4. Si no, partir en N chunks con cabecera `i/N:idHash:` por chunk.
 *
 * `idHash` es un hash corto (8 chars) que identifica la sesión y evita
 * mezclar chunks de dos pairings distintos si el usuario reescaneara
 * por error. Se calcula sobre el payload comprimido completo.
 *
 * El decoder acepta chunks en cualquier orden y los reensambla cuando
 * tiene los N esperados con el mismo idHash.
 */

const MAX_PER_FRAME = 800; // QR versión 25 con corrección M cómodo

function shortHash(input: string): string {
  // FNV-1a 32 bits, suficiente para distinguir sesiones cercanas en el
  // tiempo. No es seguridad, solo identificador estable.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export interface QrFrame {
  index: number; // 1-based
  total: number;
  sessionId: string;
  payload: string; // chunk del cuerpo comprimido
}

/** Codifica el payload a uno o varios frames listos para QR. */
export function encodeToFrames(value: unknown): string[] {
  const json = JSON.stringify(value);
  const compressed = LZString.compressToEncodedURIComponent(json);
  const sessionId = shortHash(compressed);

  if (compressed.length <= MAX_PER_FRAME) {
    return [`1/1:${sessionId}:${compressed}`];
  }

  const total = Math.ceil(compressed.length / MAX_PER_FRAME);
  const frames: string[] = [];
  for (let i = 0; i < total; i += 1) {
    const slice = compressed.slice(i * MAX_PER_FRAME, (i + 1) * MAX_PER_FRAME);
    frames.push(`${i + 1}/${total}:${sessionId}:${slice}`);
  }
  return frames;
}

/** Parser de un frame escaneado. Lanza si el formato no encaja. */
export function parseFrame(text: string): QrFrame {
  const m = text.match(/^(\d+)\/(\d+):([0-9a-f]{8}):(.*)$/s);
  if (!m) throw new Error('frame-format');
  return {
    index: Number(m[1]),
    total: Number(m[2]),
    sessionId: m[3]!,
    payload: m[4]!,
  };
}

/**
 * Acumulador de frames con detección de sesión y validación.
 * Devuelve el payload reensamblado en cuanto hay suficientes frames
 * con el mismo sessionId; null mientras falten.
 */
export class FrameAssembler {
  private sessionId: string | undefined;
  private total = 0;
  private frames = new Map<number, string>();

  /** Estado actual para mostrar progreso al usuario. */
  get progress(): { received: number; total: number; sessionId?: string } {
    return {
      received: this.frames.size,
      total: this.total,
      sessionId: this.sessionId,
    };
  }

  reset(): void {
    this.sessionId = undefined;
    this.total = 0;
    this.frames.clear();
  }

  /**
   * Procesa un frame escaneado.
   * Devuelve el valor decodificado si está completo, undefined si faltan
   * más frames. Lanza error si el frame es inválido o de otra sesión.
   */
  push(text: string): unknown | undefined {
    const f = parseFrame(text);
    if (this.sessionId === undefined) {
      this.sessionId = f.sessionId;
      this.total = f.total;
    } else if (f.sessionId !== this.sessionId) {
      throw new Error('different-session');
    }
    if (f.total !== this.total) throw new Error('total-mismatch');
    this.frames.set(f.index, f.payload);
    if (this.frames.size < this.total) return undefined;
    // Reensamblar en orden.
    const ordered: string[] = [];
    for (let i = 1; i <= this.total; i += 1) {
      const piece = this.frames.get(i);
      if (piece === undefined) return undefined; // hueco intermedio
      ordered.push(piece);
    }
    const compressed = ordered.join('');
    const json = LZString.decompressFromEncodedURIComponent(compressed);
    if (!json) throw new Error('decompress-failed');
    return JSON.parse(json);
  }
}

/** Helper para tests: encode + decode round-trip. */
export function decodeFrames(frames: string[]): unknown {
  const a = new FrameAssembler();
  let result: unknown;
  for (const f of frames) {
    const r = a.push(f);
    if (r !== undefined) result = r;
  }
  if (result === undefined) {
    throw new Error('incomplete-frames');
  }
  return result;
}

export const QR_CODEC_INTERNALS = { MAX_PER_FRAME, shortHash };
