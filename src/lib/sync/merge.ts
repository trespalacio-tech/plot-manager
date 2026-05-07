import type { Op, OpField } from './types';

/**
 * Lógica pura del merge LWW por campo.
 *
 * El motor de aplicación (applyOp) es asíncrono porque toca Dexie; aquí
 * vive la parte pura para tener convergencia testeable sin BD.
 */

/**
 * Orden total determinista entre dos ops:
 *  1. Por timestamp ascendente (la más antigua primero).
 *  2. A igual ts, por deviceId lexicográfico (tiebreak estable).
 *  3. A igual deviceId, por seq.
 */
export function compareOps(a: Op, b: Op): number {
  if (a.ts !== b.ts) return a.ts - b.ts;
  if (a.deviceId !== b.deviceId) return a.deviceId.localeCompare(b.deviceId);
  return a.seq - b.seq;
}

/**
 * Marcador de borrado. Lo materializamos en el campo virtual
 * `_deletedAt` para poder distinguir un registro borrado de uno
 * inexistente. Los repos respetan esta marca.
 */
export const TOMBSTONE_FIELD = '_deletedAt';

interface RecordWithFieldVersions {
  /** Versión del registro (timestamps por campo) para LWW. */
  _fv?: Record<string, number>;
  /** Marcador tombstone si el registro fue borrado. */
  _deletedAt?: number;
  [key: string]: unknown;
}

/**
 * Aplica una op PUT sobre un registro previo (puede ser undefined).
 * Para cada campo del payload, escribe el valor sólo si su ts es
 * estrictamente mayor que el ts ya registrado para ese campo.
 *
 * Devuelve un objeto NUEVO si hubo cambios; el mismo objeto si la op
 * llegó "tarde" y todos sus campos son obsoletos.
 */
export function applyPut<T extends RecordWithFieldVersions>(
  current: T | undefined,
  op: Op,
): { record: T; changed: boolean } {
  if (op.kind !== 'PUT') {
    throw new Error('applyPut requires kind=PUT');
  }
  const existing = current ?? ({} as T);
  const fv = { ...(existing._fv ?? {}) };
  let changed = !current; // si era undefined, ya hay cambio
  const next: RecordWithFieldVersions = { ...existing };

  // Si llega una op PUT pero el registro ya tenía tombstone más reciente,
  // ignoramos: el delete gana (LWW tombstone como cualquier campo).
  const deletedAt = existing._deletedAt;
  if (deletedAt !== undefined && deletedAt > op.ts) {
    return { record: existing as T, changed: false };
  }
  // Si la op trae un PUT más nuevo que un tombstone previo, "resucita"
  // el registro: limpiamos tombstone para que vuelva a ser visible.
  if (deletedAt !== undefined && deletedAt <= op.ts) {
    delete next._deletedAt;
    changed = true;
  }

  for (const [field, info] of Object.entries(op.fields ?? {})) {
    const prevTs = fv[field] ?? 0;
    if (info.ts > prevTs) {
      next[field] = info.value;
      fv[field] = info.ts;
      changed = true;
    }
  }
  next._fv = fv;
  return { record: next as T, changed };
}

/**
 * Aplica una op DELETE.
 *
 * El DELETE compite no solo contra otros DELETE (vía _deletedAt) sino
 * contra TODOS los timestamps por campo: si algún PUT más reciente ya
 * editó la fila, el DELETE pierde y se ignora. Esto preserva la
 * intuición LWW correcta: "lo último que pasó manda".
 *
 * No elimina físicamente la fila aunque gane: deja `_deletedAt` como
 * tombstone para que un PUT posterior con ts mayor pueda resucitar el
 * registro de forma determinista.
 */
export function applyDelete<T extends RecordWithFieldVersions>(
  current: T | undefined,
  op: Op,
): { record: T | undefined; changed: boolean } {
  if (op.kind !== 'DELETE') {
    throw new Error('applyDelete requires kind=DELETE');
  }
  if (!current) {
    // Tombstone "huérfano": creamos registro vacío con tombstone.
    return {
      record: { _deletedAt: op.ts, _fv: {} } as unknown as T,
      changed: true,
    };
  }
  const existing = current as RecordWithFieldVersions;
  const prevDeletedAt = existing._deletedAt ?? 0;
  // Comparamos contra el ts más reciente conocido de la fila: tombstone
  // previo y todos los _fv. Si el DELETE no es estrictamente posterior,
  // pierde.
  let mostRecentTs = prevDeletedAt;
  for (const fieldTs of Object.values(existing._fv ?? {})) {
    if (fieldTs > mostRecentTs) mostRecentTs = fieldTs;
  }
  if (mostRecentTs >= op.ts) {
    return { record: current, changed: false };
  }
  const next: RecordWithFieldVersions = { ...existing, _deletedAt: op.ts };
  return { record: next as T, changed: true };
}

/**
 * Materializa una Op desde un patch arbitrario al timestamp dado.
 * Útil cuando un repo escribe un updateX(id, patch) y queremos generar
 * la op correspondiente con todos los campos del patch al mismo ts.
 */
export function buildPutFields(
  patch: Record<string, unknown>,
  ts: number,
): Record<string, OpField> {
  const fields: Record<string, OpField> = {};
  for (const [key, value] of Object.entries(patch)) {
    // Saltar undefined: significa "no tocar" (Dexie tampoco escribe).
    if (value === undefined) continue;
    // Saltar campos internos de versionado para no recursar.
    if (key === '_fv' || key === '_deletedAt') continue;
    fields[key] = { value: serializeValue(value), ts };
  }
  return fields;
}

/**
 * Serialización JSON-amigable. Las fechas viajan como ISO string para
 * sobrevivir el round-trip por el DataChannel (que es texto).
 */
export function serializeValue(value: unknown): unknown {
  if (value instanceof Date) return { __date: value.toISOString() };
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object' && !(value instanceof Blob)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serializeValue(v);
    return out;
  }
  return value;
}

export function deserializeValue(value: unknown): unknown {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.__date === 'string') return new Date(v.__date);
    if (Array.isArray(value)) return value.map(deserializeValue);
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) out[k] = deserializeValue(val);
    return out;
  }
  return value;
}

/** Ordena un lote de ops para aplicarlas en orden total. */
export function sortOps(ops: Op[]): Op[] {
  return [...ops].sort(compareOps);
}
