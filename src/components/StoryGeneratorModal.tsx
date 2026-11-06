import React, { useState } from 'react';
import { X, Sparkles, Wand2, Loader2, BookOpen, User, Heart } from 'lucide-react';
import { Story } from '../types/story';

interface StoryGeneratorModalProps {
  onClose: () => void;
  onStoryGenerated: (story: Story) => void;
}

export const StoryGeneratorModal: React.FC<StoryGeneratorModalProps> = ({
  onClose,
  onStoryGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [childName, setChildName] = useState('');
  const [theme, setTheme] = useState('Magia y Fantasía');
  const [ageGroup, setAgeGroup] = useState('3-6 años');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    'Un dragón bebé que aprende a volar para salvar las estrellas de colores',
    'Un conejito astronauta que busca zanahorias mágicas en la luna',
    'Un gatito detective que descubre dónde se guardan los sueños bonitos',
    'Una osita que aprende a compartir sus galletas de miel con sus amigos',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          childName,
          theme,
          ageGroup,
        }),
      });

      let data: any = null;
      try {
        const textResponse = await res.text();
        if (textResponse && textResponse.trim().startsWith('{')) {
          data = JSON.parse(textResponse);
        }
      } catch (parseErr) {
        console.warn('Client parse response warning:', parseErr);
      }

      const protagonist = childName || 'Leo';
      const generated = data?.story || {
        title: `La Mágica Historia de ${protagonist}`,
        author: `IA Cuentilandia & ${protagonist}`,
        description: `Un hermoso cuento sobre ${prompt}.`,
        targetAge: ageGroup || '3-6 años',
        readTime: '4 min',
        moral: 'La imaginación y la bondad llenan el mundo de alegría.',
        category: theme || 'Fantasía',
        pages: [
          {
            pageNumber: 1,
            text: `Había una vez en un lugar mágico donde ${protagonist} miraba las estrellas soñando con descubrir ${prompt}.`,
          },
          {
            pageNumber: 2,
            text: `De pronto, chispitas de luz volaron en el aire susurrando una melodía que invitaba a comenzar una aventura inolvidable.`,
          },
          {
            pageNumber: 3,
            text: `${protagonist} dio un paso adelante lleno de curiosidad y alegría. Todo el bosque olía a flores frescas y caramelos.`,
          },
          {
            pageNumber: 4,
            text: `Acompañado de buenos amiguitos, ${protagonist} comprendió que compartir y ayudar a los demás es la magia más bonita.`,
          },
          {
            pageNumber: 5,
            text: `Al caer la noche, acurrucado bajo una cálida mantita, ${protagonist} cerró los ojos sonriendo plácidamente.`,
          },
        ],
      };

      const newStory: Story = {
        id: `custom-${Date.now()}`,
        title: generated.title || 'El Cuento Mágico',
        author: generated.author || (childName ? `Para ${childName}` : 'IA Cuentilandia'),
        description: generated.description || prompt,
        coverImage: '/src/assets/images/cover_leo_llama_arcoiris_1793819901146.jpg',
        category: (generated.category as any) || 'Fantasía',
        targetAge: generated.targetAge || ageGroup,
        readTime: generated.readTime || '4 min',
        moral: generated.moral,
        isCustomGenerated: true,
        pages: (generated.pages || []).map((p: any, index: number) => ({
          pageNumber: p.pageNumber || index + 1,
          text: p.text || 'Una página llena de magia y sonrisas.',
        })),
      };

      onStoryGenerated(newStory);
    } catch (err: any) {
      console.error('Error generating story:', err);
      setError('Ocurrió un pequeño inconveniente. Por favor reintenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-amber-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-fredoka text-lg font-bold text-slate-900 dark:text-white">
                Crear Cuento con IA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Impulsado por Google Gemini 3.8 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ¿De qué tratará el cuento? *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Un osito travieso que construye un barco de galleta para navegar un río de chocolate..."
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-400 outline-none resize-none"
            />
          </div>

          {/* Quick Ideas Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              💡 Ideas rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="text-[11px] bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-xl transition-colors text-left"
                >
                  {p.slice(0, 35)}...
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del niño/a (opcional)
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Ej: Sofía o Mateo"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Edad Objetivo
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="1-3 años">1-3 años (Muy simple)</option>
                <option value="3-6 años">3-6 años (Aventuras)</option>
                <option value="6-9 años">6-9 años (Fantasía)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Escribiendo historia mágica...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar y Escuchar Cuento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
