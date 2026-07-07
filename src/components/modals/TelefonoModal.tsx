import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastContext';
import { telefonoService } from '../../services/telefonoService';
import type { TelefonoResponse, TelefonoCreatePayload, TelefonoUpdatePayload } from '../../services/telefonoService';
import { tipoTelefonoService } from '../../services/tipoTelefonoService';
import type { TipoTelefonoResponse } from '../../services/tipoTelefonoService';

interface TelefonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  contribuyenteId: number;
  editingRegistro?: TelefonoResponse | null;
}

const EMPTY_FORM = {
  id_tipo_telefono: 2,
  numero: '',
  nombre_contacto: '',
  descripcion: '',
  principal: false,
  estado: true
};

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] uppercase tracking-wider mb-1.5';

export const TelefonoModal: React.FC<TelefonoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contribuyenteId,
  editingRegistro
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [tiposTelefonos, setTiposTelefonos] = useState<TipoTelefonoResponse[]>([]);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTipos();
      if (editingRegistro) {
        setFormData({
          id_tipo_telefono: editingRegistro.tipo_telefono_id || 2,
          numero: editingRegistro.numero,
          nombre_contacto: editingRegistro.nombre_contacto || '',
          descripcion: editingRegistro.descripcion || '',
          principal: editingRegistro.principal,
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
      const ts = await tipoTelefonoService.getAll(user.token);
      setTiposTelefonos(ts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!formData.numero) {
      showToast('warning', 'Campos incompletos', 'Ingrese el número de teléfono.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingRegistro) {
        const updatePayload: TelefonoUpdatePayload = {
          id_registro_contribuyentes: contribuyenteId,
          id_tipo_telefono: Number(formData.id_tipo_telefono),
          numero: formData.numero,
          nombre_contacto: formData.nombre_contacto,
          descripcion: formData.descripcion,
          principal: formData.principal,
          estado: formData.estado
        };
        await telefonoService.updateTelefono(editingRegistro.id, updatePayload, user.token);
        showToast('success', 'Teléfono Actualizado', 'Los datos del teléfono se guardaron con éxito.');
      } else {
        const createPayload: TelefonoCreatePayload = {
          numero: formData.numero,
          id_tipo_telefono: Number(formData.id_tipo_telefono),
          nombre_contacto: formData.nombre_contacto,
          descripcion: formData.descripcion,
          principal: formData.principal
        };
        await telefonoService.createTelefono(contribuyenteId, createPayload, user.token);
        showToast('success', 'Teléfono Agregado', 'Se añadió el nuevo teléfono de contacto.');
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
      <div className="bg-white dark:bg-[#16212E] w-full max-w-[500px] rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2D3D] p-2 rounded-full transition-all duration-200 z-10 hover:rotate-90"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
          <div className="mb-5">
            <span className="inline-block px-2.5 py-1 bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] rounded-full text-[10px] font-bold tracking-wider mb-2.5">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
              {editingRegistro ? 'Modificar Teléfono' : 'Agregar Nuevo Teléfono'}
            </h2>
          </div>
        
          <form id="telefono-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col">
              <label className={labelCls}>Número</label>
              <input 
                type="text" 
                placeholder="Ej: 987654321"
                required
                className={`${inputCls} font-mono`}
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelCls}>Tipo de Línea</label>
              <select
                className={inputCls}
                required
                value={formData.id_tipo_telefono}
                onChange={(e) => setFormData({ ...formData, id_tipo_telefono: e.target.value })}
              >
                <option value="">Seleccione tipo...</option>
                {tiposTelefonos.map(tt => (
                  <option key={tt.id} value={tt.id}>{tt.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className={labelCls}>Nombre de Contacto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Carlos Mendoza"
                  required
                  className={inputCls}
                  value={formData.nombre_contacto}
                  onChange={(e) => setFormData({ ...formData, nombre_contacto: e.target.value })}
                />
              </div>
              <div className="flex flex-col">
                <label className={labelCls}>Descripción / Área</label>
                <input 
                  type="text" 
                  placeholder="Ej: Ventas y Pagos"
                  required
                  className={inputCls}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="principal" checked={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.checked })}
                className="rounded text-[#C4933F] focus:ring-[#C4933F] border-[#CBD5E1] w-4 h-4" />
              <label htmlFor="principal" className="text-sm text-[#1B2E4B] dark:text-[#E8EDF5] font-medium">Es el teléfono principal</label>
            </div>
          </form>
        </div>

        <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
          <button type="submit" form="telefono-form" disabled={isSaving}
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
