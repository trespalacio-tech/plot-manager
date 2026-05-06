import { describe, expect, it } from 'vitest';
import {
  applyDelete,
  applyPut,
  buildPutFields,
  compareOps,
  deserializeValue,
  serializeValue,
  sortOps,
} from './merge';
import type { Op } from './types';

function put(
  deviceId: string,
  seq: number,
  ts: number,
  recordId: string,
  fields: Record<string, { value: unknown; ts?: number }>,
): Op {
  const built: Record<string, { value: unknown; ts: number }> = {};
  for (const [k, v] of Object.entries(fields)) {
    built[k] = { value: v.value, ts: v.ts ?? ts };
  }
  return {
    id: `${deviceId}:${seq}`,
    deviceId,
    seq,
    ts,
    table: 'farms',
    recordId,
    kind: 'PUT',
    fields: built,
  };
}

function del(
  deviceId: string,
  seq: number,
  ts: number,
  recordId: string,
): Op {
  return {
    id: `${deviceId}:${seq}`,
    deviceId,
    seq,
    ts,
    table: 'farms',
    recordId,
    kind: 'DELETE',
  };
}

describe('compareOps', () => {
  it('ordena por ts, luego deviceId, luego seq', () => {
    const a = put('zeta', 1, 100, 'r', { x: { value: 1 } });
    const b = put('alpha', 2, 100, 'r', { x: { value: 2 } });
    const c = put('alpha', 1, 90, 'r', { x: { value: 3 } });
    const d = put('alpha', 3, 100, 'r', { x: { value: 4 } });
    const sorted = [a, b, c, d].sort(compareOps);
    expect(sorted.map((o) => o.id)).toEqual([
      'alpha:1', // ts=90 (más antiguo)
      'alpha:2', // ts=100, deviceId=alpha
      'alpha:3', // ts=100, deviceId=alpha, seq mayor
      'zeta:1', // ts=100, deviceId=zeta
    ]);
  });
});

describe('applyPut LWW por campo', () => {
  it('crea registro nuevo con sus field-versions', () => {
    const op = put('A', 1, 100, 'r1', {
      name: { value: 'Hola' },
      area: { value: 1.5 },
    });
    const res = applyPut(undefined, op);
    expect(res.changed).toBe(true);
    expect(res.record.name).toBe('Hola');
    expect(res.record.area).toBe(1.5);
    expect(res.record._fv).toEqual({ name: 100, area: 100 });
  });

  it('preserva campos editados por otro peer si tienen ts mayor', () => {
    const baseOp = put('A', 1, 100, 'r1', {
      name: { value: 'Hola' },
      area: { value: 1 },
    });
    const r1 = applyPut(undefined, baseOp).record;
    // B edita name más tarde
    const opB = put('B', 1, 200, 'r1', { name: { value: 'Mundo' } });
    const r2 = applyPut(r1, opB).record;
    // Después llega A con area en t=150 (no debe pisar name)
    const opA2 = put('A', 2, 150, 'r1', { area: { value: 2 } });
    const r3 = applyPut(r2, opA2).record;
    expect(r3.name).toBe('Mundo');
    expect(r3.area).toBe(2);
    expect(r3._fv).toEqual({ name: 200, area: 150 });
  });

  it('ignora ops obsoletas (ts menor que el actual del campo)', () => {
    const op1 = put('A', 1, 200, 'r1', { name: { value: 'Nuevo' } });
    const op2 = put('B', 1, 100, 'r1', { name: { value: 'Viejo' } });
    let r = applyPut(undefined, op1).record;
    const res = applyPut(r, op2);
    expect(res.changed).toBe(false);
    expect(res.record.name).toBe('Nuevo');
  });

  it('converge independientemente del orden de aplicación', () => {
    // Tres ops desde dos dispositivos editando campos distintos y un campo común.
    const ops = [
      put('A', 1, 100, 'r', { name: { value: 'A1' }, count: { value: 1 } }),
      put('B', 1, 200, 'r', { name: { value: 'B1' }, color: { value: 'red' } }),
      put('A', 2, 300, 'r', { count: { value: 9 } }),
    ];
    const order1 = sortOps(ops);
    const order2 = [ops[2]!, ops[0]!, ops[1]!].sort(compareOps);
    const apply = (list: Op[]) => {
      let rec: any = undefined;
      for (const o of list) rec = applyPut(rec, o).record;
      return { name: rec.name, count: rec.count, color: rec.color };
    };
    expect(apply(order1)).toEqual(apply(order2));
    expect(apply(order1)).toEqual({ name: 'B1', count: 9, color: 'red' });
  });
});

describe('applyDelete (tombstones)', () => {
  it('marca tombstone si delete es más reciente', () => {
    const r = applyPut(undefined, put('A', 1, 100, 'r', { x: { value: 1 } })).record;
    const res = applyDelete(r, del('B', 1, 200, 'r'));
    expect(res.changed).toBe(true);
    expect(res.record!._deletedAt).toBe(200);
  });

  it('un PUT más reciente "resucita" tras tombstone', () => {
    const r1 = applyDelete(undefined, del('A', 1, 100, 'r')).record!;
    const r2 = applyPut(r1, put('B', 1, 200, 'r', { x: { value: 5 } })).record;
    expect(r2._deletedAt).toBeUndefined();
    expect(r2.x).toBe(5);
  });

  it('un PUT más antiguo NO resucita un tombstone reciente', () => {
    const r1 = applyDelete(undefined, del('A', 1, 200, 'r')).record!;
    const r2 = applyPut(r1, put('B', 1, 100, 'r', { x: { value: 5 } })).record;
    expect(r2._deletedAt).toBe(200);
    expect(r2.x).toBeUndefined();
  });
});

describe('serializeValue / deserializeValue', () => {
  it('round-trip de Date → ISO → Date', () => {
    const d = new Date('2026-05-07T10:00:00.000Z');
    const ser = serializeValue(d);
    const back = deserializeValue(ser);
    expect(back).toBeInstanceOf(Date);
    expect((back as Date).toISOString()).toBe(d.toISOString());
  });

  it('round-trip de objetos anidados con fechas', () => {
    const v = { name: 'X', when: new Date('2026-01-01'), nums: [1, 2, 3] };
    const ser = serializeValue(v);
    const back = deserializeValue(ser) as typeof v;
    expect(back.name).toBe('X');
    expect(back.when).toBeInstanceOf(Date);
    expect(back.nums).toEqual([1, 2, 3]);
  });
});

describe('buildPutFields', () => {
  it('omite campos undefined y los internos _fv/_deletedAt', () => {
    const fields = buildPutFields(
      { a: 1, b: undefined, _fv: { x: 1 }, _deletedAt: 99, c: 'x' },
      500,
    );
    expect(Object.keys(fields).sort()).toEqual(['a', 'c']);
    expect(fields.a!.ts).toBe(500);
  });
});
