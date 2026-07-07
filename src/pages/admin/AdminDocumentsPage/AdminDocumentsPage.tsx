import React, { useState } from 'react';
import {
  FileText, Download, FileSpreadsheet, Building2,
  SlidersHorizontal, Calendar, ChevronRight, CheckCircle2,
  Loader2, AlertCircle, TrendingUp, Users, Box, ListChecks, TrendingDown
} from 'lucide-react';
import { useToast } from '../../../components/Toast/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { reportesService } from '../../../services/reportesService';

// ─── Tipos de Reportes ───────────────────────────────────────────────────────────
const REPORTES = [
  { id: 'movimientos', name: 'Movimientos Generales', icon: ListChecks, reqDates: true },
  { id: 'ingresos',    name: 'Ingresos',              icon: TrendingUp, reqDates: true },
  { id: 'egresos',     name: 'Egresos',               icon: TrendingDown, reqDates: true },
  { id: 'cajas',       name: 'Estado de Cajas',       icon: Box, reqDates: false },
  { id: 'usuarios',    name: 'Reporte de Usuarios',   icon: Users, reqDates: false },
  { id: 'empresas',    name: 'Reporte de Empresas',   icon: Building2, reqDates: false },
];

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

type TipoFiltro = 'MENSUAL' | 'DIARIO';

// Función para descargar un JSON como CSV
const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return false;
  const keys = Object.keys(data[0]);
  const csvContent = "data:text/csv;charset=utf-8," + 
    keys.join(",") + "\n" +
    data.map(row => keys.map(k => {
      let val = row[k];
      if (val === null || val === undefined) val = '';
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

// ─── Componente principal ────────────────────────────────────────────────────
export const AdminDocumentsPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const now = new Date();
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('MENSUAL');
  const [mes, setMes]               = useState(now.getMonth()); // 0-based
  const [year, setYear]             = useState(now.getFullYear());
  const [dia, setDia]               = useState(now.getDate());
  const [loading, setLoading]       = useState<string | null>(null);

  // Días del mes seleccionado
  const diasEnMes = new Date(year, mes + 1, 0).getDate();
  const diasArray  = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const getFechas = () => {
    if (tipoFiltro === 'MENSUAL') {
      const inicio = `${year}-${String(mes + 1).padStart(2, '0')}-01`;
      const fin = `${year}-${String(mes + 1).padStart(2, '0')}-${String(diasEnMes).padStart(2, '0')}`;
      return { fecha_inicio: inicio, fecha_fin: fin };
    } else {
      const fecha = `${year}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      return { fecha_inicio: fecha, fecha_fin: fecha };
    }
  };

  const handleDescarga = async (reporteId: string, reporteName: string) => {
    const token = user?.token || '';
    if (!token) return;

    setLoading(reporteId);
    try {
      const { fecha_inicio, fecha_fin } = getFechas();
      let data: any[] = [];

      switch (reporteId) {
        case 'movimientos': data = await reportesService.getMovimientos(token, fecha_inicio, fecha_fin); break;
        case 'ingresos':    data = await reportesService.getIngresos(token, fecha_inicio, fecha_fin); break;
        case 'egresos':     data = await reportesService.getEgresos(token, fecha_inicio, fecha_fin); break;
        case 'cajas':       data = await reportesService.getCajas(token); break;
        case 'usuarios':    data = await reportesService.getUsuarios(token); break;
        case 'empresas':    data = await reportesService.getEmpresas(token); break;
      }

      if (data.length === 0) {
        showToast('info', 'Reporte vacío', 'No se encontraron datos para los filtros seleccionados.');
        return;
      }

      const suffix = tipoFiltro === 'MENSUAL' ? `${MESES[mes]}_${year}` : `${dia}_${MESES[mes]}_${year}`;
      const filename = `${reporteName.replace(/ /g, '_')}_${suffix}`;
      
      const success = exportToCSV(data, filename);
      if (success) {
        showToast('success', 'Descarga completada', `El reporte ${reporteName} se descargó como CSV.`);
      }
    } catch (error: any) {
      showToast('error', 'Error en el reporte', error.message);
    } finally {
      setLoading(null);
    }
  };

  const periodoLabel = tipoFiltro === 'MENSUAL'
    ? `${MESES[mes]} ${year}`
    : `${dia.toString().padStart(2, '0')}/${(mes + 1).toString().padStart(2, '0')}/${year}`;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">

      {/* ── Encabezado ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B2E4B] dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#C4933F] rounded-full inline-block" />
            Consultas y Reportes
          </h1>
          <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mt-1 ml-3">
            Obtén y descarga extractos detallados del sistema por período.
          </p>
        </div>
      </div>

      {/* ── Layout Principal ── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ─ Panel Parámetros ─ */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] shadow-sm p-5 sticky top-6">

            {/* Header del panel */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 flex items-center justify-center">
                <SlidersHorizontal size={17} className="text-[#1B2E4B] dark:text-[#B8C4D6]" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">Parámetros</h2>
                <p className="text-[10px] text-[#6B7A94] dark:text-[#8899B4]">Aplica a reportes con fechas</p>
              </div>
            </div>

            {/* Tipo de Filtro */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-2">
                Frecuencia
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-[#1E2D3D]">
                {(['MENSUAL', 'DIARIO'] as TipoFiltro[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipoFiltro(t)}
                    className={`flex-1 py-2 text-xs font-bold tracking-wider transition-colors ${
                      tipoFiltro === t
                        ? 'bg-[#1B2E4B] text-white'
                        : 'bg-white dark:bg-[#0F1E2E] text-[#6B7A94] dark:text-[#8899B4] hover:bg-slate-50 dark:hover:bg-[#1B2E4B]/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Selectores de Período */}
            <div className="space-y-3 mb-5">
              <div className="flex gap-2">
                {/* Mes */}
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-1">Mes</label>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-slate-200 dark:border-[#1E2D3D] rounded-lg text-sm text-[#1B2E4B] dark:text-[#E8EDF5] focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40"
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Año */}
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-1">Año</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-slate-200 dark:border-[#1E2D3D] rounded-lg text-sm text-[#1B2E4B] dark:text-[#E8EDF5] focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Día (solo en DIARIO) */}
              {tipoFiltro === 'DIARIO' && (
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase mb-1">Día</label>
                  <select
                    value={dia}
                    onChange={(e) => setDia(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-slate-200 dark:border-[#1E2D3D] rounded-lg text-sm text-[#1B2E4B] dark:text-[#E8EDF5] focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40"
                  >
                    {diasArray.map((d) => (
                      <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Período seleccionado */}
            <div className="flex items-center gap-2 bg-[#E8EDF5] dark:bg-[#1B2E4B]/20 rounded-lg px-3 py-2 mb-2">
              <Calendar size={14} className="text-[#C4933F] shrink-0" />
              <span className="text-xs font-semibold text-[#1B2E4B] dark:text-[#B8C4D6]">{periodoLabel}</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-5 leading-relaxed">
              * El rango de fechas solo afecta a los reportes de movimientos, ingresos y egresos.
            </p>

          </div>
        </div>

        {/* ─ Grid de Reportes ─ */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 content-start">
          {REPORTES.map((report) => {
            const isLoading = loading === report.id;
            const Icon = report.icon;

            return (
              <div
                key={report.id}
                className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] shadow-sm overflow-hidden transition-shadow hover:shadow-md flex flex-col"
              >
                {/* Cabecera del Reporte */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#1E2D3D]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 text-[#1B2E4B] dark:text-[#B8C4D6]">
                      <Icon size={16} strokeWidth={2} />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 flex-1">
                  <h3 className="font-bold text-[#1B2E4B] dark:text-[#E8EDF5] text-sm tracking-wide leading-tight mb-2">
                    {report.name}
                  </h3>
                  <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] leading-relaxed">
                    {report.reqDates 
                      ? 'Extrae los registros financieros en formato tabular usando el rango de fechas actual.'
                      : 'Descarga un archivo con el estado general sin depender del rango de fechas.'}
                  </p>
                </div>

                {/* Botones de descarga */}
                <div className="p-3 border-t border-slate-100 dark:border-[#1E2D3D]">
                  <button
                    onClick={() => handleDescarga(report.id, report.name)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group bg-[#E8EDF5]/50 hover:bg-[#E8EDF5] dark:bg-[#1B2E4B]/20 dark:hover:bg-[#1B2E4B]/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-[#1B2E4B] dark:text-[#E8EDF5]">
                      {isLoading
                        ? <Loader2 size={16} className="animate-spin text-[#C4933F]" />
                        : <FileSpreadsheet size={16} className="text-[#C4933F]" strokeWidth={2} />
                      }
                      <span className="text-xs font-bold tracking-widest text-left">
                        {isLoading ? 'GENERANDO...' : 'DESCARGAR CSV'}
                      </span>
                    </div>
                    
                    {!isLoading && <Download size={14} className="text-[#6B7A94] opacity-0 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-[#1E2D3D] flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-sm text-[#6B7A94] dark:text-[#8899B4]">
          <Building2 size={15} strokeWidth={1.8} />
          <span className="font-semibold">Interoceánica JJJA — Portal Administrativo</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </p>
      </div>

    </div>
  );
};
