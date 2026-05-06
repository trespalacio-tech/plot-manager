/**
 * Op-log local-first.
 *
 * Cada mutación de un repo (createX/updateX/deleteX) registra una `Op`
 * además del cambio. El log es la fuente de verdad sincronizable: dos
 * dispositivos convergen aplicando las ops del otro en orden total
 * (timestamp, deviceId como tiebreak determinista).
 *
 * Estrategia de merge: LWW por campo (`OpField`). Si dos dispositivos
 * editan campos distintos del mismo registro, ambos cambios se preservan;
 * si editan el mismo campo, gana el de mayor timestamp.
 */

export type OpKind = 'PUT' | 'DELETE';

/** Tablas de Dexie que el op-log sincroniza (excluye ops y peers). */
export const SYNCABLE_TABLES = [
  'farms',
  'parcels',
  'parcelStatusHistory',
  'varieties',
  'plants',
  'soilSamples',
  'soilAnalyses',
  'fieldLogEntries',
  'inputApplications',
  'coverCrops',
  'biodiversityFeatures',
  'transitionPlans',
  'milestones',
  'phenologyObservations',
  'pestMonitorings',
  'harvests',
  'tasks',
  'alerts',
] as const;

export type SyncableTable = (typeof SYNCABLE_TABLES)[number];

/**
 * Un campo serializable con su timestamp de modificación. Permite merge
 * LWW por campo individual: si Móvil cambia .name en t=10 y Portátil
 * cambia .notes en t=12, el merge final tiene name(t=10) y notes(t=12)
 * sin pérdida.
 */
export interface OpField {
  /** Valor serializado JSON. Las fechas viajan como ISO string. */
  value: unknown;
  /** Timestamp epoch ms de la edición de ESE campo. */
  ts: number;
}

export interface Op {
  /** Identificador estable: `${deviceId}:${seq}`. */
  id: string;
  /** Dispositivo emisor (hash corto de la pubkey ECDH). */
  deviceId: string;
  /** Secuencia monótona dentro del dispositivo. */
  seq: number;
  /** Timestamp epoch ms del registro de la op. */
  ts: number;
  /** Tabla Dexie afectada. */
  table: SyncableTable;
  /** Id del registro en esa tabla. */
  recordId: string;
  /** PUT crea o actualiza; DELETE marca borrado. */
  kind: OpKind;
  /**
   * Cuando kind = 'PUT', mapa de campo → {value, ts}. El timestamp
   * por campo permite merge granular. En PUT inicial todos los campos
   * comparten el ts de la op.
   */
  fields?: Record<string, OpField>;
}

/**
 * Vector clock: por cada peer conocido, el último seq cuya op ya
 * aplicamos. Permite a otro peer mandarnos solo lo que nos falta.
 */
export type VectorClock = Record<string, number>;

export interface PeerRecord {
  /** deviceId del peer (hash de pubkey). */
  id: string;
  /** Pubkey ECDH del peer en JWK serializado, para auth en futuras sesiones. */
  publicKeyJwk: JsonWebKey;
  /** Nombre amigable que el usuario asignó al peer ("Móvil de Rubén"). */
  name?: string;
  /** Última vez que sincronizamos con éxito. */
  lastSyncAt?: Date;
  /** Cuántas ops del peer hemos aplicado (último seq visto). */
  lastSeenSeq: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Estado de la propia identidad ECDH almacenada localmente. */
export interface IdentityRecord {
  id: 'self';
  /** deviceId derivado: sha256(pubKeyRaw).slice(0, 16) en hex. */
  deviceId: string;
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
  /** Contador monótono local de ops emitidas. */
  nextSeq: number;
  createdAt: Date;
}
