import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts';
import { useToast } from '../../components/Toast/ToastContext';
import { MovimientoService, type Movimiento } from '../../features/movimientos/services/MovimientoService';
import { TipoComprobanteService, type TipoComprobante } from '../../features/movimientos/services/TipoComprobanteService';
import { CajaService, type Caja } from '../../features/cajas/services/CajaService';
import { EmpresaService, type Empresa } from '../../features/empresas/services/EmpresaService';
import { 
  PlusCircle, 
  FileText, 
  Search, 
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Pagination } from '../../components/Pagination';

export const CajeroMovimientosPage: React.FC = () => {
  const { user } = useAuth();
  const jwt = user?.token || localStorage.getItem('auth_token') || '';
  const { showToast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const [cajas, setCajas] = useState<Caja[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [tiposComprobante, setTiposComprobante] = useState<TipoComprobante[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  // Form State
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cajaId, setCajaId] = useState<number | ''>('');
  const [tipoMovimiento, setTipoMovimiento] = useState<boolean>(true); // true = INGRESO
  const [monto, setMonto] = useState<string>('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoComprobanteId, setTipoComprobanteId] = useState<number | ''>('');
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [serie, setSerie] = useState('');
  const [correlativo, setCorrelativo] = useState('');
  
  const [empresaBuscada, setEmpresaBuscada] = useState<Empresa | null>(null);

  const [movimientoToEdit, setMovimientoToEdit] = useState<Movimiento | null>(null);
  const [movimientoToView, setMovimientoToView] = useState<Movimiento | null>(null);
  const [movimientoToDelete, setMovimientoToDelete] = useState<Movimiento | null>(null);
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);

  // Filters
  const [filterCaja, setFilterCaja] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (jwt) {
      loadData();
    }
  }, [user?.sedeId]);

  const loadData = async () => {
    try {
      const [resCajas, resEmpresas, resTipos, resMovs] = await Promise.all([
        user?.sedeId 
          ? CajaService.getCajasSedeSaldosById(jwt, user.sedeId) 
          : CajaService.getCajasSedeSaldos(jwt),
        EmpresaService.getEmpresas(jwt),
        TipoComprobanteService.getTiposComprobante(jwt),
        user?.sedeId 
          ? MovimientoService.getMovimientosBySede(jwt, user.sedeId) 
          : MovimientoService.getMovimientos(jwt)
      ]);

      if (resCajas.success && resCajas.data) setCajas(resCajas.data.filter(c => c.estado));
      if (resEmpresas.success && resEmpresas.data) setEmpresas(resEmpresas.data.filter(e => e.estado));
      // Show ALL tipos comprobante — handle estado as boolean or number (1/0)
      if (resTipos.success) {
        const rawTipos = (resTipos as any).data;
        const tiposArr: TipoComprobante[] = Array.isArray(rawTipos)
          ? rawTipos
          : Array.isArray(rawTipos?.data)
          ? rawTipos.data
          : [];
        setTiposComprobante(tiposArr);

        // Default: select 'S/N COMPROBANTE' if present
        const sn = tiposArr.find((t: TipoComprobante) => t.nombre.includes('S/N') || t.id === 3);
        if (sn) setTipoComprobanteId(sn.id);
      }
      // Guard: ensure movimientos is always an array
      if (resMovs.success) {
        const raw = (resMovs as any).data;
        const arr = Array.isArray(raw) 
          ? raw 
          : Array.isArray(raw?.data) 
            ? raw.data 
            : Array.isArray((resMovs as any).movimientos)
              ? (resMovs as any).movimientos
              : Array.isArray(raw?.movimientos)
                ? raw.movimientos
                : [];
        setMovimientos(arr);
      } else {
        console.error('API Error for Movimientos:', resMovs);
        showToast('error', 'Error API Movimientos', resMovs.message || 'La API devolvió success: false');
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Error cargando los datos');
    }
  };

  const handleRucSearch = async () => {
    if (ruc.length < 8) return;
    
    // Primero buscar en las empresas existentes
    const existing = empresas.find(e => e.ruc === ruc);
    if (existing) {
      setRazonSocial(existing.razon_social);
      showToast('success', 'Empresa encontrada', 'Datos cargados desde base de datos');
      return;
    }

    // Si no, buscar en API externa (Reniec/Sunat)
    showToast('info', 'Buscando RUC...', 'Consultando SUNAT');
    const res = await EmpresaService.consultarDocumento(ruc);
    if (res.success && res.razon_social) {
      setRazonSocial(res.razon_social);
      showToast('success', 'SUNAT/RENIEC', 'Datos obtenidos correctamente');
    } else {
      showToast('error', res.message || 'No se encontraron datos');
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaId || !monto || !descripcion || !tipoComprobanteId) {
      showToast('error', 'Campos requeridos', 'Completa todos los campos obligatorios del formulario');
      return;
    }

    const selectedCaja = cajas.find(c => c.id === Number(cajaId));
    if (!tipoMovimiento && selectedCaja && Number(monto) > Number(selectedCaja.saldo)) {
      showToast('error', 'Saldo insuficiente', 'La caja no tiene saldo suficiente para realizar este egreso');
      return;
    }

    const tipoSel = tiposComprobante.find(t => t.id === Number(tipoComprobanteId));
    const nombreTipo = tipoSel?.nombre.toUpperCase() || '';

    if (nombreTipo.includes('FACTURA')) {
      if (!ruc || !razonSocial || !serie || !correlativo) {
        showToast('error', 'Datos incompletos', 'Para FACTURA son obligatorios: RUC, Razón Social, Serie y Correlativo');
        return;
      }
    } else if (nombreTipo.includes('BOLETA')) {
      if (!serie || !correlativo) {
        showToast('error', 'Datos incompletos', 'Para BOLETA son obligatorios: Serie y Correlativo');
        return;
      }
    }

    setIsConfirmingSubmit(true);
  };

  const executeSubmit = async () => {
    setIsConfirmingSubmit(false);
    let currentEmpresaId = empresaBuscada?.id;

    // Si hay RUC pero no empresaBuscada, significa que la encontró en SUNAT pero no existe en BD
    if (ruc && !currentEmpresaId && razonSocial) {
      const resCrear = await EmpresaService.createEmpresa(jwt, {
        ruc,
        razon_social: razonSocial,
        direccion: '-',
        color: '#ccc'
      });
      if (resCrear.success && resCrear.data) {
        currentEmpresaId = resCrear.data.id;
        // Actualizar lista local
        setEmpresas([...empresas, resCrear.data]);
      }
    }

    const currentUsuarioSedeId = user?.usuarioSedeId || Number(localStorage.getItem('usuario_sede_id')) || undefined;

    const payload: Omit<Movimiento, 'id' | 'estado'> = {
      empresa_id: currentEmpresaId,
      usuario_sede_id: currentUsuarioSedeId,
      caja_id: Number(cajaId),
      tipo_comprobante_id: Number(tipoComprobanteId),
      tipo_movimiento: tipoMovimiento,
      monto: Number(monto),
      descripcion,
      ruc: ruc || undefined,
      razon_social: razonSocial || undefined,
      serie: serie || undefined,
      correlativo: correlativo || undefined,
      fecha: fecha || undefined,
      updated_at: movimientoToEdit ? (fecha || undefined) : undefined
    };

    let res;
    if (movimientoToEdit && movimientoToEdit.id) {
      res = await MovimientoService.updateMovimiento(jwt, movimientoToEdit.id, payload);
    } else {
      res = await MovimientoService.createMovimiento(jwt, payload);
    }

    if (res.success) {
      showToast('success', movimientoToEdit ? 'Movimiento actualizado' : 'Movimiento registrado', 'El movimiento fue guardado correctamente');
      handleResetForm();
      loadData();
    } else {
      showToast('error', res.message || 'Error registrando movimiento');
    }
  };

  const handleResetForm = () => {
    setMovimientoToEdit(null);
    setMonto('');
    setDescripcion('');
    setRuc('');
    setRazonSocial('');
    setSerie('');
    setCorrelativo('');
    setFecha(new Date().toISOString().split('T')[0]);
    setEmpresaBuscada(null);
  };

  const handleEditClick = (mov: Movimiento) => {
    setMovimientoToEdit(mov);
    
    // 1. Resolver Caja
    const resolvedCajaId = mov.caja_id || cajas.find(c => c.nombre === (mov as any).caja)?.id || '';
    setCajaId(resolvedCajaId);
    
    // 2. Resolver Empresa
    const resolvedEmpresa = empresas.find(e => e.id === mov.empresa_id) || empresas.find(e => e.razon_social === (mov as any).empresa);
    setEmpresaBuscada(resolvedEmpresa || null);
    
    setTipoMovimiento(mov.tipo_movimiento);
    setMonto(mov.monto.toString());
    setDescripcion(mov.descripcion);
    
    // 3. Resolver Tipo Comprobante
    const resolvedTipoId = mov.tipo_comprobante_id || tiposComprobante.find(t => t.nombre === (mov as any).tipo_comprobante)?.id || '';
    setTipoComprobanteId(resolvedTipoId);
    
    setRuc(mov.factura?.ruc || mov.ruc || '');
    setRazonSocial(mov.factura?.razon_social || mov.razon_social || '');
    setSerie(mov.factura?.serie || mov.boleta?.serie || mov.serie || '');
    setCorrelativo(mov.factura?.correlativo || mov.boleta?.correlativo || mov.correlativo || '');
    
    // Set fecha
    const rawFecha = mov.fecha || (mov as any).created_at;
    if (rawFecha) {
      setFecha(rawFecha.split('T')[0]);
    }

    // Scroll al formulario suave de múltiples formas para asegurar que funcione sin importar quién tiene el overflow
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!movimientoToDelete || !movimientoToDelete.id) return;
    const res = await MovimientoService.deleteMovimiento(jwt, movimientoToDelete.id);
    if (res.success) {
      showToast('success', 'Movimiento eliminado', 'Se revirtió el efecto en la caja correctamente.');
      setMovimientoToDelete(null);
      loadData();
    } else {
      showToast('error', res.message || 'Error al eliminar el movimiento');
    }
  };

  // Helper para mostrar campos según comprobante seleccionado
  const tipoSeleccionado = tiposComprobante.find(t => t.id === Number(tipoComprobanteId));
  const requiresRuc = tipoSeleccionado?.nombre.toUpperCase().includes('FACTURA');
  const requiresSerie = tipoSeleccionado?.nombre.toUpperCase().includes('FACTURA') || tipoSeleccionado?.nombre.toUpperCase().includes('BOLETA');

  // Stats computation
  const selectedCaja = cajas.find(c => c.id === Number(cajaId));
  let ingresosMes = 0;
  let egresosMes = 0;
  
  if (cajaId) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    movimientos.forEach(m => {
      // Comparar meses
      const movDate = (m.fecha || new Date().toISOString()).substring(0, 7);
      if (m.caja_id === Number(cajaId) && movDate === currentMonth) {
        if (m.tipo_movimiento) ingresosMes += Number(m.monto);
        else egresosMes += Number(m.monto);
      }
    });
  }

  // Dynamic Chart Data Computation
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

  // 1. Data Semanal (Ingresos vs Egresos globales por día)
  const chartDataSemanal = last7Days.map(dateStr => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const name = daysOfWeek[dateObj.getDay()];
    
    let ingresos = 0;
    let egresos = 0;
    
    movimientos.forEach(mov => {
      const mDate = (mov.fecha || (mov as any).created_at || '').split('T')[0];
      if (mDate === dateStr) {
        if (mov.tipo_movimiento) ingresos += Number(mov.monto);
        else egresos += Number(mov.monto);
      }
    });
    
    return { name, ingresos, egresos };
  });

  // Table Filtering logic
  const filteredMovimientos = movimientos.filter(mov => {
    // 1. Filter by Caja
    if (filterCaja !== 'all' && mov.caja_id.toString() !== filterCaja) {
      return false;
    }
    
    // 2. Filter by Search Term (Concepto/Descripción, RUC, Razón Social)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDescripcion = mov.descripcion?.toLowerCase().includes(term);
      const matchRuc = mov.ruc?.toLowerCase().includes(term);
      const matchRazonSocial = mov.razon_social?.toLowerCase().includes(term);
      const matchSerieCorrelativo = (mov.serie || '').toLowerCase().includes(term) || (mov.correlativo || '').toLowerCase().includes(term);
      
      if (!matchDescripcion && !matchRuc && !matchRazonSocial && !matchSerieCorrelativo) {
        return false;
      }
    }
    
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredMovimientos.length / itemsPerPage);
  const currentMovs = filteredMovimientos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--sidebar-text-hover)] flex items-center gap-3">
          Gestión de Movimientos
        </h1>
        <p className="text-sm text-[var(--sidebar-text)] mt-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C4933F]"></span>
          Operaciones de Caja y Registro de Transacciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM */}
        <div ref={formRef} className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 dark:border-[var(--sidebar-border)]">
          <div className="p-5 border-b border-gray-100 dark:border-[var(--sidebar-border)] flex items-center gap-2">
            {movimientoToEdit ? <Edit2 className="text-[#C4933F]" size={20} /> : <PlusCircle className="text-[#C4933F]" size={20} />}
            <h2 className="font-bold text-[var(--sidebar-text-hover)] text-sm uppercase tracking-wide">
              {movimientoToEdit ? `Editando Operación #${movimientoToEdit.id}` : 'Nuevo Registro de Operación'}
            </h2>
          </div>
          
          <form onSubmit={handlePreSubmit} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Fecha de Registro</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg pl-3 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Caja Origen/Destino</label>
                <div className="relative">
                  <select 
                    value={cajaId}
                    onChange={(e) => setCajaId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] appearance-none"
                    required
                  >
                    <option value="" disabled>Seleccionar Cuenta...</option>
                    {cajas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-[var(--sidebar-text)] pointer-events-none" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Empresa Relacionada</label>
                <div className="relative">
                  <select
                    value={empresaBuscada?.id || ''}
                    onChange={(e) => {
                      const emp = empresas.find(em => em.id === Number(e.target.value));
                      // Solo guarda el vínculo con la empresa — NO toca el RUC del comprobante
                      setEmpresaBuscada(emp || null);
                    }}
                    className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg pl-3 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] appearance-none truncate"
                  >
                    <option value="">Seleccionar Empresa...</option>
                    {empresas.map(emp => {
                      const displayText = `${emp.razon_social} (${emp.ruc})`;
                      return (
                        <option key={emp.id} value={emp.id} title={displayText}>
                          {displayText.length > 55 ? displayText.substring(0, 55) + '...' : displayText}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-[var(--sidebar-text)] pointer-events-none" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Tipo de Operación</label>
                <div className="flex rounded-lg overflow-hidden border border-[var(--sidebar-border)]">
                  <button 
                    type="button"
                    onClick={() => setTipoMovimiento(true)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${tipoMovimiento ? 'bg-white dark:bg-[#2a3042] text-[#C4933F] border-b-2 border-[#C4933F]' : 'bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]'}`}
                  >
                    INGRESO
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTipoMovimiento(false)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${!tipoMovimiento ? 'bg-white dark:bg-[#2a3042] text-blue-600 border-b-2 border-blue-600' : 'bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]'}`}
                  >
                    EGRESO
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Importe (S/)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--sidebar-text)]">S/</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg pl-8 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] font-medium"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Concepto o Detalle</label>
                <input 
                  type="text" 
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Pago de servicios básicos del mes..."
                  className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)]"
                  required
                />
              </div>
            </div>

            {/* Documentación de respaldo */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Documentación de Respaldo</label>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase">Requerido</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {tiposComprobante.map(tipo => {
                  const isSelected = Number(tipoComprobanteId) === tipo.id;
                  let title = tipo.nombre;
                  let subtitle = '';
                  
                  if (tipo.nombre.includes('S/N')) { title = 'Sin Sustento'; subtitle = 'INTERNO'; }
                  if (tipo.nombre.includes('BOLETA')) { title = 'Recibo / Boleta'; subtitle = 'SIMPLE'; }
                  if (tipo.nombre.includes('FACTURA')) { title = 'Factura'; subtitle = 'CON RUC'; }

                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setTipoComprobanteId(tipo.id)}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                        isSelected 
                          ? 'border-[#C4933F] bg-[#C4933F]/5' 
                          : 'border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] hover:border-[#C4933F]/50'
                      }`}
                    >
                      <span className={`text-sm font-semibold ${isSelected ? 'text-[#C4933F]' : 'text-[var(--sidebar-text-hover)]'}`}>{title}</span>
                      <span className="text-[10px] text-[var(--sidebar-text)] mt-0.5">{subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos condicionales de comprobante */}
            {(requiresSerie || requiresRuc) && (
              <div className="bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] p-4 rounded-lg space-y-4 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#C4933F]"></div>
                
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-[var(--sidebar-text-hover)] uppercase flex items-center gap-2">
                    <FileText size={14} /> Detalles del Comprobante
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-2">
                  {requiresSerie && (
                    <div className={`flex gap-3 ${requiresRuc ? 'md:col-span-4' : 'md:col-span-12'}`}>
                      <div className="w-1/3 space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Serie *</label>
                        <input 
                          type="text" 
                          value={serie}
                          onChange={(e) => setSerie(e.target.value.toUpperCase())}
                          placeholder="F001"
                          className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] transition-all"
                        />
                      </div>
                      <div className="w-2/3 space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Nº Correlativo *</label>
                        <input 
                          type="text" 
                          value={correlativo}
                          onChange={(e) => setCorrelativo(e.target.value)}
                          placeholder="000001"
                          className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {requiresRuc && (
                    <div className={`flex gap-3 ${requiresSerie ? 'md:col-span-8' : 'md:col-span-12'}`}>
                      <div className="w-[40%] space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-wider">RUC Emisor *</label>
                        <div className="relative flex">
                          <input 
                            type="text"
                            value={ruc}
                            onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleRucSearch();
                              }
                            }}
                            placeholder="20123456789"
                            className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-l-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] font-mono tracking-wider transition-all"
                          />
                          <button 
                            type="button"
                            onClick={handleRucSearch}
                            className="bg-[#C4933F] hover:bg-[#A87A30] text-white px-3 flex items-center justify-center rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#C4933F] focus:ring-offset-1"
                            title="Buscar en SUNAT (Enter)"
                          >
                            <Search size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                      <div className="w-[60%] space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-wider">Razón Social *</label>
                        <input 
                          type="text"
                          value={razonSocial}
                          onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                          placeholder="EMPRESA SAC..."
                          className="w-full bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#C4933F] focus:border-transparent outline-none text-[var(--sidebar-text-hover)] uppercase transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-[var(--sidebar-border)] flex gap-3">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-[#C4933F] hover:bg-[#A87A30] text-white py-3 rounded-lg font-bold transition-all shadow-md active:scale-[0.98]"
              >
                <PlusCircle size={18} />
                <span>{movimientoToEdit ? 'Guardar Cambios' : 'Registrar Operación'}</span>
              </button>
              {movimientoToEdit && (
                <button 
                  type="button"
                  onClick={handleResetForm}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* STATS & CHARTS */}
        <div className="space-y-6">
          {/* Card Estadísticas */}
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[220px] relative transition-all duration-300">
            {!cajaId ? (
              <div className="text-center opacity-60 p-6 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-50 dark:bg-[#1a1f2e] rounded-xl flex items-center justify-center mx-auto mb-4 border border-[var(--sidebar-border)] shadow-sm">
                  <FileText className="text-[var(--sidebar-text)]" size={28} />
                </div>
                <h3 className="text-lg font-bold text-[var(--sidebar-text-hover)] mb-1">Sin Selección</h3>
                <p className="text-xs text-[var(--sidebar-text)] max-w-[200px] mx-auto">
                  Por favor, elija una caja en el formulario para visualizar los indicadores de saldo.
                </p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col p-6 relative animate-fade-in" style={{ backgroundColor: `${selectedCaja?.color || '#C4933F'}08` }}>
                {/* Top colored accent line */}
                <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: selectedCaja?.color || '#C4933F' }}></div>
                
                <div className="text-center mb-6 mt-2">
                  <h3 className="text-2xl font-black tracking-tight mb-2" style={{ color: selectedCaja?.color || '#1B2E4B' }}>{selectedCaja?.nombre}</h3>
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-[#121622] px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-[#1E2D3D]">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Actual</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white">S/ {Number(selectedCaja?.saldo ?? 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Estadísticas Rápidas (Este Mes)</h4>
                
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center p-3.5 bg-emerald-50/80 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 hover:scale-[1.02] transition-transform">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Ingresos</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">+S/ {ingresosMes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3.5 bg-rose-50/80 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:scale-[1.02] transition-transform">
                    <span className="text-sm font-bold text-rose-800 dark:text-rose-400">Egresos</span>
                    <span className="font-black text-rose-600 dark:text-rose-400 text-base">-S/ {egresosMes.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-bold text-[var(--sidebar-text)] uppercase tracking-widest">
                  Análisis Semanal
                </h3>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 192 }}>
              <ResponsiveContainer width="100%" height={192} minWidth={1} minHeight={1}>
                <AreaChart data={chartDataSemanal}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.15} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--sidebar-border)', backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text-hover)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="ingresos" 
                    name="Ingresos" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorIngresos)" 
                    strokeWidth={2.5} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="egresos" 
                    name="Egresos" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorEgresos)" 
                    strokeWidth={2.5} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA AUDITORIA */}
      <div className="bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-[var(--sidebar-border)] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8">
        <div className="p-5 border-b border-[var(--sidebar-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#C4933F] rounded-full"></div>
            <h2 className="font-bold text-[var(--sidebar-text-hover)] text-lg">Auditoría de Movimientos</h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={filterCaja}
              onChange={(e) => { setFilterCaja(e.target.value); setCurrentPage(1); }}
              className="bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] text-[var(--sidebar-text-hover)] text-xs rounded-md px-3 py-2 outline-none focus:border-[#C4933F]"
            >
              <option value="all">Todas las Cajas</option>
              {cajas.map(c => <option key={c.id} value={c.id.toString()}>{c.nombre}</option>)}
            </select>
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2 text-[var(--sidebar-text)]" size={14} />
              <input 
                type="text" 
                placeholder="Buscar por concepto..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] rounded-md outline-none focus:border-[#C4933F]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121622] text-white text-[10px] uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Caja</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold min-w-[200px]">Concepto</th>
                <th className="p-4 font-semibold text-right">Monto</th>
                <th className="p-4 font-semibold text-center">Comprobante</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sidebar-border)] text-sm">
              {currentMovs.length > 0 ? currentMovs.map((mov) => {
                const caja = cajas.find(c => c.id === mov.caja_id);
                const isIngreso = mov.tipo_movimiento;
                
                const rawFecha = mov.fecha || (mov as any).created_at;
                let displayFecha = '-';
                if (rawFecha) {
                  const rawFechaStr = rawFecha.split('T')[0];
                  const [y, m, d] = rawFechaStr.split('-');
                  displayFecha = y && m && d 
                    ? new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                    : new Date(rawFecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                }

                return (
                  <tr key={mov.id || Math.random()} className="hover:bg-[var(--sidebar-hover)] transition-colors group">
                    <td className="p-4">
                      <div className="font-semibold text-[var(--sidebar-text-hover)]">{displayFecha}</div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border`}
                           style={{ borderColor: `${caja?.color || '#C4933F'}30`, color: caja?.color || '#C4933F', backgroundColor: `${caja?.color || '#C4933F'}10` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: caja?.color || '#C4933F' }}></span>
                        {caja?.nombre || (mov as any).caja || (mov.caja_id ? `Caja #${mov.caja_id}` : 'Caja Principal')}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isIngreso ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {isIngreso ? 'INGRESO' : 'EGRESO'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--sidebar-text-hover)] font-medium text-xs truncate max-w-[250px]" title={mov.descripcion}>
                        {mov.descripcion}
                      </p>
                    </td>
                    <td className="p-4 text-right font-bold">
                      <span className={isIngreso ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {isIngreso ? '+' : '-'}S/ {Number(mov.monto).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {mov.tipo_comprobante_id || (mov as any).tipo_comprobante ? (
                        <div className="text-[10px]">
                          <span className="font-bold text-[var(--sidebar-text-hover)] uppercase">
                            {tiposComprobante.find(t => t.id === mov.tipo_comprobante_id)?.nombre || (mov as any).tipo_comprobante || 'DOC'}
                          </span>
                          {(mov.serie || mov.correlativo) && (
                            <div className="text-[#C4933F]">{mov.serie}-{mov.correlativo}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--sidebar-text)]">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setMovimientoToView(mov)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Ver Detalle">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEditClick(mov)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setMovimientoToDelete(mov)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--sidebar-text)]">
                    No se encontraron movimientos registrados.
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
          totalItems={movimientos.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Submit Confirmation Modal */}
      {isConfirmingSubmit && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] w-[420px] max-w-[95vw] rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400">
              <CheckCircle2 size={28} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-[22px] font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
              {movimientoToEdit ? 'Actualizar Operación' : 'Registrar Operación'}
            </h3>
            
            <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              ¿Está seguro que desea {movimientoToEdit ? 'actualizar' : 'registrar'} la operación por un monto de <strong className="text-slate-700 dark:text-slate-200">S/ {Number(monto).toFixed(2)}</strong>?
            </p>
            
            <div className="flex gap-4 w-full">
              <button 
                type="button"
                onClick={() => setIsConfirmingSubmit(false)}
                className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-[15px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Revisar de nuevo
              </button>
              <button 
                type="button"
                onClick={executeSubmit}
                className="flex-1 py-3 px-4 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-xl text-[15px] font-bold transition-colors shadow-sm"
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {movimientoToDelete && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#16212E] border border-[#E2E8F0] dark:border-[#1E2D3D] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Trash2 className="text-red-600 dark:text-red-400" size={22} />
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">Eliminar Movimiento</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              ¿Eliminar el {movimientoToDelete.tipo_movimiento ? 'ingreso' : 'egreso'} por <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">S/ {Number(movimientoToDelete.monto).toFixed(2)}</strong>?
              <br/><span className="text-xs">Se revertirá automáticamente el saldo de la caja.</span>
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setMovimientoToDelete(null)}
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Detail Modal */}
      {movimientoToView && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setMovimientoToView(null)}>
          <div
            className="bg-white dark:bg-[#16212E] w-[500px] max-w-[90vw] rounded-2xl shadow-2xl relative flex flex-col border border-slate-200 dark:border-[#1E2D3D] animate-fade-in"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-6 py-5 rounded-t-2xl flex items-center justify-between border-b ${movimientoToView.tipo_movimiento ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-100 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-900/15 border-red-100 dark:border-red-900/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${movimientoToView.tipo_movimiento ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                  {movimientoToView.tipo_movimiento ? <TrendingUp size={22} strokeWidth={2} /> : <TrendingDown size={22} strokeWidth={2} />}
                </div>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${movimientoToView.tipo_movimiento ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
                    {movimientoToView.tipo_movimiento ? 'INGRESO' : 'EGRESO'}
                  </span>
                  <div className="text-lg font-black text-slate-800 dark:text-white mt-0.5">
                    {movimientoToView.tipo_movimiento ? '+' : '-'}S/ {Number(movimientoToView.monto).toFixed(2)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMovimientoToView(null)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha de Registro</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {(() => {
                      if (!movimientoToView.fecha) return '-';
                      const [y, m, d] = movimientoToView.fecha.split('-');
                      const dateStr = (y && m && d) 
                        ? new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                        : new Date(movimientoToView.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                      return `${dateStr}${movimientoToView.hora ? ` a las ${movimientoToView.hora}` : ''}`;
                    })()}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empresa</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={movimientoToView.empresa || ''}>
                    {movimientoToView.empresa || 'Sin empresa'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Caja</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{cajas.find(c => c.id === movimientoToView.caja_id)?.nombre || movimientoToView.caja || `Caja #${movimientoToView.caja_id}`}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comprobante</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{tiposComprobante.find(t => t.id === movimientoToView.tipo_comprobante_id)?.nombre || movimientoToView.tipo_comprobante || 'DOC'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">RUC</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{movimientoToView.factura?.ruc || movimientoToView.ruc || '-'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Serie / Correlativo</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {(movimientoToView.factura?.serie || movimientoToView.boleta?.serie || movimientoToView.serie) || (movimientoToView.factura?.correlativo || movimientoToView.boleta?.correlativo || movimientoToView.correlativo) 
                      ? `${movimientoToView.factura?.serie || movimientoToView.boleta?.serie || movimientoToView.serie || '-'} - ${movimientoToView.factura?.correlativo || movimientoToView.boleta?.correlativo || movimientoToView.correlativo || '-'}` 
                      : '-'}
                  </p>
                </div>
              </div>
              
              {(movimientoToView.factura?.razon_social || movimientoToView.razon_social) && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Razón Social</label>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{movimientoToView.factura?.razon_social || movimientoToView.razon_social}</p>
                </div>
              )}
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</label>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{movimientoToView.descripcion || 'Sin información'}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Responsable</label>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {movimientoToView.usuario ? `${movimientoToView.usuario.nombre} ${movimientoToView.usuario.apellido}` : (movimientoToView.usuario_id ? `Usuario ID: ${movimientoToView.usuario_id}` : 'No registrado')}
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
