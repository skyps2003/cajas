import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, CheckCircle2, Landmark, Info, Building2, User } from 'lucide-react';
import { EmpresaModal } from './EmpresaModal';
import { useToast } from '../../../components/Toast/ToastContext';
import { EmpresaService } from '../../../features/empresas/services/EmpresaService';
import type { Empresa } from '../../../features/empresas/services/EmpresaService';
import { useAuth } from '../../../contexts/AuthContext';
import TableSkeleton from '../../../components/TableSkeleton';
import { Pagination } from '../../../components/Pagination';

// ─── Estilo según estado de la empresa ────────────────────────────────────────
const getStatusStyle = (estado: boolean) => {
  if (estado) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20';
  } else {
    return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20';
  }
};

export const AdminEmpresasPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
    
  const [empresas, setEmpresas]               = useState<Empresa[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [empresaToEdit, setEmpresaToEdit]     = useState<Empresa | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);
  const [empresaToToggle, setEmpresaToToggle] = useState<Empresa | null>(null);
  const [currentPage, setCurrentPage]         = useState(1);
  const ITEMS_PER_PAGE = 6;

  const loadData = async () => {
    setIsLoading(true);
    const response = await EmpresaService.getEmpresas(user?.token || '');
    if (response.success && response.data) {
      setEmpresas(response.data);
    } else {
      showToast('error', 'Error', response.message || 'Error al cargar empresas');
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

  const filteredEmpresas = empresas.filter(emp =>
    (emp.razon_social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.ruc || '').includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredEmpresas.length / ITEMS_PER_PAGE);
  const paginatedEmpresas = filteredEmpresas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalEmpresas  = filteredEmpresas.length;
  const activasCount   = filteredEmpresas.filter(e => e.estado).length;
  const rucCount       = filteredEmpresas.filter(e => e.ruc?.length === 11).length;
  const dniCount       = filteredEmpresas.filter(e => e.ruc?.length === 8).length;

  const handleSave = () => {
    loadData();
    setEmpresaToEdit(null);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!empresaToDelete) return;
    const res = await EmpresaService.deleteEmpresa(user?.token || '', empresaToDelete.id);
    if (res.success) {
      showToast('success', 'Empresa eliminada', 'Se eliminó correctamente.');
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al eliminar');
    }
    setEmpresaToDelete(null);
  };

  const handleToggleStatus = async () => {
    if (!empresaToToggle) return;
    const res = await EmpresaService.toggleStatus(user?.token || '', empresaToToggle.id);
    if (res.success) {
      showToast('info', 'Estado actualizado', 'El estado fue actualizado correctamente.');
      loadData();
    } else {
      showToast('error', 'Error', res.message || 'Error al actualizar estado');
    }
    setEmpresaToToggle(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* ── Encabezado de página ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block"></span>
            Empresas
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">
            Gestión de Empresas (RUC) y Personas Naturales (DNI) — Validadas con SUNAT / RENIEC.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por Razón Social, RUC/DNI..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setEmpresaToEdit(null); setIsModalOpen(true); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541] whitespace-nowrap"
          >
            <Plus size={18} />
            <span>NUEVA EMPRESA</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Landmark size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>REGISTROS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{totalEmpresas.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">ESTADO<br/>ACTIVO</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{activasCount.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <Building2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">EMPRESAS<br/>(RUC)</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{rucCount.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#1B2E4B]/10 dark:bg-[#1B2E4B]/30 text-[#1B2E4B] dark:text-[#B8C4D6] flex items-center justify-center shrink-0 border border-[#1B2E4B]/15 dark:border-[#1B2E4B]/40">
            <User size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">PERSONAS<br/>(DNI)</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{dniCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* ── Tabla de Empresas ── */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="w-10 px-4 py-4 font-semibold text-xs tracking-wider"></th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">TIPO / NRO DOCUMENTO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">RAZÓN SOCIAL / NOMBRE</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider">DIRECCIÓN</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] bg-white dark:bg-[#16212E]">
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : paginatedEmpresas.length > 0 ? (
                paginatedEmpresas.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                    <td className="px-4 py-4 text-center">
                      <div className="w-3 h-3 rounded-full mx-auto shadow-sm" style={{ backgroundColor: emp.color || '#cccccc' }} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {emp.ruc?.length === 11 ? <Building2 size={14} className="text-slate-400" /> : <User size={14} className="text-slate-400" />}
                        {emp.ruc}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[250px]">{emp.razon_social}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{emp.direccion || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setEmpresaToToggle(emp)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm ${getStatusStyle(emp.estado)}`}
                      >
                        {emp.estado ? 'ACTIVO' : 'INACTIVO'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setEmpresaToEdit(emp); setIsModalOpen(true); }} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => setEmpresaToDelete(emp)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    {searchTerm ? `No se encontraron empresas con "${searchTerm}"` : 'No hay empresas registradas.'}
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
          totalItems={filteredEmpresas.length} 
          itemsPerPage={ITEMS_PER_PAGE} 
          onPageChange={setCurrentPage} 
        />
      </div>

      <EmpresaModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEmpresaToEdit(null); }}
        initialData={empresaToEdit}
        onSave={handleSave}
      />

      {empresaToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Empresa</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5">
              ¿Eliminar permanentemente <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{empresaToDelete.razon_social}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEmpresaToDelete(null)} className="flex-1 py-2.5 border rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {empresaToToggle && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-[#C4933F]/10 dark:bg-[#C4933F]/20 rounded-full flex items-center justify-center mb-3">
              <Info className="text-[#C4933F]" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Cambiar Estado</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5">
              ¿Cambiar el estado de <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{empresaToToggle.razon_social}</strong> a <strong>{empresaToToggle.estado ? 'INACTIVO' : 'ACTIVO'}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEmpresaToToggle(null)} className="flex-1 py-2.5 border rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Cancelar</button>
              <button onClick={handleToggleStatus} className="flex-1 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-semibold">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
