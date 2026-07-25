import { describe, expect, it } from 'vitest';
import { getSpeechState, stopSpeech } from './readAloudEngine';

describe('readAloudEngine (Phase UX-8)', () => {
  it('manages speech synthesis state safely', () => {
    stopSpeech();
    const state = getSpeechState();
    expect(state.isSpeaking).toBe(false);
    expect(state.isPaused).toBe(false);
  });
});
