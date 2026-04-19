import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from '../db';
import { acknowledgeAlert, createAlert, deleteAlert, listAlerts } from '.';

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

describe('alerts repo', () => {
  it('ordena por severidad descendente y excluye reconocidas por defecto', async () => {
    await createAlert({
      severity: 'INFO',
      title: 'info',
      message: 'm',
      triggerSource: 'x',
    });
    const warn = await createAlert({
      severity: 'WARNING',
      title: 'warn',
      message: 'm',
      triggerSource: 'x',
    });
    await createAlert({
      severity: 'CRITICAL',
      title: 'crit',
      message: 'm',
      triggerSource: 'x',
    });

    let rows = await listAlerts();
    expect(rows.map((a) => a.title)).toEqual(['crit', 'warn', 'info']);

    await acknowledgeAlert(warn.id);
    rows = await listAlerts();
    expect(rows.map((a) => a.title)).toEqual(['crit', 'info']);

    rows = await listAlerts({ includeAcknowledged: true });
    expect(rows.map((a) => a.title)).toEqual(['crit', 'warn', 'info']);
  });

  it('filtra por parcela, severidad y triggerSource', async () => {
    await createAlert({
      parcelId: 'p1',
      severity: 'WARNING',
      title: 'p1-w',
      message: 'm',
      triggerSource: 'soil',
    });
    await createAlert({
      parcelId: 'p2',
      severity: 'CRITICAL',
      title: 'p2-c',
      message: 'm',
      triggerSource: 'season',
    });
    expect((await listAlerts({ parcelId: 'p1' })).map((a) => a.title)).toEqual(['p1-w']);
    expect((await listAlerts({ severity: 'CRITICAL' })).map((a) => a.title)).toEqual(['p2-c']);
    expect((await listAlerts({ triggerSource: 'season' })).map((a) => a.title)).toEqual(['p2-c']);
  });

  it('excluye alertas expiradas salvo que se pida', async () => {
    await createAlert({
      severity: 'INFO',
      title: 'viva',
      message: 'm',
      triggerSource: 'x',
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    await createAlert({
      severity: 'INFO',
      title: 'vencida',
      message: 'm',
      triggerSource: 'x',
      expiresAt: new Date(Date.now() - 1000 * 60),
    });
    expect((await listAlerts()).map((a) => a.title)).toEqual(['viva']);
    const all = await listAlerts({ includeExpired: true });
    expect(all.map((a) => a.title).sort()).toEqual(['vencida', 'viva']);
  });

  it('deleteAlert elimina la alerta', async () => {
    const a = await createAlert({
      severity: 'INFO',
      title: 't',
      message: 'm',
      triggerSource: 'x',
    });
    await deleteAlert(a.id);
    expect(await listAlerts({ includeAcknowledged: true, includeExpired: true })).toHaveLength(0);
  });
});
