import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Mic,
  Volume2,
  VolumeX,
  Music,
  FileText,
  Sparkles,
  Settings,
  Type,
  BookOpen,
  Maximize,
  Minimize,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Story, VoiceSettings, AmbienceSoundType } from '../types/story';
import { ttsService, TTSState } from '../services/ttsService';
import { ambienceService } from '../services/ambienceService';

interface StoryReaderModalProps {
  story: Story;
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  onClose: () => void;
  onOpenPdf?: (pdfPath: string, title: string) => void;
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({
  story,
  voiceSettings,
  onVoiceSettingsChange,
  onClose,
  onOpenPdf,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [ttsState, setTtsState] = useState<TTSState>(ttsService.getState());
  const [selectedAmbience, setSelectedAmbience] = useState<AmbienceSoundType>('none');
  const [ambienceVol, setAmbienceVol] = useState(0.3);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isAutoFlipping, setIsAutoFlipping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentPage = story.pages[currentPageIndex] || story.pages[0];
  const totalPages = story.pages.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  // Calculate progress metrics
  const progressPercent = Math.round(((currentPageIndex + 1) / totalPages) * 100);
  const slidesRemaining = totalPages - (currentPageIndex + 1);

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  // Sync fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Subscribe to TTS state
  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      setTtsState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Play narration when changing page
  const playPageNarration = (pageIdx: number) => {
    setIsAutoFlipping(false);
    const text = story.pages[pageIdx]?.text;
    if (text) {
      ttsService.speak(text, voiceSettings, () => {
        // Page completed -> auto-flip to next slide!
        if (voiceSettings.autoPageTurn && pageIdx < story.pages.length - 1) {
          setIsAutoFlipping(true);
          setTimeout(() => {
            setIsAutoFlipping(false);
            setCurrentPageIndex((prev) => prev + 1);
          }, 1200);
        } else if (pageIdx === story.pages.length - 1) {
          // Finished story celebration!
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      });
    }
  };

  // Trigger narration on page index change
  useEffect(() => {
    playPageNarration(currentPageIndex);
    return () => {
      ttsService.stop();
    };
  }, [currentPageIndex]);

  // Handle Voice Settings updates
  const handleGenderToggle = (newGender: 'femenina' | 'masculina') => {
    const updated = { ...voiceSettings, gender: newGender };
    onVoiceSettingsChange(updated);
    if (currentPage?.text) {
      ttsService.speak(currentPage.text, updated);
    }
  };

  const handleStop = () => {
    ttsService.stop();
    setIsAutoFlipping(false);
  };

  // Click on progress bar to jump to slide
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIdx = Math.min(totalPages - 1, Math.floor(clickRatio * totalPages));
    setCurrentPageIndex(targetIdx);
  };

  // Ambience sound management
  const handleAmbienceChange = (type: AmbienceSoundType) => {
    setSelectedAmbience(type);
    if (type === 'none') {
      ambienceService.stop();
    } else {
      ambienceService.play(type);
    }
  };

  const handleAmbienceVolumeChange = (vol: number) => {
    setAmbienceVol(vol);
    ambienceService.setVolume(vol);
  };

  useEffect(() => {
    return () => {
      ambienceService.stop();
    };
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !isLastPage) {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' && !isFirstPage) {
        goToPrevPage();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && !document.fullscreenElement) {
        handleStop();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, isFirstPage, isLastPage, ttsState]);

  const togglePlayPause = () => {
    if (ttsState.isPlaying) {
      if (ttsState.isPaused) {
        ttsService.resume();
      } else {
        ttsService.pause();
      }
    } else {
      playPageNarration(currentPageIndex);
    }
  };

  const goToNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  // Split page text into words for live highlighting
  const words = currentPage.text.split(/\s+/);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden animate-fadeIn text-white select-none"
    >
      {/* Reader Top Header Bar */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Cerrar y detener cuento"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-fredoka text-base sm:text-lg font-bold text-amber-300 line-clamp-1">
              {story.title}
            </h2>
            <p className="text-xs text-slate-400">
              Diapositiva {currentPageIndex + 1} de {totalPages} · {story.author}
            </p>
          </div>
        </div>

        {/* Top Controls: Voice Gender + Fullscreen + PDF button + Settings */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Ver cuento en Pantalla Completa (F)'}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4" />
                <span className="hidden sm:inline">Salir Pantalla Completa</span>
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Pantalla Completa</span>
              </>
            )}
          </button>

          {story.isPdfOriginal && story.pdfPath && (
            <button
              onClick={() => onOpenPdf?.(story.pdfPath!, story.title)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Ver PDF Original</span>
            </button>
          )}

          {/* Quick Voice Gender Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => handleGenderToggle('femenina')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                voiceSettings.gender === 'femenina'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voz ♀
            </button>
            <button
              onClick={() => handleGenderToggle('masculina')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                voiceSettings.gender === 'masculina'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voz ♂
            </button>
          </div>

          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-2 rounded-xl transition-colors ${
              showSettingsMenu ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Ajustes de texto y sonido"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Visual Progress Bar Section */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-8 py-2.5">
        <div className="max-w-5xl mx-auto flex flex-col gap-1.5">
          {/* Progress Metadata Info */}
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Progreso del cuento: <strong className="text-amber-300">{progressPercent}%</strong>
              </span>
            </div>

            <div className="font-semibold text-slate-200">
              Diapositiva <span className="text-amber-400">{currentPageIndex + 1}</span> de {totalPages}
            </div>

            <div className="text-right">
              {slidesRemaining === 0 ? (
                <span className="text-emerald-400 font-bold">¡Última diapositiva! 🎉</span>
              ) : slidesRemaining === 1 ? (
                <span className="text-amber-300 font-medium">Queda <strong className="font-bold">1</strong> diapositiva</span>
              ) : (
                <span>Faltan <strong className="text-amber-300 font-bold">{slidesRemaining}</strong> diapositivas</span>
              )}
            </div>
          </div>

          {/* Interactive Progress Track */}
          <div
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="relative h-3 w-full bg-slate-800 hover:bg-slate-750 rounded-full overflow-hidden cursor-pointer shadow-inner border border-slate-700/80 transition-all group"
            title="Haz clic para saltar a cualquier parte del cuento"
          >
            {/* Filled Progress Bar */}
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 rounded-full transition-all duration-300 relative shadow-md"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 rounded-full animate-pulse" />
            </div>

            {/* Segment Dividers */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-0.5">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-full w-0.5 ${
                    idx <= currentPageIndex ? 'bg-amber-900/30' : 'bg-slate-900/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Storybook Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Column: Cover / Diapositiva Illustration */}
          <div className="relative aspect-[4/3] sm:aspect-[3/4] max-h-[65vh] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-800 flex items-center justify-center group">
            <img
              src={story.coverImage}
              alt={story.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-fredoka text-sm font-semibold">
                  Diapositiva {currentPageIndex + 1} de {totalPages}
                </span>

                {isAutoFlipping && (
                  <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full animate-bounce">
                    Pasando diapositiva... ⏳
                  </span>
                )}
              </div>

              {story.moral && isLastPage && (
                <p className="text-xs sm:text-sm text-amber-100/90 italic mt-2 bg-amber-950/80 p-3 rounded-xl border border-amber-500/20">
                  ✨ Mensaje: {story.moral}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: High-Legibility Story Text */}
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-800 shadow-2xl flex flex-col justify-between min-h-[360px] md:min-h-[480px]">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-xs text-amber-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-amber-400" />
                  Narrando con Voz {voiceSettings.gender === 'femenina' ? 'Femenina' : 'Masculina'}
                </span>
                <span className="text-slate-400">
                  {ttsState.isPlaying ? '▶ Leyendo automático' : '⏸ En pausa'}
                </span>
              </div>

              {/* Story Words Container with Live Highlighting */}
              <div
                className={`leading-relaxed text-slate-100 font-medium ${
                  fontSize === 'normal'
                    ? 'text-base sm:text-lg lg:text-xl'
                    : fontSize === 'large'
                    ? 'text-lg sm:text-xl lg:text-2xl'
                    : 'text-xl sm:text-2xl lg:text-3xl'
                } ${isDyslexicFont ? 'font-dyslexic' : 'font-sans'}`}
              >
                {words.map((word, idx) => {
                  const isHighlighted = ttsState.isPlaying && idx === ttsState.currentWordIndex;
                  return (
                    <span
                      key={idx}
                      className={`inline-block mr-2 transition-all duration-150 rounded px-1.5 py-0.5 ${
                        isHighlighted
                          ? 'bg-amber-400 text-slate-950 font-bold scale-105 shadow-md ring-2 ring-amber-300'
                          : 'hover:text-amber-200'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Page Navigation Indicator */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={goToPrevPage}
                disabled={isFirstPage}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  isFirstPage
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <span className="font-semibold text-slate-300">
                {currentPageIndex + 1} / {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={isLastPage}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  isLastPage
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold'
                }`}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel Overlay if open */}
      {showSettingsMenu && (
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 text-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slideUp">
          {/* Column 1: Voice & Gender Controls */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" /> Opciones de Voz
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Género de Voz:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleGenderToggle('femenina')}
                    className={`px-2 py-1 rounded-md font-semibold ${
                      voiceSettings.gender === 'femenina' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800'
                    }`}
                  >
                    Femenina
                  </button>
                  <button
                    onClick={() => handleGenderToggle('masculina')}
                    className={`px-2 py-1 rounded-md font-semibold ${
                      voiceSettings.gender === 'masculina' ? 'bg-purple-600 text-white' : 'bg-slate-800'
                    }`}
                  >
                    Masculina
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>Velocidad de Lectura:</span>
                <select
                  value={voiceSettings.rate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    const updated = { ...voiceSettings, rate };
                    onVoiceSettingsChange(updated);
                    if (currentPage?.text) ttsService.speak(currentPage.text, updated);
                  }}
                  className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700"
                >
                  <option value={0.75}>0.75x (Muy Lento - Sueño)</option>
                  <option value={0.9}>0.9x (Pausado)</option>
                  <option value={1.0}>1.0x (Normal)</option>
                  <option value={1.2}>1.2x (Rápido)</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer pt-1">
                <span>Pasar diapositiva automáticamente:</span>
                <input
                  type="checkbox"
                  checked={voiceSettings.autoPageTurn}
                  onChange={(e) =>
                    onVoiceSettingsChange({ ...voiceSettings, autoPageTurn: e.target.checked })
                  }
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
              </label>
            </div>
          </div>

          {/* Column 2: Ambience Soundscape */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Music className="w-3.5 h-3.5" /> Sonido Relajante de Fondo
            </h4>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'none', label: 'Sin sonido' },
                  { id: 'lluvia', label: '🌧️ Lluvia' },
                  { id: 'noche', label: '✨ Estrellas' },
                  { id: 'bosque', label: '🌲 Bosque' },
                  { id: 'oceano', label: '🌊 Océano' },
                  { id: 'chimenea', label: '🔥 Chimenea' },
                ].map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => handleAmbienceChange(sound.id as AmbienceSoundType)}
                    className={`p-1.5 rounded text-[11px] font-medium text-center truncate transition-colors ${
                      selectedAmbience === sound.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sound.label}
                  </button>
                ))}
              </div>

              {selectedAmbience !== 'none' && (
                <div className="flex items-center gap-2 pt-1">
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambienceVol}
                    onChange={(e) => handleAmbienceVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Typography Options */}
          <div>
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" /> Tamaño y Tipografía
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Tamaño de Letra:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-2 py-1 rounded font-bold ${
                      fontSize === 'normal' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800'
                    }`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-2 py-1 rounded font-bold text-sm ${
                      fontSize === 'large' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800'
                    }`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize('xlarge')}
                    className={`px-2 py-1 rounded font-bold text-base ${
                      fontSize === 'xlarge' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800'
                    }`}
                  >
                    A++
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between cursor-pointer pt-1">
                <span>Fuente Lectura Fácil (Dislexia):</span>
                <input
                  type="checkbox"
                  checked={isDyslexicFont}
                  onChange={(e) => setIsDyslexicFont(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reader Bottom Controls Toolbar */}
      <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
        <button
          onClick={goToPrevPage}
          disabled={isFirstPage}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
          title="Diapositiva Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Central Controls: Replay, Play/Pause, STOP, and Fullscreen toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => playPageNarration(currentPageIndex)}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
            title="Reiniciar esta diapositiva"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Big Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/20 transform active:scale-95 transition-all"
            title={ttsState.isPlaying && !ttsState.isPaused ? 'Pausar Narración' : 'Reproducir Narración'}
          >
            {ttsState.isPlaying && !ttsState.isPaused ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          {/* Explicit Stop Button */}
          <button
            onClick={handleStop}
            className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            title="Detener cuento y voz"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver cuento en Pantalla Completa'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={goToNextPage}
          disabled={isLastPage}
          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
          title="Diapositiva Siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
