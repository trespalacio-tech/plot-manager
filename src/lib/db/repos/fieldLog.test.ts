import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDbForTests, getDb } from '../db';
import {
  createFarm,
  createFieldLogEntry,
  createParcel,
  listFieldLogEntries,
  summarizeEntries,
  updateFieldLogEntry,
  voidFieldLogEntry,
} from '.';

async function setup() {
  const farm = await createFarm({
    name: 'F',
    municipality: 'Burgos',
    province: 'Burgos',
  });
  const p1 = await createParcel({
    farmId: farm.id,
    name: 'P1',
    areaHa: 1,
    status: 'REGENERATIVE',
    cropType: 'FRUIT_TREE',
    irrigation: 'DRIP',
  });
  const p2 = await createParcel({
    farmId: farm.id,
    name: 'P2',
    areaHa: 2,
    status: 'TRANSITION',
    cropType: 'VINEYARD',
    irrigation: 'DRIP',
  });
  return { farm, p1, p2 };
}

beforeEach(() => {
  resetDbForTests();
});

afterEach(async () => {
  const db = getDb();
  const name = db.name;
  db.close();
  await indexedDB.deleteDatabase(name);
});

describe('fieldLog repo', () => {
  it('ordena por fecha descendente y excluye anuladas por defecto', async () => {
    const { p1 } = await setup();
    const a = await createFieldLogEntry({
      date: new Date('2026-04-01'),
      parcelIds: [p1.id],
      type: 'MULCHING',
      title: 'Acolchado bajo copa',
    });
    await createFieldLogEntry({
      date: new Date('2026-04-10'),
      parcelIds: [p1.id],
      type: 'PRUNING',
      title: 'Poda verde',
    });
    await voidFieldLogEntry(a.id, 'duplicada');

    const rows = await listFieldLogEntries();
    expect(rows.map((r) => r.title)).toEqual(['Poda verde']);

    const withVoided = await listFieldLogEntries({ includeVoided: true });
    expect(withVoided).toHaveLength(2);
  });

  it('filtra por parcela, tipo, rango de fechas y texto', async () => {
    const { p1, p2 } = await setup();
    await createFieldLogEntry({
      date: new Date('2026-03-01'),
      parcelIds: [p1.id],
      type: 'MULCHING',
      title: 'Acolchado primavera',
      description: 'paja cebada',
    });
    await createFieldLogEntry({
      date: new Date('2026-04-01'),
      parcelIds: [p2.id],
      type: 'PRUNING',
      title: 'Poda vid',
    });
    await createFieldLogEntry({
      date: new Date('2026-04-10'),
      parcelIds: [p1.id, p2.id],
      type: 'MOWING',
      title: 'Siega cubierta',
    });

    expect(
      (await listFieldLogEntries({ parcelId: p2.id })).map((r) => r.title),
    ).toEqual(['Siega cubierta', 'Poda vid']);
    expect(
      (await listFieldLogEntries({ type: 'MULCHING' })).map((r) => r.title),
    ).toEqual(['Acolchado primavera']);
    expect(
      (await listFieldLogEntries({ dateFrom: new Date('2026-04-05') })).map((r) => r.title),
    ).toEqual(['Siega cubierta']);
    expect(
      (await listFieldLogEntries({ search: 'cebada' })).map((r) => r.title),
    ).toEqual(['Acolchado primavera']);
  });

  it('no permite editar una entrada anulada', async () => {
    const { p1 } = await setup();
    const e = await createFieldLogEntry({
      date: new Date('2026-04-01'),
      parcelIds: [p1.id],
      type: 'PRUNING',
      title: 'Poda',
    });
    await voidFieldLogEntry(e.id, 'error operador');
    await expect(updateFieldLogEntry(e.id, { title: 'nuevo' })).rejects.toThrow();
  });

  it('exige motivo para anular', async () => {
    const { p1 } = await setup();
    const e = await createFieldLogEntry({
      date: new Date('2026-04-01'),
      parcelIds: [p1.id],
      type: 'PRUNING',
      title: 'Poda',
    });
    await expect(voidFieldLogEntry(e.id, '   ')).rejects.toThrow();
  });

  it('summarizeEntries suma duración y coste sin contar anuladas', async () => {
    const { p1 } = await setup();
    await createFieldLogEntry({
      date: new Date('2026-04-01'),
      parcelIds: [p1.id],
      type: 'PRUNING',
      title: 'Poda',
      durationMinutes: 120,
      costEur: 50,
    });
    const voided = await createFieldLogEntry({
      date: new Date('2026-04-02'),
      parcelIds: [p1.id],
      type: 'MOWING',
      title: 'Siega',
      durationMinutes: 60,
      costEur: 30,
    });
    await voidFieldLogEntry(voided.id, 'error');
    const all = await listFieldLogEntries({ includeVoided: true });
    const s = summarizeEntries(all);
    expect(s.count).toBe(1);
    expect(s.totalDurationMinutes).toBe(120);
    expect(s.totalCostEur).toBe(50);
    expect(s.byType.PRUNING).toBe(1);
  });
});
