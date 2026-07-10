import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { getUpcomingDeadlines } from '../../utils/sunatSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { contribuyenteService } from '../../services/contribuyenteService';

interface SunatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SunatModal: React.FC<SunatModalProps> = ({ isOpen, onClose }) => {
  const upcomingDeadlines = getUpcomingDeadlines();
  const { user } = useAuth();
  const token = localStorage.getItem('auth_token') || '';
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (!token) return;
        const data = await contribuyenteService.getAll(token);
        const activeData = data.filter(c => c.estado === 1);
        
        const newCounts: Record<string, number> = {};
        upcomingDeadlines.forEach(d => {
          if (d.digitos === 'Buenos Contrib.') {
             newCounts[d.digitos] = 0; // Requires special sunat flag, defaulting to 0 for now
          } else {
             const count = activeData.filter(c => {
               if (!c.ruc) return false;
               const lastDigit = c.ruc.slice(-1);
               return d.digitos.includes(lastDigit);
             }).length;
             newCounts[d.digitos] = count;
          }
        });
        setCounts(newCounts);
      } catch (error) {
        console.error('Error fetching contribuyentes for modal counts', error);
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchCounts();
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
      <div className="bg-white dark:bg-[#1a1f2e] w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-rose-100 dark:border-rose-900/50 overflow-hidden relative mx-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-black/20 transition-colors z-20"
        >
          <X size={20} />
        </button>
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-6 sm:px-6 sm:py-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <AlertTriangle size={150} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <AlertTriangle size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-1 pr-6 sm:pr-0">Aviso Importante: Vencimientos SUNAT</h2>
              <p className="text-rose-100 font-medium text-sm sm:text-base">Periodo {upcomingDeadlines[0].periodo}</p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium mb-5 sm:mb-6 leading-relaxed">
            Hola <span className="font-bold text-rose-600 dark:text-rose-400 uppercase">{user?.name}</span>, como parte del equipo es vital tu apoyo. Recuerda que debes realizar las declaraciones y pagos de los contribuyentes a tu cargo antes de las fechas límite para evitar multas de SUNAT.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
            {upcomingDeadlines.map((d, i) => (
              <div key={i} className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">
                  {d.digitos === 'Buenos Contrib.' ? 'BUENOS C.' : `RUC ${d.digitos}`}
                </span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {d.fechaFormat}
                </span>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 mt-1 bg-white dark:bg-rose-900/40 px-2 py-0.5 rounded-full shadow-sm border border-rose-100 dark:border-rose-800/30">
                  {counts[d.digitos] !== undefined ? counts[d.digitos] : '...'} contribuyentes
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
