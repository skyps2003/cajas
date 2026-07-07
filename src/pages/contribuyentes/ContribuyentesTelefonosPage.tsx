import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Phone, Smartphone, Award, X, Loader2, Power, Star, MessageCircle } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../contexts/AuthContext';
import { telefonoService } from '../../services/telefonoService';
import type { TelefonoResponse, TelefonoCreatePayload, TelefonoUpdatePayload } from '../../services/telefonoService';
import { contribuyenteService } from '../../services/contribuyenteService';
import type { ContribuyenteResponse } from '../../services/contribuyenteService';
import { tipoTelefonoService } from '../../services/tipoTelefonoService';
import type { TipoTelefonoResponse } from '../../services/tipoTelefonoService';
import { Pagination } from '../../components/Pagination';

const EMPTY_FORM = {
  id_registro_contribuyentes: '',
  razon_social: '',
  id_tipo_telefono: 2,
  numero: '',
  nombre_contacto: '',
  descripcion: '',
  principal: false,
  estado: true
};

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] uppercase tracking-wider mb-1.5';

export const ContribuyentesTelefonosPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isOpen, title, message, confirm, close, onConfirm } = useConfirm();
  
  const [telefonos, setTelefonos] = useState<TelefonoResponse[]>([]);
  const [contribuyentes, setContribuyentes] = useState<ContribuyenteResponse[]>([]);
  const [tiposTelefonos, setTiposTelefonos] = useState<TipoTelefonoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<TelefonoResponse | null>(null);
  const [formData, setFormData] = useState<any>({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [telData, contData, tiposData] = await Promise.all([
        telefonoService.getTelefonos(user.token),
        contribuyenteService.getAll(user.token),
        tipoTelefonoService.getAll(user.token)
      ]);
      setTelefonos(telData);
      setContribuyentes(contData);
      setTiposTelefonos(tiposData.filter(t => Boolean(t.estado)));
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTelefonos = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const data = await telefonoService.getTelefonos(user.token);
      setTelefonos(data);
    } catch (error) {
      console.error('Error fetching telefonos:', error);
      showToast('error', 'Error', 'No se pudieron cargar los teléfonos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, numero: string) => {
    confirm(
      'Eliminar Teléfono',
      <>¿Está seguro de eliminar el teléfono <strong>{numero}</strong>?</>,
      async () => {
        if (!user?.token) return;
        try {
          await telefonoService.deleteTelefono(id, user.token);
          setTelefonos(prev => prev.filter(t => t.id !== id));
          showToast('success', 'Registro Eliminado', `El número ${numero} fue removido.`);
        } catch (error) {
          console.error(error);
          showToast('error', 'Error', 'No se pudo eliminar el teléfono');
        }
      }
    );
  };

  const handleToggleEstado = async (id: number) => {
    if (!user?.token) return;
    try {
      await telefonoService.deactivateTelefono(id, user.token);
      fetchTelefonos();
      showToast('success', 'Estado Actualizado', 'El estado del teléfono fue actualizado.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo cambiar el estado');
    }
  };

  const handleSetPrincipal = async (id: number) => {
    if (!user?.token) return;
    try {
      await telefonoService.setPrincipalTelefono(id, user.token);
      fetchTelefonos();
      showToast('success', 'Teléfono Principal', 'El teléfono fue marcado como principal.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo actualizar');
    }
  };

  const handleOpenAdd = () => {
    setEditingRegistro(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (registro: TelefonoResponse) => {
    setEditingRegistro(registro);
    setFormData({
      id_registro_contribuyentes: registro.id_registro_contribuyentes,
      razon_social: registro.razon_social || '',
      id_tipo_telefono: registro.id_tipo_telefono || 2,
      numero: registro.numero,
      nombre_contacto: registro.nombre_contacto || '',
      descripcion: registro.descripcion || '',
      principal: !!registro.principal,
      estado: !!registro.estado
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!formData.numero || !formData.id_registro_contribuyentes) {
      showToast('warning', 'Campos incompletos', 'Complete el ID del contribuyente y el número.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingRegistro) {
        const updatePayload: TelefonoUpdatePayload = {
          id_registro_contribuyentes: Number(formData.id_registro_contribuyentes),
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
        await telefonoService.createTelefono(Number(formData.id_registro_contribuyentes), createPayload, user.token);
        showToast('success', 'Teléfono Agregado', 'Se añadió el nuevo teléfono de contacto.');
      }
      setIsModalOpen(false);
      fetchTelefonos();
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al Guardar', 'Hubo un problema al procesar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTelefonos = telefonos.filter(t =>
    t.numero.includes(searchTerm) ||
    (t.razon_social && t.razon_social.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.nombre_contacto && t.nombre_contacto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredTelefonos.length / itemsPerPage);
  const paginatedTelefonos = filteredTelefonos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getTipoBadge = (tipoNombre: string | undefined) => {
    const text = tipoNombre ? tipoNombre.toUpperCase() : 'OTRO';
    if (text.includes('WHATSAPP')) {
      return { text, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' };
    }
    if (text.includes('CELULAR') || text.includes('MÓVIL') || text.includes('MOVIL')) {
      return { text, cls: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' };
    }
    if (text.includes('FIJO')) {
      return { text, cls: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20' };
    }
    return { text, cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' };
  };

  const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
  const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide';

  const kpiCelulares = telefonos.filter(t => t.tipo_telefono?.toUpperCase().includes('CELULAR') || t.tipo_telefono?.toUpperCase().includes('MOVIL') || t.tipo_telefono?.toUpperCase().includes('MÓVIL')).length;
  const kpiWhatsapp = telefonos.filter(t => t.tipo_telefono?.toUpperCase().includes('WHATSAPP')).length;
  const kpiPrincipales = telefonos.filter(t => t.principal == 1 || t.principal === true).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block" />
            Directorio de Contactos
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestione los números telefónicos, líneas móviles y canales de WhatsApp de los contribuyentes.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar número o contacto..."
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
            <span>AGREGAR TELÉFONO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Phone size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">LÍNEAS TOTALES</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{telefonos.length}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Smartphone size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">CELULARES</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{kpiCelulares}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageCircle size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">WHATSAPP</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{kpiWhatsapp}</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Star size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">PRINCIPALES</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white leading-none">{kpiPrincipales}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              <col className="w-2/6" /> {/* RAZON SOCIAL */}
              <col className="w-1/6" /> {/* NUMERO */}
              <col className="w-1/6" /> {/* TIPO */}
              <col className="w-1/6" /> {/* CONTACTO */}
              <col className="w-24" /> {/* ESTADO */}
              <col className="w-32" /> {/* ACCIONES */}
            </colgroup>
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">RAZÓN SOCIAL</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">NÚMERO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">TIPO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">CONTACTO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-slate-100 dark:border-[#1E2D3D]">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-7 mx-auto"></div></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                        <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedTelefonos.length > 0 ? (
                paginatedTelefonos.map((t) => {
                  const badge = getTipoBadge(t.tipo_telefono);
                  const contribuyente = contribuyentes.find(c => c.id === t.id_registro_contribuyentes);
                  const ruc = contribuyente ? contribuyente.ruc : 'Sin RUC';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-normal break-words">{t.razon_social || '-'}</span>
                          <span className="text-xs font-mono text-slate-500 mt-0.5">{ruc}</span>
                          {t.principal == 1 && <span className="text-[10px] text-[#B47541] flex items-center gap-1 mt-1"><Star size={10} /> Principal</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-200 font-mono font-bold text-xs">{t.numero}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{t.nombre_contacto || '-'}</span>
                          <span className="text-xs text-slate-400">{t.descripcion || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleToggleEstado(t.id)} 
                          className={`p-1.5 rounded-md transition-colors ${t.estado ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`} title={t.estado ? 'Activo' : 'Inactivo'}>
                          <Power size={18} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleSetPrincipal(t.id)} className="p-1.5 rounded-md text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Marcar como Principal">
                            <Star size={16} />
                          </button>
                          <button onClick={() => handleOpenEdit(t)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(t.id, t.numero)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No se encontraron números telefónicos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filteredTelefonos.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>
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
                  {editingRegistro ? 'Modificar Teléfono' : 'Agregar Nuevo Teléfono'}
                </h2>
              </div>
            
              <form id="telefono-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
