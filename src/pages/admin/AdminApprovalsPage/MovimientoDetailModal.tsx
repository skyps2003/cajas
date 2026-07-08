import React from 'react';
import ReactDOM from 'react-dom';
import { X, ArrowUpRight, ArrowDownRight, Building2, Wallet, MapPin, User, FileText, Hash, CreditCard, AlignLeft, Calendar } from 'lucide-react';
import type { MovimientoResponse } from '../../../services/movimientoService';

interface MovimientoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  movimiento: MovimientoResponse | null;
}

export const MovimientoDetailModal: React.FC<MovimientoDetailModalProps> = ({ isOpen, onClose, movimiento }) => {
  if (!isOpen || !movimiento) return null;

  const isIngreso = movimiento.tipo_movimiento;

  const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</div>
        <div className={`text-sm font-semibold ${highlight ? (isIngreso ? 'text-emerald-600' : 'text-red-500') : 'text-on-surface'} break-words`}>
          {value || <span className="text-on-surface-variant/50 italic font-normal">Sin información</span>}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col border border-outline-variant"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2D3D] p-2 rounded-full transition-all duration-200 z-10 hover:rotate-90"
        >
          <X size={20} />
        </button>

        {/* Body */}
        <div className="p-8 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-3 ${
              isIngreso
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {isIngreso ? 'INGRESO' : 'EGRESO'}
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              Detalle del Movimiento
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Información completa del movimiento #{movimiento.id} registrado en el sistema.
            </p>
          </div>

          {/* Monto destacado */}
          <div className={`mb-6 rounded-xl border p-5 flex items-center gap-4 ${
            isIngreso
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isIngreso
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                : 'bg-red-100 dark:bg-red-900/30 text-red-500'
            }`}>
              {isIngreso ? <ArrowUpRight size={24} strokeWidth={2} /> : <ArrowDownRight size={24} strokeWidth={2} />}
            </div>
            <div>
              <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Monto Total</div>
              <div className={`text-2xl font-black ${isIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
                {isIngreso ? '+' : '-'}S/ {movimiento.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Información detallada */}
          <div className="space-y-0">
            {movimiento.fecha && (
              <InfoRow
                icon={<Calendar size={16} className="text-on-surface-variant" />}
                label="Fecha de Registro"
                value={
                  (() => {
                    const [y, m, d] = movimiento.fecha.split('-');
                    const dateStr = (y && m && d) 
                      ? new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                      : new Date(movimiento.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                    return `${dateStr}${movimiento.hora ? ` a las ${movimiento.hora}` : ''}`;
                  })()
                }
              />
            )}
            <InfoRow
              icon={<Building2 size={16} className="text-on-surface-variant" />}
              label="Empresa"
              value={movimiento.empresa}
            />

            <InfoRow
              icon={<Wallet size={16} className="text-on-surface-variant" />}
              label="Caja"
              value={movimiento.caja}
            />

            <InfoRow
              icon={<MapPin size={16} className="text-on-surface-variant" />}
              label="Sede"
              value={movimiento.sede}
            />

            <InfoRow
              icon={<User size={16} className="text-on-surface-variant" />}
              label="Responsable"
              value={
                movimiento.usuario
                  ? `${movimiento.usuario.nombre} ${movimiento.usuario.apellido}`.trim()
                  : (movimiento.nombre || movimiento.apellido)
                    ? `${movimiento.nombre || ''} ${movimiento.apellido || ''}`.trim()
                    : null
              }
            />

            <InfoRow
              icon={<FileText size={16} className="text-on-surface-variant" />}
              label="Tipo de Comprobante"
              value={movimiento.tipo_comprobante}
            />

            {((movimiento.factura?.serie || movimiento.boleta?.serie || movimiento.serie) || 
              (movimiento.factura?.correlativo || movimiento.boleta?.correlativo || movimiento.correlativo)) && (
              <InfoRow
                icon={<Hash size={16} className="text-on-surface-variant" />}
                label="Serie / Correlativo"
                value={`${movimiento.factura?.serie || movimiento.boleta?.serie || movimiento.serie || '-'} - ${movimiento.factura?.correlativo || movimiento.boleta?.correlativo || movimiento.correlativo || '-'}`}
              />
            )}

            {(movimiento.factura?.ruc || movimiento.ruc) && (
              <InfoRow
                icon={<CreditCard size={16} className="text-on-surface-variant" />}
                label="RUC"
                value={movimiento.factura?.ruc || movimiento.ruc}
              />
            )}

            {(movimiento.factura?.razon_social || movimiento.razon_social) && (
              <InfoRow
                icon={<Building2 size={16} className="text-on-surface-variant" />}
                label="Razón Social"
                value={movimiento.factura?.razon_social || movimiento.razon_social}
              />
            )}

            <InfoRow
              icon={<AlignLeft size={16} className="text-on-surface-variant" />}
              label="Descripción"
              value={movimiento.descripcion}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white dark:bg-surface-dim rounded-b-2xl flex items-center justify-center gap-4 shrink-0 mt-2">
          <button
            onClick={onClose}
            className="px-8 py-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-w-[160px]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
