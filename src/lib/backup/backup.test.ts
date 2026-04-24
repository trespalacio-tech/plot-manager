import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db/db';
import { createFarm, createParcel, createFieldLogEntry } from '@/lib/db/repos';
import {
  exportAllToSnapshot,
  parseSnapshot,
  restoreSnapshot,
  snapshotToJsonString,
  summarizeSnapshot,
  validateSnapshot,
  BackupValidationError,
  BACKUP_FORMAT_VERSION,
} from './index';
import {
  blobToSerialized,
  isSerializedBlob,
  serializedToBlob,
  serializeRowDeep,
  deserializeRowDeep,
} from './serialize';
import {
  AUTO_BACKUP_LIMIT,
  clearAutoBackups,
  getAutoBackupDb,
  listAutoBackups,
  recordAutoBackup,
  resetAutoBackupDbForTests,
} from './auto';

beforeEach(() => {
  resetDbForTests();
  resetAutoBackupDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const dbName = db.name;
  db.close();
  await indexedDB.deleteDatabase(dbName);

  const auto = getAutoBackupDb();
  const autoName = auto.name;
  auto.close();
  await indexedDB.deleteDatabase(autoName);
});

async function seedSample() {
  const farm = await createFarm({
    name: 'Finca demo',
    municipality: 'Burgos',
    province: 'Burgos',
  });
  const parcel = await createParcel({
    farmId: farm.id,
    name: 'Parcela 1',
    areaHa: 1.5,
    status: 'TRANSITION',
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  });
  await createFieldLogEntry({
    date: new Date('2026-04-15'),
    parcelIds: [parcel.id],
    type: 'PRUNING',
    title: 'Poda verde',
    description: 'Aclareo ligero',
    durationMinutes: 60,
    costEur: 12.5,
  });
  return { farm, parcel };
}

describe('serialize', () => {
  it('round-trips Blob via base64', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5])], {
      type: 'application/octet-stream',
    });
    const ser = await blobToSerialized(blob);
    expect(isSerializedBlob(ser)).toBe(true);
    expect(ser.type).toBe('application/octet-stream');
    expect(ser.base64).toBe(btoa(String.fromCharCode(1, 2, 3, 4, 5)));
    const back = serializedToBlob(ser);
    expect(back.type).toBe('application/octet-stream');
    expect(back.size).toBe(5);
  });

  it('serializa Date como objeto __date y lo restaura', async () => {
    const original = { when: new Date('2026-04-01T10:00:00Z'), n: 7 };
    const ser = (await serializeRowDeep(original, { includeBlobs: true })) as {
      when: { __date: true; iso: string };
      n: number;
    };
    expect(ser.when.__date).toBe(true);
    expect(ser.n).toBe(7);
    const back = deserializeRowDeep(ser) as { when: Date; n: number };
    expect(back.when).toBeInstanceOf(Date);
    expect(back.when.toISOString()).toBe('2026-04-01T10:00:00.000Z');
  });

  it('deja Blobs fuera cuando includeBlobs=false', async () => {
    const row = { id: 'x', file: new Blob(['hi'], { type: 'text/plain' }) };
    const ser = (await serializeRowDeep(row, { includeBlobs: false })) as Record<
      string,
      unknown
    >;
    expect(ser.id).toBe('x');
    expect(ser.file).toBeUndefined();
  });
});

describe('exportAllToSnapshot', () => {
  it('captura las tablas y los counts cuadran con la base de datos', async () => {
    await seedSample();
    const snap = await exportAllToSnapshot({ includeBlobs: true });
    expect(snap.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(snap.counts.farms).toBe(1);
    expect(snap.counts.parcels).toBe(1);
    expect(snap.counts.fieldLogEntries).toBe(1);
    expect(snap.includesBlobs).toBe(true);
    expect(typeof snap.exportedAt).toBe('string');
  });
});

describe('validateSnapshot / parseSnapshot', () => {
  it('rechaza JSON sin formatVersion', () => {
    expect(() => validateSnapshot({ data: {} })).toThrow(BackupValidationError);
  });

  it('rechaza formato futuro no soportado', () => {
    expect(() =>
      validateSnapshot({
        formatVersion: 999,
        appVersion: '1',
        exportedAt: new Date().toISOString(),
        data: {},
      }),
    ).toThrow(BackupValidationError);
  });

  it('parseSnapshot valida JSON malformado', () => {
    expect(() => parseSnapshot('{not json')).toThrow(BackupValidationError);
  });
});

describe('restoreSnapshot', () => {
  it('reemplaza los datos locales con los del snapshot', async () => {
    await seedSample();
    const original = await exportAllToSnapshot({ includeBlobs: true });

    // Simulate user mutation
    const farm2 = await createFarm({
      name: 'Otra finca',
      municipality: 'Burgos',
      province: 'Burgos',
    });
    expect((await getDb().farms.toArray()).length).toBe(2);

    const result = await restoreSnapshot(original);
    expect(result.totalInserted).toBeGreaterThan(0);

    const farms = await getDb().farms.toArray();
    expect(farms.length).toBe(1);
    expect(farms[0]!.name).toBe('Finca demo');
    void farm2;

    // Date round-trip
    const entry = (await getDb().fieldLogEntries.toArray())[0]!;
    expect(entry.date).toBeInstanceOf(Date);
    expect(entry.title).toBe('Poda verde');
  });

  it('export → JSON → parse → restore es estable', async () => {
    await seedSample();
    const snap = await exportAllToSnapshot({ includeBlobs: false });
    const json = snapshotToJsonString(snap);
    const parsed = parseSnapshot(json);
    const summary = summarizeSnapshot(parsed);
    expect(summary.totalRows).toBeGreaterThan(0);
    await restoreSnapshot(parsed);
    expect(await getDb().farms.count()).toBe(1);
    expect(await getDb().parcels.count()).toBe(1);
  });
});

describe('auto backups', () => {
  it('rotación: conserva máximo AUTO_BACKUP_LIMIT snapshots', async () => {
    await seedSample();
    for (let i = 0; i < AUTO_BACKUP_LIMIT + 3; i++) {
      await recordAutoBackup();
    }
    const list = await listAutoBackups();
    expect(list.length).toBe(AUTO_BACKUP_LIMIT);
    // Ordered desc by createdAt
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1]!.createdAt.getTime()).toBeGreaterThanOrEqual(
        list[i]!.createdAt.getTime(),
      );
    }
  });

  it('clearAutoBackups vacía el historial', async () => {
    await seedSample();
    await recordAutoBackup();
    expect((await listAutoBackups()).length).toBe(1);
    await clearAutoBackups();
    expect((await listAutoBackups()).length).toBe(0);
  });
});
