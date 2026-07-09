import React, { useState } from 'react';
import {
  Search, Plus, Edit2, Trash2, Users, CheckCircle2, UserX, Landmark,
  X, Loader2, AlertCircle, Eye, EyeOff, Copy, Key, Phone, Shield, ArrowUp, ArrowDown, Download
} from 'lucide-react';
import { credencialService } from '../../services/credencialService';
import type { CredencialResponse } from '../../services/credencialService';
import { telefonoService } from '../../services/telefonoService';
import type { TelefonoResponse } from '../../services/telefonoService';
import { documentoService } from '../../services/documentoService';
import type { DocumentoResponse } from '../../services/documentoService';
import { useToast } from '../../components/Toast/ToastContext';
import { Pagination } from '../../components/Pagination';
import { sunatService } from '../../services/sunatService';
import { useAuth } from '../../contexts/AuthContext';
import { contribuyenteService } from '../../services/contribuyenteService';
import { sedeService } from '../../services/sedeService';
import type { SedeResponse } from '../../services/sedeService';
import { getUpcomingDeadlines } from '../../utils/sunatSchedule';
import { SunatModal } from '../../components/modals/SunatModal';
import { TelefonoModal } from '../../components/modals/TelefonoModal';
import { CredencialModal } from '../../components/modals/CredencialModal';
import { DocumentoModal } from '../../components/modals/DocumentoModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

const TableSkeleton = ({ isAdmin }: { isAdmin?: boolean }) => (
  <>
    {[...Array(6)].map((_, i) => (
      <tr key={i} className="animate-pulse border-b border-slate-100 dark:border-[#1E2D3D]">
        <td className="px-6 py-4"><div className="h-5 bg-slate-200 dark:bg-[#1E2D3D] rounded w-3/4"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-1/2"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-full"></div></td>
        {isAdmin && <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-full"></div></td>}
        <td className="px-6 py-4"><div className="h-5 bg-slate-200 dark:bg-[#1E2D3D] rounded-full w-16 mx-auto"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-slate-200 dark:bg-[#1E2D3D] rounded w-16 mx-auto"></div></td>
      </tr>
    ))}
  </>
);

const FichaSkeleton = () => (
  <div className="space-y-6 animate-pulse p-2">
    {[...Array(3)].map((_, i) => (
      <div key={i}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#1E2D3D]"></div>
          <div className="h-4 bg-slate-200 dark:bg-[#1E2D3D] rounded w-1/3"></div>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="h-20 bg-slate-100 dark:bg-[#0D1825] rounded-lg border border-slate-200 dark:border-[#1E2D3D]"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export interface Contribuyente {
  id: number;
  ruc: string;
  razonSocial: string;
  tipoContribuyente: 'Persona Natural' | 'Persona Jurídica';
  estado: 'ACTIVO' | 'INACTIVO' | 'INACTIVO TEMPORALMENTE';
  direccionFiscal: string;
  ubigeo: string;
  sede?: string;
  id_sede?: number;
  email: string;
  telefono: string;
}

const EMPTY_FORM = {
  ruc: '', razonSocial: '',
  tipoContribuyente: 'Persona Jurídica' as 'Persona Jurídica' | 'Persona Natural',
  estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO' | 'INACTIVO TEMPORALMENTE',
  direccionFiscal: '', ubigeo: '', id_sede: 1, email: '', telefono: ''
};

// ─── Modal Component ────────────────────────────────────────────────────────
interface ContribuyenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Contribuyente, 'id'>) => Promise<boolean>;
  editData?: Contribuyente | null;
  sedes: SedeResponse[];
}

const ContribuyenteModal: React.FC<ContribuyenteModalProps> = ({ isOpen, onClose, onSave, editData, sedes }) => {
  const { showToast } = useToast();
  const [isSearchingRuc, setIsSearchingRuc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (editData) {
      setFormData({
        ruc: editData.ruc, razonSocial: editData.razonSocial,
        tipoContribuyente: editData.tipoContribuyente, estado: editData.estado,
        direccionFiscal: editData.direccionFiscal, ubigeo: editData.ubigeo,
        id_sede: editData.id_sede || 1, email: editData.email, telefono: editData.telefono,
      });
    } else {
      setFormData({ ...EMPTY_FORM, id_sede: sedes.length > 0 ? sedes[0].id : 1 });
    }
    setError(null);
  }, [editData, isOpen]);

  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    // Auto-detect tipo while typing based on first 2 digits
    const tipo = val.length >= 2
      ? sunatService.detectTipoContribuyente(val)
      : formData.tipoContribuyente;
    setFormData(prev => ({ ...prev, ruc: val, tipoContribuyente: tipo }));
    if (error) setError(null);
  };

  const handleConsultRuc = async () => {
    if (formData.ruc.length !== 11 || !/^\d+$/.test(formData.ruc)) {
      setError('El RUC debe tener exactamente 11 dígitos numéricos.');
      return;
    }
    setError(null);
    setIsSearchingRuc(true);
    try {
      const data = await sunatService.consultarRuc(formData.ruc);
      setFormData(prev => ({
        ...prev,
        razonSocial: data.razonSocial,
        tipoContribuyente: data.tipoContribuyente,
        estado: data.estado,
        direccionFiscal: data.direccionFiscal,
        ubigeo: data.ubigeo || '',
      }));
      showToast('success', 'RUC Consultado', `${data.razonSocial} — datos importados de SUNAT.`);
    } catch (err: any) {
      setError(err.message || 'Error al consultar SUNAT. Verifique el RUC e intente nuevamente.');
    } finally {
      setIsSearchingRuc(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.ruc.length !== 11) { setError('El RUC debe tener 11 dígitos numéricos.'); return; }
    if (!formData.razonSocial.trim()) { setError('La Razón Social es obligatoria.'); return; }
    if (!formData.direccionFiscal.trim()) { setError('La Dirección Fiscal es obligatoria.'); return; }
    setError(null);
    setIsSaving(true);
    
    try {
      const success = await onSave(formData);
      if (success) {
        showToast('success', editData ? 'Registro Actualizado' : 'Registro Exitoso', editData ? 'El contribuyente fue actualizado.' : 'El contribuyente fue registrado con éxito.');
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'sede') {
      setFormData(prev => ({ ...prev, id_sede: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const inputClass = "w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]";
  const labelClass = "block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide";


  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16212E] w-full max-w-2xl rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
          {/* Header Badge + Title */}
          <div className="mb-5">
            <span className="inline-block px-2.5 py-1 bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] rounded-full text-[10px] font-bold tracking-wider mb-2.5">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
              {editData ? 'Editar Contribuyente' : 'Registrar Nuevo Contribuyente'}
            </h2>
            <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mt-1">
              Complete los campos requeridos para {editData ? 'actualizar los datos del' : 'dar de alta al nuevo'} contribuyente en el sistema.
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 flex gap-2.5 items-center">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <span className="text-xs font-medium text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Identificación RUC + tipo auto-detectado */}
            <div>
              <label className={labelClass}>Identificación RUC</label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  name="ruc"
                  placeholder="11 dígitos numéricos"
                  maxLength={11}
                  disabled={!!editData}
                  value={formData.ruc}
                  onChange={handleRucChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsultRuc()}
                  className={`w-full sm:flex-1 ${inputClass} font-mono disabled:opacity-60`}
                />
                 {/* Tipo auto-detectado — read only, cambia con el RUC */}
                <div className={`w-full sm:w-[190px] px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center font-medium`}>
                  {formData.tipoContribuyente}
                </div>
                {!editData && (
                  <button
                    type="button"
                    onClick={handleConsultRuc}
                    disabled={isSearchingRuc || formData.ruc.length !== 11}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#C4933F] hover:bg-[#A87A30] text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 shrink-0"
                  >
                    {isSearchingRuc ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                    <span>{isSearchingRuc ? 'Consultando...' : 'Consultar'}</span>
                  </button>
                )}
              </div>
              {formData.ruc.length >= 2 && !formData.ruc.startsWith('10') && !formData.ruc.startsWith('20') && (
                <p className="text-[10px] mt-1 text-[#6B7A94] dark:text-[#8899B4]">
                  El RUC debe comenzar en 10 (Natural) o 20 (Jurídica)
                </p>
              )}
            </div>

            {/* Razón Social */}
            <div>
              <label className={labelClass}>Razón Social / Nombre Completo</label>
              <input type="text" name="razonSocial" placeholder="Nombre oficial registrado en SUNAT"
                value={formData.razonSocial} onChange={handleChange} className={inputClass} />
            </div>

            {/* Dirección + Ubigeo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Dirección Fiscal</label>
                <input type="text" name="direccionFiscal" placeholder="Av. / Jr. / Calle, Nro, Distrito"
                  value={formData.direccionFiscal} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Ubigeo</label>
                <input type="text" name="ubigeo" placeholder="150101" maxLength={6}
                  value={formData.ubigeo} onChange={handleChange} className={`${inputClass} font-mono`} />
              </div>
            </div>

            {/* Estado + Sede */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sede Asignada</label>
                <select name="sede" value={formData.id_sede} onChange={handleChange} className={inputClass}>
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado del Contribuyente</label>
                <select name="estado" value={formData.estado} onChange={handleChange} className={inputClass}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO TEMPORALMENTE">Inactivo temporalmente</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[180px] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : null}
            {editData ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[120px]"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );

};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const ContribuyentesListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const token = user?.token || '';
  const { showToast } = useToast();
  const [contribuyentes, setContribuyentes] = useState<Contribuyente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterTerminal, setFilterTerminal] = useState<string>('TODOS');
  const [filterSede, setFilterSede] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Contribuyente | null>(null);
  const [deleteItem, setDeleteItem] = useState<Contribuyente | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [sedes, setSedes] = useState<SedeResponse[]>([]);
  const [actionLoading, setActionLoading] = useState<{ id: number, type: 'view' | 'download' } | null>(null);
  const upcomingDeadlines = getUpcomingDeadlines();
  const [showSunatModal, setShowSunatModal] = useState(true);

  const getDeadlineForRuc = (ruc: string) => {
    if (!upcomingDeadlines.length || !ruc) return '-';
    const lastDigit = ruc.slice(-1);
    const match = upcomingDeadlines.find(d => {
      if (d.digitos === 'Buenos Contrib.') return false;
      return d.digitos.includes(lastDigit);
    });
    return match ? match.fechaFormat : '-';
  };
  const { isOpen: isConfirmOpen, title: confirmTitle, message: confirmMessage, confirm, close: closeConfirm, onConfirm: handleConfirm } = useConfirm();
  const itemsPerPage = 6;

  const [sortColumn, setSortColumn] = useState<keyof Contribuyente>('razonSocial');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof Contribuyente) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: keyof Contribuyente }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1 inline" /> : <ArrowDown size={14} className="ml-1 inline" />;
  };

  // Detail modal state
  const [detailItem, setDetailItem] = useState<Contribuyente | null>(null);
  const [detailCredenciales, setDetailCredenciales] = useState<CredencialResponse[]>([]);
  const [detailTelefonos, setDetailTelefonos] = useState<TelefonoResponse[]>([]);
  const [detailDocumentos, setDetailDocumentos] = useState<DocumentoResponse[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  // Modals state for inner Ficha forms
  const [isCredencialModalOpen, setIsCredencialModalOpen] = useState(false);
  const [editingCredencial, setEditingCredencial] = useState<CredencialResponse | null>(null);
  const [isTelefonoModalOpen, setIsTelefonoModalOpen] = useState(false);
  const [editingTelefono, setEditingTelefono] = useState<TelefonoResponse | null>(null);
  const [isDocumentoModalOpen, setIsDocumentoModalOpen] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoResponse | null>(null);

  const handleOpenDetail = async (c: Contribuyente) => {
    setDetailItem(c);
    setDetailLoading(true);
    setVisiblePasswords({});
    try {
      const [creds, tels, docs] = await Promise.all([
        credencialService.getCredenciales(token),
        telefonoService.getTelefonos(token),
        documentoService.getDocumentos(token)
      ]);
      setDetailCredenciales(creds.filter(cr => cr.id_registro_contribuyentes === c.id));
      setDetailTelefonos(tels.filter(t => t.id_registro_contribuyentes === c.id));
      // In case the API returns id_registro_contribuyente or we filter by contribuyente string name matching
      setDetailDocumentos(docs.filter((d: any) => d.id_registro_contribuyente === c.id || d.contribuyente === c.razonSocial));
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshFichaData = async () => {
    if (!detailItem) return;
    await handleOpenDetail(detailItem);
  };

  const handleDeleteCredencial = (id: number) => {
    confirm(
      '¿Eliminar Credencial?',
      '¿Está seguro de eliminar esta credencial? Esta acción no se puede deshacer.',
      async () => {
        try {
          await credencialService.deleteCredencial(id, token);
          showToast('success', 'Eliminado', 'Credencial eliminada correctamente.');
          refreshFichaData();
        } catch (e) {
          showToast('error', 'Error', 'No se pudo eliminar la credencial.');
        }
      }
    );
  };

  const handleDeleteTelefono = (id: number) => {
    confirm(
      '¿Eliminar Teléfono?',
      '¿Está seguro de eliminar este teléfono? Esta acción no se puede deshacer.',
      async () => {
        try {
          await telefonoService.deleteTelefono(id, token);
          showToast('success', 'Eliminado', 'Teléfono eliminado correctamente.');
          refreshFichaData();
        } catch (e) {
          showToast('error', 'Error', 'No se pudo eliminar el teléfono.');
        }
      }
    );
  };

  const handleDeleteDocumento = (id: number) => {
    confirm(
      '¿Eliminar Documento?',
      '¿Está seguro de eliminar este documento? Esta acción no se puede deshacer.',
      async () => {
        try {
          await documentoService.deleteDocumento(id, token);
          showToast('success', 'Eliminado', 'Documento eliminado correctamente.');
          refreshFichaData();
        } catch (e) {
          showToast('error', 'Error', 'No se pudo eliminar el documento.');
        }
      }
    );
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copiado', `${label} copiado al portapapeles.`);
  };

  React.useEffect(() => {
    if (token) {
      loadSedes();
      loadContribuyentes();
    }
  }, [token]);

  const loadSedes = async () => {
    try {
      const res = await sedeService.getAll(token);
      setSedes(res);
    } catch (e) {
      console.error('Error loading sedes', e);
    }
  };

  const loadContribuyentes = async () => {
    try {
      setIsLoadingData(true);
      const res = await contribuyenteService.getAll(token);
      setContribuyentes(res.map(c => ({
        id: c.id,
        ruc: c.ruc,
        razonSocial: c.razon_social,
        tipoContribuyente: (c.tipo_ruc === 1 || (c.tipo_ruc == null && c.ruc && c.ruc.startsWith('20'))) ? 'Persona Jurídica' : 'Persona Natural',
        estado: c.estado === 1 ? 'ACTIVO' : c.estado === 2 ? 'INACTIVO TEMPORALMENTE' : 'INACTIVO',
        direccionFiscal: c.direccion || '',
        ubigeo: '',
        sede: c.sede_nombre || c.sede || 'Sede Principal',
        id_sede: c.id_sede,
        email: c.correo || '',
        telefono: c.observaciones?.includes('Tel:') ? c.observaciones.split('Tel: ')[1] : ''
      })));
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudieron cargar los contribuyentes: ' + e.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDelete = (c: Contribuyente) => setDeleteItem(c);
  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await contribuyenteService.delete(token, deleteItem.id);
      setContribuyentes(prev => prev.filter(c => c.id !== deleteItem.id));
      showToast('success', 'Registro eliminado', `${deleteItem.razonSocial} fue removido.`);
      setDeleteItem(null);
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudo eliminar: ' + e.message);
    }
  };

  const handleDownloadDocumento = async (docId: number) => {
    if (!token) return;
    setActionLoading({ id: docId, type: 'download' });
    try {
      await documentoService.downloadDocumento(docId, token);
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudo descargar el documento: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDocumento = async (docId: number) => {
    if (!token) return;
    setActionLoading({ id: docId, type: 'view' });
    try {
      const response = await fetch(`/api/documentos/download/${docId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudo obtener el documento');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudo visualizar el documento: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenAdd = () => { setEditItem(null); setIsModalOpen(true); };
  const handleOpenEdit = (c: Contribuyente) => { setEditItem(c); setIsModalOpen(true); };
  const handleSave = async (data: Omit<Contribuyente, 'id'>) => {
    const selectedSedeId = localStorage.getItem('sede_id');
    const payload = {
      id_sede: data.id_sede || (selectedSedeId ? Number(selectedSedeId) : 1),
      razon_social: data.razonSocial,
      ruc: data.ruc,
      correo: data.email,
      direccion: data.direccionFiscal,
      tipo_ruc: data.tipoContribuyente === 'Persona Jurídica' ? 1 : 0,
      estado: data.estado === 'ACTIVO' ? 1 : data.estado === 'INACTIVO TEMPORALMENTE' ? 2 : 0,
      observaciones: data.telefono ? `Tel: ${data.telefono}` : ''
    };

    try {
      if (editItem) {
        await contribuyenteService.update(token, editItem.id, payload);
      } else {
        await contribuyenteService.create(token, payload);
      }
      await loadContribuyentes();
      return true;
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudo guardar: ' + e.message);
      return false;
    }
  };

  const handleToggleEstado = async (c: Contribuyente) => {
    if (togglingId === c.id) return;
    
    let newEstadoStr: 'ACTIVO' | 'INACTIVO' | 'INACTIVO TEMPORALMENTE';
    let newEstadoNum: number;
    if (c.estado === 'ACTIVO') {
        newEstadoStr = 'INACTIVO TEMPORALMENTE';
        newEstadoNum = 2;
    } else if (c.estado === 'INACTIVO TEMPORALMENTE') {
        newEstadoStr = 'INACTIVO';
        newEstadoNum = 0;
    } else {
        newEstadoStr = 'ACTIVO';
        newEstadoNum = 1;
    }
    
    try {
      setTogglingId(c.id);
      await contribuyenteService.updateEstado(token, c.id, newEstadoNum);
      setContribuyentes(prev => prev.map(item => item.id === c.id ? { ...item, estado: newEstadoStr } : item));
      showToast('success', 'Estado Actualizado', `El estado de ${c.razonSocial} ahora es ${newEstadoStr}.`);
    } catch (e: any) {
      showToast('error', 'Error', 'No se pudo cambiar el estado: ' + e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusStyle = (estado: 'ACTIVO' | 'INACTIVO' | 'INACTIVO TEMPORALMENTE') => {
    if (estado === 'ACTIVO') return 'bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/20 dark:text-emerald-400 border border-[#a7f3d0] dark:border-emerald-500/30 shadow-sm';
    if (estado === 'INACTIVO TEMPORALMENTE') return 'bg-[#fef08a] text-[#854d0e] dark:bg-yellow-500/20 dark:text-yellow-400 border border-[#fde047] dark:border-yellow-500/30 shadow-sm';
    return 'bg-[#fee2e2] text-[#b91c1c] dark:bg-red-500/20 dark:text-red-400 border border-[#fecaca] dark:border-red-500/30 shadow-sm';
  };

  const filtered = contribuyentes.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = c.ruc.includes(q) || c.razonSocial.toLowerCase().includes(q);
    const matchEstado = filterEstado === 'TODOS' || c.estado === filterEstado;
    const matchTipo = filterTipo === 'TODOS' || c.tipoContribuyente === filterTipo;
    const matchTerminal = filterTerminal === 'TODOS' || c.ruc.endsWith(filterTerminal);
    const matchSede = filterSede === 'TODOS' || c.id_sede?.toString() === filterSede;
    return matchSearch && matchEstado && matchTipo && matchTerminal && matchSede;
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = String(a[sortColumn] || '').toLowerCase();
    const valB = String(b[sortColumn] || '').toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activosCount = filtered.filter(c => c.estado === 'ACTIVO').length;
  const inactivosCount = filtered.filter(c => c.estado === 'INACTIVO').length;
  const juridicosCount = filtered.filter(c => c.tipoContribuyente === 'Persona Jurídica').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight flex items-center gap-2">
            <span className="w-1 h-8 bg-[#B47541] rounded-full inline-block" />
            Padrón de Contribuyentes
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 ml-3">Gestión y consulta de contribuyentes registrados en el sistema financiero.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar RUC o Razón Social..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B47541]/50 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={handleOpenAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm text-white hover:bg-[#9c6030] bg-[#B47541] whitespace-nowrap border border-transparent">
            <Plus size={18} /><span>REGISTRAR CONTRIBUYENTE</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — mismo estilo que AdminUsersPage */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#E8EDF5] dark:bg-[#1B2E4B]/30 border border-[#D4DCE9] dark:border-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#E8EDF5] flex items-center justify-center shrink-0">
            <Users size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">TOTAL<br/>REGISTROS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{filtered.length.toString().padStart(2, '0')}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CONTRIB.<br/>ACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{activosCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100 dark:border-red-900/30">
            <UserX size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">CONTRIB.<br/>INACTIVOS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{inactivosCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#16212E] rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3 sm:p-4 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4933F]/10 dark:bg-[#C4933F]/15 text-[#C4933F] flex items-center justify-center shrink-0 border border-[#C4933F]/20">
            <Landmark size={20} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-[9px] sm:text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] tracking-widest uppercase leading-tight mb-0.5">PERS.<br/>JURÍDICAS</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1B2E4B] dark:text-white tracking-tight leading-none">{juridicosCount.toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none shadow-sm">
          <option value="TODOS">Todos los estados</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO TEMPORALMENTE">Inactivos Temporalmente</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
        <select value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none shadow-sm">
          <option value="TODOS">Todos los tipos</option>
          <option value="Persona Natural">Persona Natural</option>
          <option value="Persona Jurídica">Persona Jurídica</option>
        </select>
        <select value={filterTerminal} onChange={e => { setFilterTerminal(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none shadow-sm">
          <option value="TODOS">Todos los terminales</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(t => (
            <option key={t} value={t.toString()}>Terminal {t}</option>
          ))}
        </select>
        {isAdmin && (
          <select value={filterSede} onChange={e => { setFilterSede(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none shadow-sm">
            <option value="TODOS">Todas las sedes</option>
            {sedes.map(s => (
              <option key={s.id} value={s.id.toString()}>{s.nombre}</option>
            ))}
          </select>
        )}
        {(filterEstado !== 'TODOS' || filterTipo !== 'TODOS' || filterTerminal !== 'TODOS' || filterSede !== 'TODOS' || searchTerm) && (
          <button onClick={() => { setFilterEstado('TODOS'); setFilterTipo('TODOS'); setFilterTerminal('TODOS'); setFilterSede('TODOS'); setSearchTerm(''); setCurrentPage(1); }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#16212E] border border-slate-200 dark:border-[#1E2D3D] rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed">
            <colgroup>
              <col className={isAdmin ? "w-[28%] sm:w-[28%]" : "w-[35%] sm:w-[40%]"} />
              <col className="w-[12%] sm:w-[14%]" />
              <col className="w-[12%] sm:w-[14%]" />
              {isAdmin && <col className="w-[14%] sm:w-[12%]" />}
              <col className="w-[12%] sm:w-[12%]" />
              <col className="w-[12%] sm:w-[10%]" />
              <col className="w-[10%] sm:w-[10%]" />
            </colgroup>
            <thead className="bg-[#1B2E4B] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer transition-colors select-none" onClick={() => handleSort('razonSocial')}>
                  CONTRIBUYENTE <SortIcon column="razonSocial" />
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer transition-colors select-none" onClick={() => handleSort('ruc')}>
                  RUC <SortIcon column="ruc" />
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer transition-colors select-none" onClick={() => handleSort('tipoContribuyente')}>
                  TIPO <SortIcon column="tipoContribuyente" />
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 font-semibold text-xs tracking-wider cursor-pointer transition-colors select-none" onClick={() => handleSort('sede')}>
                    SEDE <SortIcon column="sede" />
                  </th>
                )}
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center cursor-pointer transition-colors select-none" onClick={() => handleSort('estado')}>
                  ESTADO <SortIcon column="estado" />
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center select-none">
                  FECHA DECLARACIÓN
                </th>
                <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D]">
              {isLoadingData ? (
                <TableSkeleton isAdmin={isAdmin} />
              ) : paginated.length > 0 ? paginated.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-[#1E2D3D]/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-normal break-words">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{c.razonSocial}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-normal break-all">
                    {c.ruc}
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-normal">
                    {c.tipoContribuyente}
                  </td>
                  {isAdmin && (
                    <td className="px-2 sm:px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-normal">
                      {c.sede}
                    </td>
                  )}
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handleToggleEstado(c)}
                      disabled={togglingId === c.id}
                      className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors hover:opacity-80 cursor-pointer whitespace-nowrap tracking-wider ${getStatusStyle(c.estado)} ${togglingId === c.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {togglingId === c.id ? '...' : c.estado}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                      <span className="text-xs font-bold whitespace-nowrap">{getDeadlineForRuc(c.ruc)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => handleOpenDetail(c)} className="p-1.5 rounded-md text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Ver detalle">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#B47541] transition-colors" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(c)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    No se encontraron contribuyentes con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={filtered.length} 
          itemsPerPage={itemsPerPage} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* Modal Detalle Contribuyente */}
      {detailItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-full max-w-2xl rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
            <button
              onClick={() => setDetailItem(null)}
              className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
            >
              <X size={18} />
            </button>

            <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar flex-1">
              {/* Header */}
              <div className="mb-5">
                <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-bold tracking-wider mb-2.5">
                  FICHA DEL CONTRIBUYENTE
                </span>
                <h2 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] leading-snug">{detailItem.razonSocial}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="font-mono text-xs bg-[#1B2E4B]/5 dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] px-2 py-0.5 rounded border border-[#1B2E4B]/10 dark:border-[#1B2E4B]/30">RUC: {detailItem.ruc}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusStyle(detailItem.estado as any)}`}>{detailItem.estado}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{detailItem.tipoContribuyente} · {detailItem.sede}</span>
                </div>
              </div>

              {detailLoading ? (
                <FichaSkeleton />
              ) : (
                <div className="space-y-5">
                  {/* Credenciales */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#C4933F]/10 flex items-center justify-center">
                          <Key size={14} className="text-[#C4933F]" />
                        </div>
                        <h3 className="text-xs font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase tracking-wider">Credenciales de Acceso</h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-500">{detailCredenciales.length}</span>
                      </div>
                      <button 
                        onClick={() => { setEditingCredencial(null); setIsCredencialModalOpen(true); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-[#C4933F] hover:bg-[#A87A30] rounded transition-colors"
                      >
                        <Plus size={12} />
                        AGREGAR
                      </button>
                    </div>
                    {detailCredenciales.length > 0 ? (
                      <div className="space-y-2">
                        {detailCredenciales.map(cr => {
                          const isVisible = !!visiblePasswords[cr.id];
                          return (
                            <div key={cr.id} className="bg-[#F5F6FA] dark:bg-[#0D1825] rounded-lg p-3 border border-slate-200 dark:border-[#1E2D3D]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-[#C4933F] uppercase tracking-wider flex items-center gap-1">
                                  <Shield size={11} />
                                  {cr.tipo_credencial}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${cr.estado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                    {cr.estado ? 'ACTIVO' : 'INACTIVO'}
                                  </span>
                                  <button onClick={() => { setEditingCredencial(cr); setIsCredencialModalOpen(true); }} className="text-slate-400 hover:text-[#B47541] transition-colors" title="Editar">
                                    <Edit2 size={12} />
                                  </button>
                                  <button onClick={() => handleDeleteCredencial(cr.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Usuario</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded">{cr.usuario}</span>
                                    <button onClick={() => handleCopyText(cr.usuario, 'Usuario')} className="text-slate-400 hover:text-slate-600 transition-colors" title="Copiar">
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Contraseña</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded">
                                      {isVisible ? cr.clave : '••••••••'}
                                    </span>
                                    <button onClick={() => setVisiblePasswords(prev => ({ ...prev, [cr.id]: !prev[cr.id] }))} className="text-slate-400 hover:text-slate-600 transition-colors">
                                      {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                                    </button>
                                    <button onClick={() => handleCopyText(cr.clave, 'Contraseña')} className="text-slate-400 hover:text-slate-600 transition-colors" title="Copiar">
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {cr.observaciones && (
                                <p className="text-[10px] text-slate-400 mt-2 italic">{cr.observaciones}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Sin credenciales registradas.</p>
                    )}
                  </div>

                  {/* Teléfonos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                          <Phone size={14} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xs font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase tracking-wider">Teléfonos</h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-500">{detailTelefonos.length}</span>
                      </div>
                      <button 
                        onClick={() => { setEditingTelefono(null); setIsTelefonoModalOpen(true); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        <Plus size={12} />
                        AGREGAR
                      </button>
                    </div>
                    {detailTelefonos.length > 0 ? (
                      <div className="space-y-2">
                        {detailTelefonos.map(tel => (
                          <div key={tel.id} className="bg-[#F5F6FA] dark:bg-[#0D1825] rounded-lg p-3 border border-slate-200 dark:border-[#1E2D3D] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                <Phone size={14} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{tel.numero}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400">{tel.tipo_telefono}</span>
                                  {tel.nombre_contacto && <span className="text-[10px] text-slate-400">· {tel.nombre_contacto}</span>}
                                  {tel.principal && <span className="text-[9px] bg-[#C4933F]/10 text-[#C4933F] px-1.5 py-0.5 rounded font-bold">PRINCIPAL</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleCopyText(tel.numero, 'Número')} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Copiar número">
                                <Copy size={13} />
                              </button>
                              <button onClick={() => { setEditingTelefono(tel); setIsTelefonoModalOpen(true); }} className="text-slate-400 hover:text-[#B47541] transition-colors p-1" title="Editar">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDeleteTelefono(tel.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Eliminar">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Sin teléfonos registrados.</p>
                    )}
                  </div>

                  {/* Documentos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                          <Landmark size={14} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-xs font-bold text-[#1B2E4B] dark:text-[#E8EDF5] uppercase tracking-wider">Documentos</h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-500">{detailDocumentos.length}</span>
                      </div>
                      <button 
                        onClick={() => { setEditingDocumento(null); setIsDocumentoModalOpen(true); }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors"
                      >
                        <Plus size={12} />
                        AGREGAR
                      </button>
                    </div>
                    {detailDocumentos.length > 0 ? (
                      <div className="space-y-2">
                        {detailDocumentos.map(doc => {
                          const getFileEmoji = (path?: string) => {
                            if (!path) return '📄';
                            const ext = path.split('.').pop()?.toLowerCase();
                            if (ext === 'pdf') return '📕';
                            if (['doc', 'docx'].includes(ext!)) return '📘';
                            if (['xls', 'xlsx'].includes(ext!)) return '📗';
                            if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext!)) return '🖼️';
                            return '📄';
                          };
                          
                          return (
                            <div key={doc.id} className="bg-[#F5F6FA] dark:bg-[#0D1825] rounded-lg p-3 border border-slate-200 dark:border-[#1E2D3D] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg shadow-sm">
                                  {getFileEmoji(doc.ruta_documento)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{doc.nombre_documento}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-400">{doc.tipo_documento}</span>
                                    {doc.rubro && <span className="text-[10px] text-slate-400">· {doc.rubro}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {doc.ruta_documento && (
                                  <>
                                    <button 
                                      onClick={() => handleViewDocumento(doc.id)} 
                                      disabled={actionLoading?.id === doc.id}
                                      className={`p-1 transition-colors ${actionLoading?.id === doc.id && actionLoading.type === 'view' ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`} 
                                      title="Previsualizar"
                                    >
                                      {actionLoading?.id === doc.id && actionLoading.type === 'view' ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                                    </button>
                                    <button 
                                      onClick={() => handleDownloadDocumento(doc.id)} 
                                      disabled={actionLoading?.id === doc.id}
                                      className={`p-1 transition-colors ${actionLoading?.id === doc.id && actionLoading.type === 'download' ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`} 
                                      title="Descargar Archivo"
                                    >
                                      {actionLoading?.id === doc.id && actionLoading.type === 'download' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    </button>
                                  </>
                                )}
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <button onClick={() => { setEditingDocumento(doc); setIsDocumentoModalOpen(true); }} className="text-slate-400 hover:text-[#B47541] transition-colors p-1" title="Editar">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteDocumento(doc.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Eliminar">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Sin documentos registrados.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
              <button
                onClick={() => setDetailItem(null)}
                className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[140px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SunatModal isOpen={showSunatModal} onClose={() => setShowSunatModal(false)} />
      
      {isModalOpen && (
        <ContribuyenteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editData={editItem}
          sedes={sedes}
        />
      )}

      {detailItem && (
        <>
          <CredencialModal
            isOpen={isCredencialModalOpen}
            onClose={() => setIsCredencialModalOpen(false)}
            onSave={refreshFichaData}
            contribuyenteId={detailItem.id}
            editingRegistro={editingCredencial}
          />
          <TelefonoModal
            isOpen={isTelefonoModalOpen}
            onClose={() => setIsTelefonoModalOpen(false)}
            onSave={refreshFichaData}
            contribuyenteId={detailItem.id}
            editingRegistro={editingTelefono}
          />
          <DocumentoModal
            isOpen={isDocumentoModalOpen}
            onClose={() => setIsDocumentoModalOpen(false)}
            onSave={refreshFichaData}
            contribuyenteId={detailItem.id}
            editingDocumento={editingDocumento}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
      />

      {/* Modal Confirmar Eliminación */}
      {deleteItem && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16212E] w-[360px] max-w-[90vw] rounded-xl shadow-2xl p-5 text-center border border-[#E2E8F0] dark:border-[#1E2D3D] animate-fade-in">
            <div className="w-12 h-12 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1B2E4B] dark:text-[#E8EDF5] mb-1">¿Confirmar eliminación?</h3>
            <p className="text-sm text-[#6B7A94] dark:text-[#8899B4] mb-5 leading-relaxed">
              Se eliminará permanentemente a <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{deleteItem.razonSocial}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteItem(null)} 
                className="flex-1 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
