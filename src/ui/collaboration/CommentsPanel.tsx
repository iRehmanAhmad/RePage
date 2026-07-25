import React, { useState } from 'react';

export interface CommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  objectId?: string | undefined;
  author: string;
  text: string;
  createdAt: string;
  isResolved: boolean;
  replies: CommentReply[];
}

interface CommentsPanelProps {
  threads: CommentThread[];
  onAddComment?: ((text: string) => void) | undefined;
  onAddReply?: ((threadId: string, text: string) => void) | undefined;
  onToggleResolve?: ((threadId: string) => void) | undefined;
  onClose?: (() => void) | undefined;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  threads,
  onAddComment,
  onAddReply,
  onToggleResolve,
  onClose,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showResolved, setShowResolved] = useState(false);

  const filteredThreads = threads.filter((t) => (showResolved ? true : !t.isResolved));

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment?.(newCommentText.trim());
    setNewCommentText('');
  };

  const handleCreateReply = (threadId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = replyInputs[threadId]?.trim();
    if (!text) return;
    onAddReply?.(threadId, text);
    setReplyInputs((prev) => ({ ...prev, [threadId]: '' }));
  };

  return (
    <div className="w-80 h-full bg-slate-900 text-white border-l border-slate-800 flex flex-col shadow-xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <h3 className="font-bold text-sm text-slate-100">تبصرے (Comments)</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <label className="text-xs text-slate-400 flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="mr-1 rounded bg-slate-800 border-slate-700"
            />
            Resolved
          </label>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleCreateComment} className="p-3 border-b border-slate-800">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="نیا تبصرہ لکھیں... (Write a comment)"
          className="w-80 w-full p-2 bg-slate-800 text-sm text-white rounded border border-slate-700 focus:outline-none focus:border-emerald-500 resize-none h-16"
        />
        <button
          type="submit"
          disabled={!newCommentText.trim()}
          className="mt-2 w-full py-1 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold rounded transition-colors"
        >
          Post Comment
        </button>
      </form>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredThreads.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">کوئی تبصرہ نہیں (No comments found)</p>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              className={`p-2.5 rounded border text-xs space-y-2 ${
                thread.isResolved ? 'bg-slate-950 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">{thread.author}</span>
                <button
                  type="button"
                  onClick={() => onToggleResolve?.(thread.id)}
                  className="text-[10px] text-slate-400 hover:text-emerald-300 underline"
                >
                  {thread.isResolved ? 'Reopen' : '✓ Resolve'}
                </button>
              </div>

              <p className="text-slate-200 dir-rtl text-right font-serif">{thread.text}</p>

              {/* Replies */}
              {thread.replies.length > 0 && (
                <div className="pl-2 border-l border-slate-700 space-y-1.5 mt-2">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="bg-slate-900 p-1.5 rounded">
                      <span className="font-semibold text-slate-300 text-[11px]">{reply.author}: </span>
                      <span className="text-slate-200 text-[11px] dir-rtl">{reply.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Reply */}
              {!thread.isResolved && (
                <form onSubmit={(e) => handleCreateReply(thread.id, e)} className="mt-2 flex space-x-1 space-x-reverse">
                  <input
                    type="text"
                    value={replyInputs[thread.id] || ''}
                    onChange={(e) =>
                      setReplyInputs((prev) => ({ ...prev, [thread.id]: e.target.value }))
                    }
                    placeholder="جواب دیں (Reply...)"
                    className="flex-1 px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] border border-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px]"
                  >
                    Reply
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
