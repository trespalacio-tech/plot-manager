import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { _makeLiveSyncForTests } from './live';

/**
 * Tests del LiveSyncManager con mocks de RTCDataChannel/RTCPeerConnection.
 * No usamos el singleton global para no contaminar entre tests.
 */

interface MockChannel {
  readyState: 'open' | 'closed';
  sent: string[];
  onmessage?: (e: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  send(data: string): void;
  close(): void;
  /** Simula que llega un mensaje desde el otro extremo. */
  receive(data: string): void;
}

interface MockPC {
  closed: boolean;
  close(): void;
}

function makeMockChannel(): MockChannel {
  const ch: MockChannel = {
    readyState: 'open',
    sent: [],
    send(data: string) {
      this.sent.push(data);
    },
    close() {
      this.readyState = 'closed';
      this.onclose?.();
    },
    receive(data: string) {
      this.onmessage?.({ data });
    },
  };
  return ch;
}

function makeMockPC(): MockPC {
  return {
    closed: false,
    close() {
      this.closed = true;
    },
  };
}

describe('LiveSyncManager', () => {
  let live: ReturnType<typeof _makeLiveSyncForTests>;

  beforeEach(() => {
    live = _makeLiveSyncForTests();
  });

  afterEach(() => {
    live.disconnectAll();
  });

  it('attach añade peer y livePeers/isLive lo reflejan', () => {
    const ch = makeMockChannel();
    const pc = makeMockPC();
    live.attach('peer-A', ch as unknown as RTCDataChannel, pc as unknown as RTCPeerConnection);
    expect(live.livePeers()).toEqual(['peer-A']);
    expect(live.isLive('peer-A')).toBe(true);
    expect(live.isLive('peer-B')).toBe(false);
  });

  it('broadcast envía LIVE_OP a todos los canales abiertos', () => {
    const ch1 = makeMockChannel();
    const ch2 = makeMockChannel();
    live.attach('A', ch1 as unknown as RTCDataChannel, makeMockPC() as unknown as RTCPeerConnection);
    live.attach('B', ch2 as unknown as RTCDataChannel, makeMockPC() as unknown as RTCPeerConnection);
    const op = {
      id: 'X:1',
      deviceId: 'X',
      seq: 1,
      ts: 1000,
      table: 'farms' as const,
      recordId: 'R',
      kind: 'PUT' as const,
      fields: { name: { value: 'Hola', ts: 1000 } },
    };
    live.broadcast(op);
    expect(ch1.sent).toHaveLength(1);
    expect(ch2.sent).toHaveLength(1);
    const parsed = JSON.parse(ch1.sent[0]!);
    expect(parsed.kind).toBe('LIVE_OP');
    expect(parsed.op.id).toBe('X:1');
  });

  it('broadcast salta canales en estado closed sin tirar todo', () => {
    const ch1 = makeMockChannel();
    const ch2 = makeMockChannel();
    ch2.readyState = 'closed';
    live.attach('A', ch1 as unknown as RTCDataChannel, makeMockPC() as unknown as RTCPeerConnection);
    live.attach('B', ch2 as unknown as RTCDataChannel, makeMockPC() as unknown as RTCPeerConnection);
    live.broadcast({
      id: 'X:1', deviceId: 'X', seq: 1, ts: 1000,
      table: 'farms', recordId: 'R', kind: 'PUT',
      fields: {},
    });
    expect(ch1.sent).toHaveLength(1);
    expect(ch2.sent).toHaveLength(0);
  });

  it('disconnect cierra canal+pc y desregistra', () => {
    const ch = makeMockChannel();
    const pc = makeMockPC();
    live.attach('A', ch as unknown as RTCDataChannel, pc as unknown as RTCPeerConnection);
    live.disconnect('A');
    expect(ch.readyState).toBe('closed');
    expect(pc.closed).toBe(true);
    expect(live.isLive('A')).toBe(false);
  });

  it('subscribe notifica al adjuntar y desconectar', () => {
    let calls = 0;
    const unsub = live.subscribe(() => {
      calls += 1;
    });
    const ch = makeMockChannel();
    live.attach('A', ch as unknown as RTCDataChannel, makeMockPC() as unknown as RTCPeerConnection);
    live.disconnect('A');
    expect(calls).toBeGreaterThanOrEqual(2);
    unsub();
  });

  it('attach sustituye un canal previo del mismo peer (cierra el anterior)', () => {
    const old = makeMockChannel();
    const oldPc = makeMockPC();
    live.attach('A', old as unknown as RTCDataChannel, oldPc as unknown as RTCPeerConnection);
    const fresh = makeMockChannel();
    const freshPc = makeMockPC();
    live.attach('A', fresh as unknown as RTCDataChannel, freshPc as unknown as RTCPeerConnection);
    expect(old.readyState).toBe('closed');
    expect(oldPc.closed).toBe(true);
    expect(live.isLive('A')).toBe(true);
  });

  it('canal cerrado dispara onclose y se desregistra solo', () => {
    const ch = makeMockChannel();
    live.attach('A', ch as unknown as RTCDataChannel, makeMockPC() as unknown as RTCPeerConnection);
    ch.close(); // dispara onclose internamente
    expect(live.isLive('A')).toBe(false);
  });
});
