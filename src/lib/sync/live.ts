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

type LiveMsg =
  | { kind: 'LIVE_OP'; op: Op }
  | { kind: 'PING'; t: number }
  | { kind: 'PONG'; t: number };

const HEARTBEAT_MS = 15_000;
/** Si pasa más de este tiempo sin pong tras un ping, la conexión es zombi. */
const HEARTBEAT_TIMEOUT_MS = 30_000;

type Listener = () => void;

interface ActiveLink {
  channel: RTCDataChannel;
  /**
   * RTCPeerConnection que sostiene el canal. Mantenemos la referencia
   * para que no se garbage-colecte (cerrar el PC cierra el canal).
   */
  peerConnection: RTCPeerConnection;
  /** Timer del heartbeat para limpiar al desconectar. */
  heartbeatTimer?: ReturnType<typeof setInterval>;
  /** Último pong recibido (epoch ms); la sesión nace en estado activo. */
  lastPongAt: number;
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
    // nueva manda. tearDown no notifica si limpiamos antes de re-set.
    const previous = this.links.get(peerDeviceId);
    if (previous && previous.channel !== channel) {
      if (previous.heartbeatTimer) clearInterval(previous.heartbeatTimer);
      try {
        previous.channel.close();
        previous.peerConnection.close();
      } catch {
        /* noop */
      }
      this.links.delete(peerDeviceId);
    }
    const link: ActiveLink = {
      channel,
      peerConnection,
      lastPongAt: Date.now(),
    };
    // Heartbeat: enviamos PING regulares y vigilamos el último PONG
    // para detectar conexiones zombi (canal "open" pero red caída
    // sin que el navegador haya disparado onclose todavía).
    link.heartbeatTimer = setInterval(() => {
      this.heartbeat(peerDeviceId);
    }, HEARTBEAT_MS);
    this.links.set(peerDeviceId, link);

    channel.onmessage = (e) => {
      void this.handleIncoming(peerDeviceId, e.data);
    };
    channel.onclose = () => {
      const current = this.links.get(peerDeviceId);
      if (current && current.channel === channel) this.tearDown(peerDeviceId);
    };
    channel.onerror = () => {
      const current = this.links.get(peerDeviceId);
      if (current && current.channel === channel) this.tearDown(peerDeviceId);
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
    this.tearDown(peerDeviceId);
  }

  /** Cierra todos los canales (al cerrar la pestaña, por ejemplo). */
  disconnectAll(): void {
    for (const peerDeviceId of [...this.links.keys()]) {
      this.tearDown(peerDeviceId);
    }
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

  private async handleIncoming(peerDeviceId: string, data: unknown): Promise<void> {
    try {
      const msg = JSON.parse(String(data)) as LiveMsg;
      if (msg.kind === 'PING') {
        // Respondemos con pong sobre el mismo canal.
        const link = this.links.get(peerDeviceId);
        if (link && link.channel.readyState === 'open') {
          try {
            link.channel.send(JSON.stringify({ kind: 'PONG', t: msg.t }));
          } catch {
            /* ignore */
          }
        }
        return;
      }
      if (msg.kind === 'PONG') {
        const link = this.links.get(peerDeviceId);
        if (link) link.lastPongAt = Date.now();
        return;
      }
      if (msg.kind !== 'LIVE_OP') return;
      if (await isOpKnown(msg.op.id)) return;
      await applyRemoteOp(msg.op);
    } catch {
      // mensaje corrupto: ignoramos para no tirar el canal por un parse
    }
  }

  private heartbeat(peerDeviceId: string): void {
    const link = this.links.get(peerDeviceId);
    if (!link) return;
    // Si el canal ya no está abierto, limpiamos.
    if (link.channel.readyState !== 'open') {
      this.tearDown(peerDeviceId);
      return;
    }
    // Conexión zombi: canal sigue 'open' pero no hay pong reciente.
    // Sucede tras suspender el dispositivo o caída de red breve.
    if (Date.now() - link.lastPongAt > HEARTBEAT_TIMEOUT_MS) {
      this.tearDown(peerDeviceId);
      return;
    }
    try {
      link.channel.send(JSON.stringify({ kind: 'PING', t: Date.now() }));
    } catch {
      this.tearDown(peerDeviceId);
    }
  }

  private tearDown(peerDeviceId: string): void {
    const link = this.links.get(peerDeviceId);
    if (!link) return;
    if (link.heartbeatTimer) clearInterval(link.heartbeatTimer);
    try {
      link.channel.close();
      link.peerConnection.close();
    } catch {
      /* noop */
    }
    this.links.delete(peerDeviceId);
    this.notify();
  }
}

export const liveSync = new LiveSyncManager();

// Para tests: una factoría limpia (no toca el singleton).
export function _makeLiveSyncForTests(): LiveSyncManager {
  return new LiveSyncManager();
}

export type { LiveSyncManager };
