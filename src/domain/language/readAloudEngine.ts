export interface SpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  rate: number;
}

let activeSpeechState: SpeechState = {
  isSpeaking: false,
  isPaused: false,
  rate: 1.0,
};

/**
 * Initiates text-to-speech synthesis for Urdu or English document text.
 */
export function speakText(text: string, lang: 'ur' | 'en' = 'ur', rate = 1.0): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
  utterance.rate = rate;

  utterance.onend = () => {
    activeSpeechState.isSpeaking = false;
    activeSpeechState.isPaused = false;
  };

  utterance.onerror = () => {
    activeSpeechState.isSpeaking = false;
    activeSpeechState.isPaused = false;
  };

  activeSpeechState = {
    isSpeaking: true,
    isPaused: false,
    rate,
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stops ongoing speech synthesis.
 */
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeSpeechState.isSpeaking = false;
  activeSpeechState.isPaused = false;
}

/**
 * Pauses ongoing speech synthesis.
 */
export function pauseSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.pause();
    activeSpeechState.isPaused = true;
  }
}

/**
 * Resumes paused speech synthesis.
 */
export function resumeSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
    activeSpeechState.isPaused = false;
  }
}

/**
 * Returns current speech engine state.
 */
export function getSpeechState(): SpeechState {
  return activeSpeechState;
}
