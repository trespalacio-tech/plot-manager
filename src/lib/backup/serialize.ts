import type { SerializedBlob } from './types';

export function isSerializedBlob(v: unknown): v is SerializedBlob {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as { __blob?: unknown }).__blob === true &&
    typeof (v as { base64?: unknown }).base64 === 'string'
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunk, bytes.length)),
    );
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('blob read failed'));
    reader.readAsArrayBuffer(blob);
  });
}

export async function blobToSerialized(blob: Blob): Promise<SerializedBlob> {
  const bytes = await readBlobBytes(blob);
  return {
    __blob: true,
    type: blob.type || 'application/octet-stream',
    base64: bytesToBase64(bytes),
  };
}

export function serializedToBlob(s: SerializedBlob): Blob {
  const bytes = base64ToBytes(s.base64);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new Blob([buffer], { type: s.type });
}

const BLOB_CTOR =
  typeof Blob !== 'undefined' ? Blob : (null as unknown as typeof Blob);

export async function serializeRowDeep(
  value: unknown,
  options: { includeBlobs: boolean },
): Promise<unknown> {
  if (value === null || value === undefined) return value;
  if (BLOB_CTOR && value instanceof BLOB_CTOR) {
    return options.includeBlobs ? await blobToSerialized(value) : null;
  }
  if (value instanceof Date) {
    return { __date: true, iso: value.toISOString() };
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      const ser = await serializeRowDeep(item, options);
      if (ser !== null || options.includeBlobs) out.push(ser);
    }
    return out;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const ser = await serializeRowDeep(v, options);
      if (ser === null && !options.includeBlobs && BLOB_CTOR && v instanceof BLOB_CTOR) {
        continue;
      }
      out[k] = ser;
    }
    return out;
  }
  return value;
}

export function deserializeRowDeep(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(deserializeRowDeep);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (isSerializedBlob(obj)) return serializedToBlob(obj as SerializedBlob);
    if (obj.__date === true && typeof obj.iso === 'string') {
      return new Date(obj.iso);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = deserializeRowDeep(v);
    }
    return out;
  }
  return value;
}
