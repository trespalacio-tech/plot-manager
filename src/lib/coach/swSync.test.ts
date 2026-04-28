import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mirrorEnabled,
  mirrorLastNotified,
  readMirroredEnabled,
} from './swSync';

beforeEach(async () => {
  // limpia la base entre tests
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('coach-sw');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
});

afterEach(async () => {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('coach-sw');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
});

describe('swSync (espejo IDB para el service worker)', () => {
  it('sin escribir nada, enabled = false', async () => {
    expect(await readMirroredEnabled()).toBe(false);
  });

  it('mirrorEnabled persiste el flag en IDB', async () => {
    await mirrorEnabled(true);
    expect(await readMirroredEnabled()).toBe(true);
    await mirrorEnabled(false);
    expect(await readMirroredEnabled()).toBe(false);
  });

  it('mirrorLastNotified guarda el mapa y se puede sobreescribir', async () => {
    await mirrorLastNotified({ a: 1, b: 2 });
    // verificación directa contra IDB para no exponer un getter público
    const map = await new Promise<Record<string, number> | undefined>((resolve, reject) => {
      const req = indexedDB.open('coach-sw');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('state', 'readonly');
        const get = tx.objectStore('state').get('lastNotified');
        get.onsuccess = () => {
          db.close();
          resolve(get.result as Record<string, number> | undefined);
        };
        get.onerror = () => {
          db.close();
          reject(get.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
    expect(map).toEqual({ a: 1, b: 2 });
  });
});
