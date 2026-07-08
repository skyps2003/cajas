import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { getUpcomingDeadlines } from '../../utils/sunatSchedule';

interface SunatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SunatModal: React.FC<SunatModalProps> = ({ isOpen, onClose }) => {
  const upcomingDeadlines = getUpcomingDeadlines();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || upcomingDeadlines.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1f2e] w-full max-w-2xl rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/50 overflow-hidden relative mx-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-black/20 transition-colors z-20"
        >
          <X size={20} />
        </button>
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <AlertTriangle size={150} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <AlertTriangle size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black mb-1">Aviso Importante: Vencimientos SUNAT</h2>
              <p className="text-rose-100 font-medium">Periodo {upcomingDeadlines[0].periodo}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 font-medium mb-6">
            Recuerda que debes realizar tus declaraciones y pagos antes de las siguientes fechas límite, según el último dígito del RUC. Evita multas y recargos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {upcomingDeadlines.map((d, i) => (
              <div key={i} className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
                  {d.digitos === 'Buenos Contrib.' ? 'BUENOS C.' : `RUC ${d.digitos}`}
                </span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {d.fechaFormat}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
