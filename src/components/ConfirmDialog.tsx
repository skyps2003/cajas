import React, { type ReactNode } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  icon?: 'trash' | 'alert';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sí, eliminar',
  cancelText = 'Cancelar',
  icon = 'trash'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-in fade-in zoom-in duration-200">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${icon === 'trash' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          {icon === 'trash' ? (
            <Trash2 className="text-red-600 dark:text-red-400" size={22} />
          ) : (
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={22} />
          )}
        </div>
        <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">{title}</h3>
        <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 border rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-[#1B2E4B] dark:text-white cursor-pointer"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer ${icon === 'trash' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#B47541] hover:bg-[#9c6030]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
