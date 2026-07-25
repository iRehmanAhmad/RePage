import React from 'react';
import type { CollaboratorPresence } from '../../collaboration/awareness';
import type { NetworkConnectionState } from '../../collaboration/networkProvider';

interface CollaborationBarProps {
  connectionState: NetworkConnectionState;
  presences: CollaboratorPresence[];
  followedUserId?: string | undefined;
  onFollowUser?: ((userId?: string) => void) | undefined;
  onToggleComments?: (() => void) | undefined;
  unreadCommentsCount?: number | undefined;
  isLocalRecoveryActive?: boolean | undefined;
}

export const CollaborationBar: React.FC<CollaborationBarProps> = ({
  connectionState,
  presences,
  followedUserId,
  onFollowUser,
  onToggleComments,
  unreadCommentsCount = 0,
  isLocalRecoveryActive = false,
}) => {
  const getStatusBadge = () => {
    switch (connectionState) {
      case 'connected':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">● Online</span>;
      case 'relay-forced':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">🛡️ TURN Relay</span>;
      case 'reconnecting':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">⏳ Reconnecting...</span>;
      case 'disconnected':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 font-sans">○ Offline</span>;
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 text-white text-sm border-b border-slate-800">
      <div className="flex items-center space-x-3 space-x-reverse">
        {getStatusBadge()}
        {isLocalRecoveryActive && (
          <span className="text-xs text-emerald-400 font-medium">✓ Local recovery active</span>
        )}
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        {/* Participant list */}
        <div className="flex items-center -space-x-1 space-x-reverse">
          {presences.map((p) => {
            const isFollowed = followedUserId === p.userId;
            return (
              <button
                key={p.userId}
                type="button"
                onClick={() => onFollowUser?.(isFollowed ? undefined : p.userId)}
                title={`${p.displayName}${isFollowed ? ' - Following' : ''}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 ${
                  isFollowed ? 'border-amber-400 ring-2 ring-amber-400' : 'border-slate-900'
                }`}
                style={{ backgroundColor: p.userColor || '#2563eb' }}
              >
                {p.displayName.charAt(0).toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Comments Button */}
        <button
          type="button"
          onClick={onToggleComments}
          className="relative px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors"
        >
          💬 Comments
          {unreadCommentsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] rounded-full font-bold">
              {unreadCommentsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
