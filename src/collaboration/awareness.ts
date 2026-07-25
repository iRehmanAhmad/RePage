export interface CollaboratorPresence {
  userId: string;
  displayName: string;
  userColor: string;
  activePageId?: string | undefined;
  selectedObjectId?: string | undefined;
  cursor?: { x: number; y: number } | undefined;
}

export class AwarenessManager {
  private localPresence: CollaboratorPresence;
  private peerPresences = new Map<string, CollaboratorPresence>();
  private listeners = new Set<(presences: CollaboratorPresence[]) => void>();

  constructor(initialUser?: Partial<CollaboratorPresence>) {
    this.localPresence = {
      userId: initialUser?.userId || `user-${Math.random().toString(36).substring(2, 9)}`,
      displayName: initialUser?.displayName || 'Urdu Publisher',
      userColor: initialUser?.userColor || '#059669',
      activePageId: initialUser?.activePageId,
      selectedObjectId: initialUser?.selectedObjectId,
      cursor: initialUser?.cursor,
    };
  }

  public getLocalPresence(): CollaboratorPresence {
    return { ...this.localPresence };
  }

  public updateLocalPresence(patch: Partial<CollaboratorPresence>): void {
    this.localPresence = {
      ...this.localPresence,
      ...patch,
    };
    this.notify();
  }

  public updatePeerPresence(peer: CollaboratorPresence): void {
    this.peerPresences.set(peer.userId, peer);
    this.notify();
  }

  public removePeerPresence(userId: string): void {
    this.peerPresences.delete(userId);
    this.notify();
  }

  public getAllPresences(): CollaboratorPresence[] {
    return [this.localPresence, ...Array.from(this.peerPresences.values())];
  }

  public subscribe(callback: (presences: CollaboratorPresence[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getAllPresences());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(): void {
    const presences = this.getAllPresences();
    for (const listener of this.listeners) {
      listener(presences);
    }
  }
}
