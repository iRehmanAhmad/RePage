import React, { useState } from 'react';
import { AppIcon } from '../icons/AppIcon';
import {
  getExportReadinessReport,
  type PreflightResult,
  type PreflightSeverity,
} from '../../domain/diagnostics/preflightEngine';
import type { RePageDocument } from '../../domain/document/types';

interface PreflightPanelProps {
  result: PreflightResult;
  document?: RePageDocument | undefined;
  onClose?: () => void;
  onSelectIssue?: (targetId?: string) => void;
}

export const PreflightPanel: React.FC<PreflightPanelProps> = ({
  result,
  document,
  onClose,
  onSelectIssue,
}) => {
  const [filter, setFilter] = useState<'all' | PreflightSeverity | 'readiness'>('all');

  const filteredIssues = result.issues.filter(
    (issue) => filter === 'all' || issue.severity === filter,
  );

  const readinessReport = document ? getExportReadinessReport(document) : null;

  return (
    <div
      data-testid="preflight-panel"
      dir="rtl"
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#f8fafc',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        width: '500px',
        maxWidth: '92vw',
        direction: 'rtl',
        fontFamily: 'inherit',
        zIndex: 1050,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155',
          paddingBottom: '12px',
          marginBottom: '14px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#f8fafc',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AppIcon name="search" /> پری فلائٹ رپورٹ (Preflight Diagnostics)
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#94a3b8',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <AppIcon name="dismiss" /> بند کریں
          </button>
        )}
      </div>

      {/* Summary Status Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              backgroundColor: '#450a0a',
              color: '#fca5a5',
              border: '1px solid #991b1b',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            <AppIcon name="dismiss" /> {result.errorCount} غلطیاں (Errors)
          </span>
          <span
            style={{
              backgroundColor: '#451a03',
              color: '#fde047',
              border: '1px solid #854d0e',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            <AppIcon name="warning" /> {result.warningCount} تنبیہات (Warnings)
          </span>
        </div>
        <div style={{ color: result.passed ? '#34d399' : '#f87171' }}>
          {result.passed ? 'تیار ہے (Passed)' : 'مسئلہ ہے (Failed)'}
        </div>
      </div>

      {/* Filter / View Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', fontSize: '11px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilter('all')}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid ' + (filter === 'all' ? '#10b981' : '#334155'),
            backgroundColor: filter === 'all' ? '#059669' : '#1e293b',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          تمام ({result.issues.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('error')}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid ' + (filter === 'error' ? '#f43f5e' : '#334155'),
            backgroundColor: filter === 'error' ? '#e11d48' : '#1e293b',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          غلطیاں ({result.errorCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('warning')}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid ' + (filter === 'warning' ? '#f59e0b' : '#334155'),
            backgroundColor: filter === 'warning' ? '#d97706' : '#1e293b',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          تنبیہات ({result.warningCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('readiness')}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid ' + (filter === 'readiness' ? '#38bdf8' : '#334155'),
            backgroundColor: filter === 'readiness' ? '#0284c7' : '#1e293b',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <AppIcon name="clipboard" /> PDF تیاری (PDF Readiness)
        </button>
      </div>

      {/* Main Content Area */}
      {filter === 'readiness' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {readinessReport ? (
            <>
              {/* Score Meter */}
              <div
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '24px', fontWeight: 800, color: readinessReport.isPrintReady ? '#34d399' : '#38bdf8' }}>
                  {readinessReport.score}%
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>{readinessReport.summary}</div>
              </div>

              {/* Checklist Items */}
              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {readinessReport.checks.map((check, idx) => (
                  <div
                    key={`check-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#1e293b',
                      border: '1px solid ' + (check.passed ? '#166534' : '#991b1b'),
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{check.name}</span>
                    <span style={{ color: check.passed ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      {check.passed ? 'پاس (Passed)' : 'نااہل (Failed)'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '12px' }}>
              دستاویز ڈیٹا لوڈ ہو رہا ہے... (Loading PDF Readiness Report)
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredIssues.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '13px' }}>
              کوئی مسائل نہیں پائے گئے (No preflight issues found)
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => onSelectIssue?.(issue.targetId)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  border: '1px solid ' + (issue.severity === 'error' ? '#991b1b' : issue.severity === 'warning' ? '#854d0e' : '#334155'),
                  backgroundColor: issue.severity === 'error' ? '#450a0a' : issue.severity === 'warning' ? '#451a03' : '#1e293b',
                  color: issue.severity === 'error' ? '#fecdd3' : issue.severity === 'warning' ? '#fef08a' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 600 }}>{issue.message}</div>
                {issue.details && <div style={{ color: '#94a3b8', marginTop: '4px', fontSize: '11px' }}>{issue.details}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
