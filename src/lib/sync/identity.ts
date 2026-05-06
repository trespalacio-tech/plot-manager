import { getDb } from '@/lib/db/db';
import type { IdentityRecord } from './types';

/**
 * Identidad criptográfica del dispositivo.
 *
 * - Se genera UNA vez en el primer arranque tras instalar el op-log
 *   (ECDH P-256, soporte universal en Web Crypto API).
 * - El `deviceId` es un hash corto de la pubkey, suficiente para que
 *   los peers identifiquen al emisor de cada Op sin colisiones reales.
 * - Las claves se serializan como JWK para guardarse cómodamente en
 *   IndexedDB y volver a importarse con `crypto.subtle.importKey`.
 *
 * Privacidad: la clave privada NUNCA sale del dispositivo. La pública
 * se incluye en el QR de pairing y queda registrada en `peers` del otro
 * dispositivo como autorización persistente (Trust on First Use).
 */

const IDENTITY_TABLE_KEY = 'self';

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function deriveDeviceId(publicKeyJwk: JsonWebKey): Promise<string> {
  // Usamos los componentes x,y de la curva (sin la cabecera JWK) como
  // entrada estable para el hash. JSON.stringify ordena alfabéticamente
  // las claves al filtrar manualmente.
  const stable = JSON.stringify({ x: publicKeyJwk.x, y: publicKeyJwk.y });
  const bytes = new TextEncoder().encode(stable);
  const hex = await sha256Hex(bytes.buffer as ArrayBuffer);
  return hex.slice(0, 16);
}

async function generateKeyPair(): Promise<{
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}> {
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits', 'deriveKey'],
  );
  const [publicKeyJwk, privateKeyJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', pair.publicKey),
    crypto.subtle.exportKey('jwk', pair.privateKey),
  ]);
  return { publicKeyJwk, privateKeyJwk };
}

let _cached: IdentityRecord | undefined;

/**
 * Lee la identidad local; si no existe, la genera atómicamente.
 * Idempotente: llamadas concurrentes ven la misma identidad.
 */
export async function ensureIdentity(): Promise<IdentityRecord> {
  if (_cached) return _cached;
  const db = getDb();
  const existing = await db.identity.get(IDENTITY_TABLE_KEY);
  if (existing) {
    _cached = existing;
    return existing;
  }
  const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();
  const deviceId = await deriveDeviceId(publicKeyJwk);
  const record: IdentityRecord = {
    id: IDENTITY_TABLE_KEY,
    deviceId,
    publicKeyJwk,
    privateKeyJwk,
    nextSeq: 1,
    createdAt: new Date(),
  };
  // put() en lugar de add() por si una llamada concurrente nos adelantó.
  // En ese caso re-leemos el resultado real para no devolver un objeto
  // que conflicte con el ya persistido.
  await db.identity.put(record);
  const final = (await db.identity.get(IDENTITY_TABLE_KEY)) ?? record;
  _cached = final;
  return final;
}

/**
 * Reserva un seq monótono para una nueva Op. Se llama dentro de la
 * misma transacción Dexie que la mutación + inserción en `ops`.
 */
export async function reserveNextSeq(): Promise<{
  deviceId: string;
  seq: number;
}> {
  const db = getDb();
  const ident = await ensureIdentity();
  // Incremento atómico: leer el valor actual y escribir +1 dentro de
  // una transacción readwrite que solape con la del caller.
  const seq = ident.nextSeq;
  await db.identity.update(IDENTITY_TABLE_KEY, { nextSeq: seq + 1 });
  _cached = { ...ident, nextSeq: seq + 1 };
  return { deviceId: ident.deviceId, seq };
}

/** Para tests: limpia el cache en memoria. NO toca la BD. */
export function _resetIdentityCacheForTests(): void {
  _cached = undefined;
}
