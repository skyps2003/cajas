import React, { useState, useEffect } from 'react';

import { Search, Plus, Edit2, Trash2, CheckCircle2, FileText, Info, AlertTriangle, ArrowDown, ArrowUp, Hash, Eye, } from 'lucide-react';
import { useToast } from '../../../components/Toast/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import TableSkeleton from '../../../components/TableSkeleton';
import { tipoComprobanteService } from '../../../services/tipoComprobanteService';
import type { TipoComprobante } from '../../../services/tipoComprobanteService';
import { ComprobanteModal } from './ComprobanteModal';
import { Pagination } from '../../../components/Pagination';

export const AdminComprobantesPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [tipos, setTipos]                     = useState<TipoComprobante[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [tipoToEdit, setTipoToEdit]           = useState<TipoComprobante | null>(null);
  const [tipoToDelete, setTipoToDelete]       = useState<TipoComprobante | null>(null);
  const [tipoToToggle, setTipoToToggle]       = useState<TipoComprobante | null>(null);
  const [_tipoToView, setTipoToView]           = useState<TipoComprobante | null>(null);
  
  const [currentPage, setCurrentPage]         = useState(1);
  const [sortConfig, setSortConfig]           = useState<{ key: 'id' | 'nombre' | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  const itemsPerPage = 6;

  const loadData = async () => {
    setIsLoading(true);
    const response = await tipoComprobanteService.getTipos(user?.token || '');
    if (response.success && response.data) {
      setTipos(response.data);
    } else {
      showToast('error', 'Error', response.message || 'Error al cargar tipos de comprobante');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.token) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filtered = tipos.filter(t => 
    (t.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedData = [...filtered].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aValue: string | number = a[sortConfig.key];
    let bValue: string | number = b[sortConfig.key];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginated = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: 'id' | 'nombre') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const renderSortIcon = (key: 'id' | 'nombre') => {
    if (sortConfig.key !== key) return <span className="w-4 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="inline ml-1 text-[#B47541]" /> 
      : <ArrowDown size={14} className="inline ml-1 text-[#B47541]" />;
  };

  // KPI calculations
  const totalCount = filtered.length;
  const activeCount = filtered.filter(t => t.estado).length;
  const inactiveCount = filtered.filter(t => !t.estado).length;

  const getStatusStyle = (estado: boolean) => {
    return estado
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
      : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20';
  };

  const getStatusDotColor = (estado: boolean) => estado ? '#22c55e' : '#ef4444';

  const handleSave = async (data: { nombre: string }) => {
    if (tipoToEdit) {
      const res = await tipoComprobanteService.updateTipo(user?.token || '', tipoToEdit.id, data);
      if (res.success) {
        showToast('success', 'Actualizado', 'Tipo de comprobante actualizado correctamente.');
        loadData();
        setIsModalOpen(false);
        setTipoToEdit(null);
      } else {
        showToast('error', 'Error', res.message || 'Error al actualizar');
      }
    } else {
      const res = await tipoComprobanteService.createTipo(user?.token || '', data);
      if (res.success) {
        showToast('success', 'Registrado', 'Tipo de comprobante registrado correctamente.');
        loadData();
        setIsModalOpen(false);
      } else {
        showToast('error', 'Error', res.message || 'Error al registrar');
      }
    }
  };

  const handleDelete = async () => {
    if (!tipoToDelete) return;
    const res = await tipoComprobanteService.deleteTipo(user?.token || '', tipoToDelete.id);
    if (res.success) {
      showToast('success', 'Eliminado', 'Tipo de comprobante eliminado permanentemente.');
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al eliminar');
    }
    setTipoToDelete(null);
  };

  const handleToggleStatus = async () => {
    if (!tipoToToggle) return;
    const res = await tipoComprobanteService.toggleStatus(user?.token || '', tipoToToggle.id);
    if (res.success) {
      showToast('info', 'Estado actualizado', 'El estado fue actualizado correctamente.');
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al actualizar estado');
    }
    setTipoToToggle(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="fleflex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight fleitems-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Tipos de Comprobante
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestión de documentos tributarios usados en los ingresos y egresos del sistema.
          </p>
        </div>
        <div className="fleflex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filtrar registros..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setTipoToEdit(null); setIsModalOpen(true); }}
            className="w-full sm:w-auto fleitems-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541]"
          >
            <Plus size={18} />
            <span>NUEVO TIPO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Comprobantes */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm fleitems-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] fleitems-center justify-center shrink-0">
            <FileText size={20} strokeWidth={1.8} />
          </div>
          <div className="fleflex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>TIPOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{totalCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Activos */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm fleitems-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 fleitems-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="fleflex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TIPOS<br/>ACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{activeCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Inactivos */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm fleitems-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 fleitems-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <AlertTriangle size={20} strokeWidth={1.8} />
          </div>
          <div className="fleflex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TIPOS<br/>INACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{inactiveCount.toString().padStart(2, '0')}</div>
          </div>
        </div>

        {/* Porcentaje Activos */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm fleitems-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] fleitems-center justify-center shrink-0 border border-[#C4933F]/20">
            <Hash size={20} strokeWidth={1.8} />
          </div>
          <div className="fleflex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TASA<br/>ACTIVOS</div>
            <div className="text-lg sm:text-xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none mt-0.5">
              {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#15171c] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1a1c23] text-white select-none">
              <tr>
                <th 
                  className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('id')}
                >
                  <div className="fleitems-center">CÓD. {renderSortIcon('id')}</div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => handleSort('nombre')}
                >
                  <div className="fleitems-center">NOMBRE DEL COMPROBANTE {renderSortIcon('nombre')}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO OPERATIVO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#15171c]">
                {isLoading ? (
                  <TableSkeleton columns={4} />
                ) : paginated.length > 0 ? (
                paginated.map((tipo) => (
                  <tr key={tipo.id} className="bg-white dark:bg-[#15171c] hover:bg-slate-50 dark:hover:bg-[#1e2028] transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      <div className="fleitems-center">
                        <span 
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 shrink-0" 
                          style={{ backgroundColor: getStatusDotColor(tipo.estado) }}
                          title={`Estado: ${tipo.estado ? 'ACTIVO' : 'INACTIVO'}`}
                        />
                        <span>#{tipo.id.toString().padStart(3, '0')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-white">
                      <div className="fleitems-center gap-2">
                        <FileText size={14} className="text-[#B47541] shrink-0" />
                        {tipo.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setTipoToToggle(tipo)}
                        className={`inline-fleitems-center px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${getStatusStyle(tipo.estado)}`}
                        title="Haz clic para cambiar el estado"
                      >
                        {tipo.estado ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="fleitems-center justify-center gap-2">
                        <button 
                          onClick={() => setTipoToView(tipo)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                          title="Ver Detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setTipoToEdit(tipo); setIsModalOpen(true); }}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" 
                          title="Editar Comprobante"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setTipoToDelete(tipo)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                          title="Eliminar Comprobante"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    {searchTerm 
                      ? `No se encontraron comprobantes con "${searchTerm}"`
                      : 'Aún no hay tipos de comprobante registrados en el sistema.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile (Tarjetas) */}
        <div className="md:hidden fleflex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-700 h-24 rounded-lg w-full"></div>
                ))}
              </div>
            ) : paginated.length > 0 ? (
            paginated.map((tipo) => (
              <div key={tipo.id} className="p-4 fleflex-col gap-3">
                <div className="flejustify-between items-start">
                  <div className="fleitems-start gap-3">
                    <span 
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" 
                      style={{ backgroundColor: getStatusDotColor(tipo.estado) }}
                    />
                    <div>
                      <div className="font-extrabold text-slate-800 dark:text-white text-sm fleitems-center gap-2">
                        <FileText size={14} className="text-[#B47541]" />
                        {tipo.nombre}
                      </div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">#{tipo.id.toString().padStart(3, '0')}</div>
                    </div>
                  </div>
                </div>
                <div className="flejustify-between items-center gap-3 mt-1">
                  <button 
                    onClick={() => setTipoToToggle(tipo)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm ${getStatusStyle(tipo.estado)}`}
                  >
                    {tipo.estado ? 'ACTIVO' : 'INACTIVO'}
                  </button>
                  <div className="fleitems-center gap-2">
                    <button 
                      onClick={() => setTipoToView(tipo)}
                      className="p-2.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-slate-200 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => { setTipoToEdit(tipo); setIsModalOpen(true); }}
                      className="p-2.5 text-slate-500 hover:text-[#B47541] transition-colors hover:bg-slate-200 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setTipoToDelete(tipo)}
                      className="p-2.5 text-red-500 hover:text-red-600 transition-colors hover:bg-red-100 bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              {searchTerm ? 'No se encontraron resultados.' : 'Aún no hay tipos de comprobante registrados.'}
            </div>
          )}
        </div>
        
        {/* Pagination Section */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filtered.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Delete Confirmation Modal */}
      {tipoToDelete && (
        <div className="fixed inset-0 z-[10000] fleitems-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] border border-[#E2E8F0] dark:border-[#1E2D3D] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full fleitems-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Comprobante</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Eliminar el tipo de comprobante <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{tipoToDelete.nombre}</strong>?
            </p>
            <div className="flegap-3 w-full">
              <button 
                onClick={() => setTipoToDelete(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Cambio de Estado */}
      {tipoToToggle && (
        <div className="fixed inset-0 z-[10000] fleitems-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] border border-[#E2E8F0] dark:border-[#1E2D3D] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-[#C4933F]/10 dark:bg-[#C4933F]/20 rounded-full fleitems-center justify-center mb-3">
              <Info className="text-[#C4933F]" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Cambiar Estado</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Cambiar el estado de <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{tipoToToggle.nombre}</strong> a <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{tipoToToggle.estado ? 'INACTIVO' : 'ACTIVO'}</strong>?
            </p>
            <div className="flegap-3 w-full">
              <button 
                onClick={() => setTipoToToggle(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleToggleStatus}
                className="flex-1 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Sí, cambiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Modal */}
      <ComprobanteModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTipoToEdit(null); }}
        onSave={handleSave}
        initialData={tipoToEdit}
      />
    </div>
  );
};
