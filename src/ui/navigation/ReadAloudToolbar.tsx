import React, { useState } from 'react';
import {
  getSpeechState,
  pauseSpeech,
  resumeSpeech,
  speakText,
  stopSpeech,
} from '../../domain/language/readAloudEngine';
import type { UiLanguage } from '../i18n/menuTranslation';

export interface ReadAloudToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  textToRead: string;
  lang: UiLanguage;
}

export function ReadAloudToolbar({
  isOpen,
  onClose,
  textToRead,
  lang,
}: ReadAloudToolbarProps) {
  const [speechState, setSpeechState] = useState(getSpeechState());
  const [speed, setSpeed] = useState(1.0);

  if (!isOpen) return null;

  const isUr = lang === 'ur';

  const handlePlay = () => {
    if (speechState.isPaused) {
      resumeSpeech();
    } else {
      speakText(textToRead, lang === 'ur' ? 'ur' : 'en', speed);
    }
    setSpeechState(getSpeechState());
  };

  const handlePause = () => {
    pauseSpeech();
    setSpeechState(getSpeechState());
  };

  const handleStop = () => {
    stopSpeech();
    setSpeechState(getSpeechState());
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '50px',
        right: '20px',
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '10px 16px',
        color: '#f8fafc',
        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px',
      }}
    >
      <span style={{ fontWeight: 700, color: '#10b981' }}>
        🔊 {isUr ? 'متن کی پڑھائی (Read Aloud)' : 'Read Aloud'}
      </span>

      <button
        type="button"
        onClick={speechState.isSpeaking && !speechState.isPaused ? handlePause : handlePlay}
        style={{
          backgroundColor: '#0284c7',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 10px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {speechState.isSpeaking && !speechState.isPaused ? '⏸ Pause' : '▶ Play'}
      </button>

      <button
        type="button"
        onClick={handleStop}
        style={{
          backgroundColor: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 10px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ⏹ Stop
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Speed:</span>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.25"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '60px' }}
        />
        <span style={{ fontSize: '10px' }}>{speed}x</span>
      </div>

      <button
        type="button"
        onClick={() => {
          handleStop();
          onClose();
        }}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: '#94a3b8',
          fontSize: '14px',
          cursor: 'pointer',
          marginLeft: '4px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
