import { VoiceSettings } from '../types/story';

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWordIndex: number;
  totalWords: number;
  activeWord: string;
}

export type TTSCallback = (state: TTSState) => void;

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private callbacks: Set<TTSCallback> = new Set();
  private words: string[] = [];
  private currentWordIndex = -1;
  private isPlaying = false;
  private isPaused = false;
  private fallbackTimer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    try {
      this.voices = this.synth.getVoices();
    } catch (e) {
      this.voices = [];
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    // Return Spanish voices first, or all if none
    const esVoices = this.voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('es'));
    return esVoices.length > 0 ? esVoices : this.voices;
  }

  public getVoicesByGender(gender: 'masculina' | 'femenina'): SpeechSynthesisVoice[] {
    const spanishVoices = this.getAvailableVoices();
    
    // Male & Female voice keywords across standard operating systems and browsers
    const maleKeywords = ['jorge', 'pablo', 'diego', 'enrique', 'carlos', 'male', 'hombre', 'david', 'alvaro', 'gonzalo', 'manuel', 'miguel', 'juan'];
    const femaleKeywords = ['monica', 'lucia', 'helena', 'laura', 'marta', 'sora', 'female', 'mujer', 'paloma', 'victoria', 'rosa', 'carmen', 'soledad'];

    if (gender === 'masculina') {
      const maleFound = spanishVoices.filter((v) =>
        maleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
      return maleFound.length > 0 ? maleFound : spanishVoices;
    } else {
      const femaleFound = spanishVoices.filter((v) =>
        femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
      );
      return femaleFound.length > 0 ? femaleFound : spanishVoices;
    }
  }

  public speak(
    text: string,
    settings: VoiceSettings,
    onEndCallback?: () => void
  ) {
    this.stop();

    // Prepare word breakdown for highlighting
    this.words = text.trim().split(/\s+/);
    this.currentWordIndex = -1;
    this.isPlaying = true;
    this.isPaused = false;
    this.notifyState();

    if (!this.synth) {
      this.startFallbackTimer(settings.rate, onEndCallback);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    // Clamp rate & pitch to valid W3C ranges
    const safeRate = Math.max(0.5, Math.min(2.0, settings.rate || 1.0));
    utterance.rate = safeRate;

    let basePitch = settings.pitch || 1.0;
    if (settings.gender === 'masculina') {
      basePitch *= 0.85; // slightly lower pitch for male voice
    } else {
      basePitch *= 1.10; // slightly higher pitch for female voice
    }
    utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch));
    utterance.volume = Math.max(0, Math.min(1.0, settings.volume ?? 1.0));

    // Select suitable voice
    const candidateVoices = this.getVoicesByGender(settings.gender);
    if (settings.selectedVoiceName) {
      const matched = this.voices.find((v) => v.name === settings.selectedVoiceName);
      if (matched) utterance.voice = matched;
    } else if (candidateVoices.length > 0) {
      utterance.voice = candidateVoices[0];
    }

    // Word boundary handling for synchronized text highlighting
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        let count = 0;
        let foundIdx = 0;
        for (let i = 0; i < this.words.length; i++) {
          if (count >= charIndex) {
            foundIdx = i;
            break;
          }
          count += this.words[i].length + 1; // +1 for space
        }
        this.currentWordIndex = foundIdx;
        this.notifyState();
      }
    };

    // Simulated highlighting timer as fallback if browser doesn't emit onboundary
    this.startFallbackTimer(safeRate, onEndCallback);

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.notifyState();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentWordIndex = this.words.length - 1;
      this.clearFallbackTimer();
      this.notifyState();
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      // Normal browser behavior when cancelling or replacing an utterance
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      this.isPlaying = false;
      this.isPaused = false;
      this.notifyState();
    };

    this.currentUtterance = utterance;

    // Use microtask / setTimeout delay to ensure clean utterance dispatch in Chromium / WebKit
    setTimeout(() => {
      if (this.synth && this.isPlaying && this.currentUtterance === utterance) {
        try {
          this.synth.speak(utterance);
        } catch (err) {
          // Keep visual highlight going even if audio is blocked by autoplay policy
        }
      }
    }, 40);
  }

  private startFallbackTimer(rate: number, onEndCallback?: () => void) {
    this.clearFallbackTimer();
    const averageWordMs = Math.max(150, 60000 / (130 * rate)); // ~130 WPM
    let wordTimerIdx = 0;

    this.fallbackTimer = window.setInterval(() => {
      if (this.isPlaying && !this.isPaused) {
        if (this.currentWordIndex < wordTimerIdx && wordTimerIdx < this.words.length) {
          this.currentWordIndex = wordTimerIdx;
          this.notifyState();
        }
        wordTimerIdx++;
        if (wordTimerIdx >= this.words.length) {
          this.clearFallbackTimer();
          if (!this.synth) {
            this.isPlaying = false;
            this.notifyState();
            if (onEndCallback) onEndCallback();
          }
        }
      }
    }, averageWordMs);
  }

  public pause() {
    if (this.synth && this.isPlaying && !this.isPaused) {
      try {
        this.synth.pause();
      } catch (e) {}
    }
    this.isPaused = true;
    this.notifyState();
  }

  public resume() {
    if (this.synth && this.isPaused) {
      try {
        this.synth.resume();
      } catch (e) {}
    }
    this.isPaused = false;
    this.notifyState();
  }

  public stop() {
    this.clearFallbackTimer();
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentWordIndex = -1;
    this.currentUtterance = null;
    this.notifyState();
  }

  private clearFallbackTimer() {
    if (this.fallbackTimer !== null) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  public subscribe(callback: TTSCallback) {
    this.callbacks.add(callback);
    callback(this.getState());
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public getState(): TTSState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentWordIndex: this.currentWordIndex,
      totalWords: this.words.length,
      activeWord:
        this.currentWordIndex >= 0 && this.currentWordIndex < this.words.length
          ? this.words[this.currentWordIndex]
          : '',
    };
  }

  private notifyState() {
    const state = this.getState();
    this.callbacks.forEach((cb) => cb(state));
  }
}

export const ttsService = new TTSService();
