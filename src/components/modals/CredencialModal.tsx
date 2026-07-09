import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastContext';
import { credencialService } from '../../services/credencialService';
import type { CredencialResponse, CredencialCreatePayload, CredencialUpdatePayload } from '../../services/credencialService';
import { tipoCredencialService } from '../../services/tipoCredencialService';
import type { TipoCredencialResponse } from '../../services/tipoCredencialService';

interface CredencialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  contribuyenteId: number;
  editingRegistro?: CredencialResponse | null;
}

const EMPTY_FORM = {
  id_tipo_credencial: '',
  usuario: '',
  clave: '',
  observaciones: '',
  estado: true
};

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] uppercase tracking-wider mb-1.5';

export const CredencialModal: React.FC<CredencialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contribuyenteId,
  editingRegistro
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [tiposCredencial, setTiposCredencial] = useState<TipoCredencialResponse[]>([]);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTipos();
      if (editingRegistro) {
        setFormData({
          id_tipo_credencial: '',
          usuario: editingRegistro.usuario,
          clave: editingRegistro.clave,
          observaciones: editingRegistro.observaciones || '',
          estado: editingRegistro.estado
        });
      } else {
        setFormData({ ...EMPTY_FORM });
      }
    }
  }, [isOpen, editingRegistro]);

  const loadTipos = async () => {
    if (!user?.token) return;
    try {
      const ts = await tipoCredencialService.getAll(user.token);
      setTiposCredencial(ts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!formData.usuario || !formData.clave || !formData.id_tipo_credencial) {
      showToast('warning', 'Campos incompletos', 'Llene usuario, clave y sistema.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingRegistro) {
        const updatePayload: CredencialUpdatePayload = {
          id_tipo_credencial: Number(formData.id_tipo_credencial),
          usuario: formData.usuario,
          clave: formData.clave,
          observaciones: formData.observaciones,
          estado: formData.estado
        };
        await credencialService.updateCredencial(editingRegistro.id, updatePayload, user.token);
        showToast('success', 'Credencial Actualizada', 'Los datos se guardaron con éxito.');
      } else {
        const createPayload: CredencialCreatePayload = {
          id_tipo_credencial: Number(formData.id_tipo_credencial),
          usuario: formData.usuario,
          clave: formData.clave,
          observaciones: formData.observaciones
        };
        await credencialService.createCredencial(contribuyenteId, createPayload, user.token);
        showToast('success', 'Credencial Agregada', 'Se añadieron los accesos.');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al Guardar', 'Hubo un problema al procesar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16212E] w-full max-w-[450px] rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
          <div className="mb-5">
            <span className="inline-block px-2.5 py-1 bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] rounded-full text-[10px] font-bold tracking-wider mb-2.5">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
              {editingRegistro ? 'Modificar Acceso' : 'Agregar Credenciales'}
            </h2>
          </div>
        
          <form id="credencial-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label className={labelCls}>Sistema / Entidad (Tipo)</label>
              <select
                className={inputCls}
                required
                value={formData.id_tipo_credencial}
                onChange={(e) => setFormData({ ...formData, id_tipo_credencial: e.target.value })}
              >
                <option value="">Seleccione sistema...</option>
                {tiposCredencial.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className={labelCls}>Usuario Acceso</label>
                <input 
                  type="text" 
                  placeholder="Usuario"
                  required
                  className={`${inputCls} font-mono`}
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                />
              </div>

              <div className="flex flex-col">
                <label className={labelCls}>Clave / Contraseña</label>
                <input 
                  type="text" 
                  placeholder="Contraseña"
                  required
                  className={`${inputCls} font-mono`}
                  value={formData.clave}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className={labelCls}>Observaciones</label>
              <input 
                type="text" 
                placeholder="Detalles adicionales..."
                className={inputCls}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>

            {editingRegistro && (
              <div className="flex flex-col">
                <label className={labelCls}>Estado Operativo</label>
                <select
                  className={inputCls}
                  value={formData.estado ? '1' : '0'}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value === '1' })}
                >
                  <option value="1">ACTIVO (Vigente)</option>
                  <option value="0">INACTIVO</option>
                </select>
              </div>
            )}
          </form>
        </div>

        <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
          <button type="submit" form="credencial-form" disabled={isSaving}
            className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[160px] flex items-center justify-center gap-2">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {editingRegistro ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button type="button" onClick={onClose} disabled={isSaving}
            className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[120px]">
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
};
