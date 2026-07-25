import { describe, expect, it } from 'vitest';
import {
  CollaborativeNetworkProvider,
  DEFAULT_ICE_SERVERS,
  DEFAULT_SIGNALING_URL,
  MAX_PEERS_PER_ROOM,
} from './networkProvider';

describe('networkProvider (M5.4)', () => {
  it('configures STUN/TURN servers and default production signaling endpoint', () => {
    const provider = new CollaborativeNetworkProvider({ roomName: 'urdu-doc-101' });
    const diagnostics = provider.getDiagnostics();

    expect(diagnostics.signalingUrl).toContain(DEFAULT_SIGNALING_URL);
    expect(provider.getIceServers()).toHaveLength(DEFAULT_ICE_SERVERS.length);
    expect(provider.getIceTransportPolicy()).toBe('all');
  });

  it('supports forced-relay policy for enterprise firewalls', () => {
    const provider = new CollaborativeNetworkProvider({
      roomName: 'urdu-doc-102',
      forceRelay: true,
    });

    expect(provider.getIceTransportPolicy()).toBe('relay');
    expect(provider.getDiagnostics().isRelayForced).toBe(true);
    expect(provider.getDiagnostics().iceCandidateType).toBe('relay');
  });

  it('enforces small-room limit of max 4 editors', () => {
    const provider = new CollaborativeNetworkProvider({ roomName: 'urdu-doc-103' });

    expect(provider.addPeer('editor-1').success).toBe(true);
    expect(provider.addPeer('editor-2').success).toBe(true);
    expect(provider.addPeer('editor-3').success).toBe(true);
    expect(provider.addPeer('editor-4').success).toBe(true);

    const overflow = provider.addPeer('editor-5');
    expect(overflow.success).toBe(false);
    expect(overflow.error).toContain(`Room capacity exceeded (Maximum ${MAX_PEERS_PER_ROOM} editors allowed)`);
  });

  it('handles automatic reconnection and network interface changes', async () => {
    const provider = new CollaborativeNetworkProvider({ roomName: 'urdu-doc-104' });
    provider.connect();

    // Trigger network interface change (e.g. WiFi -> Cellular)
    provider.handleNetworkChange();
    expect(provider.getDiagnostics().state).toBe('reconnecting');
    expect(provider.getDiagnostics().reconnectAttempts).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(provider.getDiagnostics().state).toBe('connected');
  });
});
