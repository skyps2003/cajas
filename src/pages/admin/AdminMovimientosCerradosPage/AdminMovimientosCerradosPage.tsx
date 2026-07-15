import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts';
import { MovimientoService } from '../../../features/movimientos/services/MovimientoService';
import { sedeService } from '../../../services/sedeService';
import type { SedeResponse } from '../../../services/sedeService';
import { useToast } from '../../../components/Toast/ToastContext';
import papelMembretado from '../../../assets/PDF/Papel Membretado Estudio El Asesor.png';
import {
  Archive,
  TrendingUp, TrendingDown, RefreshCw,
  Loader2, User, MapPin, Eye, X, ArrowUpRight, ArrowDownRight, Calendar, CreditCard, Activity,
  Trash2, Download
} from 'lucide-react';

type Cierre = {
  id: number;
  sede_id: number;
  sede?: string;
  usuario_sede_id: number;
  fecha_cierre: string;
  movimientos_cerrados: number;
  total_ingresos: number;
  total_egresos: number;
  saldo_cierre: number;
  usuario?: { nombre: string; apellido: string };
  cajas?: Array<{
    caja_id: number;
    caja: string;
    total_ingresos: number;
    total_egresos: number;
    saldo_cierre: number;
  }>;
};

export const AdminMovimientosCerradosPage: React.FC = () => {
  const { user, jwt } = useAuth() as any;
  const { showToast } = useToast();

  const isAdmin = user?.rol === 1 || user?.role === 'admin' || user?.rol === 'admin';

  // Para admin: lista de sedes y sede seleccionada ('all' para todas)
  const [sedes, setSedes] = useState<SedeResponse[]>([]);
  const [selectedSedeId, setSelectedSedeId] = useState<number | 'all'>('all');

  // Para cajero: la sede viene del contexto
  const cajeroSedeId = user?.sedeId || Number(localStorage.getItem('selected_sede_id')) || null;

  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Cargar sedes (solo admin)
  useEffect(() => {
    if (!isAdmin) return;
    sedeService.getAll(jwt || user?.token || '').then(res => {
      if (Array.isArray(res)) setSedes(res);
    }).catch(err => console.error(err));
  }, [isAdmin]);

  const sedeIdToFetch = isAdmin ? selectedSedeId : cajeroSedeId;

  const loadCierres = async () => {
    if (!sedeIdToFetch && sedeIdToFetch !== 'all') return;
    setLoading(true);
    try {
      const token = jwt || user?.token || '';
      let res;
      if (sedeIdToFetch === 'all') {
        res = await MovimientoService.getAllCierres(token);
      } else {
        res = await MovimientoService.getCierresBySede(token, Number(sedeIdToFetch));
      }
      
      if (res.success && res.data) {
        setCierres(
          res.data.sort(
            (a, b) => new Date(b.fecha_cierre).getTime() - new Date(a.fecha_cierre).getTime()
          )
        );
      } else {
        showToast('error', 'Error', res.message || 'No se pudieron cargar los cierres');
        setCierres([]);
      }
    } catch {
      showToast('error', 'Error de red', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Cajero: cargar al montar. Admin: cargar cuando cambia la sede seleccionada
  useEffect(() => {
    if (sedeIdToFetch) loadCierres();
    else setCierres([]);
  }, [sedeIdToFetch]);

  const fmt = (n: number) =>
    Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 });

  const formatFecha = (iso: string) =>
    new Date(iso)
      .toLocaleString('es-PE', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      .toUpperCase();

  const selectedSede = sedes.find(s => s.id === selectedSedeId);

  const handleExportPDF = async (cierre: Cierre) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const img = new Image();
      img.src = papelMembretado;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const drawBackground = (docInstance: any) => {
        docInstance.addImage(img, 'PNG', 0, 0, pageWidth, pageHeight);
      };

      const originalAddPage = doc.addPage.bind(doc);
      doc.addPage = function() {
        originalAddPage(...arguments);
        drawBackground(doc);
        return doc;
      };

      drawBackground(doc);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.text('REPORTE FINANCIERO', pageWidth / 2, 130, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Reporte de Cierre de Caja', pageWidth / 2, 145, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      const nombreSede = cierre.sede || sedes.find(s => String(s.id) === String(cierre.sede_id))?.nombre || 'SEDE PRINCIPAL';
      doc.text(`SEDE: ${nombreSede.toUpperCase()}`, pageWidth / 2, 160, { align: 'center' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(40, 180, pageWidth - 40, 180);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('RESUMEN OPERATIVO', 40, 195);

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('FECHA DEL CIERRE', 40, 220);
      
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text(formatFecha(cierre.fecha_cierre), 40, 235);
      
      doc.setFontSize(7);
      doc.setTextColor(0, 176, 80);
      doc.text(`(+) INGRESOS: S/ ${fmt(Number(cierre.total_ingresos))}`, 40, 250);

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('CAJERO', pageWidth / 2, 220, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text(cierre.usuario ? `${cierre.usuario.nombre} ${cierre.usuario.apellido}` : '-', pageWidth / 2, 235, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('SALDO NETO', pageWidth - 40, 220, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(0, 176, 80);
      doc.text(`S/ ${fmt(Number(cierre.saldo_cierre))}`, pageWidth - 40, 235, { align: 'right' });

      doc.setFontSize(7);
      doc.setTextColor(220, 38, 38);
      doc.text(`(-) EGRESOS: S/ ${fmt(Number(cierre.total_egresos))}`, pageWidth - 40, 250, { align: 'right' });

      const tableData = cierre.cajas?.map(c => [
        c.caja,
        `S/ ${fmt(Number(c.total_ingresos))}`,
        `S/ ${fmt(Number(c.total_egresos))}`,
        `S/ ${fmt(Number(c.saldo_cierre))}`
      ]) || [];

      autoTable(doc, {
        startY: 270,
        head: [['CAJA / METODO', 'INGRESOS', 'EGRESOS', 'SALDO']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [80, 80, 80],
          cellPadding: 4,
          lineWidth: { bottom: 0.1 },
          lineColor: { bottom: [200, 200, 200] } as any
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        margin: { top: 150, bottom: 50 },
      });

      doc.save(`cierre_${cierre.fecha_cierre.split('T')[0]}.pdf`);
      showToast('success', 'PDF Generado', 'El reporte se ha descargado correctamente.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo generar el PDF');
    }
  };

  const handleExportAllPDF = async () => {
    if (cierres.length === 0) {
      showToast('warning', 'Sin Datos', 'No hay cierres para exportar.');
      return;
    }

    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const img = new Image();
      img.src = papelMembretado;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const drawBackground = (docInstance: any) => {
        docInstance.addImage(img, 'PNG', 0, 0, pageWidth, pageHeight);
      };

      const originalAddPage = doc.addPage.bind(doc);
      doc.addPage = function() {
        originalAddPage(...arguments);
        drawBackground(doc);
        return doc;
      };

      drawBackground(doc);

      cierres.forEach((cierre, index) => {
        if (index > 0) {
          doc.addPage();
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 58, 138);
        doc.text('REPORTE FINANCIERO', pageWidth / 2, 130, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Reporte de Cierre de Caja', pageWidth / 2, 145, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        const nombreSede = cierre.sede || sedes.find(s => String(s.id) === String(cierre.sede_id))?.nombre || selectedSede?.nombre || 'SEDE PRINCIPAL';
        doc.text(`SEDE: ${nombreSede.toUpperCase()}`, pageWidth / 2, 160, { align: 'center' });

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.line(40, 180, pageWidth - 40, 180);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('RESUMEN OPERATIVO', 40, 195);

        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('FECHA DEL CIERRE', 40, 220);
        
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138);
        doc.text(formatFecha(cierre.fecha_cierre), 40, 235);
        
        doc.setFontSize(7);
        doc.setTextColor(0, 176, 80);
        doc.text(`(+) INGRESOS: S/ ${fmt(Number(cierre.total_ingresos))}`, 40, 250);

        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('CAJERO', pageWidth / 2, 220, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138);
        doc.text(cierre.usuario ? `${cierre.usuario.nombre} ${cierre.usuario.apellido}` : '-', pageWidth / 2, 235, { align: 'center' });

        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('SALDO NETO', pageWidth - 40, 220, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setTextColor(0, 176, 80);
        doc.text(`S/ ${fmt(Number(cierre.saldo_cierre))}`, pageWidth - 40, 235, { align: 'right' });

        doc.setFontSize(7);
        doc.setTextColor(220, 38, 38);
        doc.text(`(-) EGRESOS: S/ ${fmt(Number(cierre.total_egresos))}`, pageWidth - 40, 250, { align: 'right' });

        const tableData = cierre.cajas?.map(c => [
          c.caja,
          `S/ ${fmt(Number(c.total_ingresos))}`,
          `S/ ${fmt(Number(c.total_egresos))}`,
          `S/ ${fmt(Number(c.saldo_cierre))}`
        ]) || [];

        autoTable(doc, {
          startY: 270,
          head: [['CAJA / METODO', 'INGRESOS', 'EGRESOS', 'SALDO']],
          body: tableData,
          theme: 'plain',
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [80, 80, 80],
            cellPadding: 4,
            lineWidth: { bottom: 0.1 },
            lineColor: { bottom: [200, 200, 200] } as any
          },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
          },
          margin: { top: 150, bottom: 50 },
        });
      });

      doc.save(`reporte_cierres_general_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('success', 'PDF Generado', 'El reporte general se ha descargado correctamente.');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error', 'No se pudo generar el PDF general');
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCierre = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const cierre = cierres.find(c => c.id === deleteId);
      if (cierre && cierre.movimientos_ids && cierre.movimientos_ids.length > 0) {
        setIsDeleting(true);
        try {
          const token = jwt || user?.token || '';
          await Promise.all(
            cierre.movimientos_ids.map(movId => MovimientoService.deleteMovimiento(token, movId))
          );
          
          setCierres(prev => prev.filter(c => c.id !== deleteId));
          showToast('success', 'Cierre Eliminado', 'Se han eliminado todos los movimientos de este cierre.');
        } catch (error) {
          showToast('error', 'Error', 'No se pudieron eliminar todos los movimientos del cierre.');
        } finally {
          setIsDeleting(false);
          setDeleteId(null);
        }
      } else {
        setCierres(prev => prev.filter(c => c.id !== deleteId));
        showToast('success', 'Cierre Eliminado', 'El cierre ha sido eliminado localmente de la tabla.');
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B2E4B] dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#C4933F] rounded-full inline-block"></span>
            Cierres de Caja
          </h1>
          <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mt-1 ml-3">
            {isAdmin ? 'Historial detallado de cierres de caja por sede.' : 'Historial detallado de los cierres de tu caja.'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={handleExportAllPDF}
            disabled={loading || cierres.length === 0}
            className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
          >
            <Download size={15} />
            Exportar General
          </button>
          <button
            onClick={loadCierres}
            disabled={loading || !sedeIdToFetch}
            className="flex items-center gap-2 bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] text-[var(--sidebar-text-hover)] hover:border-[#C4933F]/60 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Actualizar
          </button>
        </div>
      </div>

      {/* Selector de sede (solo admin) */}
      {isAdmin && (
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-5 shadow-sm mb-6">
          <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <MapPin size={13} className="text-[#C4933F]" />
            Seleccionar Sede
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button
              onClick={() => setSelectedSedeId('all')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left ${
                selectedSedeId === 'all'
                  ? 'bg-[#C4933F] border-[#C4933F] text-white shadow-sm'
                  : 'border-[var(--sidebar-border)] text-[var(--sidebar-text-hover)] hover:border-[#C4933F]/50 hover:bg-[var(--sidebar-hover)]'
              }`}
            >
              <MapPin size={13} className={selectedSedeId === 'all' ? 'text-white' : 'text-[#C4933F]'} />
              <span className="truncate">Todas las Sedes</span>
            </button>
            {sedes.map(sede => {
              const isActive = selectedSedeId === sede.id;
              return (
                <button
                  key={sede.id}
                  onClick={() => setSelectedSedeId(sede.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-[#C4933F] border-[#C4933F] text-white shadow-sm'
                      : 'border-[var(--sidebar-border)] text-[var(--sidebar-text-hover)] hover:border-[#C4933F]/50 hover:bg-[var(--sidebar-hover)]'
                  }`}
                >
                  <MapPin size={13} className={isActive ? 'text-white' : 'text-[#C4933F]'} />
                  <span className="truncate">{sede.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin sede seleccionada (admin) */}
      {isAdmin && selectedSedeId === null && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] flex items-center justify-center">
            <MapPin size={24} className="text-[var(--sidebar-text)]" />
          </div>
          <h3 className="text-base font-bold text-[var(--sidebar-text-hover)]">Selecciona una sede</h3>
          <p className="text-sm text-[var(--sidebar-text)]">Elige una sede arriba para ver sus cierres.</p>
        </div>
      )}

      {/* Cargando */}
      {loading && (sedeIdToFetch || sedeIdToFetch === 'all') && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 mb-6">
          <Loader2 size={32} className="animate-spin text-[#C4933F]" />
          <p className="text-sm text-[var(--sidebar-text)]">Cargando cierres{selectedSede ? ` de ${selectedSede.nombre}` : ''}...</p>
        </div>
      )}

      {/* Sin cierres */}
      {!loading && (sedeIdToFetch || sedeIdToFetch === 'all') && cierres.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] flex items-center justify-center">
            <Archive size={24} className="text-[var(--sidebar-text)]" />
          </div>
          <h3 className="text-base font-bold text-[var(--sidebar-text-hover)]">Sin cierres registrados</h3>
          <p className="text-sm text-[var(--sidebar-text)]">Aún no se ha realizado ningún cierre en esta sede.</p>
        </div>
      )}

      {/* Lista de cierres (Formato Tabla) */}
      {!loading && cierres.length > 0 && (
        <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1B2E4B] text-white whitespace-nowrap">
                <tr>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider">NRO</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider">FECHA / HORA</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider">SEDE</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider">CAJERO</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider text-center">MOVIMIENTOS</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider text-right">INGRESOS</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider text-right">EGRESOS</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider text-right">SALDO NETO</th>
                  <th className="px-5 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D]">
                {cierres.map((cierre, idx) => {
                  const saldoPositivo = Number(cierre.saldo_cierre) >= 0;
                  return (
                    <tr key={cierre.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center bg-[#C4933F]/10 text-[#C4933F] text-[10px] font-black tracking-wider px-2.5 py-1 rounded">
                          #{cierres.length - idx}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-[#1B2E4B] dark:text-white text-xs">
                          {formatFecha(cierre.fecha_cierre)}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg inline-block">
                          {cierre.sede || sedes.find(s => String(s.id) === String(cierre.sede_id))?.nombre || '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-[#1B2E4B] dark:text-[#E8EDF5] uppercase">
                          {cierre.usuario ? `${cierre.usuario.nombre} ${cierre.usuario.apellido}` : '-'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="font-bold text-[#1B2E4B] dark:text-white text-xs">
                          {cierre.movimientos_cerrados}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="font-black text-sm text-emerald-600">
                          +S/ {fmt(Number(cierre.total_ingresos))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="font-black text-sm text-red-500">
                          -S/ {fmt(Number(cierre.total_egresos))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className={`font-black text-sm ${saldoPositivo ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                          S/ {fmt(Number(cierre.saldo_cierre))}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setExpandedId(cierre.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCierre(cierre.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Eliminar cierre"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button
                            onClick={() => handleExportPDF(cierre)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Descargar PDF"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}      {/* Modal Detalles del Cierre */}
      {expandedId && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setExpandedId(null)}>
          <div 
            className="bg-white dark:bg-surface w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col border border-outline-variant animate-fade-in"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedId(null)}
              className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
            >
              <X size={20} />
            </button>

            {/* Body */}
            <div className="p-8 overflow-y-auto no-scrollbar">
              {(() => {
                const cierre = cierres.find(c => c.id === expandedId);
                if (!cierre) return null;
                const saldoPositivo = Number(cierre.saldo_cierre) >= 0;

                return (
                  <>
                    {/* Header */}
                    <div className="mb-6">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        CIERRE DE CAJA
                      </span>
                      <h2 className="text-2xl font-bold text-[#1B2E4B] dark:text-white">
                        Detalle del Cierre
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Información completa del cierre #{cierres.length - cierres.findIndex(c => c.id === expandedId)} registrado en el sistema.
                      </p>
                    </div>

                    {/* Saldo Neto destacado */}
                    <div className={`mb-6 rounded-xl border p-5 flex items-center gap-4 ${
                      saldoPositivo
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                    }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        saldoPositivo
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                      }`}>
                        {saldoPositivo ? <ArrowUpRight size={24} strokeWidth={2} /> : <ArrowDownRight size={24} strokeWidth={2} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Saldo Neto</div>
                        <div className={`text-2xl font-black ${saldoPositivo ? 'text-emerald-600' : 'text-red-500'}`}>
                          S/ {fmt(Number(cierre.saldo_cierre))}
                        </div>
                      </div>
                    </div>

                    {/* Información detallada principal */}
                    <div className="space-y-0 mb-8">
                      <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar size={16} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Fecha de Cierre</div>
                          <div className="text-sm font-semibold text-[#1B2E4B] dark:text-white break-words">
                            {formatFecha(cierre.fecha_cierre)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          <User size={16} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Responsable</div>
                          <div className="text-sm font-semibold text-[#1B2E4B] dark:text-white break-words uppercase">
                            {cierre.usuario ? `${cierre.usuario.nombre} ${cierre.usuario.apellido}` : '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Activity size={16} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Movimientos Registrados</div>
                          <div className="text-sm font-semibold text-[#1B2E4B] dark:text-white break-words">
                            {cierre.movimientos_cerrados}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desglose por Caja */}
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard size={16} />
                        Desglose por Caja
                      </h3>
                      <div className="space-y-3">
                        {cierre.cajas?.map((c, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-[#1A2837] border border-slate-100 dark:border-[#1E2D3D] rounded-xl p-4">
                            <h4 className="text-sm font-bold text-[#1B2E4B] dark:text-white mb-3 uppercase tracking-wide border-b border-slate-200 dark:border-[#2A3B4D] pb-2">
                              {c.caja}
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ingresos</p>
                                <p className="text-sm font-black text-emerald-600 flex items-center gap-1">
                                  <TrendingUp size={12} /> +S/ {fmt(Number(c.total_ingresos))}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Egresos</p>
                                <p className="text-sm font-black text-red-500 flex items-center gap-1">
                                  <TrendingDown size={12} /> -S/ {fmt(Number(c.total_egresos))}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-[#1B2E4B] dark:text-slate-400 uppercase tracking-wider mb-0.5">Saldo</p>
                                <p className="text-sm font-black text-[#1B2E4B] dark:text-white">
                                  S/ {fmt(Number(c.saldo_cierre))}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {(!cierre.cajas || cierre.cajas.length === 0) && (
                          <p className="text-sm text-center text-slate-500 py-4">No hay detalles de caja disponibles.</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white dark:bg-surface-dim rounded-b-2xl flex items-center justify-center gap-4 shrink-0 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setExpandedId(null)}
                className="px-8 py-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[160px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Delete Confirmation Modal */}
      {deleteId && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] border border-[#E2E8F0] dark:border-[#1E2D3D] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Cierre</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Está seguro de eliminar este cierre?
              <br/><span className="text-xs">Esta acción solo lo ocultará de esta vista (Modo Administrador).</span>
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
