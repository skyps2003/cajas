import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle, CheckCircle2, } from 'lucide-react';
import { EmpresaService } from '../../../features/empresas/services/EmpresaService';
import { CajaService } from '../../../features/cajas/services/CajaService';
import type { Empresa } from '../../../features/empresas/services/EmpresaService';
import type { Caja } from '../../../features/cajas/services/CajaService';
import { tipoComprobanteService } from '../../../services/tipoComprobanteService';
import type { TipoComprobante } from '../../../services/tipoComprobanteService';
import { useAuth } from '../../../contexts/AuthContext';

interface MovimientoFormData {
  empresa_id: number;
  caja_id: number;
  tipo_comprobante_id: number;
  tipo_movimiento: boolean; // true = INGRESO, false = EGRESO
  monto: number;
  descripcion: string;
  ruc?: string;
  razon_social?: string;
  serie?: string;
  correlativo?: string;
}

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MovimientoFormData) => void;
  initialData?: any; // Para edición
}

export const MovimientoModal: React.FC<MovimientoModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [tiposComprobante, setTiposComprobante] = useState<TipoComprobante[]>([]);

  const [tipoMovimiento, setTipoMovimiento] = useState<boolean>(true); // true: INGRESO
  const [cajaId, setCajaId] = useState<number | ''>('');
  const [empresaId, setEmpresaId] = useState<number | ''>('');
  const [tipoComprobanteId, setTipoComprobanteId] = useState<number | ''>('');
  const [monto, setMonto] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [serie, setSerie] = useState('');
  const [correlativo, setCorrelativo] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && user?.token) {
      EmpresaService.getEmpresas(user.token).then(res => {
        if (res.success && res.data) setEmpresas(res.data.filter(e => e.estado));
      });
      CajaService.getCajas(user.token).then(res => {
        if (res.success && res.data) setCajas(res.data.filter(c => c.estado));
      });
      tipoComprobanteService.getTipos(user.token).then(res => {
        if (res.success && res.data) setTiposComprobante(res.data.filter(t => t.estado));
      });
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTipoMovimiento(initialData.tipo_movimiento);
        setCajaId(initialData.caja_id || '');
        setEmpresaId(initialData.empresa_id || '');
        setTipoComprobanteId(initialData.tipo_comprobante_id || 1);
        setMonto(initialData.monto || '');
        setDescripcion(initialData.descripcion || '');
        setSerie(initialData.factura?.serie || initialData.boleta?.serie || initialData.serie || '');
        setCorrelativo(initialData.factura?.correlativo || initialData.boleta?.correlativo || initialData.correlativo || '');
      } else {
        setTipoMovimiento(true);
        setCajaId('');
        setEmpresaId('');
        setTipoComprobanteId(1);
        setMonto('');
        setDescripcion('');
        setSerie('');
        setCorrelativo('');
      }
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, initialData]);

  const handlePreSave = () => {
    if (!cajaId || !empresaId || !tipoComprobanteId || !monto || !descripcion) {
      setError('Por favor, complete todos los campos obligatorios (*).');
      return;
    }
    if (Number(monto) <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    const empresaSeleccionada = empresas.find(e => e.id === Number(empresaId));
    
    const data: MovimientoFormData = {
      tipo_movimiento: tipoMovimiento,
      caja_id: Number(cajaId),
      empresa_id: Number(empresaId),
      tipo_comprobante_id: Number(tipoComprobanteId),
      monto: Number(monto),
      descripcion,
      serie,
      correlativo
    };

    if (empresaSeleccionada) {
      data.ruc = empresaSeleccionada.ruc;
      data.razon_social = empresaSeleccionada.razon_social;
    }

    onSave(data);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16212E] w-full max-w-2xl rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar">
          <div className="mb-5">
            <span className="inline-block px-2.5 py-1 bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] rounded-full text-[10px] font-bold tracking-wider mb-2.5">
              FORMULARIO DE MOVIMIENTO
            </span>
            <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
              {initialData ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}
            </h2>
            <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mt-1">
              Complete los datos del {tipoMovimiento ? 'ingreso' : 'egreso'} para actualizar la caja.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 flex gap-2.5 items-center animate-fade-in">
              <AlertCircle size={17} className="text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-xs font-medium text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-2 uppercase tracking-wide">
                Tipo de Operación *
              </label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-[#1E2D3D]">
                <button
                  onClick={() => setTipoMovimiento(true)}
                  className={`flex-1 py-2.5 text-xs font-bold tracking-wider transition-colors ${
                    tipoMovimiento
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F5F6FA] dark:bg-[#0F1E2E] text-[#6B7A94] dark:text-[#8899B4] hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  INGRESO
                </button>
                <button
                  onClick={() => setTipoMovimiento(false)}
                  className={`flex-1 py-2.5 text-xs font-bold tracking-wider transition-colors ${
                    !tipoMovimiento
                      ? 'bg-red-600 text-white'
                      : 'bg-[#F5F6FA] dark:bg-[#0F1E2E] text-[#6B7A94] dark:text-[#8899B4] hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  EGRESO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Caja de Destino / Origen *
                </label>
                <select 
                  value={cajaId}
                  onChange={(e) => setCajaId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                >
                  <option value="">-- Seleccionar Caja --</option>
                  {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Empresa / Entidad *
                </label>
                <select 
                  value={empresaId}
                  onChange={(e) => setEmpresaId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                >
                  <option value="">-- Seleccionar Empresa --</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.razon_social} ({e.ruc})</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Monto (S/) *
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5] font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Tipo de Comprobante *
                </label>
                <select 
                  value={tipoComprobanteId}
                  onChange={(e) => setTipoComprobanteId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                >
                  <option value="">-- Seleccionar Comprobante --</option>
                  {tiposComprobante.map(tc => <option key={tc.id} value={tc.id}>{tc.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Serie del Comprobante
                </label>
                <input 
                  type="text" 
                  value={serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  placeholder="Ej: F001"
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Correlativo
                </label>
                <input 
                  type="text" 
                  value={correlativo}
                  onChange={(e) => setCorrelativo(e.target.value)}
                  placeholder="Ej: 00000125"
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                Descripción / Motivo *
              </label>
              <textarea 
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle de la operación..."
                className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
          <button 
            onClick={handlePreSave}
            className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[180px]"
          >
            {initialData ? 'Actualizar Movimiento' : 'Registrar Movimiento'}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[120px]"
          >
            Cancelar
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[350px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-11 h-11 mx-auto bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={22} />
            </div>
            <h3 className="text-base font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">
              Confirmar Operación
            </h3>
            <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mb-4 leading-relaxed">
              ¿Registrar este <strong className={tipoMovimiento ? 'text-emerald-600' : 'text-red-500'}>{tipoMovimiento ? 'INGRESO' : 'EGRESO'}</strong> por un monto de <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">S/ {Number(monto).toFixed(2)}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Revisar
              </button>
              <button 
                onClick={() => { setShowConfirm(false); handleConfirmSave(); }}
                className="flex-1 py-2 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Sí, confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
