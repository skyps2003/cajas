// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Key, Eye, EyeOff, Copy, Shield, Power, Loader2, X } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../contexts/AuthContext';
import { credencialService } from '../../services/credencialService';
import type { CredencialResponse, CredencialCreatePayload, CredencialUpdatePayload } from '../../services/credencialService';
import { contribuyenteService } from '../../services/contribuyenteService';
import type { ContribuyenteResponse } from '../../services/contribuyenteService';
import { tipoCredencialService } from '../../services/tipoCredencialService';
import type { TipoCredencialResponse } from '../../services/tipoCredencialService';
import { Pagination } from '../../components/Pagination';

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] uppercase tracking-wider mb-1.5';

const EMPTY_FORM = {
  id_registro_contribuyentes: '',
  id_tipo_credencial: '1',
  usuario: '',
  clave: '',
  observaciones: '',
  estado: 1
};

export const ContribuyentesCredencialesPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isOpen, title, message, confirm, close, onConfirm } = useConfirm();
  
  const [credenciales, setCredenciales] = useState<CredencialResponse[]>([]);
  const [contribuyentes, setContribuyentes] = useState<ContribuyenteResponse[]>([]);
  const [tiposCredencial, setTiposCredencial] = useState<TipoCredencialResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Show/Hide password states map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<CredencialResponse | null>(null);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCredenciales();
  }, []);

  const fetchCredenciales = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [credData, contData, tiposData] = await Promise.all([
        credencialService.getCredenciales(user.token),
        contribuyenteService.getAll(user.token),
        tipoCredencialService.getAll(user.token)
      ]);
      setCredenciales(credData);
      setContribuyentes(contData);
      setTiposCredencial(tiposData.filter(t => Boolean(t.estado)));
    } catch (error) {
      console.error('Error fetching credenciales:', error);
      showToast('error', 'Error', 'No se pudieron cargar las credenciales');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copiado al Portapapeles', `Se copió el ${label} correctamente.`);
  };

  const handleDelete = (id: number, sistema: string) => {
    confirm(
      'Eliminar Credenciales',
      <>¿Está seguro de eliminar las credenciales de <strong>"{sistema}"</strong>?</>,
      async () => {
        if (!user?.token) return;
        try {
          await credencialService.deleteCredencial(id, user.token);
          setCredenciales(prev => prev.filter(c => c.id !== id));
          showToast('success', 'Credenciales Eliminadas', `Las credenciales de ${sistema} fueron removidas.`);
        } catch (error) {
          console.error(error);
          showToast('error', 'Error', 'No se pudieron eliminar las credenciales');
        }
      }
    );
  };

  const handleToggleEstado = async (id: number) => {
    if (!user?.token) return;
    try {
      await credencialService.activateCredencial(id, user.token);
      fetchCredenciales();
      showToast('success', 'Estado Actualizado', 'El estado de la credencial fue actualizado.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo cambiar el estado');
    }
  };

  const handleOpenAdd = () => {
    setEditingRegistro(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (registro: CredencialResponse) => {
    setEditingRegistro(registro);
    // Find ID from the text name or use the returned ID if available
    let tipoId = tiposCredencial.find(t => t.nombre === registro.tipo_credencial)?.id?.toString() || '1';
    
    setFormData({
      id_registro_contribuyentes: registro.id_registro_contribuyentes,
      id_tipo_credencial: tipoId,
      usuario: registro.usuario || '',
      clave: registro.clave || '',
      observaciones: registro.observaciones || '',
      estado: registro.estado ? 1 : 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!formData.usuario || !formData.clave || !formData.id_registro_contribuyentes) {
      showToast('warning', 'Campos requeridos', 'Complete todos los campos obligatorios.');
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
          estado: Number(formData.estado)
        };
        await credencialService.updateCredencial(editingRegistro.id, updatePayload, user.token);
        showToast('success', 'Credenciales Guardadas', 'Se actualizaron las credenciales.');
      } else {
        const createPayload: CredencialCreatePayload = {
          id_tipo_credencial: Number(formData.id_tipo_credencial),
          usuario: formData.usuario,
          clave: formData.clave,
          observaciones: formData.observaciones
        };
        await credencialService.createCredencial(Number(formData.id_registro_contribuyentes), createPayload, user.token);
        showToast('success', 'Credenciales Creadas', 'Se agregaron las nuevas credenciales de acceso.');
      }
      setIsModalOpen(false);
      fetchCredenciales();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al Guardar', 'Hubo un problema procesando las credenciales.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCredenciales = credenciales.filter(c => {
    return (c.contribuyente && c.contribuyente.toLowerCase().includes(searchTerm.toLowerCase())) || 
           (c.id_registro_contribuyentes && c.id_registro_contribuyentes.toString().includes(searchTerm)) || 
           (c.tipo_credencial && c.tipo_credencial.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (c.usuario && c.usuario.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const totalPages = Math.ceil(filteredCredenciales.length / itemsPerPage);
  const paginatedCredenciales = filteredCredenciales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const kpiSol = credenciales.filter(c => c.tipo_credencial?.toUpperCase().includes('SOL')).length;
  const kpiMinem = credenciales.filter(c => c.tipo_credencial?.toUpperCase().includes('MINEM') || c.tipo_credencial?.toUpperCase().includes('EXTRANET')).length;
  const kpiAfp = credenciales.filter(c => c.tipo_credencial?.toUpperCase().includes('AFP')).length;

  const getEstadoBadge = (estado: boolean | number) => {
    if (estado) {
      return { text: 'ACTIVO', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' };
    }
    return { text: 'INACTIVO', cls: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' };
  };

  const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
  const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Cofre de Credenciales (SOL / Extranet)
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestión segura de claves SOL de SUNAT, certificados digitales y accesos de contribuyentes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar ID o sistema..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541] cursor-pointer whitespace-nowrap border border-transparent"
          >
            <Plus size={18} />
            <span>AGREGAR ACCESO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Key size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>ACCESOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{credenciales.length.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Shield size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">CLAVE SOL</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{kpiSol.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Shield size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">MINEM /<br/>EXTRANET</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{kpiMinem.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Shield size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">AFP NET</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{kpiAfp.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Safety Alert */}

      {/* Grid */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              <col className="w-2/6" /> {/* CONTRIBUYENTE */}
              <col className="w-1/6" /> {/* SISTEMA */}
              <col className="w-1/6" /> {/* USUARIO */}
              <col className="w-1/6" /> {/* CONTRASEÑA */}
              <col className="w-24" /> {/* ESTADO */}
              <col className="w-32" /> {/* ACCIONES */}
            </colgroup>
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">CONTRIBUYENTE</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">SISTEMA</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">USUARIO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">CONTRASEÑA</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-slate-100 dark:border-[#1E2D3D]">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                    <td className="px-6 py-4"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-7 mx-auto"></div></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedCredenciales.length > 0 ? (
                paginatedCredenciales.map((c) => {
                  const isVisible = !!visiblePasswords[c.id];
                  const badge = getEstadoBadge(c.estado);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-normal break-words">{c.contribuyente || '-'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">RUC: {contribuyentes.find(cont => cont.id === c.id_registro_contribuyentes)?.ruc || c.id_registro_contribuyentes}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.tipo_credencial || '-'}</span>
                          <span className="text-[10px] text-slate-400 max-w-[150px] truncate" title={c.observaciones}>{c.observaciones || ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{c.usuario}</span>
                          <button 
                            onClick={() => handleCopy(c.usuario, 'usuario')}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copiar Usuario"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                            {isVisible ? c.clave : '••••••••••••'}
                          </span>
                          <button 
                            onClick={() => togglePasswordVisibility(c.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button 
                            onClick={() => handleCopy(c.clave, 'contraseña')}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copiar Clave"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleEstado(c.id)} 
                          className={`p-1.5 rounded-md transition-colors ${c.estado ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} title={c.estado ? 'Activo' : 'Inactivo'}>
                          <Power size={18} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.tipo_credencial)}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No se encontraron credenciales que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filteredCredenciales.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-full max-w-[450px] rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
            <button
              onClick={() => setIsModalOpen(false)}
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
            
              <form id="credencial-form" onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col">
                  <label className={labelCls}>Contribuyente</label>
                  <select
                    required
                    disabled={!!editingRegistro}
                    className={inputCls}
                    value={formData.id_registro_contribuyentes}
                    onChange={(e) => setFormData({ ...formData, id_registro_contribuyentes: e.target.value })}
                  >
                    <option value="">Seleccione un contribuyente...</option>
                    {contribuyentes.map(c => (
                      <option key={c.id} value={c.id}>{c.razon_social} - {c.ruc}</option>
                    ))}
                  </select>
                </div>

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
              <button type="submit" form="credencial-form" disabled={isSaving}
                className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[160px] flex items-center justify-center gap-2">
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {editingRegistro ? 'Guardar Cambios' : 'Crear Registro'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving}
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

