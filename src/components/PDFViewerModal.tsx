import React from 'react';
import { X, ExternalLink, FileText, Download } from 'lucide-react';

interface PDFViewerModalProps {
  pdfPath: string;
  title: string;
  onClose: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  pdfPath,
  title,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-fredoka text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                {title} (PDF Original)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Documento adjuntado por el usuario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Abrir PDF en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Embedded Iframe */}
        <div className="flex-1 bg-slate-950">
          <iframe
            src={`${pdfPath}#toolbar=1`}
            title={title}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
