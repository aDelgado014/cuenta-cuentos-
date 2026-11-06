import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Search,
  Filter,
  Mic,
  Volume2,
  Heart,
  Moon,
  Sun,
  FileText,
  Clock,
  Play,
  Square,
} from 'lucide-react';
import { INITIAL_STORIES } from './data/stories';
import { Story, VoiceSettings, VoiceGender } from './types/story';
import { Navbar } from './components/Navbar';
import { StoryCard } from './components/StoryCard';
import { StoryReaderModal } from './components/StoryReaderModal';
import { StoryGeneratorModal } from './components/StoryGeneratorModal';
import { PDFViewerModal } from './components/PDFViewerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { ttsService, TTSState } from './services/ttsService';
import { ambienceService } from './services/ambienceService';

export default function App() {
  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('cuentilandia_custom_stories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...parsed, ...INITIAL_STORIES];
      } catch (e) {}
    }
    return INITIAL_STORIES;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('cuentilandia_favorites');
    return saved ? JSON.parse(saved) : ['leo-llama-arcoiris', 'aurora-bosque-estrellas'];
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [ttsState, setTtsState] = useState<TTSState>(ttsService.getState());

  // Voice Settings State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    gender: 'femenina',
    engine: 'web-speech',
    pitch: 1.0,
    rate: 0.9, // Bedtime slow & comforting
    volume: 1.0,
    autoPageTurn: true,
  });

  // Modals & Reader
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activePdf, setActivePdf] = useState<{ path: string; title: string } | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Sleep Timer logic
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Subscribe to TTS state to know if narration is actively playing
  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      setTtsState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle Favorites toggle
  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('cuentilandia_favorites', JSON.stringify(updated));
  };

  // Handle story selection & narration launch with automatic slide turning
  const handleSelectStory = (story: Story, voiceGender?: VoiceGender) => {
    if (voiceGender) {
      setVoiceSettings((prev) => ({ ...prev, gender: voiceGender }));
    }
    setActiveStory(story);
  };

  // Handle direct STOP on a story
  const handleStopStory = () => {
    ttsService.stop();
    ambienceService.stop();
    setActiveStory(null);
  };

  // Handle sleep timer activation
  const handleStartSleepTimer = (minutes: number) => {
    setSleepTimerMinutes(minutes);
    const timeoutMs = minutes * 60 * 1000;
    setTimeout(() => {
      handleStopStory();
      setSleepTimerMinutes(null);
    }, timeoutMs);
  };

  // Handle custom generated story
  const handleStoryGenerated = (newStory: Story) => {
    const customList = [newStory, ...stories.filter((s) => s.isCustomGenerated)];
    localStorage.setItem('cuentilandia_custom_stories', JSON.stringify(customList));
    setStories([newStory, ...stories]);
    setIsGeneratorOpen(false);
    setActiveStory(newStory);
  };

  // Filter categories
  const categories = ['Todos', 'Leo y Llama', 'Aurora', 'Alba', 'Mascotas', 'Para Dormir', 'Favoritos'];

  const filteredStories = stories.filter((story) => {
    const matchesCategory =
      selectedCategory === 'Todos' ||
      (selectedCategory === 'Favoritos' && favorites.includes(story.id)) ||
      story.category === selectedCategory;

    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Top Bar Navigation */}
      <Navbar
        voiceSettings={voiceSettings}
        onVoiceSettingsChange={setVoiceSettings}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(!darkMode)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        activeTimerMinutes={sleepTimerMinutes}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-8 pb-10 bg-gradient-to-b from-amber-100/60 via-amber-50/30 to-transparent dark:from-slate-900/80 dark:to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300/50 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Cuentos Infantiles con Reproducción Automática de Diapositivas</span>
            </div>

            <h1 className="font-fredoka text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Apreta Reproducir y la Historia Avanzará Sola Diapositiva a Diapositiva
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Usa los botones <strong>PLAY ▶</strong> y <strong>STOP ⏹</strong> en cada cuento para abrirlo inmediatamente, escuchar la narración con voz femenina o masculina y pasar las diapositivas de forma automática.
            </p>

            {/* Global Playing Banner if audio active */}
            {activeStory && ttsState.isPlaying && (
              <div className="mt-5 p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-between gap-3 shadow-lg max-w-xl animate-pulse">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  <span className="truncate">
                    Reproduciendo: <strong>{activeStory.title}</strong>
                  </span>
                </div>
                <button
                  onClick={handleStopStory}
                  className="px-3 py-1 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1 shrink-0"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Detener</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main id="biblioteca" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 pt-2">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'Favoritos' ? `❤️ ${cat} (${favorites.length})` : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o autor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                isPlayingThisStory={activeStory?.id === story.id && ttsState.isPlaying}
                onSelectStory={handleSelectStory}
                onStopStory={handleStopStory}
                onOpenPdf={(pdfPath, title) => setActivePdf({ path: pdfPath, title })}
                isFavorite={favorites.includes(story.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-amber-200 dark:border-slate-700 p-8">
            <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
            <h3 className="font-fredoka text-lg font-bold text-slate-800 dark:text-slate-200">
              No encontramos cuentos en esta categoría
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Prueba buscar con otra palabra clave o haz clic en "Crear Cuento con IA" para inventar uno nuevo.
            </p>
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow hover:bg-amber-400 transition-colors"
            >
              Inventar Cuento Ahora
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-amber-200/60 dark:border-slate-800 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="font-fredoka font-bold text-slate-800 dark:text-slate-200">
              Cuentilandia Voz & Magia
            </span>
            <span>· Cuentos infantiles narrados de Andres Delgado</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span>Reproducción Automática de Diapositivas</span>
            <span>·</span>
            <span>2026 Todos los derechos reservados</span>
          </div>
        </div>
      </footer>

      {/* Active Story Reader Modal */}
      {activeStory && (
        <StoryReaderModal
          story={activeStory}
          voiceSettings={voiceSettings}
          onVoiceSettingsChange={setVoiceSettings}
          onClose={() => setActiveStory(null)}
          onOpenPdf={(pdfPath, title) => setActivePdf({ path: pdfPath, title })}
        />
      )}

      {/* AI Story Generator Modal */}
      {isGeneratorOpen && (
        <StoryGeneratorModal
          onClose={() => setIsGeneratorOpen(false)}
          onStoryGenerated={handleStoryGenerated}
        />
      )}

      {/* PDF Viewer Modal */}
      {activePdf && (
        <PDFViewerModal
          pdfPath={activePdf.path}
          title={activePdf.title}
          onClose={() => setActivePdf(null)}
        />
      )}

      {/* Sleep Timer Modal */}
      {isSleepTimerOpen && (
        <SleepTimerModal
          activeTimerMinutes={sleepTimerMinutes}
          onStartTimer={handleStartSleepTimer}
          onCancelTimer={() => setSleepTimerMinutes(null)}
          onClose={() => setIsSleepTimerOpen(false)}
        />
      )}

      {/* Detailed Voice Settings Modal */}
      {isVoiceModalOpen && (
        <VoiceSettingsModal
          voiceSettings={voiceSettings}
          onVoiceSettingsChange={setVoiceSettings}
          onClose={() => setIsVoiceModalOpen(false)}
        />
      )}
    </div>
  );
}
