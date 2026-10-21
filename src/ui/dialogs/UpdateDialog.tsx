import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkForUpdate,
  downloadAndInstallPendingUpdate,
  downloadPercent,
  initialDownloadProgress,
  type AvailableUpdate,
  type DownloadProgress,
} from '../../platform/tauri/updateManager';
import { DICTIONARY, type UiLanguage } from '../i18n/menuTranslation';
import { AppIcon } from '../icons/AppIcon';

export interface UpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lang: UiLanguage;
}

type Phase =
  | { kind: 'checking' }
  | { kind: 'unsupported' }
  | { kind: 'up-to-date'; currentVersion: string }
  | { kind: 'available'; update: AvailableUpdate }
  | { kind: 'downloading'; update: AvailableUpdate; progress: DownloadProgress }
  | { kind: 'installing' }
  | { kind: 'error'; message: string };

/**
 * Software update dialog backed by the real Tauri updater. Signature
 * verification happens inside the updater plugin (Rust/minisign) against
 * the pubkey pinned in tauri.conf.json — this dialog never handles keys.
 * In a plain browser it honestly reports that updates are desktop-only.
 */
export function UpdateDialog({ isOpen, onClose, lang }: UpdateDialogProps) {
  const t = DICTIONARY[lang];
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' });
  const runId = useRef(0);

  const runCheck = useCallback(async () => {
    const id = ++runId.current;
    setPhase({ kind: 'checking' });
    const state = await checkForUpdate();
    if (runId.current !== id) return;
    switch (state.status) {
      case 'unsupported':
        setPhase({ kind: 'unsupported' });
        break;
      case 'up-to-date':
        setPhase({ kind: 'up-to-date', currentVersion: state.currentVersion });
        break;
      case 'available':
        setPhase({ kind: 'available', update: state.update });
        break;
      case 'error':
        setPhase({ kind: 'error', message: state.message });
        break;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void runCheck();
    }
  }, [isOpen, runCheck]);

  if (!isOpen) return null;

  const busy = phase.kind === 'downloading' || phase.kind === 'installing';

  const startInstall = async (update: AvailableUpdate) => {
    setPhase({ kind: 'downloading', update, progress: initialDownloadProgress() });
    try {
      await downloadAndInstallPendingUpdate((progress) => {
        setPhase((prev) =>
          prev.kind === 'downloading' ? { ...prev, progress } : prev,
        );
        if (progress.done) {
          setPhase({ kind: 'installing' });
        }
      });
      // Resolves only when the relaunch did not take over (e.g. the OS
      // installer restarts the app itself) — stay on the installing note.
      setPhase({ kind: 'installing' });
    } catch (error) {
      setPhase({
        kind: 'error',
        message: error instanceof Error ? error.message : t.updError,
      });
    }
  };

  const percent =
    phase.kind === 'downloading' ? downloadPercent(phase.progress) : undefined;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
      }}
      onClick={busy ? undefined : onClose}
    >
      <div
        style={{
          width: '440px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontSize: '13px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #334155',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '15px', color: '#38bdf8', fontWeight: 700 }}>{t.updTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.4 : 1,
            }}
          >
            <AppIcon name="dismiss" />
          </button>
        </div>

        {phase.kind === 'checking' && <p style={{ color: '#cbd5e1' }}>{t.updChecking}</p>}

        {phase.kind === 'unsupported' && <p style={{ color: '#cbd5e1' }}>{t.updDesktopOnly}</p>}

        {phase.kind === 'up-to-date' && (
          <div>
            <p style={{ color: '#10b981', fontWeight: 600 }}>{t.updUpToDate}</p>
            <p style={{ color: '#94a3b8' }}>
              {t.updCurrentVersion}: {phase.currentVersion}
            </p>
          </div>
        )}

        {phase.kind === 'available' && (
          <div>
            <p style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>{t.updAvailable}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              <span style={{ color: '#94a3b8' }}>
                {t.updCurrentVersion}: {phase.update.currentVersion}
              </span>
              <span style={{ color: '#f8fafc', fontWeight: 700 }}>
                {t.updNewVersion}: {phase.update.version}
              </span>
            </div>
            {phase.update.notes && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>{t.updReleaseNotes}</div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    color: '#cbd5e1',
                    backgroundColor: '#1e293b',
                    borderRadius: '6px',
                    padding: '10px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  {phase.update.notes}
                </div>
              </div>
            )}
          </div>
        )}

        {phase.kind === 'downloading' && (
          <div>
            <p style={{ color: '#cbd5e1' }}>{t.updDownloading}</p>
            <div
              style={{
                height: '10px',
                backgroundColor: '#1e293b',
                borderRadius: '5px',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: percent === undefined ? '40%' : `${percent}%`,
                  backgroundColor: '#38bdf8',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
            {percent !== undefined && <span style={{ color: '#94a3b8' }}>{percent}%</span>}
          </div>
        )}

        {phase.kind === 'installing' && <p style={{ color: '#cbd5e1' }}>{t.updInstalling}</p>}

        {phase.kind === 'error' && (
          <div>
            <p style={{ color: '#f87171', fontWeight: 600 }}>{t.updError}</p>
            <p style={{ color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{phase.message}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          {phase.kind === 'available' && (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.updLater}
              </button>
              <button
                type="button"
                onClick={() => void startInstall(phase.update)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {t.updDownloadInstall}
              </button>
            </>
          )}
          {phase.kind === 'error' && (
            <button
              type="button"
              onClick={() => void runCheck()}
              style={{
                padding: '8px 20px',
                backgroundColor: 'transparent',
                color: '#38bdf8',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.updRetry}
            </button>
          )}
          {!busy && phase.kind !== 'available' && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t.updClose}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateDialog;
