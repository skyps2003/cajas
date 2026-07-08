// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Download, Loader2, Calendar, MoreVertical, ShieldAlert,
  ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronLeft, ChevronRight, Search, Building2, Users, Wallet, Archive, X
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, YAxis, Legend, CartesianGrid, Tooltip as RechartsTooltip, XAxis, AreaChart, Area, LineChart 
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { reportesService } from '../../services/reportesService';
import type { DashboardPrincipal, DashboardMensual, RankingEmpresa, RankingUsuario, AlertaCaja } from '../../services/dashboardService';
import { movimientoService } from '../../services/movimientoService';
import type { MovimientoResponse } from '../../services/movimientoService';
import { useAuth } from '../../contexts/AuthContext';
import { CajaService } from '../../features/cajas/services/CajaService';
import { sedeService } from '../../services/sedeService';
import papelMembretado from '../../assets/PDF/Papel Membretado Estudio El Asesor.png';
import { contribuyenteService } from '../../services/contribuyenteService';
import { getUpcomingDeadlines } from '../../utils/sunatSchedule';

export const CajeroDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const upcomingDeadlines = getUpcomingDeadlines();

  // Datos Reales
  const [principal, setPrincipal] = useState<DashboardPrincipal | null>(null);
  const [mensual, setMensual] = useState<DashboardMensual[]>([]);
  const [empresas, setEmpresas] = useState<RankingEmpresa[]>([]);
  const [usuarios, setUsuarios] = useState<RankingUsuario[]>([]);
  const [alertas, setAlertas] = useState<AlertaCaja[]>([]);
  const [transacciones, setTransacciones] = useState<MovimientoResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [allTransacciones, setAllTransacciones] = useState<any[]>([]);
  
  // Datos Reales Avanzados
  const [distSedes, setDistSedes] = useState<any[]>([]);
  const [distCajas, setDistCajas] = useState<any[]>([]);
  const [distEmpresas, setDistEmpresas] = useState<any[]>([]);
  const [distContribuyentesTipo, setDistContribuyentesTipo] = useState<any[]>([]);
  const [distContribuyentesTerminal, setDistContribuyentesTerminal] = useState<any[]>([]);
  const [cajasMaster, setCajasMaster] = useState<any[]>([]);
  const [sedesMaster, setSedesMaster] = useState<any[]>([]);
  const [estadoCajaTab, setEstadoCajaTab] = useState<'general' | 'sede'>('general');
  const [estadoCajaSede, setEstadoCajaSede] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const [chartViewMode, setChartViewMode] = useState<'historico' | 'mensual'>('historico');
  const [expandedChart, setExpandedChart] = useState<'flujo' | 'cajas' | null>(null);
  const [saldoHoy, setSaldoHoy] = useState({ ingresos: 0, egresos: 0, total: 0, variacion: 0 });

  const COLORS_SEDES = ['#1A1E38', '#C4933F', '#cfdaf1', '#10b981'];
  const COLORS_CAJAS = ['#1A1E38', '#cfdaf1', '#C4933F', '#475569'];
  const COLORS_EMPRESAS = ['#3b82f6', '#ca8a04', '#22c55e', '#ef4444', '#8b5cf6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--sidebar-bg)] text-[var(--sidebar-text-hover)] text-xs px-3 py-2 rounded shadow-lg border border-[var(--sidebar-border)]">
          <p className="font-bold">{`${payload[0].name}: S/ ${Number(payload[0].value).toLocaleString('en-US', {minimumFractionDigits: 2})}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--sidebar-bg)] text-[var(--sidebar-text-hover)] text-xs px-3 py-2 rounded shadow-lg border border-[var(--sidebar-border)]">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-[#C4933F]">{`Flujo Neto: S/ ${Number(payload[0].value).toLocaleString('en-US', {minimumFractionDigits: 2})}`}</p>
        </div>
      );
    }
    return null;
  };

  const CountTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--sidebar-bg)] text-[var(--sidebar-text-hover)] text-xs px-3 py-2 rounded shadow-lg border border-[var(--sidebar-border)]">
          <p className="font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (allTransacciones.length === 0) return;

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const strSelected = formatDate(selectedDate);
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const strYesterday = formatDate(yesterday);

    let tIngHoy = 0, tEgHoy = 0, tIngAyer = 0, tEgAyer = 0;
    allTransacciones.forEach((t: any) => {
      const upDate = t.fecha || (t.updated_at ? t.updated_at.split('T')[0] : '');
      const amt = Number(t.monto) || 0;
      if (upDate === strSelected) {
        if (t.tipo_movimiento === 1 || t.tipo_movimiento === true) tIngHoy += amt;
        else tEgHoy += amt;
      } else if (upDate === strYesterday) {
        if (t.tipo_movimiento === 1 || t.tipo_movimiento === true) tIngAyer += amt;
        else tEgAyer += amt;
      }
    });

    const tHoy = tIngHoy - tEgHoy;
    const tAyer = tIngAyer - tEgAyer;
    let variacion = 0;
    if (tAyer !== 0) {
      variacion = ((tHoy - tAyer) / Math.abs(tAyer)) * 100;
    } else if (tHoy > 0) {
      variacion = 100;
    }

    setSaldoHoy({ ingresos: tIngHoy, egresos: tEgHoy, total: tHoy, variacion });

    const filteredTx = [...allTransacciones].filter((t: any) => {
      const upDate = t.fecha || (t.updated_at ? t.updated_at.split('T')[0] : '');
      return upDate === strSelected;
    }).sort((x: any, y: any) => y.id - x.id);
    
    setTransacciones(filteredTx.slice(0, 10));
  }, [selectedDate, allTransacciones]);

  useEffect(() => {
    if (!user?.token) return;

    const fetchAdvancedData = async () => {
      try {
        setLoading(true);

        if (!user.sedeId) {
          console.error('El usuario no tiene una sede asignada');
          setLoading(false);
          return;
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        const strToday = formatDate(today);
        const strYesterday = formatDate(yesterday);

        // Fetch only the Sede's movimientos and Cajas
        const [
          tx,
          cajas
        ] = await Promise.all([
          movimientoService.getMovimientosBySede(user?.token || '', user.sedeId),
          CajaService.getCajasSedeSaldosById(user?.token || '', user.sedeId)
        ]);

        let transaccionesData: any[] = [];
        if (tx.success && tx.data) {
          transaccionesData = tx.data;
          setAllTransacciones(tx.data);
        }

        // Calculate Principal
        let tIngresos = 0, tEgresos = 0;
        transaccionesData.forEach(t => {
          const amt = Number(t.monto) || 0;
          if (t.tipo_movimiento === 1 || t.tipo_movimiento === true) {
            tIngresos += amt;
          } else {
            tEgresos += amt;
          }
        });
        
        // Calculate Cajas Dist (for this sede only)
        const cajasData = cajas.success && cajas.data ? cajas.data : [];
        setCajasMaster(cajasData);
        
        // Calculate Cajas Dist using the actual saldo from the backend
        const cDist = cajasData.map((c: any) => ({
          name: c.nombre,
          value: Number(c.saldo) || 0,
          fill: c.color || '#C4933F'
        })).filter((c: any) => c.value > 0);
        
        setDistCajas(cDist);

        setPrincipal({
          totalIngresos: tIngresos,
          totalEgresos: tEgresos,
          saldoGeneral: tIngresos - tEgresos,
          totalMovimientos: transaccionesData.length,
          totalUsuarios: new Set(transaccionesData.map(t => t.usuario?.id).filter(Boolean)).size,
          totalCajas: cDist.length,
          totalEmpresas: new Set(transaccionesData.map(t => t.empresa_id).filter(Boolean)).size
        } as any);

        // Calculate Mensual
        const mensualMap = new Map<string, {ingresos: number, egresos: number}>();
        transaccionesData.forEach(t => {
          const dateStr = t.fecha || (t.updated_at ? t.updated_at.split('T')[0] : '');
          if (!dateStr) return;
          const monthKey = dateStr.substring(0, 7); // YYYY-MM
          if (!mensualMap.has(monthKey)) mensualMap.set(monthKey, {ingresos: 0, egresos: 0});
          const m = mensualMap.get(monthKey)!;
          const amt = Number(t.monto) || 0;
          if (t.tipo_movimiento === 1 || t.tipo_movimiento === true) m.ingresos += amt;
          else m.egresos += amt;
        });
        const monthNamesArr = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mensualArr = Array.from(mensualMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([key, vals]) => {
          const monthNum = parseInt(key.substring(5, 7), 10);
          return {
            mes: monthNamesArr[monthNum - 1],
            ingresos: vals.ingresos,
            egresos: vals.egresos
          };
        });
        setMensual(mensualArr);

        // Ranking Empresas
        const empMap = new Map<string, number>();
        transaccionesData.forEach(t => {
           if (!t.empresa) return;
           empMap.set(t.empresa, (empMap.get(t.empresa) || 0) + 1);
        });
        setEmpresas(Array.from(empMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([nombre, movs]) => ({ nombre, movimientos: movs })));

        // Ranking Usuarios
        const usrMap = new Map<string, number>();
        transaccionesData.forEach(t => {
           if (!t.usuario?.nombre) return;
           const name = t.usuario.nombre + ' ' + (t.usuario.apellido || '');
           usrMap.set(name, (usrMap.get(name) || 0) + 1);
        });
        setUsuarios(Array.from(usrMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([nombre, movs]) => ({ nombre, movimientos: movs })));

        // Alertas Cajas
        const alertasArr: any[] = [];
        cajasData.forEach((c: any) => {
          const saldo = Number(c.saldo) || 0;
          if (c.monto_min !== null && saldo < c.monto_min) {
            alertasArr.push({ caja: c.nombre, saldo, monto_min: c.monto_min, alerta: 'Por debajo del mínimo' });
          } else if (c.monto_max !== null && saldo > c.monto_max) {
             alertasArr.push({ caja: c.nombre, saldo, monto_max: c.monto_max, alerta: 'Excede el máximo' });
          }
        });
        setAlertas(alertasArr);

        setSedesMaster([]); // Not needed
        setLoading(false);

        // Parse Empresas Dist (filtered by sede)
        const eMap = new Map<string, { total_ingresos: number, total_egresos: number, color?: string }>();
        transaccionesData.forEach((t: any) => {
          if (!t.empresa) return;
          if (!eMap.has(t.empresa)) {
            eMap.set(t.empresa, { total_ingresos: 0, total_egresos: 0 });
          }
          const emp = eMap.get(t.empresa)!;
          const monto = Number(t.monto) || 0;
          if (t.tipo_movimiento === 1 || t.tipo_movimiento === true) {
            emp.total_ingresos += monto;
          } else {
            emp.total_egresos += monto;
          }
        });
        const eDist = Array.from(eMap.entries()).map(([name, data], idx) => {
          return {
            name,
            value: data.total_ingresos - data.total_egresos,
            fill: data.color || COLORS_EMPRESAS[idx % COLORS_EMPRESAS.length]
          };
        }).filter((e: any) => e.value > 0);
        setDistEmpresas(eDist);

        // Fetch Contribuyentes and parse them
        try {
          const resContribuyentes = await contribuyenteService.getAll(user?.token || '');
          const cList = resContribuyentes.filter(c => c.id_sede === user.sedeId);
          let nat = 0, jur = 0;
          const terminalCounts: Record<string, number> = {};

          cList.forEach((c: any) => {
            if (c.tipo_ruc === 1 || (c.tipo_ruc == null && c.ruc && c.ruc.startsWith('20'))) jur++; else nat++;
            const term = c.ruc ? c.ruc.slice(-1) : 'N/A';
            terminalCounts[term] = (terminalCounts[term] || 0) + 1;
          });

          if (nat > 0 || jur > 0) {
            setDistContribuyentesTipo([
              ...(nat > 0 ? [{ name: 'Persona Natural', value: nat, fill: '#3b82f6' }] : []),
              ...(jur > 0 ? [{ name: 'Persona Jurídica', value: jur, fill: '#8b5cf6' }] : [])
            ]);
          }

          const terminalColors = ['#e11d48', '#d97706', '#65a30d', '#059669', '#0891b2', '#2563eb', '#7c3aed', '#c026d3', '#475569', '#1A1E38', '#94a3b8'];
          const tDistArr = Object.keys(terminalCounts).sort().map((k, idx) => ({
            name: `Terminal ${k}`,
            value: terminalCounts[k],
            fill: terminalColors[idx % terminalColors.length]
          })).filter(t => t.value > 0);
          setDistContribuyentesTerminal(tDistArr);
        } catch (error) {
          console.error('Error fetching contribuyentes for charts:', error);
        }

      } catch (error) {
        console.error('Error fetching dashboard advanced data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvancedData();
  }, [user?.token]);

  const handleExportExcel = async (isDaily = false) => {
    setIsExportMenuOpen(false);
    try {
      let txsToExport = allTransacciones;
      if (isDaily) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const targetDate = `${year}-${month}-${day}`;
        txsToExport = allTransacciones.filter(tx => tx.fecha === targetDate);
      } else {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const targetMonth = `${year}-${month}`;
        txsToExport = allTransacciones.filter(tx => (tx.fecha || '').startsWith(targetMonth));
      }
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(isDaily ? 'Caja Diaria' : 'Caja Mensual', { views: [{ showGridLines: false }] });

      // Column widths
      sheet.columns = [
        { width: 15 }, // A: FECHA / Nro.
        { width: 15 }, // B: SEDE
        { width: 30 }, // C: CONCEPTO / Tipo de Caja
        { width: 12 }, // D: CÓDIGO
        { width: 25 }, // E: N° RECIBO
        { width: 15 }, // F: ENTRADAS
        { width: 15 }, // G: SALIDAS
        { width: 15 }, // H: SALDO
        { width: 5 },  // I: (espaciador)
        { width: 15 }, // J: (Derecha - Sede)
        { width: 30 }, // K: (Derecha - Tipos de caja)
        { width: 15 }, // L: (Derecha - Saldo)
      ];

      // --- SECTION 1: Tipos de Caja (Top Left) ---
      sheet.getCell('A1').value = 'Liste los Tipos de Caja';
      sheet.getCell('A1').font = { italic: true, color: { argb: 'FF808080' } };
      
      const headerCajasStyle = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } },
        font: { bold: true, color: { argb: 'FF00B050' } },
        alignment: { horizontal: 'center' }
      } as any;

      sheet.getCell('A2').value = 'Nro.';
      sheet.mergeCells('B2:C2');
      sheet.getCell('B2').value = 'Tipo de Caja';
      sheet.getCell('A2').style = headerCajasStyle;
      sheet.getCell('B2').style = headerCajasStyle;

      const cajasUnicas = Array.from(new Set(txsToExport.map(t => t.caja).filter(Boolean)));
      cajasUnicas.forEach((caja, index) => {
        const row = 3 + index;
        sheet.getCell(`A${row}`).value = String(index + 1).padStart(3, '0');
        sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
        sheet.mergeCells(`B${row}:C${row}`);
        sheet.getCell(`B${row}`).value = caja;
        sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
      });

      // --- SECTION 2: Saldos a mantener (Top Center) ---
      sheet.getCell('D1').value = 'Ingrese los saldos a mantener en caja';
      sheet.getCell('D1').font = { italic: true, color: { argb: 'FF808080' } };
      
      sheet.getCell('D2').value = 'Mínimo:';
      sheet.getCell('D2').font = { bold: true, color: { argb: 'FF00B050' } };
      sheet.getCell('D2').alignment = { horizontal: 'right' };
      sheet.getCell('D2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      
      sheet.getCell('E2').value = 500;
      sheet.getCell('E2').numFmt = '"S/" #,##0.00';
      
      sheet.getCell('D3').value = 'Máximo:';
      sheet.getCell('D3').font = { bold: true, color: { argb: 'FF00B050' } };
      sheet.getCell('D3').alignment = { horizontal: 'right' };
      sheet.getCell('D3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      
      sheet.getCell('E3').value = 10000;
      sheet.getCell('E3').numFmt = '"S/" #,##0.00';

      // --- SECTION 3: Saldo Total (Top Right) ---
      sheet.mergeCells('J2:L2');
      const saldoTotalCell = sheet.getCell('J2');
      saldoTotalCell.value = 'SALDO TOTAL DE CAJA       S/ ' + Number(saldoTotal).toLocaleString('en-US', {minimumFractionDigits: 2});
      saldoTotalCell.font = { bold: true, color: { argb: 'FF00B050' } };
      saldoTotalCell.alignment = { horizontal: 'center' };
      saldoTotalCell.border = {
        top: { style: 'thin', color: { argb: 'FFED7D31' } },
        left: { style: 'thin', color: { argb: 'FFED7D31' } },
        bottom: { style: 'thin', color: { argb: 'FFED7D31' } },
        right: { style: 'thin', color: { argb: 'FFED7D31' } },
      };

      sheet.mergeCells('J3:L3');
      const saldoMinimo = 500;
      if (saldoTotal < saldoMinimo) {
        sheet.getCell('J3').value = `La caja es inferior a su mínimo tolerable en un monto equivalente a ${saldoMinimo - saldoTotal}`;
      } else {
        sheet.getCell('J3').value = 'La caja se encuentra dentro del rango permitido.';
      }
      sheet.getCell('J3').font = { italic: true, size: 10 };
      sheet.getCell('J3').alignment = { horizontal: 'center' };

      // Calculate totals per Sede + Caja
      const sedeCajaTotals = new Map<string, { sede: string, caja: string, total: number }>();
      txsToExport.forEach(tx => {
        if (!tx.caja) return;
        const sede = tx.sede || 'Sin Sede';
        const key = `${sede}|${tx.caja}`;
        const monto = Number(tx.monto || 0);
        
        if (!sedeCajaTotals.has(key)) {
          sedeCajaTotals.set(key, { sede, caja: tx.caja, total: 0 });
        }
        
        const entry = sedeCajaTotals.get(key)!;
        if (tx.tipo_movimiento) {
          entry.total += monto;
        } else {
          entry.total -= monto;
        }
      });

      // Table "SEDE", "TIPO DE CAJA", "SALDO"
      sheet.getCell('J5').value = 'SEDE';
      sheet.getCell('K5').value = 'TIPO DE CAJA';
      sheet.getCell('L5').value = 'SALDO';
      sheet.getCell('J5').style = headerCajasStyle;
      sheet.getCell('K5').style = headerCajasStyle;
      sheet.getCell('L5').style = headerCajasStyle;
      
      let rightRow = 6;
      const sortedSedeCajas = Array.from(sedeCajaTotals.values()).sort((a, b) => a.sede.localeCompare(b.sede) || a.caja.localeCompare(b.caja));
      
      sortedSedeCajas.forEach(entry => {
        sheet.getCell(`J${rightRow}`).value = entry.sede;
        sheet.getCell(`K${rightRow}`).value = 'Saldo en ' + entry.caja;
        sheet.getCell(`L${rightRow}`).value = entry.total;
        sheet.getCell(`L${rightRow}`).numFmt = '"S/" #,##0.00';
        
        ['J', 'K', 'L'].forEach(col => {
          sheet.getCell(`${col}${rightRow}`).border = {
            top: { style: 'dotted', color: { argb: 'FF808080' } },
            left: { style: 'dotted', color: { argb: 'FF808080' } },
            bottom: { style: 'dotted', color: { argb: 'FF808080' } },
            right: { style: 'dotted', color: { argb: 'FF808080' } },
          };
        });
        sheet.getCell(`J${rightRow}`).alignment = { horizontal: 'center' };
        sheet.getCell(`K${rightRow}`).alignment = { horizontal: 'center' };
        rightRow++;
      });

      // --- SECTION 4: Movimientos Diarios ---
      const startRowMov = Math.max(cajasUnicas.length + 5, 10);
      sheet.getCell(`A${startRowMov - 1}`).value = 'Ingrese los movimientos de caja diarios';
      sheet.getCell(`A${startRowMov - 1}`).font = { italic: true, color: { argb: 'FF808080' } };

      const headersMov = ['FECHA', 'SEDE', 'CONCEPTO', 'CÓDIGO', 'N° RECIBO', 'ENTRADAS', 'SALIDAS', 'SALDO'];
      headersMov.forEach((h, i) => {
        const col = String.fromCharCode(65 + i);
        const cell = sheet.getCell(`${col}${startRowMov}`);
        cell.value = h;
        cell.font = { bold: true, color: { argb: h === 'SALDO' ? 'FFFFFFFF' : 'FF00B050' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: h === 'SALDO' ? 'FF00B050' : 'FFFFF2CC' } };
        cell.alignment = { horizontal: 'center' };
      });

      let currentSaldo = 0;
      let movRow = startRowMov + 1;
      
      const sortedTxs = [...txsToExport].sort((a, b) => new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime());
      
      sortedTxs.forEach((tx) => {
        const row = sheet.getRow(movRow);
        row.getCell(1).value = tx.fecha ? tx.fecha.split('-').reverse().join('/') : '';
        row.getCell(2).value = tx.sede || 'Sin Sede';
        row.getCell(3).value = tx.descripcion || '';
        
        const cajaIndex = cajasUnicas.indexOf(tx.caja);
        row.getCell(4).value = cajaIndex >= 0 ? String(cajaIndex + 1).padStart(3, '0') : '';
        row.getCell(4).alignment = { horizontal: 'center' };
        
        row.getCell(5).value = tx.tipo_comprobante ? `${tx.tipo_comprobante} ${tx.serie ? tx.serie + '-' + tx.correlativo : ''}` : '';
        
        const monto = Number(tx.monto || 0);
        if (tx.tipo_movimiento) {
          row.getCell(6).value = monto;
          currentSaldo += monto;
        } else {
          row.getCell(7).value = monto;
          currentSaldo -= monto;
        }
        row.getCell(6).numFmt = '"S/" #,##0.00';
        row.getCell(7).numFmt = '"S/" #,##0.00';
        
        row.getCell(8).value = currentSaldo;
        row.getCell(8).numFmt = '"S/" #,##0.00';
        
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
        row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1DE' } };
        
        movRow++;
      });

      sheet.spliceRows(1, 0, []);
      sheet.mergeCells('A1:L1');
      const sedeStr = user?.sede ? user.sede.toUpperCase() : '';
      const tipoStr = isDaily ? 'DIARIA' : 'MENSUAL';
      const titleCell = sheet.getCell('A1');
      titleCell.value = `CAJA ${tipoStr} ESTUDIO CONTABLE CPCC ( EL ASESOR ) ${sedeStr}`;
      titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const todayStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Reporte_${isDaily ? 'DIARIO' : 'MENSUAL'}_${user?.sede?.toUpperCase() || 'SEDE'}_${todayStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generando Excel:', error);
    }
  };

  const handleExportPDF = async (isDaily = false) => {
    setIsExportMenuOpen(false);
    try {
      let txsToExport = allTransacciones;
      if (isDaily) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const targetDate = `${year}-${month}-${day}`;
        txsToExport = allTransacciones.filter(tx => tx.fecha === targetDate);
      } else {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const targetMonth = `${year}-${month}`;
        txsToExport = allTransacciones.filter(tx => (tx.fecha || '').startsWith(targetMonth));
      }
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
      doc.text(isDaily ? 'Reporte Diario' : 'Reporte Mensual', pageWidth / 2, 145, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      
      doc.text(`SEDE: ${user?.sede?.toUpperCase() || 'MI SEDE'}`, pageWidth / 2, 160, { align: 'center' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(40, 180, pageWidth - 40, 180);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('RESUMEN OPERATIVO', 40, 195);

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('FECHA DEL REPORTE', 40, 220);
      
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
      
      const dateText = isDaily
        ? `${selectedDate.getDate().toString().padStart(2, '0')} DE ${monthNames[selectedDate.getMonth()]} DE ${selectedDate.getFullYear()}`
        : `DEL 01 DE ${monthNames[selectedDate.getMonth()]} AL ${new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()} DE ${monthNames[selectedDate.getMonth()]} DE ${selectedDate.getFullYear()}`;
      
      doc.text(dateText, 40, 235);

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('REGISTROS', pageWidth / 2, 220, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 138);
      doc.text(`${txsToExport.length} registros`, pageWidth / 2, 235, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('SALDO NETO', pageWidth - 40, 220, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(0, 176, 80);
      doc.text(`S/ ${Number(saldoTotal).toLocaleString('en-US', {minimumFractionDigits: 2})}`, pageWidth - 40, 235, { align: 'right' });

      let totalIngresos = 0;
      let totalEgresos = 0;
      txsToExport.forEach(tx => {
        if (tx.tipo_movimiento) totalIngresos += Number(tx.monto || 0);
        else totalEgresos += Number(tx.monto || 0);
      });

      doc.setFontSize(7);
      doc.setTextColor(0, 176, 80);
      doc.text(`(+) INGRESOS: S/ ${totalIngresos.toLocaleString('en-US', {minimumFractionDigits: 2})}`, 40, 250);
      
      doc.setTextColor(255, 0, 0);
      doc.text(`(-) EGRESOS: S/ ${totalEgresos.toLocaleString('en-US', {minimumFractionDigits: 2})}`, pageWidth - 40, 250, { align: 'right' });

      const sortedTxs = [...txsToExport].sort((a, b) => new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime());
      
      let currentSaldo = 0;
      const tableData = sortedTxs.map(tx => {
        const monto = Number(tx.monto || 0);
        if (tx.tipo_movimiento) currentSaldo += monto;
        else currentSaldo -= monto;

        const dateStr = tx.fecha ? tx.fecha.split('-').reverse().join('/') : '';
        const dateCell = dateStr;

        return [
          dateCell,
          tx.sede || '-',
          tx.caja || '-',
          tx.tipo_movimiento ? 'INGRESO' : 'EGRESO',
          tx.descripcion || '-',
          `S/ ${monto.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
          `S/ ${currentSaldo.toLocaleString('en-US', {minimumFractionDigits: 2})}`
        ];
      });

      autoTable(doc, {
        startY: 270,
        head: [['Fecha', 'Sede', 'Caja / Cuenta', 'Tipo', 'Concepto / Detalle', 'Monto', 'Saldo']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 6,
          textColor: [80, 80, 80],
          cellPadding: 4,
          lineWidth: { bottom: 0.1 },
          lineColor: { bottom: [200, 200, 200] } as any
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 50 },
          1: { halign: 'center', cellWidth: 85 },
          2: { halign: 'center', cellWidth: 70 },
          3: { halign: 'center', cellWidth: 45 },
          4: { halign: 'left' },
          5: { halign: 'right', cellWidth: 60 },
          6: { halign: 'right', cellWidth: 60 },
        },
        margin: { top: 150, bottom: 150 },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 3) {
            if (data.cell.raw === 'INGRESO') {
              data.cell.styles.textColor = [0, 176, 80];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [255, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      try {
        const html2canvas = (await import('html2canvas')).default;
        const lineChartsElement = document.getElementById('charts-line');
        const pieChartsElement = document.getElementById('charts-pie');
        
        if (lineChartsElement && pieChartsElement && !isDaily) {
          doc.addPage();
          
          // Capturar y añadir Gráficos de Línea
          const canvasLine = await html2canvas(lineChartsElement, { scale: 2, backgroundColor: '#ffffff' });
          const imgLine = canvasLine.toDataURL('image/png');
          const lineProps = doc.getImageProperties(imgLine);
          const pdfWidth = pageWidth - 80;
          const linePdfHeight = (lineProps.height * pdfWidth) / lineProps.width;
          
          doc.addImage(imgLine, 'PNG', 40, 80, pdfWidth, linePdfHeight);
          
          // Capturar y añadir Gráficos de Torta
          const canvasPie = await html2canvas(pieChartsElement, { scale: 2, backgroundColor: '#ffffff' });
          const imgPie = canvasPie.toDataURL('image/png');
          const pieProps = doc.getImageProperties(imgPie);
          const piePdfHeight = (pieProps.height * pdfWidth) / pieProps.width;
          
          const nextY = 100 + linePdfHeight + 40;
          doc.text('DISTRIBUCIÓN DE CAPITAL REAL', pageWidth / 2, nextY, { align: 'center' });
          doc.addImage(imgPie, 'PNG', 40, nextY + 20, pdfWidth, piePdfHeight);
        }
      } catch (e) {
        console.error('Error adjuntando gráficos al PDF', e);
      }

      const todayStr = new Date().toISOString().split('T')[0];
      doc.save(`Reporte_${isDaily ? 'DIARIO' : 'MENSUAL'}_${user?.sede?.toUpperCase() || 'SEDE'}_${todayStr}.pdf`);


    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 w-full space-y-6 animate-pulse">
        {/* HEADER SKELETON */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-md"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800/50 rounded-md"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800/50 rounded-xl"></div>
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800/50 rounded-xl"></div>
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800/50 rounded-xl hidden md:block"></div>
          </div>
        </div>

        {/* ROW 1: TOP CARDS SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800/50 rounded-lg"></div>
            </div>
            <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
              <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
              <div className="h-2 w-5/6 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800/50 rounded-lg"></div>
            </div>
            <div className="space-y-5 mt-6">
               <div className="flex justify-between items-center"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div></div>
               <div className="flex justify-between items-center"><div className="h-4 w-40 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div></div>
               <div className="flex justify-between items-center"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div></div>
            </div>
          </div>
        </div>

        {/* ROW 2: CHARTS SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-3xl p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
               <div className="flex gap-2">
                 <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
                 <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div>
               </div>
            </div>
            <div className="flex-1 w-full flex items-end gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-800/50 rounded-t-md" style={{height: `${Math.max(20, Math.random() * 80)}%`}}></div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-3xl p-6 h-[400px] flex flex-col items-center justify-center">
             <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/50 rounded-full mb-8 self-start"></div>
             <div className="w-56 h-56 rounded-full border-[20px] border-slate-100 dark:border-slate-800/30"></div>
             <div className="mt-8 flex justify-center gap-6 w-full">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800/50"></div><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800/50"></div><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/50 rounded-full"></div></div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Preparamos datos históricos para el gráfico a partir de transacciones reales
  const flowMap = new Map();
  const cajasFlowMap = new Map();
  const cajasUnicas = new Map<string, string>();

  let startDate = new Date();
  let endDate = new Date();
  
  if (chartViewMode === 'historico') {
    if (allTransacciones.length > 0) {
      const dates = allTransacciones.map(tx => {
        if (tx.fecha) {
           const [y, m, d_] = tx.fecha.split('-');
           return new Date(Number(y), Number(m) - 1, Number(d_)).getTime();
        }
        return new Date(tx.updated_at || new Date()).getTime();
      });
      startDate = new Date(Math.min(...dates));
      endDate = new Date(Math.max(...dates, new Date().getTime()));
    }
  } else {
    // Mensual
    const currentMonth = calendarViewDate.getMonth();
    const currentYear = calendarViewDate.getFullYear();
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 0); // Last day of month
  }

  // Ensure start is before or equal to end
  if (startDate > endDate) startDate = new Date(endDate);

  // Set hours to 0 to avoid skipping days or DST issues
  startDate.setHours(0,0,0,0);
  endDate.setHours(0,0,0,0);

  // Generate all days in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayStr = d.getDate().toString().padStart(2, '0');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const yearStr = d.getFullYear().toString().substring(2);
    const nameStr = `${dayStr}/${monthStr}/${yearStr}`;
    const timeKey = d.getTime();

    flowMap.set(nameStr, {
      name: nameStr,
      flujo: 0,
      sortKey: timeKey
    });

    cajasFlowMap.set(nameStr, {
      name: nameStr,
      sortKey: timeKey
    });
  }

  allTransacciones.forEach(tx => {
    if (!tx.fecha) return;
    const [y, m, d] = tx.fecha.split('-');
    
    const txDate = new Date(Number(y), Number(m) - 1, Number(d));
    
    if (chartViewMode === 'mensual') {
      const currentMonth = calendarViewDate.getMonth();
      const currentYear = calendarViewDate.getFullYear();
      if (txDate.getMonth() !== currentMonth || txDate.getFullYear() !== currentYear) {
        return;
      }
    }
    
    // Procesar todos los registros que pasen el filtro
    const nameStr = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.substring(2)}`;
    const monto = Number(tx.monto) || 0;
    const isIngreso = tx.tipo_movimiento === 1 || tx.tipo_movimiento === true;
    const neto = isIngreso ? monto : -monto;

    // 1. Flujo General
    const current = flowMap.get(nameStr);
    if (current) {
      current.flujo += neto;
    }

    // 2. Movimientos por Cajas
    const cajaName = tx.caja || 'Otros';
    const cajaColor = tx.caja_color || '#8b5cf6';
    if (!cajasUnicas.has(cajaName)) {
      cajasUnicas.set(cajaName, cajaColor);
    }

    const currentCaja = cajasFlowMap.get(nameStr);
    if (currentCaja) {
      if (currentCaja[cajaName] === undefined) currentCaja[cajaName] = 0;
      currentCaja[cajaName] += neto;
    }
  });

  const chartDataMensual = Array.from(flowMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  const chartDataCajas = Array.from(cajasFlowMap.values()).sort((a, b) => a.sortKey - b.sortKey);

  // Acumulamos el flujo día a día para que se vea la evolución
  let accFlujo = 0;
  chartDataMensual.forEach(day => {
    accFlujo += day.flujo;
    day.flujo = accFlujo;
  });

  const accCajas: Record<string, number> = {};
  cajasUnicas.forEach((_, cajaName) => {
    accCajas[cajaName] = 0;
  });

  chartDataCajas.forEach(day => {
    cajasUnicas.forEach((_, cajaName) => {
      if (day[cajaName] === undefined) day[cajaName] = 0;
      accCajas[cajaName] += day[cajaName];
      day[cajaName] = accCajas[cajaName];
    });
  });

  const arrayCajas = Array.from(cajasUnicas.entries()).map(([name, color]) => ({ name, color }));

  const totalCajas = principal?.totalCajas || 0;
  const saldoTotal = distCajas.reduce((acc, c) => acc + (Number(c.value) || 0), 0);

  const renderCalendar = () => {
    const currentMonth = calendarViewDate.getMonth();
    const currentYear = calendarViewDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center text-slate-500 text-xs py-1.5"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = d === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
      days.push(
        <div key={`day-${d}`} 
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth, d))}
          className={`text-center text-xs py-1.5 rounded border ${isSelected ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-200 dark:border-slate-200 dark:text-slate-900 font-semibold shadow-sm' : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#121622] hover:border-gray-200 dark:hover:border-[var(--sidebar-border)] cursor-pointer transition-all'}`}>
          {d}
        </div>
      );
    }

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return (
      <div className="bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-[var(--sidebar-border)] rounded-xl p-6 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100 dark:border-[var(--sidebar-border)]">
            <div className="relative inline-block">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {monthNames[currentMonth]} {currentYear}
                <ChevronDown size={14} className="text-slate-400" />
              </h3>
              <input 
                type="month"
                value={`${currentYear}-${(currentMonth+1).toString().padStart(2,'0')}`}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {
                    // Fallback para navegadores antiguos
                  }
                }}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m] = e.target.value.split('-');
                    setCalendarViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCalendarViewDate(new Date(currentYear, currentMonth - 1, 1))}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <Calendar size={18} className="text-slate-400" />
              <button 
                onClick={() => setCalendarViewDate(new Date(currentYear, currentMonth + 1, 1))}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
              <div key={day} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-5">
            {days}
          </div>
        </div>
        <div className="flex flex-col border border-gray-200 dark:border-[var(--sidebar-border)] rounded-lg overflow-hidden bg-white dark:bg-[#1a1f2e]">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-[var(--sidebar-border)] hover:bg-slate-50/50 dark:hover:bg-[#121622] transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ingresos del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">S/ {saldoHoy.ingresos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-[var(--sidebar-border)] hover:bg-slate-50/50 dark:hover:bg-[#121622] transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Egresos del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}</span>
            <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">S/ {saldoHoy.egresos.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-[#121622]">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Balance Neto</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">S/ {saldoHoy.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => handleExportExcel(true)} className="flex-1 py-2.5 text-xs font-semibold bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors flex justify-center items-center gap-1 shadow-sm">
            <Download size={14} /> Excel Día
          </button>
          <button onClick={() => handleExportPDF(true)} className="flex-1 py-2.5 text-xs font-semibold bg-rose-50 text-rose-600 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors flex justify-center items-center gap-1 shadow-sm">
            <Download size={14} /> PDF Día
          </button>
        </div>
      </div>
    );
  };

  const filteredTransacciones = allTransacciones.filter(tx => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    
    // Construct derived fields for accurate searching
    const fechaFormatted = tx.fecha?.split('-').reverse().join('/') || '';
    const comprobanteFull = `${tx.tipo_comprobante || ''} ${tx.serie ? `${tx.serie}-${tx.correlativo}` : ''}`.trim();
    const tipoStr = tx.tipo_movimiento ? 'ingreso' : 'egreso';
    const montoStr = tx.monto ? Number(tx.monto).toLocaleString() : '';

    return (
      tx.descripcion?.toLowerCase().includes(lowerTerm) || 
      tx.empresa?.toLowerCase().includes(lowerTerm) ||
      tx.caja?.toLowerCase().includes(lowerTerm) ||
      tx.sede?.toLowerCase().includes(lowerTerm) ||
      tx.nombre?.toLowerCase().includes(lowerTerm) ||
      tx.apellido?.toLowerCase().includes(lowerTerm) ||
      tx.usuario?.nombre?.toLowerCase().includes(lowerTerm) ||
      tx.usuario?.apellido?.toLowerCase().includes(lowerTerm) ||
      comprobanteFull.toLowerCase().includes(lowerTerm) ||
      fechaFormatted.includes(lowerTerm) ||
      tipoStr.includes(lowerTerm) ||
      montoStr.includes(lowerTerm) ||
      String(tx.monto || '').includes(lowerTerm)
    );
  }).sort((a: any, b: any) => {
    const dateA = new Date(a.fecha || a.updated_at || 0).getTime();
    const dateB = new Date(b.fecha || b.updated_at || 0).getTime();
    // Sort descending (newest first). If dates are equal, sort by id descending.
    if (dateB === dateA) {
      return (b.id || 0) - (a.id || 0);
    }
    return dateB - dateA;
  });

  return (
    <div className="p-4 sm:p-6 w-full space-y-4 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--sidebar-text-hover)] tracking-tight">Panel de Cajero</h1>
          <p className="text-sm text-[var(--sidebar-text)] font-medium mt-1">Monitoreo en tiempo real de liquidez y auditoría.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <button 
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-2 bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] text-[var(--sidebar-text-hover)] px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[var(--sidebar-hover)] transition-all shadow-sm"
            >
              <Download size={16} />
              Exportar
              <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-xl shadow-lg z-50 overflow-hidden">
                <button onClick={() => handleExportExcel(false)} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-[#121622] text-[var(--sidebar-text-hover)] font-semibold border-b border-gray-100 dark:border-[var(--sidebar-border)] transition-colors">
                  Exportar a Excel (.xlsx)
                </button>
                <button onClick={() => handleExportPDF(false)} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-[#121622] text-[var(--sidebar-text-hover)] font-semibold transition-colors">
                  Exportar a PDF
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SUNAT ALERTS */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start gap-4 mb-6">
          <div className="bg-rose-100 dark:bg-rose-800/50 p-2.5 rounded-xl flex-shrink-0 mt-1">
            <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-base font-bold text-rose-800 dark:text-rose-300 mb-1 flex items-center gap-2">
              Vencimientos SUNAT - Periodo {upcomingDeadlines[0].periodo}
              <span className="bg-rose-200 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200 text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider">Atención</span>
            </h3>
            <p className="text-sm text-rose-700 dark:text-rose-400/80 mb-3 font-medium">
              Recuerda realizar las declaraciones antes de las siguientes fechas límite según el último dígito del RUC:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {upcomingDeadlines.map((d, i) => (
                <div key={i} className="bg-white/80 dark:bg-[#1a1f2e]/80 backdrop-blur-sm border border-rose-100 dark:border-rose-800/30 rounded-lg p-2 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-rose-500/80 dark:text-rose-400/80 uppercase tracking-widest">{d.digitos === 'Buenos Contrib.' ? 'BUENOS C.' : `RUC ${d.digitos}`}</span>
                  <span className="text-[13px] font-black text-rose-700 dark:text-rose-300">{d.fechaFormat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ROW 1: TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Capital Total Sede */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Capital Total Sede</h3>
            <div className="text-[#C4933F] bg-[#C4933F]/10 p-1.5 rounded-md">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-[var(--sidebar-text-hover)] mb-6">
            S/ {Number(saldoTotal).toLocaleString('en-US', {minimumFractionDigits: 2})}
          </p>
          
          <div className="space-y-4 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
            {[...distCajas].sort((a, b) => b.value - a.value).slice(0, 2).map((caja, idx) => {
              const porcentaje = saldoTotal > 0 ? ((caja.value / Number(saldoTotal)) * 100).toFixed(1) : 0;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--sidebar-text-hover)]">
                    <span className="truncate max-w-[150px]">{caja.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--sidebar-text)] font-semibold">S/ {Number(caja.value).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                      <span>{porcentaje}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--sidebar-bg)] rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${porcentaje}%`, backgroundColor: caja.fill }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saldo del Día */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Flujo Neto: {selectedDate.getDate().toString().padStart(2, '0')}/{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.getFullYear()}</h3>
            {saldoHoy.variacion >= 0 ? (
              <ArrowUpRight size={18} className="text-emerald-500" />
            ) : (
              <ArrowDownRight size={18} className="text-rose-500" />
            )}
          </div>
          <div className="mb-6">
            <p className="text-3xl font-black text-[var(--sidebar-text-hover)]">S/ {saldoHoy.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
            <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${saldoHoy.variacion >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {saldoHoy.variacion >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {saldoHoy.variacion > 0 ? '+' : ''}{saldoHoy.variacion.toFixed(1)}% vs ayer
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase">Ingresos</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">S/ {saldoHoy.ingresos.toLocaleString('en-US')}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg">
              <p className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase">Egresos</p>
              <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">S/ {saldoHoy.egresos.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: TENDENCIA Y RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tendencia de Flujo y Cajas */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Estadísticas</h3>
            <select
              value={chartViewMode}
              onChange={(e) => setChartViewMode(e.target.value as 'historico' | 'mensual')}
              className="text-[10px] font-bold text-[var(--sidebar-text)] border border-gray-100 dark:border-[var(--sidebar-border)] px-2 py-1 rounded bg-[var(--sidebar-bg)] outline-none cursor-pointer"
            >
              <option value="historico">Histórico</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          
          <div className={`grid grid-cols-1 ${expandedChart ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-12 transition-all duration-300 ${expandedChart ? 'min-h-[600px]' : 'h-[360px]'}`} id="charts-line">
            {chartDataMensual.length > 0 ? (
              <>
                {(!expandedChart || expandedChart === 'flujo') && (
                  <div 
                    className="flex flex-col h-full cursor-pointer hover:opacity-90 transition-opacity relative group" 
                    onClick={() => setExpandedChart(expandedChart === 'flujo' ? null : 'flujo')}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-widest text-center flex-1">
                        Flujo Neto {chartViewMode === 'historico' ? 'Histórico' : 'Mensual'}
                      </h4>
                      {expandedChart === 'flujo' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedChart(null); }}
                          className="absolute right-0 top-0 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 p-1.5 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <AreaChart data={chartDataMensual} margin={{ top: expandedChart ? 30 : 10, right: expandedChart ? 40 : 10, left: expandedChart ? 20 : 0, bottom: expandedChart ? 40 : 10 }}>
                        <defs>
                          <linearGradient id="colorFlujoModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray={expandedChart ? "4 4" : "3 3"} vertical={false} stroke="var(--sidebar-border)" opacity={expandedChart ? 0.4 : 0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dy={expandedChart ? 20 : 10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dx={-15} tickFormatter={(val) => `S/${val}`} />
                        <RechartsTooltip formatter={(val: any) => `S/ ${Number(val).toLocaleString('en-US', {minimumFractionDigits: 2})}`} contentStyle={expandedChart ? {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '15px', fontWeight: 'bold', borderRadius: '12px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'} : {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px'}} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: expandedChart ? '13px' : '10px', fontWeight: 'bold', paddingTop: expandedChart ? '30px' : '20px' }} />
                        <Area type="monotone" dataKey="flujo" name="Flujo Neto" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFlujoModal)" strokeWidth={expandedChart ? 4 : 3} activeDot={{ r: expandedChart ? 8 : 5, strokeWidth: 0, fill: '#3b82f6' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {(!expandedChart || expandedChart === 'cajas') && (
                  <div 
                    className="flex flex-col h-full cursor-pointer hover:opacity-90 transition-opacity relative group" 
                    onClick={() => setExpandedChart(expandedChart === 'cajas' ? null : 'cajas')}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-widest text-center flex-1">
                        Evolución por Caja
                      </h4>
                      {expandedChart === 'cajas' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedChart(null); }}
                          className="absolute right-0 top-0 text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/50 dark:hover:bg-rose-900/20 p-1.5 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <AreaChart data={chartDataCajas} margin={{ top: expandedChart ? 30 : 10, right: expandedChart ? 40 : 10, left: expandedChart ? 20 : 0, bottom: expandedChart ? 40 : 10 }}>
                        <defs>
                          {arrayCajas.map((cajaInfo, index) => (
                            <linearGradient key={`grad-${cajaInfo.name}`} id={`colorCaja-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={cajaInfo.color} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={cajaInfo.color} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray={expandedChart ? "4 4" : "3 3"} vertical={false} stroke="var(--sidebar-border)" opacity={expandedChart ? 0.4 : 0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dy={expandedChart ? 20 : 10} minTickGap={30} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: expandedChart ? 13 : 10, fill: expandedChart ? '#64748b' : '#94a3b8', fontWeight: 600 }} dx={-15} tickFormatter={(val) => `S/${val}`} />
                        <RechartsTooltip shared={false} formatter={(val: any) => `S/ ${Number(val).toLocaleString('en-US', {minimumFractionDigits: 2})}`} contentStyle={expandedChart ? {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '15px', fontWeight: 'bold', borderRadius: '12px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'} : {backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-hover)', fontSize: '12px', fontWeight: 'bold', borderRadius: '8px'}} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: expandedChart ? '13px' : '10px', fontWeight: 'bold', paddingTop: expandedChart ? '30px' : '10px' }} />
                        {arrayCajas.map((cajaInfo, index) => (
                          <Area key={cajaInfo.name} type="monotone" dataKey={cajaInfo.name} name={cajaInfo.name} stroke={cajaInfo.color} fillOpacity={1} fill={`url(#colorCaja-${index})`} strokeWidth={expandedChart ? 4 : 3} activeDot={{ r: expandedChart ? 8 : 5, strokeWidth: 0, fill: cajaInfo.color }} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--sidebar-text)] text-sm font-medium w-full col-span-1 md:col-span-2">
                Sin datos recientes
              </div>
            )}
          </div>
        </div>


      </div>

      {/* ROW 3: DISTRIBUCIÓN Y ACTIVIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribución de Capital */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Distribución de Capital Real</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 items-center" id="charts-pie">
            {/* Monto por Empresas */}
            <div className="flex flex-col items-center relative w-full">
              <h4 className="text-xs font-semibold text-[var(--sidebar-text-hover)] mb-4">Saldos por Empresas</h4>
              <div className="w-full h-[200px] relative">
                {distEmpresas.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <PieChart>
                      <Pie data={distEmpresas} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                        {distEmpresas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos de empresas</div>
                )}
              </div>
                <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
                  {distEmpresas.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-1.5" title={e.name}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: e.fill}}></span> 
                      <span className="truncate max-w-[120px]">{e.name}</span>
                    </div>
                  ))}
                </div>
            </div>

            {/* Monto por Cajas */}
            <div className="flex flex-col items-center relative w-full">
              <h4 className="text-xs font-semibold text-[var(--sidebar-text-hover)] mb-4">Saldos por Cajas</h4>
              <div className="w-full h-[200px] relative">
                {distCajas.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    <PieChart>
                      <Pie data={distCajas} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                        {distCajas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos de cajas</div>
                )}
              </div>
                <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
                  {distCajas.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-1.5" title={c.name}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: c.fill}}></span> 
                      <span className="truncate max-w-[120px]">{c.name}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

        {/* Calendario (Reemplaza al Ranking) */}
        <div className="col-span-1 h-full">
          {renderCalendar()}
        </div>



      </div>

      {/* ROW CONTRIBUYENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6">
        {/* Distribución por Tipo */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Contribuyentes por Tipo</h3>
          </div>
          <div className="flex flex-col items-center relative w-full flex-1 min-h-[200px]">
            <div className="w-full h-[200px] relative">
              {distContribuyentesTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <PieChart>
                    <Pie data={distContribuyentesTipo} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                      {distContribuyentesTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CountTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos</div>
              )}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
              {distContribuyentesTipo.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5" title={t.name}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: t.fill}}></span> 
                  <span className="truncate max-w-[120px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribución por Terminal */}
        <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Contribuyentes por Terminal</h3>
          </div>
          <div className="flex flex-col items-center relative w-full flex-1 min-h-[200px]">
            <div className="w-full h-[200px] relative">
              {distContribuyentesTerminal.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                  <PieChart>
                    <Pie data={distContribuyentesTerminal} innerRadius={60} outerRadius={80} dataKey="value" stroke="var(--sidebar-bg)" strokeWidth={3}>
                      {distContribuyentesTerminal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CountTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--sidebar-text)] font-medium">Sin datos</div>
              )}
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-3 text-[10px] font-bold text-[var(--sidebar-text)] uppercase w-full px-2">
              {distContribuyentesTerminal.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5" title={t.name}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: t.fill}}></span> 
                  <span className="truncate max-w-[120px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: MONITOREO DE CAJAS */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
          <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Estado por Caja</h3>
          
          
        </div>

        {cajasMaster.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h4 className="text-sm font-bold text-[var(--sidebar-text-hover)]">Sin cajas</h4>
            <p className="text-xs text-[var(--sidebar-text)] mt-1">No hay cajas registradas en el sistema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...cajasMaster].sort((a, b) => (a.id || 0) - (b.id || 0)).map((caja, idx) => {
              const saldoMostrar = caja.saldo;
              const isAlert = Number(saldoMostrar) < Number(caja.monto_min);
              const cajaColor = caja.color || '#C4933F';
              
              return (
                <div key={idx} className={`rounded-2xl border ${isAlert ? 'border-rose-400 dark:border-rose-500/50 bg-rose-50/30 dark:bg-rose-900/10' : 'border-gray-100 dark:border-[var(--sidebar-border)] bg-white dark:bg-[#1a1f2e]'} shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative transition-colors`}>
                  {isAlert && (
                    <div className="absolute top-5 right-5 flex items-center gap-1.5 text-rose-500">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    </div>
                  )}
                  <div className={`${isAlert ? 'border-rose-200/50 dark:border-rose-500/20' : 'bg-slate-50/50 dark:bg-[#121622] border-gray-100 dark:border-[var(--sidebar-border)]'} px-5 py-4 border-b flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cajaColor }}></span>
                      <h4 className={`text-sm font-bold ${isAlert ? 'text-rose-900 dark:text-rose-100' : 'text-[var(--sidebar-text-hover)]'}`}>{caja.nombre}</h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[var(--sidebar-text)]">Saldo Actual:</span>
                        <span className={`text-sm font-black ${isAlert ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--sidebar-text-hover)]'}`}>S/ {Number(saldoMostrar).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-[var(--sidebar-text)]">Rango Permitido:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ color: cajaColor, backgroundColor: `${cajaColor}15` }}>
                          {caja.monto_min != null && caja.monto_max != null 
                            ? `S/ ${Number(caja.monto_min).toLocaleString()} - S/ ${Number(caja.monto_max).toLocaleString()}` 
                            : 'No definido'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ROW 5: TRANSACCIONES RECIENTES */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-gray-100 dark:border-[var(--sidebar-border)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="bg-[var(--sidebar-bg)] px-5 py-4 border-b border-gray-100 dark:border-[var(--sidebar-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-widest">Transacciones Recientes</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 text-[var(--sidebar-text)]" size={14} />
            <input 
              type="text" 
              placeholder="Buscar concepto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-[var(--sidebar-border)] rounded-lg bg-white dark:bg-[#121622] focus:outline-none focus:border-[#C4933F] transition-colors text-[var(--sidebar-text-hover)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1A1E38] text-white text-[10px] uppercase tracking-wider">
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Fecha</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Comprobante</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap">Sede</th>
                <th className="px-4 py-4 font-semibold min-w-[100px]">Caja</th>
                <th className="px-4 py-4 font-semibold min-w-[150px]">Empresa</th>
                <th className="px-4 py-4 font-semibold min-w-[120px]">Responsable</th>
                <th className="px-4 py-4 font-semibold min-w-[120px]">Concepto</th>
                <th className="px-4 py-4 font-semibold text-center whitespace-nowrap">Tipo</th>
                <th className="px-4 py-4 font-semibold text-right whitespace-nowrap">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[var(--sidebar-border)] text-xs">
              {filteredTransacciones.length > 0 ? filteredTransacciones.slice(0, visibleCount).map((tx, idx) => {
                return (
                  <tr key={tx.id} className="hover:bg-[var(--sidebar-hover)] transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-[var(--sidebar-text-hover)]">{tx.fecha?.split('-').reverse().join('/') || ''}</span>
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] whitespace-nowrap">
                      {tx.tipo_comprobante || '-'} {tx.serie ? `${tx.serie}-${tx.correlativo}` : ''}
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] whitespace-nowrap">
                      {tx.sede || '-'}
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] min-w-[100px]">
                      {tx.caja || '-'}
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] min-w-[150px]">
                      <div className="line-clamp-2" title={tx.empresa || ''}>{tx.empresa || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-[var(--sidebar-text)] min-w-[120px]">
                      <div className="line-clamp-2" title={tx.nombre ? `${tx.nombre} ${tx.apellido || ''}` : (tx.usuario ? `${tx.usuario.nombre} ${tx.usuario.apellido}` : '')}>{tx.nombre ? `${tx.nombre} ${tx.apellido || ''}` : (tx.usuario ? `${tx.usuario.nombre} ${tx.usuario.apellido}` : '-')}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--sidebar-text-hover)] min-w-[120px]">
                      <div className="truncate max-w-[150px]" title={tx.descripcion || ''}>{tx.descripcion || '-'}</div>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-block w-20 border ${tx.tipo_movimiento ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800'}`}>
                        {tx.tipo_movimiento ? 'INGRESO' : 'EGRESO'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <span className={`font-black ${tx.tipo_movimiento ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.tipo_movimiento ? '+' : '-'}S/ {Math.abs(Number(tx.monto)).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-[var(--sidebar-text)] font-medium">
                    No hay transacciones que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransacciones.length > visibleCount && (
          <div className="bg-[var(--sidebar-bg)] border-t border-gray-100 dark:border-[var(--sidebar-border)] p-3 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="text-[10px] font-black text-[var(--sidebar-text)] uppercase tracking-widest hover:text-[var(--sidebar-text-hover)] transition-colors"
            >
              Cargar más transacciones
            </button>
          </div>
        )}
      </div>



    </div>
  );
};


