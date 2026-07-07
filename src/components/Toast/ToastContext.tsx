import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <Info size={18} />,
};

const STYLES: Record<ToastType, { bar: string; icon: string; bg: string; border: string }> = {
  success: {
    bar: 'bg-[#2a7d57]',
    icon: 'text-[#2a7d57]',
    bg: 'bg-white dark:bg-[#16212E]',
    border: 'border-[#2a7d57]/30',
  },
  error: {
    bar: 'bg-[#b91c1c]',
    icon: 'text-[#b91c1c]',
    bg: 'bg-white dark:bg-[#16212E]',
    border: 'border-[#b91c1c]/30',
  },
  info: {
    bar: 'bg-[#C4933F]',
    icon: 'text-[#C4933F]',
    bg: 'bg-white dark:bg-[#16212E]',
    border: 'border-[#C4933F]/30',
  },
  warning: {
    bar: 'bg-[#f59e0b]',
    icon: 'text-[#f59e0b]',
    bg: 'bg-white dark:bg-[#16212E]',
    border: 'border-[#f59e0b]/30',
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const style = STYLES[toast.type];

  return (
    <div
      className={`relative flex items-start gap-3 min-w-[300px] max-w-[380px] rounded-xl shadow-lg border px-4 py-3.5 ${style.bg} ${style.border} overflow-hidden
        animate-[slideInRight_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]`}
      style={{ borderWidth: '1px' }}
    >
      {/* Barra lateral de color */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar} rounded-l-xl`} />

      {/* Icono */}
      <div className={`shrink-0 mt-0.5 ${style.icon}`}>
        {ICONS[toast.type]}
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-[#6B7A94] hover:text-[#1B2E4B] dark:hover:text-[#E8EDF5] transition-colors mt-0.5"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${++counterRef.current}-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);

    // Auto-dismiss after 4s
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
