import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

// ─── Paleta extendida para picker inline ────────────────────────────────────
const EXTRA_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899',
  '#dc2626','#ea580c','#ca8a04','#16a34a','#0d9488','#2563eb','#7c3aed','#db2777',
  '#1B2E4B','#C4933F','#64748b','#0f172a','#f8fafc','#475569','#94a3b8','#334155',
];

interface BoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (box: any) => void;
  initialData?: any;
}

export const BoxModal: React.FC<BoxModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [limitMin, setLimitMin] = useState<number>(500);
  const [limitMax, setLimitMax] = useState<number>(10000);
  const [selectedColor, setSelectedColor] = useState<string>('#22c55e');
  const [customColors, setCustomColors] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState('');

  const baseColors = [
    '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#64748b', '#0f172a',
  ];

  const allColors = [...baseColors, ...customColors];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCode(initialData.code);
        setName(initialData.name);
        setLimitMin(initialData.limitMin);
        setLimitMax(initialData.limitMax);
        setSelectedColor(initialData.color || '#22c55e');

        if (initialData.color && !baseColors.includes(initialData.color) && !customColors.includes(initialData.color)) {
          setCustomColors(prev => [...prev, initialData.color]);
        }
      } else {
        setCode('');
        setName('');
        setLimitMin(500);
        setLimitMax(10000);
        setSelectedColor('#22c55e');
      }
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, initialData]);

  const handlePreCreate = () => {
    if (!code.trim()) {
      setError('Por favor, ingrese el código de la caja.');
      return;
    }
    if (code.trim().length !== 3) {
      setError('El código de la caja debe tener exactamente 3 dígitos (ej: 001).');
      return;
    }
    if (!name.trim()) {
      setError('Por favor, ingrese la denominación de la caja.');
      return;
    }
    if (limitMin < 0 || limitMax < 0) {
      setError('Los límites mínimos y máximos no pueden ser negativos.');
      return;
    }
    if (limitMin >= limitMax) {
      setError('El límite mínimo debe ser menor que el límite máximo.');
      return;
    }

    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmCreate = () => {
    const newBox = {
      id: initialData ? initialData.id : Date.now().toString(),
      code: code.trim().padStart(3, '0'),
      name: name.trim(),
      sede: '',
      limitMin: Number(limitMin),
      limitMax: Number(limitMax),
      balance: initialData ? initialData.balance : 0,
      status: initialData ? initialData.status : 'ACTIVO' as const,
      color: selectedColor,
    };

    onSave(newBox);
    onClose();
  };

  if (!isOpen) return null;

  // Renderizar en document.body para escapar del overflow del AdminLayout
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
              {initialData ? 'Editar Caja' : 'Registrar Nueva Caja'}
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Configure una nueva caja, estableciendo sus límites y asignación de sede.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase tracking-wide">
                  Código de Caja
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreCreate()}
                  placeholder="001"
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase tracking-wide">
                  Denominación / Nombre
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreCreate()}
                  placeholder="Ej. Caja Principal 1"
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                />
              </div>
            </div>



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

              {/* Colores base */}
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

              {/* Panel expandible */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase tracking-wide">
                  Límite Mínimo (S/)
                </label>
                <input
                  type="number"
                  min={0}
                  value={limitMin}
                  onChange={(e) => setLimitMin(Number(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreCreate()}
                  placeholder="500"
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-on-surface-variant uppercase tracking-wide">
                  Límite Máximo (S/)
                </label>
                <input
                  type="number"
                  min={0}
                  value={limitMax}
                  onChange={(e) => setLimitMax(Number(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreCreate()}
                  placeholder="10000"
                  className="w-full px-4 py-2.5 bg-background border border-outline-variant rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-surface-dim rounded-b-2xl flex items-center justify-center gap-4 shrink-0 mt-2">
          <button
            onClick={handlePreCreate}
            className="px-8 py-3.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-base font-bold transition-colors shadow-sm min-w-[200px]"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3.5 border border-outline-variant rounded-lg text-base font-bold text-on-surface hover:bg-surface-variant transition-colors min-w-[140px]"
          >
            Descartar
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface w-[360px] max-w-[90vw] rounded-2xl shadow-2xl p-6 text-center transform transition-all border border-outline-variant animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-50 dark:ring-green-900/10">
              <CheckCircle2 className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {initialData ? 'Actualizar Caja' : 'Registrar Caja'}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              ¿Está seguro que desea {initialData ? 'actualizar los datos de' : 'registrar'} la caja{' '}
              <strong>{name} ({code})</strong>?
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
                className="flex-1 py-2.5 bg-warm-copper hover:bg-warm-copper-hover text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
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
