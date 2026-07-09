import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { EmpresaService } from '../../../features/empresas/services/EmpresaService';
import type { Empresa } from '../../../features/empresas/services/EmpresaService';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/Toast/ToastContext';

// ─── Paleta extendida para picker inline ────────────────────────────────────
const EXTRA_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899',
  '#dc2626','#ea580c','#ca8a04','#16a34a','#0d9488','#2563eb','#7c3aed','#db2777',
  '#1B2E4B','#C4933F','#64748b','#0f172a','#f8fafc','#475569','#94a3b8','#334155',
];

interface EmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Empresa | null;
  onSave: () => void;
}

export const EmpresaModal: React.FC<EmpresaModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('#22c55e');
  const [customColors, setCustomColors] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseColors = [
    '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#64748b', '#0f172a',
  ];

  const allColors = [...baseColors, ...customColors];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setRuc(initialData.ruc || '');
        setRazonSocial(initialData.razon_social || '');
        setDireccion(initialData.direccion || '');
        setSelectedColor(initialData.color || '#22c55e');
        if (initialData.color && !baseColors.includes(initialData.color) && !customColors.includes(initialData.color)) {
          setCustomColors(prev => [...prev, initialData.color]);
        }
      } else {
        setRuc('');
        setRazonSocial('');
        setDireccion('');
        setSelectedColor('#22c55e');
      }
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, initialData]);

  const handleSearchSunat = async () => {
    if (!ruc || (ruc.length !== 8 && ruc.length !== 11)) {
      setError('El documento debe tener 8 (DNI) o 11 (RUC) dígitos.');
      return;
    }

    setIsSearching(true);
    setError(null);
    const res = await EmpresaService.consultarDocumento(ruc);
    setIsSearching(false);

    if (res.success) {
      setRazonSocial(res.razon_social || razonSocial);
      setDireccion(res.direccion || direccion || '');
      showToast('success', 'Éxito', 'Datos obtenidos correctamente');
    } else {
      setError(res.message || 'No se encontró información para ese documento.');
    }
  };

  const handlePreCreate = () => {
    if (!ruc.trim()) {
      setError('Por favor, ingrese el RUC o DNI.');
      return;
    }
    if (ruc.trim().length !== 8 && ruc.trim().length !== 11) {
      setError('El documento debe tener 8 dígitos (DNI) o 11 dígitos (RUC).');
      return;
    }
    if (!razonSocial.trim()) {
      setError('Por favor, ingrese la Razón Social o Nombre Completo.');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    const data = {
      ruc: ruc.trim(),
      razon_social: razonSocial.trim(),
      direccion: direccion.trim(),
      color: selectedColor,
    };

    let res;
    if (initialData?.id) {
      res = await EmpresaService.updateEmpresa(user?.token || '', initialData.id, data);
    } else {
      res = await EmpresaService.createEmpresa(user?.token || '', data as Omit<Empresa, 'id' | 'estado'>);
    }

    setIsSubmitting(false);
    setShowConfirm(false);

    if (res.success) {
      showToast('success', 'Éxito', initialData ? 'Empresa actualizada correctamente' : 'Empresa registrada correctamente');
      onSave();
      onClose();
    } else {
      showToast('error', 'Error', res.message || 'Ocurrió un error al guardar');
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={20} />
        </button>

        <div className="p-8 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-[10px] font-bold tracking-wider mb-3">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              {initialData ? 'Editar Empresa' : 'Registrar Empresa'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {initialData
                ? 'Actualice los campos detallados a continuación para modificar el registro.'
                : 'Complete los campos para registrar una nueva empresa o persona natural en el sistema.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 flex gap-3 items-center animate-fade-in">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* RUC / DNI con búsqueda */}
            <div>
              <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase tracking-wide">
                RUC o DNI
              </label>
              <div className="flex border border-outline-variant rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <div className="flex-1 flex items-center bg-background px-3">
                  <Search size={16} className="text-on-surface-variant mr-2" />
                  <input
                    type="text"
                    value={ruc}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setRuc(v);
                      if (error) setError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSunat()}
                    placeholder="Ingrese 8 (DNI) u 11 (RUC) dígitos..."
                    className="w-full py-2.5 bg-transparent border-none text-sm text-on-surface focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSearchSunat}
                  disabled={isSearching || !ruc || (ruc.length !== 8 && ruc.length !== 11)}
                  className="bg-[#B47541] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#9c6030] disabled:opacity-70 transition-colors flex items-center gap-2"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSearching ? 'Buscando...' : 'Consultar'}
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1 tracking-wide">
                Consulta automática a SUNAT (RUC) o RENIEC (DNI)
              </p>
            </div>

            {/* Razón Social y Dirección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  RAZÓN SOCIAL / NOMBRE
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => {
                    setRazonSocial(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ej: Constructora ABC SAC"
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  DIRECCIÓN FISCAL
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Perú 123, Lima"
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Color de Identidad */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  COLOR DE IDENTIDAD
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: selectedColor }} />
                  <span className="text-xs font-mono text-slate-500">{selectedColor}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {allColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { setSelectedColor(color); setShowColorPicker(false); }}
                    className={`w-7 h-7 rounded-full transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-[#C4933F] scale-110 dark:ring-offset-slate-900'
                        : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => { setShowColorPicker(v => !v); setHexInput(''); }}
                  className={`w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
                    showColorPicker
                      ? 'border-[#C4933F] text-[#C4933F] bg-[#C4933F]/10'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-700'
                  }`}
                  title="Más colores"
                >
                  <Plus size={14} />
                </button>
              </div>

              {showColorPicker && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Paleta extendida</p>
                  <div className="grid grid-cols-8 gap-1.5 mb-3">
                    {EXTRA_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => { setSelectedColor(color); setShowColorPicker(false); }}
                        className={`w-full aspect-square rounded-md transition-all ${
                          selectedColor === color ? 'ring-2 ring-offset-1 ring-[#C4933F] scale-110' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" style={{ backgroundColor: hexInput.length === 7 ? hexInput : selectedColor }} />
                    <input
                      type="text"
                      maxLength={7}
                      value={hexInput}
                      onChange={e => {
                        const v = e.target.value;
                        setHexInput(v);
                        if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                          setSelectedColor(v);
                          if (!allColors.includes(v) && !EXTRA_COLORS.includes(v)) {
                            setCustomColors(prev => [...prev, v]);
                          }
                        }
                      }}
                      placeholder="#1B2E4B"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(false)}
                      className="px-3 py-1.5 bg-[#1B2E4B] text-white rounded-lg text-xs font-bold hover:bg-[#152440] transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 flex gap-3">
              <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                <span className="font-bold">Nota:</span> Toda empresa registrada estará disponible globalmente para ser asignada en las transacciones de las sedes o cajas del sistema.
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white dark:bg-surface-dim rounded-b-2xl flex items-center justify-center gap-4 shrink-0 mt-2">
          <button
            onClick={handlePreCreate}
            className="px-8 py-3.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-colors shadow-sm min-w-[200px]"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[160px]"
          >
            Descartar
          </button>
        </div>
      </div>

      {/* Modal Confirmación de Guardado */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface w-[360px] max-w-[90vw] rounded-2xl shadow-2xl p-6 text-center transform transition-all border border-outline-variant animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-50 dark:ring-green-900/10">
              <CheckCircle2 className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {initialData ? 'Actualizar Empresa' : 'Registrar Empresa'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              ¿Está seguro que desea {initialData ? 'actualizar' : 'registrar'} la empresa{' '}
              <strong>{razonSocial.toUpperCase()}</strong> (RUC/DNI: {ruc})?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-variant dark:hover:bg-slate-800 transition-colors"
              >
                Revisar de nuevo
              </button>
              <button
                onClick={handleConfirmCreate}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
