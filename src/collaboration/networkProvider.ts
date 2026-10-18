export type NetworkConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'relay-forced';

export type IceCandidateType = 'host' | 'srflx' | 'relay';

export interface IceServerConfig {
  urls: string | string[];
  username?: string | undefined;
  credential?: string | undefined;
}

export interface NetworkDiagnostics {
  state: NetworkConnectionState;
  peerCount: number;
  maxPeers: number;
  iceCandidateType: IceCandidateType;
  isRelayForced: boolean;
  latencyMs: number;
  signalingUrl: string;
  reconnectAttempts: number;
}

export interface NetworkProviderOptions {
  roomName: string;
  signalingUrl?: string | undefined;
  iceServers?: IceServerConfig[] | undefined;
  forceRelay?: boolean | undefined;
  maxPeers?: number | undefined;
}

export const DEFAULT_SIGNALING_URL = 'wss://signaling.repage.org';
/**
 * Optional TURN relay configuration.
 *
 * SECURITY: Never commit TURN credentials to source control. Populate this
 * from environment / build-time configuration (e.g. `import.meta.env`) when
 * a relay is actually deployed. It defaults to `null`: peer connections use
 * STUN-only discovery until an operator configures a relay out of band.
 */
export const TURN_SERVER_CONFIG: { urls: string; username?: string | undefined; credential?: string | undefined } | null = null;
export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(TURN_SERVER_CONFIG ? [TURN_SERVER_CONFIG] : []),
];
export const MAX_PEERS_PER_ROOM = 4;

export class CollaborativeNetworkProvider {
  private roomName: string;
  private signalingUrl: string;
  private iceServers: IceServerConfig[];
  private forceRelay: boolean;
  private maxPeers: number;

  private state: NetworkConnectionState = 'disconnected';
  private connectedPeers = new Set<string>();
  private reconnectAttempts = 0;
  private activeCandidateType: IceCandidateType = 'srflx';
  private currentLatencyMs = 45;

  constructor(options: NetworkProviderOptions) {
    this.roomName = options.roomName;
    this.signalingUrl = options.signalingUrl || DEFAULT_SIGNALING_URL;
    this.iceServers = options.iceServers || DEFAULT_ICE_SERVERS;
    this.forceRelay = Boolean(options.forceRelay);
    this.maxPeers = options.maxPeers || MAX_PEERS_PER_ROOM;

    if (this.forceRelay) {
      this.activeCandidateType = 'relay';
    }
  }

  public connect(): void {
    this.state = 'connecting';
    // Simulate signaling connection
    setTimeout(() => {
      this.state = this.forceRelay ? 'relay-forced' : 'connected';
      this.reconnectAttempts = 0;
    }, 10);
  }

  public addPeer(peerId: string): { success: boolean; error?: string } {
    if (this.connectedPeers.size >= this.maxPeers) {
      return {
        success: false,
        error: `Room capacity exceeded (Maximum ${this.maxPeers} editors allowed)`,
      };
    }

    this.connectedPeers.add(peerId);
    return { success: true };
  }

  public removePeer(peerId: string): void {
    this.connectedPeers.delete(peerId);
  }

  public handleNetworkChange(): void {
    this.state = 'reconnecting';
    this.reconnectAttempts += 1;

    setTimeout(() => {
      this.state = this.forceRelay ? 'relay-forced' : 'connected';
    }, 20);
  }

  public getDiagnostics(): NetworkDiagnostics {
    return {
      state: this.state,
      peerCount: this.connectedPeers.size,
      maxPeers: this.maxPeers,
      iceCandidateType: this.activeCandidateType,
      isRelayForced: this.forceRelay,
      latencyMs: this.currentLatencyMs,
      signalingUrl: `${this.signalingUrl}?room=${encodeURIComponent(this.roomName)}`,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  public getIceTransportPolicy(): 'all' | 'relay' {
    return this.forceRelay ? 'relay' : 'all';
  }

  public getIceServers(): IceServerConfig[] {
    return [...this.iceServers];
  }
}
