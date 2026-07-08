import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, FileText, Download, Trash2, Calendar, CheckCircle2, XCircle, Filter, RefreshCw, Loader2, UploadCloud, X } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../contexts/AuthContext';
import { documentoService } from '../../services/documentoService';
import type { DocumentoResponse } from '../../services/documentoService';
import { contribuyenteService } from '../../services/contribuyenteService';
import type { ContribuyenteResponse } from '../../services/contribuyenteService';
import { tipoDocumentoService } from '../../services/tipoDocumentoService';
import type { TipoDocumentoResponse } from '../../services/tipoDocumentoService';
import { rubroService } from '../../services/rubroService';
import type { RubroResponse } from '../../services/rubroService';

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide';

export const ContribuyentesDocumentosPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isOpen, title, message, confirm, close, onConfirm } = useConfirm();
  
  const [documentos, setDocumentos] = useState<DocumentoResponse[]>([]);
  const [contribuyentes, setContribuyentes] = useState<ContribuyenteResponse[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoResponse[]>([]);
  const [rubros, setRubros] = useState<RubroResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  // Upload modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoResponse | null>(null);
  const [formData, setFormData] = useState({
    nombre_documento: '',
    id_tipo_documento: '',
    id_rubro: '',
    id_registro_contribuyente: '',
    observaciones: '',
    estado: '1'
  });

  const EMPTY_FORM = {
    nombre_documento: '',
    id_tipo_documento: '',
    id_rubro: '',
    id_registro_contribuyente: '',
    observaciones: '',
    estado: '1'
  };

  useEffect(() => {
    fetchDocumentos();
  }, []);

  const fetchDocumentos = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [docsData, contData, tiposData, rubrosData] = await Promise.all([
        documentoService.getDocumentos(user.token),
        contribuyenteService.getAll(user.token),
        tipoDocumentoService.getAll(user.token),
        rubroService.getAll(user.token)
      ]);
      setDocumentos(docsData);
      setContribuyentes(contData);
      setTiposDocumento(tiposData.filter(t => Boolean(t.estado)));
      setRubros(rubrosData.filter(r => Boolean(r.estado)));
    } catch (error) {
      console.error('Error fetching documentos:', error);
      showToast('error', 'Error', 'No se pudieron cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, nombre: string) => {
    confirm(
      'Eliminar Archivo',
      <>¿Está seguro de eliminar el archivo <strong>"{nombre}"</strong>?</>,
      async () => {
        if (!user?.token) return;
        try {
          await documentoService.deleteDocumento(id, user.token);
          setDocumentos(prev => prev.filter(d => d.id !== id));
          showToast('success', 'Archivo Eliminado', `El documento ${nombre} fue removido.`);
        } catch (error) {
          console.error(error);
          showToast('error', 'Error', 'No se pudo eliminar el documento');
        }
      }
    );
  };

  const handleDownload = async (id: number, nombre: string) => {
    if (!user?.token) return;
    try {
      await documentoService.downloadDocumento(id, user.token);
      showToast('success', 'Descarga Iniciada', `Descargando "${nombre}"...`);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo descargar el documento');
    }
  };

  const handleOpenAdd = () => {
    setEditingDocumento(null);
    setFormData({ ...EMPTY_FORM });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DocumentoResponse) => {
    setEditingDocumento(doc);
    const tipoId = tiposDocumento.find(t => t.nombre_tipo_documento === doc.tipo_documento)?.id?.toString() || '';
    const rubroId = rubros.find(r => r.nombre_rubro === doc.rubro)?.id?.toString() || '';
    const contId = contribuyentes.find(c => c.razon_social === doc.contribuyente)?.id?.toString() || '';
    setFormData({
      nombre_documento: doc.nombre_documento || '',
      id_tipo_documento: tipoId,
      id_rubro: rubroId,
      id_registro_contribuyente: contId,
      observaciones: doc.observaciones || '',
      estado: doc.estado ? '1' : '0'
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!editingDocumento && !selectedFile) {
      showToast('warning', 'Sin archivo', 'Seleccione un archivo para subir.');
      return;
    }

    try {
      setIsUploading(true);
      const formPayload = new FormData();
      formPayload.append('nombre_documento', formData.nombre_documento);
      formPayload.append('id_tipo_documento', formData.id_tipo_documento);
      formPayload.append('id_rubro', formData.id_rubro);
      formPayload.append('id_registro_contribuyente', formData.id_registro_contribuyente);
      formPayload.append('observaciones', formData.observaciones);
      if (selectedFile) {
        formPayload.append('archivo', selectedFile);
      }

      if (editingDocumento) {
        formPayload.append('estado', formData.estado);
        await documentoService.updateDocumento(editingDocumento.id, formPayload, user.token);
        showToast('success', 'Documento Actualizado', 'El documento se actualizó correctamente.');
      } else {
        await documentoService.createDocumento(formPayload, user.token);
        showToast('success', 'Archivo Subido', 'El documento se subió correctamente.');
      }
      setIsModalOpen(false);
      setSelectedFile(null);
      setEditingDocumento(null);
      setFormData({ ...EMPTY_FORM });
      fetchDocumentos();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', editingDocumento ? 'No se pudo actualizar el documento.' : 'Hubo un problema subiendo el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocumentos = documentos.filter(d => {
    const matchesSearch = 
      (d.contribuyente && d.contribuyente.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (d.nombre_documento && d.nombre_documento.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (d.tipo_documento && d.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let docEstadoText = d.estado ? 'VIGENTE' : 'INACTIVO';
    const matchesEstado = filterEstado === 'TODOS' || docEstadoText === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const getEstadoIcon = (estado: boolean | number) => {
    return estado ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-red-500" size={16} />;
  };

  const getEstadoClass = (estado: boolean | number) => {
    return estado ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-500/10 dark:text-red-400';
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Gestión Documentaria (Contribuyentes)
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Historial y archivo digital de fichas RUC, testimonios, declaraciones y licencias.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar archivo o contribuyente..." 
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
            <span>SUBIR DOCUMENTO</span>
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
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>ARCHIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{documentos.length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
          <Filter size={16} />
          <span>Filtros rápidos:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="VIGENTE">Vigente</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterEstado('TODOS');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 rounded-lg text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RefreshCw size={12} />
            Resetear
          </button>
        </div>
      </div>

      {/* Grid of Files */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm p-5 flex flex-col justify-between h-[200px] animate-pulse">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                  <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <div className="mb-4">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mt-2"></div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-[#1E2D3D] flex items-center justify-between">
                <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  <div className="w-7 h-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocumentos.length > 0 ? (
            filteredDocumentos.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/10">
                      <FileText size={20} />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border dark:border-none ${getEstadoClass(doc.estado)}`}>
                      {getEstadoIcon(doc.estado)}
                      {doc.estado ? 'VIGENTE' : 'INACTIVO'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{doc.tipo_documento || 'Documento'} - {doc.rubro || 'Rubro'}</h4>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1 truncate" title={doc.nombre_documento}>
                      {doc.nombre_documento}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{doc.contribuyente || '-'}</p>
                    <p className="text-xs text-slate-400 mt-2 italic line-clamp-2">{doc.observaciones}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-[#1E2D3D] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-[10px] font-medium"><Calendar size={11} /> {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDownload(doc.id, doc.nombre_documento)}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors"
                      title="Descargar"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(doc)}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(doc.id, doc.nombre_documento)}
                      className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400">
              No se encontraron documentos registrados.
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-full max-w-[500px] rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
            <button
              onClick={() => setIsModalOpen(false)}
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
                  {editingDocumento ? 'Editar Documento' : 'Subir Nuevo Documento'}
                </h2>
              </div>
            
              <form id="documento-form" onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col">
                  <label className={labelCls}>Contribuyente</label>
                  <select
                    required
                    disabled={!!editingDocumento}
                    className={inputCls}
                    value={formData.id_registro_contribuyente}
                    onChange={(e) => setFormData({ ...formData, id_registro_contribuyente: e.target.value })}
                  >
                    <option value="">Seleccione un contribuyente...</option>
                    {contribuyentes.map(c => (
                      <option key={c.id} value={c.id}>{c.razon_social} - {c.ruc}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className={labelCls}>Nombre del Documento</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Contrato Empresa"
                    required
                    className={inputCls}
                    value={formData.nombre_documento}
                    onChange={(e) => setFormData({ ...formData, nombre_documento: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className={labelCls}>Tipo de Documento</label>
                    <select
                      className={inputCls}
                      required
                      value={formData.id_tipo_documento}
                      onChange={(e) => setFormData({ ...formData, id_tipo_documento: e.target.value })}
                    >
                      <option value="">Seleccione tipo...</option>
                      {tiposDocumento.map(td => (
                        <option key={td.id} value={td.id}>{td.nombre_tipo_documento}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className={labelCls}>Rubro / Área</label>
                    <select
                      className={inputCls}
                      required
                      value={formData.id_rubro}
                      onChange={(e) => setFormData({ ...formData, id_rubro: e.target.value })}
                    >
                      <option value="">Seleccione rubro...</option>
                      {rubros.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre_rubro}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <label className={labelCls}>Observaciones</label>
                  <textarea 
                    placeholder="Documento de prueba..."
                    rows={2}
                    className={inputCls}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  />
                </div>

                <div className="flex flex-col mt-2">
                  <label className={labelCls}>Archivo Adjunto</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="archivo-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="archivo-upload" className="flex items-center gap-2 w-full px-4 py-3 bg-[#F5F6FA] dark:bg-[#0F1E2E] border-2 border-dashed border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#16212E] cursor-pointer transition-colors justify-center font-bold">
                      <UploadCloud size={18} className="text-[#C4933F]" />
                      {selectedFile ? selectedFile.name : 'Seleccionar Archivo...'}
                    </label>
                  </div>
                </div>

                {editingDocumento && (
                  <div className="flex flex-col">
                    <label className={labelCls}>Estado</label>
                    <select
                      className={inputCls}
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="1">ACTIVO (Vigente)</option>
                      <option value="0">INACTIVO</option>
                    </select>
                  </div>
                )}
              </form>
            </div>

            <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
              <button type="submit" form="documento-form" disabled={isUploading}
                className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[160px] flex items-center justify-center gap-2">
                {isUploading && <Loader2 size={16} className="animate-spin" />}
                {editingDocumento ? 'Guardar Cambios' : 'Subir Documento'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isUploading}
                className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[120px]">
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
