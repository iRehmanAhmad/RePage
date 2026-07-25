import React from 'react';
import type { CollaboratorPresence } from '../../collaboration/awareness';

interface RemoteCollaboratorOverlayProps {
  presences: CollaboratorPresence[];
  currentUserId?: string | undefined;
  activePageId?: string | undefined;
}

export const RemoteCollaboratorOverlay: React.FC<RemoteCollaboratorOverlayProps> = ({
  presences,
  currentUserId,
  activePageId,
}) => {
  const remotePresences = presences.filter(
    (p) => p.userId !== currentUserId && p.activePageId === activePageId,
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {remotePresences.map((p) => {
        if (!p.cursor) return null;
        return (
          <div
            key={p.userId}
            className="absolute transition-all duration-75 ease-out flex items-center space-x-1"
            style={{
              left: `${p.cursor.x}px`,
              top: `${p.cursor.y}px`,
            }}
          >
            {/* SVG Cursor Pointer */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={p.userColor || '#2563eb'}
              className="drop-shadow-sm"
            >
              <path d="M3 3l7 18 3-7 7-3L3 3z" />
            </svg>

            {/* Name Tag */}
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded shadow-sm whitespace-nowrap"
              style={{ backgroundColor: p.userColor || '#2563eb' }}
            >
              {p.displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};
