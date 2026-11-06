import React from 'react';
import { X, Clock, Moon, Check, VolumeX } from 'lucide-react';

interface SleepTimerModalProps {
  activeTimerMinutes: number | null;
  onStartTimer: (minutes: number) => void;
  onCancelTimer: () => void;
  onClose: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  activeTimerMinutes,
  onStartTimer,
  onCancelTimer,
  onClose,
}) => {
  const options = [5, 10, 15, 30, 45, 60];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fredoka text-base font-bold">Temporizador de Sueño</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Apaga el audio suavemente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeTimerMinutes ? (
          <div className="text-center py-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 mb-4">
            <Moon className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-200">
              Temporizador activo
            </p>
            <p className="text-2xl font-bold font-fredoka text-purple-700 dark:text-purple-300 mt-1">
              ~ {activeTimerMinutes} min restantes
            </p>
            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="mt-3 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow transition-colors"
            >
              Cancelar Temporizador
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
            Selecciona en cuántos minutos deseas que la narración y los sonidos de fondo se apaguen solos cuando tu peque se quede dormido:
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {options.map((mins) => (
            <button
              key={mins}
              onClick={() => {
                onStartTimer(mins);
                onClose();
              }}
              className={`p-3 rounded-2xl border text-center transition-all ${
                activeTimerMinutes === mins
                  ? 'bg-purple-600 text-white border-purple-600 font-bold'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <span className="block text-base font-bold font-fredoka">{mins}</span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400">minutos</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
