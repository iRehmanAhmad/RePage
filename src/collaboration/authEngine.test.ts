import { describe, expect, it } from 'vitest';
import { CollaborationRoomAuth } from './authEngine';

describe('authEngine (M5.5)', () => {
  it('assigns owner role and manages high-entropy invitation tokens', () => {
    const room = new CollaborationRoomAuth('room-101', 'owner-1', 'Owner Fatima');
    expect(room.getParticipants()).toHaveLength(1);
    expect(room.getParticipants()[0]?.role).toBe('owner');

    const invitation = room.createInvitationToken('owner-1', 'editor', 12);
    expect(invitation).not.toBeNull();
    expect(invitation?.token.length).toBe(64); // 256-bit hex token
    expect(invitation?.role).toBe('editor');
  });

  it('validates expiring and revoked invitation tokens', () => {
    const room = new CollaborationRoomAuth('room-102', 'owner-1');
    const inv = room.createInvitationToken('owner-1', 'viewer', 1);

    expect(inv).not.toBeNull();
    const token = inv!.token;

    expect(room.validateInvitationToken(token).valid).toBe(true);

    room.revokeInvitationToken('owner-1', token);
    const revoked = room.validateInvitationToken(token);
    expect(revoked.valid).toBe(false);
    expect(revoked.reason).toBe('Token has been revoked');
  });

  it('allows owner to remove participants and change room lifecycle state', () => {
    const room = new CollaborationRoomAuth('room-103', 'owner-1');
    const inv = room.createInvitationToken('owner-1', 'editor', 24)!;

    const joinRes = room.joinRoom('user-2', 'Editor Tariq', inv.token);
    expect(joinRes.success).toBe(true);
    expect(room.getParticipants()).toHaveLength(2);

    // Remove user-2
    const removed = room.removeParticipant('owner-1', 'user-2');
    expect(removed).toBe(true);
    expect(room.getParticipants()).toHaveLength(1);

    // Change room lifecycle state to archived
    expect(room.setRoomState('owner-1', 'archived')).toBe(true);
    expect(room.getRoomState()).toBe('archived');
  });

  it('enforces schema version compatibility and logs append-only audit events', () => {
    const room = new CollaborationRoomAuth('room-104', 'owner-1');
    const inv = room.createInvitationToken('owner-1', 'editor', 24)!;

    const incompatibleJoin = room.joinRoom('user-3', 'Old Client', inv.token, 0); // version 0 incompatible
    expect(incompatibleJoin.success).toBe(false);
    expect(incompatibleJoin.error).toContain('Incompatible document schema version');

    const auditTrail = room.getAuditTrail();
    expect(auditTrail.length).toBeGreaterThan(0);
    expect(auditTrail[0]?.eventType).toBe('ROOM_STATE_CHANGE');
  });
});
