import React, { useState, useEffect } from 'react';
import { X, Loader2, UploadCloud, ChevronDown, File } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../Toast/ToastContext';
import { documentoService } from '../../services/documentoService';
import type { DocumentoResponse } from '../../services/documentoService';
import { tipoDocumentoService } from '../../services/tipoDocumentoService';
import type { TipoDocumentoResponse } from '../../services/tipoDocumentoService';
import { rubroService } from '../../services/rubroService';


interface DocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  contribuyenteId: number;
  editingDocumento?: DocumentoResponse | null;
}

const EMPTY_FORM = {
  id_tipo_documento: '',
  nombre_documento: '',
  observaciones: '',
  estado: true
};

const inputCls = 'w-full px-4 py-2.5 bg-slate-50/50 dark:bg-[#0F1E2E]/50 border border-slate-200 dark:border-[#1E2D3D] rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-[#C4933F]/20 focus:border-[#C4933F] transition-all duration-300 text-slate-800 dark:text-[#E8EDF5] hover:bg-white dark:hover:bg-[#0F1E2E] shadow-sm';
const labelCls = 'block text-[11px] font-bold text-slate-500 dark:text-[#8899B4] uppercase tracking-wider mb-2 ml-1';

export const DocumentoModal: React.FC<DocumentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contribuyenteId,
  editingDocumento
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoResponse[]>([]);

  
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      loadDependencies();
      if (editingDocumento) {
        setFormData({
          id_tipo_documento: '',
          nombre_documento: editingDocumento.nombre_documento || '',
          observaciones: editingDocumento.observaciones || '',
          estado: editingDocumento.estado
        });
      } else {
        setFormData({ ...EMPTY_FORM });
      }
      setSelectedFile(null);
    } else {
      setShowModal(false);
    }
  }, [isOpen, editingDocumento]);

  const loadDependencies = async () => {
    if (!user?.token) return;
    try {
      const [tdRes] = await Promise.all([
        tipoDocumentoService.getAll(user.token),
        rubroService.getAll(user.token)
      ]);
      setTiposDocumento(tdRes);

      // Si estamos editando y faltaban los IDs, tratamos de matchearlos por nombre
      if (editingDocumento) {
        setFormData((prev: any) => ({
          ...prev,
          id_tipo_documento: prev.id_tipo_documento || tdRes.find(t => t.nombre_tipo_documento === editingDocumento.tipo_documento)?.id.toString() || '',
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    
    if (!formData.nombre_documento || !formData.id_tipo_documento) {
      showToast('warning', 'Campos incompletos', 'Llene todos los campos requeridos.');
      return;
    }
    
    if (!editingDocumento && !selectedFile) {
      showToast('warning', 'Archivo requerido', 'Debe adjuntar un documento.');
      return;
    }

    try {
      setIsSaving(true);
      const formPayload = new FormData();
      formPayload.append('id_registro_contribuyente', String(contribuyenteId));
      formPayload.append('id_tipo_documento', formData.id_tipo_documento);
      formPayload.append('nombre_documento', formData.nombre_documento);
      formPayload.append('observaciones', formData.observaciones || '');
      
      if (selectedFile) {
        formPayload.append('archivo', selectedFile);
      }

      if (editingDocumento) {
        formPayload.append('estado', formData.estado ? '1' : '0');
        await documentoService.updateDocumento(editingDocumento.id, formPayload, user.token);
        showToast('success', 'Documento Actualizado', 'El documento se actualizó correctamente.');
      } else {
        await documentoService.createDocumento(formPayload, user.token);
        showToast('success', 'Archivo Subido', 'El documento se subió correctamente.');
      }
      handleClose();
      onSave();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al Guardar', 'Hubo un problema subiendo el archivo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !showModal) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${showModal ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none pointer-events-none'}`}>
      <div 
        className={`bg-white dark:bg-[#16212E] w-full max-w-[550px] rounded-2xl shadow-2xl relative flex flex-col border border-slate-100 dark:border-[#1E2D3D] transition-all duration-300 transform ${showModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        style={{ maxHeight: '90vh' }}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex-1">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1B2E4B]/40 dark:to-[#1B2E4B]/60 border border-blue-100/50 dark:border-blue-900/30 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 tracking-wider uppercase">
                Formulario de Gestión
              </span>
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              {editingDocumento ? 'Editar Documento' : 'Subir Nuevo Documento'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Complete la información requerida para {editingDocumento ? 'actualizar el' : 'registrar un nuevo'} documento en el sistema.
            </p>
          </div>
        
          <form id="documento-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col group">
              <label className={labelCls}>Nombre del Documento</label>
              <input 
                type="text" 
                placeholder="Ej: Contrato de Arrendamiento 2024"
                required
                className={inputCls}
                value={formData.nombre_documento}
                onChange={(e) => setFormData({ ...formData, nombre_documento: e.target.value })}
              />
            </div>

            <div className="flex flex-col">
              <label className={labelCls}>Tipo de Documento</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none cursor-pointer`}
                  required
                  value={formData.id_tipo_documento}
                  onChange={(e) => setFormData({ ...formData, id_tipo_documento: e.target.value })}
                >
                  <option value="" disabled className="text-slate-400">Seleccione tipo...</option>
                  {tiposDocumento.map(td => (
                    <option key={td.id} value={td.id}>{td.nombre_tipo_documento}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex flex-col">
              <label className={labelCls}>Observaciones (Opcional)</label>
              <textarea 
                placeholder="Agregue notas o detalles adicionales sobre este documento..."
                rows={3}
                className={`${inputCls} resize-none`}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              />
            </div>

            <div className="flex flex-col mt-2">
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-[#8899B4] uppercase tracking-wider m-0">
                  Archivo Adjunto {editingDocumento && '(Opcional)'}
                </label>
                {selectedFile && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:underline transition-colors"
                  >
                    Quitar archivo
                  </button>
                )}
              </div>
              <div className="relative group">
                <input 
                  type="file" 
                  id="archivo-upload"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={() => setIsDragging(false)}
                />
                <label 
                  htmlFor="archivo-upload" 
                  className={`flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 
                    ${isDragging ? 'border-[#C4933F] bg-[#C4933F]/5' : 
                      selectedFile ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 
                      'border-slate-300 dark:border-[#1E2D3D] bg-slate-50/50 dark:bg-[#0F1E2E]/50 hover:bg-slate-100 dark:hover:bg-[#16212E] hover:border-[#C4933F]/50'
                    }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-sm">
                        <File className="text-green-600 dark:text-green-400" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 bg-white dark:bg-[#1E2D3D] rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className="text-[#C4933F]" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          <span className="text-[#C4933F]">Haga clic para subir</span> o arrastre y suelte
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {editingDocumento ? 'Sube un nuevo archivo para reemplazar el actual' : 'PDF, DOCX, JPG, PNG (Max 10MB)'}
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {editingDocumento && (
              <div className="flex flex-col pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className={labelCls}>Estado del Documento</label>
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none cursor-pointer`}
                    value={formData.estado ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value === '1' })}
                  >
                    <option value="1">ACTIVO (Vigente)</option>
                    <option value="0">INACTIVO (Archivado)</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-5 bg-slate-50/80 dark:bg-[#0D1825]/80 backdrop-blur-md rounded-b-2xl flex items-center justify-end gap-3 shrink-0 border-t border-slate-100 dark:border-[#1E2D3D]">
          <button type="button" onClick={handleClose} disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-[#1E2D3D] hover:text-slate-900 dark:hover:text-white transition-all duration-200">
            Cancelar
          </button>
          <button type="submit" form="documento-form" disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-[#C4933F] to-[#B38332] hover:from-[#B38332] hover:to-[#A3732A] disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_4px_14px_0_rgba(196,147,63,0.39)] hover:shadow-[0_6px_20px_rgba(196,147,63,0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {editingDocumento ? 'Guardar Cambios' : 'Subir Documento'}
          </button>
        </div>
      </div>
    </div>
  );
};

