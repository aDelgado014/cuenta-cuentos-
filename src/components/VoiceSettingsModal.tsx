import React, { useEffect, useState } from 'react';
import { X, Mic, Volume2, Sparkles, Play, Check } from 'lucide-react';
import { VoiceSettings } from '../types/story';
import { ttsService } from '../services/ttsService';

interface VoiceSettingsModalProps {
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  voiceSettings,
  onVoiceSettingsChange,
  onClose,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const voices = ttsService.getVoicesByGender(voiceSettings.gender);
      setAvailableVoices(voices);
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [voiceSettings.gender]);

  const testVoiceSample = () => {
    const sampleText =
      voiceSettings.gender === 'femenina'
        ? 'Hola, soy la voz femenina. Me encanta narrar cuentos mágicos para soñar.'
        : 'Hola, soy la voz masculina. Estoy listo para contar la aventura más divertida.';
    ttsService.speak(sampleText, voiceSettings);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fredoka text-base font-bold">Ajustes de Voz y Locución</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personaliza la experiencia sonora</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Gender Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Género de Voz Predeterminado
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onVoiceSettingsChange({ ...voiceSettings, gender: 'femenina' })}
                className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                  voiceSettings.gender === 'femenina'
                    ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="text-base">♀</span>
                <span>Voz Femenina</span>
              </button>

              <button
                type="button"
                onClick={() => onVoiceSettingsChange({ ...voiceSettings, gender: 'masculina' })}
                className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                  voiceSettings.gender === 'masculina'
                    ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="text-base">♂</span>
                <span>Voz Masculina</span>
              </button>
            </div>
          </div>

          {/* System Voice Model Dropdown */}
          {availableVoices.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Voz del Sistema ({availableVoices.length} detectadas)
              </label>
              <select
                value={voiceSettings.selectedVoiceName || ''}
                onChange={(e) =>
                  onVoiceSettingsChange({ ...voiceSettings, selectedVoiceName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="">-- Voz Automática del Sistema --</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Speed Slider */}
          <div>
            <div className="flex justify-between font-bold mb-1">
              <span>Velocidad (Ritmo):</span>
              <span className="text-amber-600 dark:text-amber-400">{voiceSettings.rate}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.3"
              step="0.05"
              value={voiceSettings.rate}
              onChange={(e) =>
                onVoiceSettingsChange({ ...voiceSettings, rate: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Lento (Sueño)</span>
              <span>Normal</span>
              <span>Ligero</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex justify-between font-bold mb-1">
              <span>Tono de la Voz (Pitch):</span>
              <span className="text-amber-600 dark:text-amber-400">{voiceSettings.pitch}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={voiceSettings.pitch}
              onChange={(e) =>
                onVoiceSettingsChange({ ...voiceSettings, pitch: parseFloat(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Más Grave</span>
              <span>Natural</span>
              <span>Más Agudo</span>
            </div>
          </div>

          {/* Test Voice Sample Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={testVoiceSample}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-100 dark:bg-slate-800 hover:bg-amber-200 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Probar Voz de Muestra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
