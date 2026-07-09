import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, File, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

import { useAuth } from '../../contexts/AuthContext';
import { tipoDocumentoService } from '../../services/tipoDocumentoService';
import type { TipoDocumentoResponse } from '../../services/tipoDocumentoService';

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] uppercase tracking-wider mb-1.5';

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-[#1E2D3D] bg-white dark:bg-[#16212E]">
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-3/4"></div></td>
        <td className="px-6 py-4"><div className="h-5 bg-slate-200 dark:bg-[#1E2D3D] rounded-full w-16 mx-auto"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-[#1E2D3D] rounded w-16 mx-auto"></div></td>
      </tr>
    ))}
  </>
);

export const ContribuyentesTiposDocumentoPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isOpen, title, message, confirm, close, onConfirm } = useConfirm();
  const [tipos, setTipos] = useState<TipoDocumentoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<TipoDocumentoResponse | null>(null);
  const [formData, setFormData] = useState({
    nombre_tipo_documento: '',
    descripcion: '',
    obligatorio: true as boolean | number | string,
    formatos_permitidos: '.pdf',
    estado: 1 as number | boolean
  });

  React.useEffect(() => {
    fetchTipos();
  }, []);

  const fetchTipos = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const data = await tipoDocumentoService.getAll(user.token);
      setTipos(data);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudieron cargar los tipos de documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, nombre: string) => {
    confirm(
      'Eliminar Tipo de Documento',
      <>¿Está seguro de eliminar el tipo de documento <strong>"{nombre}"</strong>?</>,
      async () => {
        if (!user?.token) return;
        try {
          await tipoDocumentoService.delete(user.token, id);
          setTipos(prev => prev.filter(t => t.id !== id));
          showToast('success', 'Tipo de Documento Eliminado', `Se removió "${nombre}".`);
        } catch (error) {
          console.error(error);
          showToast('error', 'Error', 'No se pudo eliminar el tipo de documento');
        }
      }
    );
  };

  const handleToggleStatus = async (id: number, currentEstado: any, nombre: string) => {
    if (!user?.token) return;
    try {
      await tipoDocumentoService.toggleStatus(user.token, id);
      setTipos(prev => prev.map(t => 
        t.id === id 
          ? { ...t, estado: (t.estado == 1 || t.estado === true || Number(t.estado) === 1) ? 0 : 1 } 
          : t
      ));
      const newState = (currentEstado == 1 || currentEstado === true || currentEstado === '1') ? 'INACTIVO' : 'ACTIVO';
      showToast('success', 'Estado Actualizado', `El tipo de documento "${nombre}" ahora es ${newState}.`);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo cambiar el estado del tipo de documento');
    }
  };

  const handleOpenAdd = () => {
    setEditingRegistro(null);
    setFormData({
      nombre_tipo_documento: '',
      descripcion: '',
      obligatorio: true,
      formatos_permitidos: '.pdf',
      estado: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (registro: TipoDocumentoResponse) => {
    setEditingRegistro(registro);
    setFormData({
      nombre_tipo_documento: registro.nombre_tipo_documento,
      descripcion: registro.descripcion || '',
      obligatorio: registro.obligatorio == 1 || registro.obligatorio === true || registro.obligatorio === '1',
      formatos_permitidos: registro.formatos_permitidos || '',
      estado: registro.estado
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!formData.nombre_tipo_documento) {
      showToast('warning', 'Campos vacíos', 'Por favor complete el nombre del tipo de documento.');
      return;
    }

    try {
      const payload = {
        ...formData,
        obligatorio: Boolean(formData.obligatorio),
        estado: Boolean(formData.estado)
      };

      if (editingRegistro) {
        await tipoDocumentoService.update(user.token, editingRegistro.id, payload);
        showToast('success', 'Tipo de Documento Guardado', 'Se guardaron los cambios correctamente.');
      } else {
        await tipoDocumentoService.create(user.token, payload);
        showToast('success', 'Tipo de Documento Creado', 'Se ha registrado el nuevo tipo de documento.');
      }
      fetchTipos();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'Ocurrió un problema al guardar el registro');
    }
  };

  const filteredTipos = tipos.filter(t => {
    return (t.nombre_tipo_documento || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (t.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Tipos de Documentos Tributarios
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Configuración y catálogo de documentos requeridos para la afiliación de contribuyentes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar tipo de documento..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541] cursor-pointer whitespace-nowrap border border-transparent"
          >
            <Plus size={18} />
            <span>AGREGAR TIPO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <FileText size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CATÁLOGO<br/>TOTAL</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{tipos.length.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TIPOS<br/>ACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{tipos.filter(t => Boolean(t.estado)).length.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
            <ShieldAlert size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">DOCS.<br/>OBLIGATORIOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{tipos.filter(t => t.obligatorio == 1 || t.obligatorio === true || t.obligatorio === '1').length.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <File size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">DOCS.<br/>OPCIONALES</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{tipos.filter(t => !(t.obligatorio == 1 || t.obligatorio === true || t.obligatorio === '1')).length.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">NOMBRE DEL TIPO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">DESCRIPCIÓN</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">OBLIGATORIO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">EXTENSIONES</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {loading ? (
                <TableSkeleton />
              ) : filteredTipos.length > 0 ? (
                filteredTipos.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{t.nombre_tipo_documento}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{t.descripcion}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (t.obligatorio == 1 || t.obligatorio === true || t.obligatorio === '1') 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {(t.obligatorio == 1 || t.obligatorio === true || t.obligatorio === '1') ? 'SÍ' : 'NO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-mono">{t.formatos_permitidos}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                        t.estado 
                          ? 'bg-[#d1fae5] text-[#047857] border-[#a7f3d0] dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' 
                          : 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca] dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                      }`}>
                        {t.estado ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(t.id, t.estado, t.nombre_tipo_documento)}
                          className={`p-1.5 rounded-md transition-colors ${
                            t.estado 
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' 
                              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                          }`}
                          title={t.estado ? "Desactivar" : "Activar"}
                        >
                          {t.estado ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.nombre_tipo_documento)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No se encontraron tipos de documentos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-full max-w-[450px] rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2D3D] p-2 rounded-full transition-all duration-200 z-10 hover:rotate-90"
            >
              <XCircle size={18} />
            </button>

            <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
              <div className="mb-5">
                <span className="inline-block px-2.5 py-1 bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] rounded-full text-[10px] font-bold tracking-wider mb-2.5">
                  FORMULARIO DE GESTIÓN
                </span>
                <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
                  {editingRegistro ? 'Editar Tipo Documento' : 'Agregar Tipo Documento'}
                </h2>
              </div>
            
              <form id="tipo-doc-form" onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col">
                  <label className={labelCls}>Nombre del Tipo de Documento</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Certificado Tributario"
                    required
                    className={inputCls}
                    value={formData.nombre_tipo_documento}
                    onChange={(e) => setFormData({ ...formData, nombre_tipo_documento: e.target.value })}
                  />
                </div>

                <div className="flex flex-col">
                  <label className={labelCls}>Descripción / Utilidad</label>
                  <textarea 
                    placeholder="Describa para qué sirve este tipo de documento..."
                    className={`${inputCls} h-20 resize-none`}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className={labelCls}>Formatos Permitidos</label>
                    <input 
                      type="text" 
                      placeholder="Ej: .pdf, .jpg"
                      required
                      className={`${inputCls} font-mono`}
                      value={formData.formatos_permitidos}
                      onChange={(e) => setFormData({ ...formData, formatos_permitidos: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={labelCls}>Obligatorio</label>
                    <select
                      className={inputCls}
                      value={formData.obligatorio ? 'SÍ' : 'NO'}
                      onChange={(e) => setFormData({ ...formData, obligatorio: e.target.value === 'SÍ' })}
                    >
                      <option value="SÍ">Sí, obligatorio</option>
                      <option value="NO">No, opcional</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={labelCls}>Estado</label>
                  <select
                    className={inputCls}
                    value={formData.estado.toString()}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value === '1' ? 1 : 0 })}
                  >
                    <option value="1">ACTIVO</option>
                    <option value="0">INACTIVO</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
              <button type="submit" form="tipo-doc-form" className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[160px] flex items-center justify-center gap-2">
                GUARDAR
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[120px]">
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        onConfirm={onConfirm}
        title={title}
        message={message}
      />
    </div>
  );
};
