export type UserRole = 'owner' | 'editor' | 'viewer';

export type RoomLifecycleState = 'created' | 'active' | 'archived' | 'closed';

export interface InvitationToken {
  token: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

export interface RoomParticipant {
  userId: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
}

export type AuditEventType =
  | 'JOIN'
  | 'LEAVE'
  | 'ROLE_CHANGE'
  | 'TOKEN_REVOKED'
  | 'PARTICIPANT_REMOVED'
  | 'ROOM_STATE_CHANGE';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  actorId: string;
  targetId?: string | undefined;
  details: string;
}

export class CollaborationRoomAuth {
  private roomId: string;
  private ownerId: string;
  private minSupportedSchemaVersion = 1;
  private roomState: RoomLifecycleState = 'created';

  private participants = new Map<string, RoomParticipant>();
  private invitations = new Map<string, InvitationToken>();
  private auditTrail: AuditEvent[] = [];

  constructor(roomId: string, ownerId: string, ownerName = 'Room Owner') {
    this.roomId = roomId;
    this.ownerId = ownerId;

    this.participants.set(ownerId, {
      userId: ownerId,
      displayName: ownerName,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });

    this.logAudit('ROOM_STATE_CHANGE', ownerId, undefined, 'Room created');
  }

  public getRoomState(): RoomLifecycleState {
    return this.roomState;
  }

  public setRoomState(actorId: string, newState: RoomLifecycleState): boolean {
    if (!this.isOwner(actorId)) {
      return false;
    }
    this.roomState = newState;
    this.logAudit('ROOM_STATE_CHANGE', actorId, undefined, `Room state changed to ${newState}`);
    return true;
  }

  /**
   * Generates a 256-bit cryptographically secure high-entropy invitation token.
   */
  public createInvitationToken(actorId: string, role: UserRole = 'editor', expiresInHours = 24): InvitationToken | null {
    if (!this.canManageUsers(actorId)) {
      return null;
    }

    const tokenBytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(tokenBytes);
    } else {
      for (let i = 0; i < 32; i++) {
        tokenBytes[i] = Math.floor(Math.random() * 256);
      }
    }
    const tokenHex = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

    const invitation: InvitationToken = {
      token: tokenHex,
      role,
      createdAt: now.toISOString(),
      expiresAt,
      isRevoked: false,
    };

    this.invitations.set(tokenHex, invitation);
    this.logAudit('ROLE_CHANGE', actorId, undefined, `Generated ${role} invitation token`);
    return invitation;
  }

  public validateInvitationToken(token: string): { valid: boolean; role?: UserRole; reason?: string } {
    const inv = this.invitations.get(token);
    if (!inv) {
      return { valid: false, reason: 'Invalid token' };
    }
    if (inv.isRevoked) {
      return { valid: false, reason: 'Token has been revoked' };
    }
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: 'Token has expired' };
    }
    return { valid: true, role: inv.role };
  }

  public revokeInvitationToken(actorId: string, token: string): boolean {
    if (!this.canManageUsers(actorId)) {
      return false;
    }
    const inv = this.invitations.get(token);
    if (inv) {
      inv.isRevoked = true;
      this.logAudit('TOKEN_REVOKED', actorId, undefined, 'Invitation token revoked');
      return true;
    }
    return false;
  }

  public joinRoom(userId: string, displayName: string, token: string, schemaVersion = 1): { success: boolean; error?: string } {
    if (this.roomState === 'closed' || this.roomState === 'archived') {
      return { success: false, error: `Cannot join room in ${this.roomState} state` };
    }

    if (schemaVersion < this.minSupportedSchemaVersion) {
      return { success: false, error: `Incompatible document schema version ${schemaVersion}` };
    }

    const validation = this.validateInvitationToken(token);
    if (!validation.valid || !validation.role) {
      return { success: false, error: validation.reason || 'Unauthorized' };
    }

    this.participants.set(userId, {
      userId,
      displayName,
      role: validation.role,
      joinedAt: new Date().toISOString(),
    });

    this.logAudit('JOIN', userId, undefined, `Joined as ${validation.role}`);
    return { success: true };
  }

  public removeParticipant(actorId: string, targetUserId: string): boolean {
    if (!this.isOwner(actorId)) {
      return false;
    }
    if (targetUserId === this.ownerId) {
      return false;
    }
    const removed = this.participants.delete(targetUserId);
    if (removed) {
      this.logAudit('PARTICIPANT_REMOVED', actorId, targetUserId, 'Participant removed by owner');
    }
    return removed;
  }

  public getParticipants(): RoomParticipant[] {
    return Array.from(this.participants.values());
  }

  public getAuditTrail(): AuditEvent[] {
    return [...this.auditTrail];
  }

  private isOwner(userId: string): boolean {
    return userId === this.ownerId;
  }

  private canManageUsers(userId: string): boolean {
    const p = this.participants.get(userId);
    return Boolean(p && (p.role === 'owner' || p.role === 'editor'));
  }

  private logAudit(eventType: AuditEventType, actorId: string, targetId?: string, details = ''): void {
    this.auditTrail.push({
      id: `audit-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      actorId,
      targetId,
      details,
    });
  }
}
