export type VoiceGender = 'femenina' | 'masculina';
export type VoiceEngine = 'web-speech' | 'gemini-tts';

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  pdfPath?: string;
  category: 'Leo y Llama' | 'Aurora' | 'Alba' | 'Mascotas' | 'Fantasía' | 'Para Dormir';
  targetAge: string;
  readTime: string;
  moral?: string;
  isPdfOriginal?: boolean;
  pages: StoryPage[];
  isCustomGenerated?: boolean;
}

export interface VoiceSettings {
  gender: VoiceGender;
  engine: VoiceEngine;
  pitch: number; // 0.5 to 1.5
  rate: number;  // 0.5 to 1.5
  volume: number; // 0 to 1
  selectedVoiceName?: string;
  autoPageTurn: boolean;
}

export type AmbienceSoundType = 'none' | 'lluvia' | 'noche' | 'bosque' | 'oceano' | 'chimenea';

export interface AmbienceSound {
  type: AmbienceSoundType;
  name: string;
  description: string;
  iconName: string;
}

export interface SleepTimerState {
  active: boolean;
  durationMinutes: number;
  remainingSeconds: number;
}
