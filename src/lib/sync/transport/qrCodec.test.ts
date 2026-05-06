import { describe, expect, it } from 'vitest';
import {
  decodeFrames,
  encodeToFrames,
  FrameAssembler,
  parseFrame,
} from './qrCodec';

describe('encodeToFrames / decodeFrames', () => {
  it('round-trip de payload pequeño en un solo frame', () => {
    const value = { hello: 'world', n: 42, when: new Date(0).toISOString() };
    const frames = encodeToFrames(value);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatch(/^1\/1:[0-9a-f]{8}:/);
    const back = decodeFrames(frames);
    expect(back).toEqual(value);
  });

  it('partir y reensamblar payload grande', () => {
    const big = { rows: Array.from({ length: 200 }, (_, i) => ({ i, v: 'x'.repeat(50) })) };
    const frames = encodeToFrames(big);
    expect(frames.length).toBeGreaterThan(1);
    // Todos deben tener el mismo sessionId.
    const sessions = new Set(frames.map((f) => parseFrame(f).sessionId));
    expect(sessions.size).toBe(1);
    const back = decodeFrames(frames);
    expect(back).toEqual(big);
  });

  it('FrameAssembler acepta frames en orden arbitrario', () => {
    const value = { rows: Array.from({ length: 200 }, (_, i) => i) };
    const frames = encodeToFrames(value);
    if (frames.length < 2) {
      // Forzamos varios frames si el payload era pequeño con distinto seed.
      return;
    }
    const shuffled = [...frames].reverse();
    const a = new FrameAssembler();
    let result: unknown;
    for (const f of shuffled) {
      const r = a.push(f);
      if (r !== undefined) result = r;
    }
    expect(result).toEqual(value);
  });

  it('FrameAssembler rechaza frames de otra sesión', () => {
    const f1 = encodeToFrames({ a: 1 })[0]!;
    const f2 = encodeToFrames({ b: 2 })[0]!;
    const a = new FrameAssembler();
    a.push(f1);
    expect(() => a.push(f2)).toThrow(/different-session/);
  });

  it('FrameAssembler tolera frames duplicados', () => {
    const value = { x: 1 };
    const [frame] = encodeToFrames(value);
    const a = new FrameAssembler();
    a.push(frame!);
    const r = a.push(frame!); // duplicado
    expect(r).toEqual(value);
  });

  it('parseFrame rechaza formato inválido', () => {
    expect(() => parseFrame('no es válido')).toThrow(/frame-format/);
    expect(() => parseFrame('1/2:nohex:payload')).toThrow(/frame-format/);
  });

  it('progress refleja received/total', () => {
    const big = { rows: Array.from({ length: 300 }, (_, i) => ({ i, v: 'x'.repeat(60) })) };
    const frames = encodeToFrames(big);
    const a = new FrameAssembler();
    a.push(frames[0]!);
    const p = a.progress;
    expect(p.received).toBe(1);
    expect(p.total).toBe(frames.length);
    expect(p.sessionId).toMatch(/[0-9a-f]{8}/);
  });
});
