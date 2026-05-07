/**
 * Transporte WebRTC para sync P2P sin servidor.
 *
 * Modo de uso:
 *  - Iniciador: `createOfferer()` → genera offer con ICE COMPLETO →
 *    muestra QR de la offer → escanea answer → setea remote → DataChannel.
 *  - Receptor:  `createAnswerer(offer)` → genera answer con ICE COMPLETO →
 *    muestra QR de la answer → DataChannel disponible.
 *
 * Punto crítico: NO usamos trickle ICE. Esperamos a
 * `iceGatheringState === 'complete'` antes de exportar el SDP. Así un
 * solo QR por dirección lleva todo lo necesario para conectar.
 *
 * STUN: usamos servers públicos (Google) para ayudar al descubrimiento
 * de IP en NATs típicos. No es señalización, solo "qué dirección tengo
 * en internet". Si los dos peers están en la misma LAN, ICE host
 * candidates bastan y el STUN apenas se usa.
 *
 * TURN (relay): NO incluido. Si los dos peers están en NATs simétricos
 * incompatibles, la conexión fallará. En el caso "mismos dispositivos
 * del mismo usuario, normalmente misma red WiFi", esto es excepcional.
 */

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const ICE_TIMEOUT_MS = 5000;

interface SessionDescription {
  type: RTCSdpType;
  sdp: string;
}

export interface OffererSession {
  /** SDP offer con todos los ICE candidates ya incluidos. Listo para QR. */
  offer: SessionDescription;
  /** Promesa que resuelve cuando llega la answer y se establece el canal. */
  acceptAnswer(answer: SessionDescription): Promise<RTCDataChannel>;
  /** Cierra la conexión sin esperar answer (cancelar). */
  close(): void;
  /**
   * RTCPeerConnection subyacente. Hay que mantener una referencia viva
   * mientras se quiera usar el DataChannel; cerrar el PC cierra el canal.
   */
  peerConnection: RTCPeerConnection;
}

export interface AnswererSession {
  /** SDP answer con todos los ICE candidates. Listo para QR. */
  answer: SessionDescription;
  /** Promesa que resuelve con el DataChannel cuando el iniciador lo abre. */
  channelReady(): Promise<RTCDataChannel>;
  close(): void;
  peerConnection: RTCPeerConnection;
}

function waitForIceComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      // Si tarda demasiado seguimos con los candidatos que tengamos:
      // mejor un SDP "casi completo" que esperar para siempre.
      pc.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    }, ICE_TIMEOUT_MS);
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

function makePeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS });
}

/**
 * Crea una sesión de iniciador: produce la offer y devuelve un handle
 * que aceptará la answer recibida desde el otro dispositivo.
 */
export async function createOfferer(): Promise<OffererSession> {
  const pc = makePeerConnection();
  // Creamos el DataChannel ANTES del offer para que su descripción
  // entre en el SDP. El receptor lo recibirá vía evento `datachannel`.
  const channel = pc.createDataChannel('sync', {
    ordered: true,
    // No fijamos maxRetransmits ni maxPacketLifeTime → reliable.
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForIceComplete(pc);
  // localDescription ahora incluye los candidates como atributo del SDP.
  const finalSdp = pc.localDescription;
  if (!finalSdp || !finalSdp.sdp) throw new Error('no-local-description');

  let acceptResolved = false;

  return {
    peerConnection: pc,
    offer: { type: finalSdp.type, sdp: finalSdp.sdp },
    async acceptAnswer(answer) {
      if (acceptResolved) throw new Error('already-accepted');
      acceptResolved = true;
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: answer.type, sdp: answer.sdp }),
      );
      // Esperamos a que el canal esté open.
      if (channel.readyState === 'open') return channel;
      return new Promise<RTCDataChannel>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('channel-open-timeout'));
        }, 15000);
        channel.onopen = () => {
          clearTimeout(timeout);
          resolve(channel);
        };
        channel.onerror = (event) => {
          clearTimeout(timeout);
          reject(new Error(`channel-error: ${(event as ErrorEvent).message ?? 'unknown'}`));
        };
      });
    },
    close() {
      try {
        channel.close();
      } catch {
        /* noop */
      }
      pc.close();
    },
  };
}

/**
 * Crea una sesión de receptor: parte de la offer escaneada y produce
 * la answer correspondiente.
 */
export async function createAnswerer(
  offer: SessionDescription,
): Promise<AnswererSession> {
  const pc = makePeerConnection();
  await pc.setRemoteDescription(
    new RTCSessionDescription({ type: offer.type, sdp: offer.sdp }),
  );

  // El canal lo abre el iniciador, lo recibimos por evento.
  const channelPromise = new Promise<RTCDataChannel>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('channel-event-timeout')), 30000);
    pc.ondatachannel = (e) => {
      clearTimeout(timeout);
      const ch = e.channel;
      if (ch.readyState === 'open') resolve(ch);
      else {
        ch.onopen = () => resolve(ch);
        ch.onerror = () => reject(new Error('channel-error'));
      }
    };
  });

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForIceComplete(pc);
  const finalSdp = pc.localDescription;
  if (!finalSdp || !finalSdp.sdp) throw new Error('no-local-description');

  return {
    peerConnection: pc,
    answer: { type: finalSdp.type, sdp: finalSdp.sdp },
    channelReady: () => channelPromise,
    close() {
      pc.close();
    },
  };
}

export type { SessionDescription };
