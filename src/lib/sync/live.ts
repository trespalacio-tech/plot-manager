import { applyRemoteOp, isOpKnown } from './log';
import type { Op } from './types';

/**
 * Live sync manager: mantiene los DataChannels abiertos tras un pairing
 * exitoso. Cualquier mutación local emite un mensaje LIVE_OP por todos
 * los canales vivos; cualquier LIVE_OP entrante se aplica al instante.
 *
 * Diseño:
 *  - Singleton (los canales viven mientras la pestaña esté abierta).
 *  - Suscripción a cambios para que la UI muestre "conectado en vivo".
 *  - Sin reconexión automática: WebRTC no persiste entre cargas de
 *    página, así que cerrar la pestaña termina la sesión live. La
 *    siguiente vez que el usuario quiera sync, repetirá QR.
 */

interface LiveMsg {
  kind: 'LIVE_OP';
  op: Op;
}

type Listener = () => void;

interface ActiveLink {
  channel: RTCDataChannel;
  /**
   * RTCPeerConnection que sostiene el canal. Mantenemos la referencia
   * para que no se garbage-colecte (cerrar el PC cierra el canal).
   */
  peerConnection: RTCPeerConnection;
}

class LiveSyncManager {
  private links = new Map<string, ActiveLink>();
  private listeners = new Set<Listener>();

  /**
   * Registra un canal recién pareado. Asume que el handshake del sync
   * inicial ya terminó y el canal ya no tiene `onmessage` propio del
   * runSyncSession. Reasignamos los handlers para modo live.
   */
  attach(
    peerDeviceId: string,
    channel: RTCDataChannel,
    peerConnection: RTCPeerConnection,
  ): void {
    // Si ya hay un link previo para ese peer, lo cerramos: la sesión
    // nueva manda.
    const previous = this.links.get(peerDeviceId);
    if (previous && previous.channel !== channel) {
      try {
        previous.channel.close();
        previous.peerConnection.close();
      } catch {
        /* noop */
      }
    }
    this.links.set(peerDeviceId, { channel, peerConnection });

    channel.onmessage = (e) => {
      void this.handleIncoming(peerDeviceId, e.data);
    };
    channel.onclose = () => {
      // Solo desregistrar si seguimos siendo el canal "actual".
      const current = this.links.get(peerDeviceId);
      if (current && current.channel === channel) {
        try {
          current.peerConnection.close();
        } catch {
          /* noop */
        }
        this.links.delete(peerDeviceId);
        this.notify();
      }
    };
    channel.onerror = () => {
      const current = this.links.get(peerDeviceId);
      if (current && current.channel === channel) {
        try {
          channel.close();
          current.peerConnection.close();
        } catch {
          /* noop */
        }
        this.links.delete(peerDeviceId);
        this.notify();
      }
    };
    this.notify();
  }

  /** True si hay al menos un canal vivo con el peer. */
  isLive(peerDeviceId: string): boolean {
    const link = this.links.get(peerDeviceId);
    return !!link && link.channel.readyState === 'open';
  }

  /** deviceIds de peers actualmente conectados en vivo. */
  livePeers(): string[] {
    const out: string[] = [];
    for (const [id, link] of this.links) {
      if (link.channel.readyState === 'open') out.push(id);
    }
    return out;
  }

  /**
   * Difunde una op recién emitida localmente a todos los peers vivos.
   * Llamado desde recordPut/recordDelete tras persistir.
   */
  broadcast(op: Op): void {
    const msg: LiveMsg = { kind: 'LIVE_OP', op };
    const text = JSON.stringify(msg);
    for (const [id, link] of this.links) {
      if (link.channel.readyState !== 'open') continue;
      try {
        link.channel.send(text);
      } catch {
        // Canal roto: cerramos y desregistramos.
        try {
          link.channel.close();
          link.peerConnection.close();
        } catch {
          /* noop */
        }
        this.links.delete(id);
        this.notify();
      }
    }
  }

  /**
   * Cierra explícitamente el canal con un peer (ej: usuario pulsa
   * "Olvidar" o quiere repairear).
   */
  disconnect(peerDeviceId: string): void {
    const link = this.links.get(peerDeviceId);
    if (!link) return;
    try {
      link.channel.close();
      link.peerConnection.close();
    } catch {
      /* noop */
    }
    this.links.delete(peerDeviceId);
    this.notify();
  }

  /** Cierra todos los canales (al cerrar la pestaña, por ejemplo). */
  disconnectAll(): void {
    for (const [, link] of this.links) {
      try {
        link.channel.close();
        link.peerConnection.close();
      } catch {
        /* noop */
      }
    }
    this.links.clear();
    this.notify();
  }

  /** Suscripción para que la UI reaccione al estado live. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch {
        /* aislamos errores de listeners */
      }
    }
  }

  private async handleIncoming(_peerDeviceId: string, data: unknown): Promise<void> {
    try {
      const msg = JSON.parse(String(data)) as LiveMsg;
      if (msg.kind !== 'LIVE_OP') return;
      if (await isOpKnown(msg.op.id)) return;
      await applyRemoteOp(msg.op);
    } catch {
      // mensaje corrupto: ignoramos para no tirar el canal por un parse
    }
  }
}

export const liveSync = new LiveSyncManager();

// Para tests: una factoría limpia (no toca el singleton).
export function _makeLiveSyncForTests(): LiveSyncManager {
  return new LiveSyncManager();
}

export type { LiveSyncManager };
