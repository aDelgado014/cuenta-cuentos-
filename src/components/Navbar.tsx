import React from 'react';
import { BookOpen, Sparkles, Moon, Sun, Volume2, Clock, User, Mic } from 'lucide-react';
import { VoiceSettings } from '../types/story';

interface NavbarProps {
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onOpenGenerator: () => void;
  onOpenSleepTimer: () => void;
  activeTimerMinutes: number | null;
  onOpenVoiceModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  voiceSettings,
  onVoiceSettingsChange,
  darkMode,
  onDarkModeToggle,
  onOpenGenerator,
  onOpenSleepTimer,
  activeTimerMinutes,
  onOpenVoiceModal,
}) => {
  const toggleGender = () => {
    onVoiceSettingsChange({
      ...voiceSettings,
      gender: voiceSettings.gender === 'femenina' ? 'masculina' : 'femenina',
    });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-amber-50/90 dark:bg-slate-900/90 border-b border-amber-200/60 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 dark:from-indigo-600 dark:to-purple-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-fredoka text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Cuentilandia
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              Voz & Magia
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#biblioteca" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            Cuentos Destacados
          </a>
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-1.5 hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Crear Cuento con IA</span>
          </button>
        </nav>

        {/* Zone 3: Primary Voice & Theme Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Voice Gender Switcher Button */}
          <button
            onClick={toggleGender}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400 dark:hover:border-purple-400 shadow-sm transition-all whitespace-nowrap"
            title="Cambiar entre Voz Femenina y Voz Masculina"
          >
            <Mic className="w-3.5 h-3.5 text-amber-500" />
            <span className="capitalize">
              Voz {voiceSettings.gender === 'femenina' ? '♀ Femenina' : '♂ Masculina'}
            </span>
          </button>

          {/* Detailed Voice Adjustments */}
          <button
            onClick={onOpenVoiceModal}
            className="p-2 text-xs rounded-xl bg-amber-100/80 dark:bg-slate-800 text-amber-800 dark:text-slate-200 hover:bg-amber-200 dark:hover:bg-slate-700 transition-colors"
            title="Ajustar tono, velocidad y voz de narración"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl transition-all ${
              activeTimerMinutes
                ? 'bg-purple-600 text-white animate-pulse'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
            title="Temporizador para dormir"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {activeTimerMinutes ? `${activeTimerMinutes} min` : 'Sueño'}
            </span>
          </button>

          {/* Day / Bedtime Night Mode Toggle */}
          <button
            onClick={onDarkModeToggle}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={darkMode ? 'Modo Día' : 'Modo Noche para Dormir'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* AI Generator Button on Mobile */}
          <button
            onClick={onOpenGenerator}
            className="md:hidden flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Crear</span>
          </button>
        </div>
      </div>
    </header>
  );
};
