import React from 'react';
import { Play, Square, Pause, FileText, Clock, Heart, Volume2, Sparkles } from 'lucide-react';
import { Story, VoiceGender } from '../types/story';

interface StoryCardProps {
  story: Story;
  onSelectStory: (story: Story, voiceGender?: VoiceGender) => void;
  onStopStory: () => void;
  isPlayingThisStory: boolean;
  onOpenPdf?: (pdfPath: string, title: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (storyId: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onSelectStory,
  onStopStory,
  isPlayingThisStory,
  onOpenPdf,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <div
      className={`group relative bg-white dark:bg-slate-800/90 rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col h-full storybook-card ${
        isPlayingThisStory
          ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/50 shadow-xl'
          : 'border-amber-100 dark:border-slate-700/60 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[4/3] sm:aspect-[3/4] overflow-hidden bg-amber-100 dark:bg-slate-900">
        <img
          src={story.coverImage}
          alt={story.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isPlayingThisStory ? 'scale-105 filter brightness-105' : 'group-hover:scale-105'
          }`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10">
          <span className="bg-amber-900/80 backdrop-blur-md text-amber-100 text-xs font-bold px-2.5 py-1 rounded-xl shadow-sm">
            {story.category}
          </span>
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {story.isPdfOriginal && story.pdfPath && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPdf?.(story.pdfPath!, story.title);
                }}
                className="bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-800 dark:text-slate-200 text-xs font-medium px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 transition-all"
                title="Ver PDF Original Adjuntado"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(story.id);
                }}
                className={`p-1.5 rounded-xl backdrop-blur-md transition-all ${
                  isFavorite ? 'bg-rose-500 text-white' : 'bg-black/30 hover:bg-black/50 text-white'
                }`}
                title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Playing Status Overlay Banner */}
        {isPlayingThisStory && (
          <div className="absolute top-12 left-3 bg-amber-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse z-10">
            <Sparkles className="w-3 h-3" />
            <span>EN REPRODUCCIÓN AUTOMÁTICA</span>
          </div>
        )}

        {/* Big Central Overlay Action Buttons */}
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center gap-3 opacity-90 sm:opacity-0 group-hover:opacity-100 duration-200">
          <button
            onClick={() => onSelectStory(story)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 flex items-center justify-center shadow-xl transform hover:scale-110 active:scale-95 transition-all font-bold"
            title="Abrir y reproducir pasando diapositivas"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>

          {isPlayingThisStory && (
            <button
              onClick={onStopStory}
              className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl transform hover:scale-110 active:scale-95 transition-all"
              title="Detener cuento"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Bar */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>{story.targetAge}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              {story.readTime}
            </span>
            <span aria-hidden="true">·</span>
            <span>{story.pages.length} diapositivas</span>
          </div>

          {/* Title & Author */}
          <h3 className="font-fredoka text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            {story.title}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Por {story.author}
          </p>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
            {story.description}
          </p>
        </div>

        {/* Direct Play & Stop Toolbar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-2">
          {/* Direct Play Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectStory(story)}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              title="Abrir y reproducir cuento pasando diapositivas"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Reproducir Cuento</span>
            </button>

            <button
              onClick={onStopStory}
              className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isPlayingThisStory
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
              }`}
              title="Detener reproducción de voz"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Detener</span>
            </button>
          </div>

          {/* Voice Gender Selection Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectStory(story, 'femenina')}
              className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-xl bg-amber-50 dark:bg-slate-700/60 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 transition-colors flex items-center justify-center gap-1"
              title="Reproducir directo con Voz Femenina"
            >
              <Volume2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Voz ♀ Femenina</span>
            </button>

            <button
              onClick={() => onSelectStory(story, 'masculina')}
              className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 transition-colors flex items-center justify-center gap-1"
              title="Reproducir directo con Voz Masculina"
            >
              <Volume2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>Voz ♂ Masculina</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
