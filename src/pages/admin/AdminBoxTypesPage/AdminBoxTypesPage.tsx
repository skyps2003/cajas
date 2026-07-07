import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Wallet, CheckCircle2, AlertTriangle, Landmark, Info, ArrowDown, ArrowUp } from 'lucide-react';
import { BoxModal } from './BoxModal';
import TableSkeleton from '../../../components/TableSkeleton';
import { useToast } from '../../../components/Toast/ToastContext';
import { CajaService } from '../../../features/cajas/services/CajaService';
import type { Caja } from '../../../features/cajas/services/CajaService';
import { useAuth } from '../../../contexts/AuthContext';
import { Pagination } from '../../../components/Pagination';

interface BoxData {
  id: string;
  code: string;
  name: string;
  sede: string;
  limitMin: number;
  limitMax: number;
  balance: number;
  status: 'ACTIVO' | 'INACTIVO' | 'ALERTA';
  color?: string;
  _apiId?: number; // real API id
}

// Map API Caja to internal BoxData
const mapCajaToBox = (caja: Caja): BoxData => ({
  id: caja.id.toString(),
  code: caja.codigo || '',
  name: caja.nombre || '',
  sede: '',
  limitMin: Number(caja.monto_min) || 0,
  limitMax: Number(caja.monto_max) || 0,
  balance: Number(caja.saldo) || 0,
  status: caja.estado ? 'ACTIVO' : 'INACTIVO',
  color: caja.color || '#22c55e',
  _apiId: caja.id
});

export const AdminBoxTypesPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [boxesData, setBoxesData] = useState<BoxData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boxToEdit, setBoxToEdit] = useState<BoxData | null>(null);
  const [boxToDelete, setBoxToDelete] = useState<BoxData | null>(null);
  const [boxToToggle, setBoxToToggle] = useState<BoxData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: 'code' | 'name' | 'balance' | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  const itemsPerPage = 6;

  const loadData = async () => {
    setIsLoading(true);
    const res = await CajaService.getCajas(user?.token || '');
    if (res.success && res.data) {
      setBoxesData(res.data.map(mapCajaToBox));
    } else {
      showToast('error', 'Error', res.message || 'Error al cargar cajas');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.token) loadData();
  }, [user]);

  const getStatusStyle = (status: BoxData['status']) => {
    switch (status) {
      case 'ACTIVO': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
      case 'INACTIVO': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20';
      case 'ALERTA': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20';
    }
  };

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredBoxes = boxesData.filter(box => 
    box.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    box.code.includes(searchTerm)
  );

  const sortedBoxes = [...filteredBoxes].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    let aValue: string | number = a[sortConfig.key];
    let bValue: string | number = b[sortConfig.key];

    // For strings, ignore case
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedBoxes.length / itemsPerPage);
  const paginatedBoxes = sortedBoxes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: 'code' | 'name' | 'balance') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null; // Reset sort
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const renderSortIcon = (key: 'code' | 'name' | 'balance') => {
    if (sortConfig.key !== key) return <span className="w-4 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="inline ml-1 text-[#B47541]" /> 
      : <ArrowDown size={14} className="inline ml-1 text-[#B47541]" />;
  };

  // Dynamic calculations based on list
  const totalBoxesCount = filteredBoxes.length;
  const activeBoxesCount = filteredBoxes.filter(b => b.status === 'ACTIVO').length;
  const inactiveBoxesCount = filteredBoxes.filter(b => b.status === 'INACTIVO').length;
  
  // Consolidated Balance (sum of active/alert boxes balance)
  const consolidatedBalance = filteredBoxes
    .filter(b => b.status !== 'INACTIVO')
    .reduce((sum, b) => sum + b.balance, 0);

  const getStatusDotColor = (status: BoxData['status']) => {
    switch (status) {
      case 'ACTIVO': return '#22c55e';
      case 'ALERTA': return '#f97316';
      case 'INACTIVO': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const handleDelete = async () => {
    if (!boxToDelete) return;
    const apiId = boxToDelete._apiId;
    if (!apiId) return;
    const res = await CajaService.deleteCaja(user?.token || '', apiId);
    if (res.success) {
      showToast('success', 'Caja eliminada', `${boxToDelete.name} fue removida del sistema.`);
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al eliminar');
    }
    setBoxToDelete(null);
  };

  const handleToggleStatus = async () => {
    if (!boxToToggle) return;
    const apiId = boxToToggle._apiId;
    if (!apiId) return;
    const res = await CajaService.toggleStatus(user?.token || '', apiId);
    if (res.success) {
      showToast('info', 'Estado actualizado', `El estado de ${boxToToggle.name} fue actualizado.`);
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al actualizar estado');
    }
    setBoxToToggle(null);
  };

  const handleSave = async (newBox: BoxData) => {
    const cajaData: any = {
      nombre: newBox.name,
      codigo: newBox.code,
      color: newBox.color || '#22c55e',
      monto_min: newBox.limitMin,
      monto_max: newBox.limitMax,
    };

    let res;
    if (boxToEdit && boxToEdit._apiId) {
      cajaData.saldo = newBox.balance;
      res = await CajaService.updateCaja(user?.token || '', boxToEdit._apiId, cajaData);
    } else {
      res = await CajaService.createCaja(user?.token || '', cajaData);
    }

    if (res.success) {
      showToast('success', boxToEdit ? 'Caja actualizada' : 'Caja creada', boxToEdit ? `${newBox.name} fue actualizada.` : `${newBox.name} fue registrada.`);
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al guardar');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Configuración de Cajas 
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestión de ventanillas, cajas fuertes, límites operativos e indicadores de liquidez.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
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
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541]"
          >
            <Plus size={18} />
            <span>CREAR NUEVA CAJA</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Cajas */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Wallet size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>CAJAS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{totalBoxesCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Cajas Activas */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CAJAS<br/>ACTIVAS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{activeBoxesCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        
        {/* Saldo Consolidado */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <Landmark size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">SALDO<br/>CONSOLIDADO</div>
            <div className="text-lg sm:text-xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none mt-0.5">
              S/ {consolidatedBalance.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        
        {/* Alertas de Liquidez */}
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <AlertTriangle size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CAJAS<br/>INACTIVAS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{inactiveBoxesCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#15171c] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden mb-6">
        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1B2E4B] text-white select-none">
              <tr>
                <th 
                  className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer hover:bg-[#2A4365] transition-colors"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center">CÓD. {renderSortIcon('code')}</div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer hover:bg-[#2A4365] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">DENOMINACIÓN {renderSortIcon('name')}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">LÍMITES (MIN/MAX)</th>
                <th 
                  className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer hover:bg-[#2A4365] transition-colors"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center">SALDO {renderSortIcon('balance')}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO OPERATIVO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#15171c]">
                {isLoading ? (
                  <TableSkeleton columns={6} />
                ) : paginatedBoxes.length > 0 ? (
                paginatedBoxes.map((box) => (
                  <tr key={box.id} className="bg-white dark:bg-[#15171c] hover:bg-slate-50 dark:hover:bg-[#1e2028] transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center">
                        <span 
                          className="inline-block w-2.5 h-2.5 rounded-full mr-2.5 shrink-0" 
                          style={{ backgroundColor: box.color || getStatusDotColor(box.status) }}
                          title={`Estado: ${box.status}`}
                        />
                        <span>{box.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-white">
                      {box.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-300 font-medium">
                      S/ {box.limitMin.toLocaleString()} - S/ {box.limitMax.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                      S/ {box.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setBoxToToggle(box)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${getStatusStyle(box.status)}`}
                        title="Haz clic para cambiar el estado"
                      >
                        {box.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setBoxToEdit(box)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" 
                          title="Editar Caja"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setBoxToDelete(box)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                          title="Eliminar Caja"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 dark:text-slate-500">
                    {searchTerm 
                      ? `No se encontraron cajas con "${searchTerm}"`
                      : 'Aún no hay cajas registradas en el sistema.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile (Tarjetas) */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-700 h-24 rounded-lg w-full"></div>
                ))}
              </div>
          ) : paginatedBoxes.length > 0 ? (
            paginatedBoxes.map((box) => (
              <div key={box.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span 
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" 
                      style={{ backgroundColor: box.color || getStatusDotColor(box.status) }}
                    />
                    <div>
                      <div className="font-extrabold text-slate-800 dark:text-white text-sm">{box.name}</div>
                      <div className="text-xs text-slate-500 font-bold mt-0.5">{box.code}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 mt-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">Límites (Mín/Máx):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-xs text-right">S/ {box.limitMin.toLocaleString()}<br/>S/ {box.limitMax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-3 mt-1">
                  <button 
                    onClick={() => setBoxToToggle(box)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm ${getStatusStyle(box.status)}`}
                  >
                    {box.status}
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setBoxToEdit(box)}
                      className="p-2.5 text-slate-500 hover:text-[#B47541] transition-colors hover:bg-slate-200 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setBoxToDelete(box)}
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
              {searchTerm ? 'No se encontraron resultados.' : 'Aún no hay cajas registradas.'}
            </div>
          )}
        </div>
        
        {/* Pagination Section */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filteredBoxes.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Delete Confirmation Modal */}
      {boxToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] border border-[#E2E8F0] dark:border-[#1E2D3D] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Caja</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Eliminar la caja <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{boxToDelete.name}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setBoxToDelete(null)}
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
      {boxToToggle && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] border border-[#E2E8F0] dark:border-[#1E2D3D] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-[#C4933F]/10 dark:bg-[#C4933F]/20 rounded-full flex items-center justify-center mb-3">
              <Info className="text-[#C4933F]" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Cambiar Estado</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Cambiar el estado de <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{boxToToggle.name}</strong> a <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{boxToToggle.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setBoxToToggle(null)}
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

      {/* Main Form Box Modal */}
      <BoxModal 
        isOpen={isModalOpen || !!boxToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setBoxToEdit(null);
        }}
        initialData={boxToEdit}
        onSave={handleSave}
      />
    </div>
  );
};
