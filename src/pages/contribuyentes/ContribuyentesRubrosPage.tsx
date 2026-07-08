import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Tags, CheckCircle2, XCircle, Percent, } from 'lucide-react';
import { useToast } from '../../components/Toast/ToastContext';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { Pagination } from '../../components/Pagination';

import { useAuth } from '../../contexts/AuthContext';
import { rubroService } from '../../services/rubroService';
import type { RubroResponse } from '../../services/rubroService';

const inputCls = 'w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]';
const labelCls = 'block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] uppercase tracking-wider mb-1.5';

const ITEMS_PER_PAGE = 6;

const TableSkeleton = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-[#1E2D3D] bg-white dark:bg-[#16212E]">
        <td className="px-4 py-3.5"><div className="h-5 bg-slate-200 dark:bg-[#1E2D3D] rounded w-16"></div></td>
        <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-3/4"></div></td>
        <td className="px-4 py-3.5"><div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-full"></div></td>
        <td className="px-4 py-3.5"><div className="h-5 bg-slate-200 dark:bg-[#1E2D3D] rounded w-16 mx-auto"></div></td>
        <td className="px-4 py-3.5"><div className="h-5 bg-slate-200 dark:bg-[#1E2D3D] rounded-full w-14 mx-auto"></div></td>
        <td className="px-4 py-3.5"><div className="h-6 bg-slate-200 dark:bg-[#1E2D3D] rounded w-12 mx-auto"></div></td>
      </tr>
    ))}
  </>
);

export const ContribuyentesRubrosPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isOpen, title, message, confirm, close, onConfirm } = useConfirm();
  const [rubros, setRubros] = useState<RubroResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RubroResponse | null>(null);
  const [formData, setFormData] = useState({
    nombre_rubro: '',
    codigo_sunat: '',
    descripcion: '',
    tipo_detraccion: '12.0%',
    estado: 1 as number | boolean
  });

  React.useEffect(() => {
    fetchRubros();
  }, []);

  const fetchRubros = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const data = await rubroService.getAll(user.token);
      setRubros(data);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudieron cargar los rubros');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, nombre: string) => {
    confirm(
      'Eliminar Rubro',
      <>¿Está seguro de eliminar el rubro <strong>"{nombre}"</strong>?</>,
      async () => {
        if (!user?.token) return;
        try {
          await rubroService.delete(user.token, id);
          setRubros(prev => prev.filter(r => r.id !== id));
          showToast('success', 'Rubro Eliminado', `El rubro comercial ${nombre} fue removido.`);
        } catch (error) {
          console.error(error);
          showToast('error', 'Error', 'No se pudo eliminar el rubro');
        }
      }
    );
  };

  const handleOpenAdd = () => {
    setEditingRegistro(null);
    setFormData({
      nombre_rubro: '',
      codigo_sunat: '',
      descripcion: '',
      tipo_detraccion: '12.0%',
      estado: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (registro: RubroResponse) => {
    setEditingRegistro(registro);
    setFormData({
      nombre_rubro: registro.nombre_rubro,
      codigo_sunat: registro.codigo_sunat,
      descripcion: registro.descripcion || '',
      tipo_detraccion: registro.tipo_detraccion || 'No Sujeto',
      estado: registro.estado
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) return;
    if (!formData.nombre_rubro || !formData.codigo_sunat) {
      showToast('warning', 'Campos vacíos', 'Por favor complete el nombre y código SUNAT.');
      return;
    }

    try {
      if (editingRegistro) {
        await rubroService.update(user.token, editingRegistro.id, formData);
        showToast('success', 'Rubro Actualizado', 'El rubro fue actualizado exitosamente.');
      } else {
        await rubroService.create(user.token, formData);
        showToast('success', 'Rubro Creado', 'Se ha registrado el nuevo rubro comercial.');
      }
      fetchRubros();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'Ocurrió un problema al guardar el rubro');
    }
  };

  const filteredRubros = rubros.filter(r => {
    return (r.nombre_rubro || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (r.codigo_sunat || '').includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredRubros.length / ITEMS_PER_PAGE);
  const paginatedRubros = filteredRubros.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Rubros de Negocio y Detracciones
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Definición de rubros comerciales, códigos oficiales de SUNAT y tasas de detracción tributarias.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por rubro o código..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541] cursor-pointer whitespace-nowrap border border-transparent"
          >
            <Plus size={18} />
            <span>AGREGAR RUBRO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Tags size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>RUBROS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{rubros.length.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">RUBROS<br/>ACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{rubros.filter(r => Boolean(r.estado)).length.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <XCircle size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">RUBROS<br/>INACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{rubros.filter(r => !r.estado).length.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <Percent size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CON<br/>DETRACCIÓN</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{rubros.filter(r => r.tipo_detraccion && r.tipo_detraccion !== 'No Sujeto').length.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              <col className="w-[100px]" />
              <col />
              <col />
              <col className="w-[130px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-[11px] tracking-wider uppercase">Código</th>
                <th className="px-4 py-3.5 font-semibold text-[11px] tracking-wider uppercase">Nombre del Rubro</th>
                <th className="px-4 py-3.5 font-semibold text-[11px] tracking-wider uppercase">Descripción</th>
                <th className="px-4 py-3.5 font-semibold text-[11px] tracking-wider uppercase text-center">Detracción</th>
                <th className="px-4 py-3.5 font-semibold text-[11px] tracking-wider uppercase text-center">Estado</th>
                <th className="px-4 py-3.5 font-semibold text-[11px] tracking-wider uppercase text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {loading ? (
                <TableSkeleton />
              ) : paginatedRubros.length > 0 ? (
                paginatedRubros.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F9FC] dark:hover:bg-[#1E2D3D]/50 transition-colors group">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center bg-[#1B2E4B]/5 dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-[#1B2E4B]/10 dark:border-[#1B2E4B]/30">
                        {r.codigo_sunat}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-snug">{r.nombre_rubro}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.descripcion}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#A07030] dark:text-[#D4A960] px-2.5 py-1 rounded-md text-xs font-bold border border-[#C4933F]/20">
                        {r.tipo_detraccion || 'No Sujeto'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                        r.estado 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {r.estado ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-[#B47541]/10 hover:text-[#B47541] transition-all opacity-70 group-hover:opacity-100"
                          title="Editar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.nombre_rubro)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all opacity-70 group-hover:opacity-100"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No se encontraron rubros registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filteredRubros.length} 
          itemsPerPage={ITEMS_PER_PAGE} 
          onPageChange={setCurrentPage} 
        />
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
                  {editingRegistro ? 'Editar Rubro' : 'Agregar Nuevo Rubro'}
                </h2>
              </div>
            
              <form id="rubro-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col col-span-2">
                    <label className={labelCls}>Nombre del Rubro</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Servicios de Limpieza"
                      required
                      className={inputCls}
                      value={formData.nombre_rubro}
                      onChange={(e) => setFormData({ ...formData, nombre_rubro: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className={labelCls}>Código SUNAT</label>
                    <input 
                      type="text" 
                      placeholder="Ej: 022"
                      required
                      className={`${inputCls} font-mono`}
                      value={formData.codigo_sunat}
                      onChange={(e) => setFormData({ ...formData, codigo_sunat: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={labelCls}>Descripción del Rubro</label>
                  <input 
                    type="text" 
                    placeholder="Detalle comercial de este rubro..."
                    className={inputCls}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col">
                    <label className={labelCls}>Tasa de Detracción</label>
                    <select
                      className={inputCls}
                      value={formData.tipo_detraccion}
                      onChange={(e) => setFormData({ ...formData, tipo_detraccion: e.target.value })}
                    >
                      <option value="1.5%">1.5%</option>
                      <option value="1.8%">1.8%</option>
                      <option value="4%">4%</option>
                      <option value="9%">9%</option>
                      <option value="10%">10%</option>
                      <option value="12%">12%</option>
                      <option value="15%">15%</option>
                      <option value="No Sujeto">No Sujeto</option>
                    </select>
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
                </div>
              </form>
            </div>

            <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
              <button type="submit" form="rubro-form" className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[160px] flex items-center justify-center gap-2">
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
