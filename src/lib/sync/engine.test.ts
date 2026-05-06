import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from '@/lib/db/db';
import { createFarm, createTask, updateFarm } from '@/lib/db/repos';
import { runSyncSession } from './engine';
import { _resetIdentityCacheForTests } from './identity';

/**
 * Mock de DataChannel emparejado: dos extremos donde send() del uno
 * dispara onmessage del otro de forma síncrona pero asíncrona-segura
 * (microtask), simulando el comportamiento del DataChannel real.
 */
function makePairedChannels(): { a: any; b: any } {
  const a: any = { readyState: 'open' };
  const b: any = { readyState: 'open' };
  a.send = (data: string) => {
    queueMicrotask(() => b.onmessage?.({ data }));
  };
  b.send = (data: string) => {
    queueMicrotask(() => a.onmessage?.({ data }));
  };
  return { a, b };
}

describe('runSyncSession (in-memory)', () => {
  // Un solo navegador no puede tener dos identidades distintas a la vez
  // (la BD es global). Simulamos sync entre el local y un peer "B"
  // inyectando ops directamente como si vinieran de B.
  beforeEach(() => {
    resetDbForTests();
    _resetIdentityCacheForTests();
  });

  afterEach(async () => {
    const db = getDb();
    const name = db.name;
    db.close();
    await indexedDB.deleteDatabase(name);
  });

  it('sync simétrico: dos engines hablan, intercambian DONE', async () => {
    // Preparamos algunos datos locales que mandar al "peer".
    const farm = await createFarm({
      name: 'F',
      municipality: 'Aranda',
      province: 'Burgos',
    });
    await updateFarm(farm.id, { altitudeM: 850 });
    await createTask({
      source: 'USER',
      type: 'OTHER',
      title: 'T1',
      rationale: 'r',
      priority: 'LOW',
    });

    // Ambos extremos comparten la MISMA BD en este test (fake-indexeddb).
    // No tiene sentido aplicar las propias ops al volver, pero el engine
    // es idempotente: aplicar una op ya conocida es no-op. Lo que probamos
    // aquí es que el handshake completo funciona y termina sin error.
    const { a, b } = makePairedChannels();
    const [statsA, statsB] = await Promise.all([
      runSyncSession(a),
      runSyncSession(b),
    ]);
    expect(statsA.peerDeviceId).toBe(statsB.peerDeviceId); // misma identidad en este test
    expect(statsA.durationMs).toBeGreaterThan(0);
  });

  it('sync ignora ops ya conocidas (idempotencia)', async () => {
    await createFarm({
      name: 'F',
      municipality: 'Aranda',
      province: 'Burgos',
    });
    const { a, b } = makePairedChannels();
    const [statsA] = await Promise.all([
      runSyncSession(a),
      runSyncSession(b),
    ]);
    // Como ambos lados tienen las mismas ops, appliedOps debería ser 0.
    expect(statsA.appliedOps).toBe(0);
  });

  it('persiste el peer tras sincronización con éxito', async () => {
    const { a, b } = makePairedChannels();
    await Promise.all([runSyncSession(a), runSyncSession(b)]);
    const peers = await getDb().peers.toArray();
    expect(peers.length).toBeGreaterThan(0);
    expect(peers[0]!.lastSyncAt).toBeInstanceOf(Date);
  });
});
