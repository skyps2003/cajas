import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import type { TipoComprobante } from '../../../services/tipoComprobanteService';

interface ComprobanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string }) => void;
  initialData?: TipoComprobante | null;
}

export const ComprobanteModal: React.FC<ComprobanteModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNombre(initialData.nombre);
      } else {
        setNombre('');
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const handlePreSave = () => {
    if (!nombre.trim()) {
      setError('El nombre del comprobante es obligatorio.');
      return;
    }
    setError(null);
    onSave({ nombre: nombre.trim().toUpperCase() });
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col animate-fade-in" style={{ maxHeight: '90vh' }}>
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2D3D] p-2 rounded-full transition-all duration-200 z-10 hover:rotate-90"
        >
          <X size={20} />
        </button>

        <div className="p-8 overflow-y-auto no-scrollbar">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-[10px] font-bold tracking-wider mb-3">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              {initialData ? 'Editar Comprobante' : 'Registrar Nuevo Comprobante'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Complete los campos para gestionar el tipo de comprobante en el sistema.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex gap-3 items-center animate-fade-in">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase tracking-wide">
                Nombre del Comprobante *
              </label>
              <input 
                type="text" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: FACTURA"
                className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePreSave();
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dim rounded-b-2xl flex items-center justify-center gap-4 shrink-0 mt-2">
          <button 
            onClick={handlePreSave}
            className="px-8 py-3.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-base font-bold transition-colors shadow-sm min-w-[200px]"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3.5 border border-outline-variant rounded-lg text-base font-bold text-on-surface hover:bg-surface-variant transition-colors min-w-[140px]"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
