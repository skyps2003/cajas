import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Filter, Building2, Wallet, Eye } from 'lucide-react';
import { useToast } from '../../../components/Toast/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { movimientoService } from '../../../services/movimientoService';
import type { MovimientoResponse } from '../../../services/movimientoService';
import { MovimientoModal } from './MovimientoModal';
import { MovimientoDetailModal } from './MovimientoDetailModal';
import TableSkeleton from '../../../components/TableSkeleton';
import { Pagination } from '../../../components/Pagination';

export const AdminApprovalsPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [movimientos, setMovimientos]             = useState<MovimientoResponse[]>([]);
  const [isLoading, setIsLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]               = useState('');
  const [filtroTipo, setFiltroTipo]               = useState<'TODOS' | 'INGRESO' | 'EGRESO'>('TODOS');
  
  const [isModalOpen, setIsModalOpen]             = useState(false);
  const [movimientoToEdit, setMovimientoToEdit]   = useState<MovimientoResponse | null>(null);
  const [movimientoToDelete, setMovToDelete]      = useState<MovimientoResponse | null>(null);
  const [movimientoToView, setMovimientoToView]   = useState<MovimientoResponse | null>(null);
  
  const [currentPage, setCurrentPage]             = useState(1);
  const ITEMS_PER_PAGE = 6;

  const loadData = async () => {
    setIsLoading(true);
    const response = await movimientoService.getMovimientos(user?.token || '');
    if (response.success && response.data) {
      setMovimientos(response.data);
    } else {
      showToast('error', 'Error', response.message || 'Error al cargar movimientos');
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
  }, [searchTerm, filtroTipo]);

  const filtered = movimientos.filter(mov => {
    const matchTipo = filtroTipo === 'TODOS' 
                      || (filtroTipo === 'INGRESO' && mov.tipo_movimiento) 
                      || (filtroTipo === 'EGRESO' && !mov.tipo_movimiento);
    
    const searchLow = searchTerm.toLowerCase();
    const matchSearch = (mov.descripcion || '').toLowerCase().includes(searchLow)
                     || (mov.empresa || '').toLowerCase().includes(searchLow)
                     || (mov.caja || '').toLowerCase().includes(searchLow)
                     || (mov.sede || '').toLowerCase().includes(searchLow);
                     
    return matchTipo && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalMovs = filtered.length;
  const totalIngresos = filtered.filter(m => m.tipo_movimiento).reduce((acc, curr) => acc + curr.monto, 0);
  const totalEgresos = filtered.filter(m => !m.tipo_movimiento).reduce((acc, curr) => acc + curr.monto, 0);

  const handleSave = async (data: any) => {
    if (movimientoToEdit) {
      const res = await movimientoService.updateMovimiento(user?.token || '', movimientoToEdit.id, data);
      if (res.success) {
        showToast('success', 'Movimiento actualizado', 'El movimiento fue actualizado correctamente.');
        loadData();
        setIsModalOpen(false);
        setMovimientoToEdit(null);
      } else {
        showToast('error', 'Error', res.message || 'Error al actualizar el movimiento');
      }
    } else {
      const res = await movimientoService.createMovimiento(user?.token || '', data);
      if (res.success) {
        showToast('success', 'Movimiento registrado', 'El movimiento se registró correctamente.');
        loadData();
        setIsModalOpen(false);
      } else {
        showToast('error', 'Error', res.message || 'Error al registrar el movimiento');
      }
    }
  };

  const handleDelete = async () => {
    if (!movimientoToDelete) return;
    const res = await movimientoService.deleteMovimiento(user?.token || '', movimientoToDelete.id);
    if (res.success) {
      showToast('success', 'Movimiento eliminado', 'El movimiento fue eliminado y la caja se actualizó.');
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al eliminar');
    }
    setMovToDelete(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      {/* ── Encabezado ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B2E4B] dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#C4933F] rounded-full inline-block"></span>
            Gestión de Movimientos
          </h1>
          <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mt-1 ml-3">
            Administra los ingresos y egresos de las distintas cajas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por descripción, caja, sede..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/50 transition-all text-[#1B2E4B] dark:text-[#E8EDF5] shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setMovimientoToEdit(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={18} />
            <span>NUEVO MOVIMIENTO</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1B2E4B]/30 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Activity size={22} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">MOVIMIENTOS</div>
            <div className="text-2xl font-black text-[#1B2E4B] dark:text-white leading-none">{totalMovs}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <ArrowUpRight size={22} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">INGRESOS</div>
            <div className="text-xl font-black text-emerald-600 leading-none">S/ {totalIngresos.toLocaleString('es-PE', {minimumFractionDigits:2})}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <ArrowDownRight size={22} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">EGRESOS</div>
            <div className="text-xl font-black text-red-500 leading-none">S/ {totalEgresos.toLocaleString('es-PE', {minimumFractionDigits:2})}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C4933F]/10 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <DollarSign size={22} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-0.5">BALANCE FLUJO</div>
            <div className={`text-xl font-black leading-none ${(totalIngresos - totalEgresos) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              S/ {(totalIngresos - totalEgresos).toLocaleString('es-PE', {minimumFractionDigits:2})}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtro Rápido ── */}
      <div className="flex mb-4 gap-2">
        {(['TODOS', 'INGRESO', 'EGRESO'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-colors border ${
              filtroTipo === t
                ? 'bg-[#1B2E4B] text-white border-[#1B2E4B]'
                : 'bg-white dark:bg-[#16212E] text-[#6B7A94] dark:text-[#8899B4] border-slate-200 dark:border-[#1E2D3D] hover:bg-slate-50 dark:hover:bg-[#1E2D3D]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tabla de Movimientos ── */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1B2E4B] text-white whitespace-nowrap">
              <tr>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider">TIPO</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider">FECHA</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider">SEDE / CAJA</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider">EMPRESA</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider">DESCRIPCIÓN</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider">COMPROBANTE</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider text-right">MONTO</th>
                <th className="px-5 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D]">
              {isLoading ? (
                <TableSkeleton columns={8} />
              ) : paginated.length > 0 ? (
                paginated.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-black tracking-wider ${
                        mov.tipo_movimiento 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
                          : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {mov.tipo_movimiento ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {mov.tipo_movimiento ? 'INGRESO' : 'EGRESO'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-[#1B2E4B] dark:text-white text-xs">
                        {mov.fecha ? (
                          (() => {
                            const [y, m, d] = mov.fecha.split('-');
                            if (y && m && d) {
                              return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                            }
                            return new Date(mov.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                          })()
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-[#1B2E4B] dark:text-white text-xs">{mov.caja || 'Sin caja'}</div>
                      <div className="text-[10px] text-[#6B7A94] dark:text-[#8899B4] mt-0.5">{mov.sede || 'Sin sede'}</div>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="font-medium text-[#1B2E4B] dark:text-[#E8EDF5] truncate text-xs" title={mov.empresa}>
                        {mov.empresa || '-'}
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[250px]">
                      <div className="text-xs text-[#6B7A94] dark:text-[#8899B4] truncate" title={mov.descripcion}>
                        {mov.descripcion}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-[#1B2E4B] dark:text-[#E8EDF5]">
                        {mov.tipo_comprobante || '-'}
                      </div>
                      {(mov.serie || mov.correlativo) && (
                        <div className="text-[10px] text-[#6B7A94] dark:text-[#8899B4]">
                          {mov.serie && `${mov.serie}-`}{mov.correlativo}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className={`font-black text-sm ${mov.tipo_movimiento ? 'text-emerald-600' : 'text-red-500'}`}>
                        {mov.tipo_movimiento ? '+' : '-'}S/ {mov.monto.toLocaleString('es-PE', {minimumFractionDigits:2})}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setMovimientoToView(mov)} 
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setMovimientoToEdit(mov); setIsModalOpen(true); }} 
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setMovToDelete(mov)} 
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
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Activity size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-[#6B7A94] dark:text-[#8899B4]">
                      {searchTerm ? `No se encontraron movimientos con "${searchTerm}"` : 'No hay movimientos registrados.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filtered.length} 
          itemsPerPage={ITEMS_PER_PAGE} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <MovimientoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setMovimientoToEdit(null); }}
        onSave={handleSave}
        initialData={movimientoToEdit}
      />

      <MovimientoDetailModal
        isOpen={!!movimientoToView}
        onClose={() => setMovimientoToView(null)}
        movimiento={movimientoToView}
      />

      {movimientoToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Movimiento</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5">
              ¿Estás seguro de eliminar este <strong>{movimientoToDelete.tipo_movimiento ? 'INGRESO' : 'EGRESO'}</strong> de S/ {movimientoToDelete.monto}? <br/><br/>
              <span className="text-xs opacity-80">El saldo de la caja se revertirá automáticamente.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setMovToDelete(null)} className="flex-1 py-2.5 border rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-[#1B2E4B] dark:text-white">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
