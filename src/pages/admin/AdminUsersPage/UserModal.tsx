import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Search, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { reniecService } from '../../../services/reniecService';
import type { SedeResponse } from '../../../services/sedeService';

export interface UserFormData {
  nombre: string;
  apellido: string;
  correo: string;
  password?: string;
  rol: number;
  estado: boolean;
  sedes_ids?: number[];
  // Solo para UI
  documento?: string;
  imagen?: File;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserFormData) => void;
  initialData?: any;
  sedesDisponibles: SedeResponse[];
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, initialData, sedesDisponibles }) => {
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<boolean>(true);
  const [role, setRole] = useState<number>(2); // 2 = Cajero
  const [sedesIds, setSedesIds] = useState<number[]>([]);
  
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDocType('DNI');
        setDocNumber('');
        setNombres(initialData.nombre);
        setApellidos(initialData.apellido);
        setEmail(initialData.correo);
        setStatus(Boolean(initialData.estado));
        setRole(initialData.rol);
        setSedesIds(initialData.sedes_ids || []);
        setPassword('');
        setConfirmPassword('');
      } else {
        setDocType('DNI');
        setDocNumber('');
        setNombres('');
        setApellidos('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setStatus(true);
        setRole(2);
        setSedesIds([]);
      }
      setError(null);
      setShowConfirm(false);
    }
  }, [isOpen, initialData]);

  const handleConsultar = async () => {
    if (!docNumber || docType !== 'DNI') {
      setError('Por ahora solo se soporta consulta de DNI.');
      return;
    }
    
    if (docNumber.length !== 8) {
      setError('El DNI debe tener 8 dígitos.');
      return;
    }
    
    setIsLoadingDoc(true);
    setError(null);

    try {
      const data = await reniecService.consultarDNI(docNumber);
      setNombres(data.nombre || '');
      setApellidos(data.apellido || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al consultar el documento.');
      setNombres('');
      setApellidos('');
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const handlePreCreate = () => {
    if (!nombres || !apellidos) {
      setError('Por favor, complete los nombres y apellidos.');
      return;
    }
    if (!email.includes('@')) {
      setError('Por favor, ingrese un correo electrónico válido.');
      return;
    }
    if (!initialData && (!password || password !== confirmPassword)) {
      setError('Las contraseñas no coinciden o están vacías.');
      return;
    }
    
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmCreate = () => {
    const newUser: UserFormData = {
      nombre: nombres,
      apellido: apellidos,
      correo: email,
      rol: role,
      estado: status,
      sedes_ids: sedesIds.length > 0 ? sedesIds : undefined,
      documento: docNumber
    };
    if (password) {
      newUser.password = password;
    }
    
    onSave(newUser);
    onClose();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16212E] w-full max-w-2xl rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="mb-5">
            <span className="inline-block px-2.5 py-1 bg-[#E8EDF5] dark:bg-[#1B2E4B]/40 text-[#1B2E4B] dark:text-[#B8C4D6] rounded-full text-[10px] font-bold tracking-wider mb-2.5">
              FORMULARIO DE GESTIÓN
            </span>
            <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
              {initialData ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h2>
            <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mt-1">
              Complete los campos requeridos para {initialData ? 'actualizar la cuenta' : 'habilitar una nueva cuenta'} en el sistema.
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
            {/* Documento (solo útil para rellenar, no se envía si la API no lo requiere, pero sirve para buscar) */}
            {!initialData && (
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Identificación del Documento
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select 
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value);
                      setDocNumber('');
                      setNombres('');
                      setApellidos('');
                    }}
                    className="w-full sm:w-1/4 px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  >
                    <option value="DNI">DNI</option>
                  </select>
                  <input 
                    type="text" 
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, '').slice(0, docType === 'DNI' ? 8 : 11))}
                    onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
                    placeholder="Número de documento" 
                    className="w-full sm:w-2/4 px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                  <button 
                    onClick={handleConsultar}
                    disabled={isLoadingDoc}
                    className="w-full sm:w-1/4 flex items-center justify-center gap-2 bg-[#C4933F] hover:bg-[#A87A30] text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70"
                  >
                    <Search size={15} />
                    <span>{isLoadingDoc ? '...' : 'Consultar'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Nombres
                </label>
                <input 
                  type="text" 
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Nombres completos"
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Apellidos
                </label>
                <input 
                  type="text" 
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Apellidos completos"
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@corporacionjjja.com"
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                  Rol de Acceso Principal
                </label>
                <select 
                  value={role}
                  onChange={(e) => setRole(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                >
                  <option value={1}>Administrador</option>
                  <option value={2}>Cajero / Operador</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Contraseña {initialData && '(Opcional)'}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2 text-[#6B7A94]">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Confirmar Contraseña</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2 text-[#6B7A94]">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">
                Sede Asignada
              </label>
              {role === 1 ? (
                <select 
                  value={sedesIds.length > 0 ? sedesIds[0] : ''}
                  onChange={(e) => setSedesIds(e.target.value ? [Number(e.target.value)] : [])}
                  className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                >
                  <option value="">-- Sin sede --</option>
                  {sedesDisponibles.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full max-h-32 overflow-y-auto px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm space-y-1">
                  {sedesDisponibles.map(s => (
                    <label key={s.id} className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-2 transition-colors">
                      <input
                        type="checkbox"
                        checked={sedesIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSedesIds([...sedesIds, s.id]);
                          } else {
                            setSedesIds(sedesIds.filter(id => id !== s.id));
                          }
                        }}
                        className="rounded border-[#CBD5E1] text-[#C4933F] focus:ring-[#C4933F] w-4 h-4"
                      />
                      <span className="text-[#1B2E4B] dark:text-[#E8EDF5] font-medium">{s.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-center gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
          <button 
            onClick={handlePreCreate}
            className="px-6 py-2.5 bg-[#C4933F] hover:bg-[#A87A30] text-white rounded-lg text-sm font-bold transition-colors shadow-sm min-w-[180px]"
          >
            {initialData ? 'Guardar Cambios' : 'Crear Registro'}
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors min-w-[120px]"
          >
            Descartar
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
              {initialData ? 'Actualizar Usuario' : 'Registrar Usuario'}
            </h3>
            <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mb-4 leading-relaxed">
              ¿Confirmar {initialData ? 'actualización de' : 'registro de'} <strong className="text-[#1B2E4B] dark:text-[#E8EDF5]">{nombres} {apellidos}</strong>?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-semibold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#F0F4F9] dark:hover:bg-[#1E2D3D] transition-colors"
              >
                Revisar
              </button>
              <button 
                onClick={handleConfirmCreate}
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
