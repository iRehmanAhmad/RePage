import React, { useState } from 'react';
import type { PreflightResult, PreflightSeverity } from '../../domain/diagnostics/preflightEngine';

interface PreflightPanelProps {
  result: PreflightResult;
  onClose?: () => void;
  onSelectIssue?: (targetId?: string) => void;
}

export const PreflightPanel: React.FC<PreflightPanelProps> = ({
  result,
  onClose,
  onSelectIssue,
}) => {
  const [filter, setFilter] = useState<'all' | PreflightSeverity>('all');

  const filteredIssues = result.issues.filter(
    (issue) => filter === 'all' || issue.severity === filter,
  );

  return (
    <div
      data-testid="preflight-panel"
      className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-4 shadow-xl max-w-md w-full dir-rtl"
      dir="rtl"
    >
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>🔍</span> پری فلائٹ رپورٹ (Preflight Diagnostics)
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded bg-slate-800"
          >
            ✕ بند کریں
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 text-xs font-semibold">
        <div className="flex gap-2">
          <span className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-1 rounded">
            ❌ {result.errorCount} غلطیاں (Errors)
          </span>
          <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-1 rounded">
            ⚠️ {result.warningCount} تنبیہات (Warnings)
          </span>
        </div>
        <div className="text-slate-400">
          {result.passed ? '✅ تیار ہے (Passed)' : '❌ مسئلہ ہے (Failed)'}
        </div>
      </div>

      <div className="flex gap-2 mb-3 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2 py-1 rounded border ${
            filter === 'all'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          تمام ({result.issues.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('error')}
          className={`px-2 py-1 rounded border ${
            filter === 'error'
              ? 'bg-rose-600 border-rose-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          غلطیاں ({result.errorCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('warning')}
          className={`px-2 py-1 rounded border ${
            filter === 'warning'
              ? 'bg-amber-600 border-amber-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          تنبیہات ({result.warningCount})
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {filteredIssues.length === 0 ? (
          <div className="text-center text-slate-400 py-6 text-sm">
            کوئی مسائل نہیں پائے گئے (No preflight issues found)
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue?.(issue.targetId)}
              className={`p-2.5 rounded text-xs border cursor-pointer transition ${
                issue.severity === 'error'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200 hover:bg-rose-900/60'
                  : issue.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200 hover:bg-amber-900/60'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <div className="font-semibold">{issue.message}</div>
              {issue.details && <div className="text-slate-400 mt-1">{issue.details}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
