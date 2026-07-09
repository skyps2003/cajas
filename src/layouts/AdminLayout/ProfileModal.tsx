import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertCircle, Eye, EyeOff, User, Upload, Shield } from 'lucide-react';
import { useAuth } from '../../contexts';
import { usuarioService } from '../../services/usuarioService';
import { useToast } from '../../components/Toast/ToastContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad'>('perfil');
  
  // Perfil State
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [imagenPreview, setImagenPreview] = useState('');
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  
  // Seguridad State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_success, _setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      // Intentamos separar nombre y apellido de forma básica
      const parts = user.name.split(' ');
      setNombres(parts.slice(0, Math.ceil(parts.length / 2)).join(' '));
      setApellidos(parts.slice(Math.ceil(parts.length / 2)).join(' '));
      setEmail(user.email);
      setImagenUrl(user.imagen || '');
      setImagenPreview(user.imagen ? (user.imagen.startsWith('http') ? user.imagen : `https://caja.corporacionjjja.com/${user.imagen}`) : '');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setActiveTab('perfil');
    }
  }, [isOpen, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagenPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setImagenFile(file);
  };

  const handleSaveProfile = async () => {
    if (!nombres || !apellidos || !email) {
      setError('Nombres, apellidos y correo son requeridos.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (user?.token && user?.id) {
        const currentData = await usuarioService.getById(user.token, Number(user.id));
        
        const payload: any = {
          nombre: nombres,
          apellido: apellidos,
          correo: email,
          rol: currentData.rol,
          estado: currentData.estado,
        };

        if (imagenFile) {
          payload.imagen = imagenFile;
        }

        await usuarioService.update(user.token, Number(user.id), payload);
        
        // Simular url si hubo archivo, o mantener actual
        const newImagenUrl = imagenFile ? imagenPreview : (currentData.imagen || imagenUrl);

        const newFullName = `${nombres} ${apellidos}`.trim();
        let changes = [];
        if (user.name !== newFullName) {
          changes.push(`Tu nombre cambió de "${user.name}" a "${newFullName}"`);
        }
        if (imagenFile) {
          changes.push(`Tu foto de perfil fue actualizada`);
        }
        
        const description = changes.length > 0 
          ? changes.join('. ') + '.'
          : 'Los datos de tu perfil fueron guardados correctamente.';
          
        showToast('success', 'Perfil actualizado', description);
        
        updateUser({
          name: newFullName,
          email: email,
          imagen: newImagenUrl
        });
        
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos de contraseña son obligatorios.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (user?.token) {
        const data = {
          currentPassword,
          newPassword,
          confirmPassword
        };
        const result = await usuarioService.changeProfilePassword(user.token, data);
        if (result.success) {
          showToast('success', 'Seguridad actualizada', 'Tu contraseña ha sido cambiada exitosamente.');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          onClose();
        } else {
          setError(result.message || 'Error al actualizar la contraseña');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#16212E] w-full max-w-[500px] rounded-xl shadow-2xl relative flex flex-col border border-[#E2E8F0] dark:border-[#1E2D3D]" style={{ maxHeight: '90vh' }}>
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-50 hover:bg-slate-200 dark:bg-[#1E2D3D] dark:hover:bg-[#2A3F54] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 p-2 rounded-full transition-all duration-300 z-10 hover:rotate-90 shadow-sm border border-slate-200/60 dark:border-slate-700/50"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 pb-2 border-b border-[#E2E8F0] dark:border-[#1E2D3D]">
          <h2 className="text-xl font-bold text-[#1B2E4B] dark:text-[#E8EDF5]">
            Configuración de Perfil
          </h2>
          <p className="text-xs text-[#6B7A94] dark:text-[#8899B4] mt-1">
            Administra tus datos personales y credenciales de acceso.
          </p>

          <div className="flex mt-4 gap-4">
            <button 
              onClick={() => { setActiveTab('perfil'); setError(null); }}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'perfil' ? 'border-[#C4933F] text-[#C4933F]' : 'border-transparent text-[#6B7A94] dark:text-[#8899B4] hover:text-[#1B2E4B] dark:hover:text-[#E8EDF5]'}`}
            >
              Datos Generales
            </button>
            <button 
              onClick={() => { setActiveTab('seguridad'); setError(null); }}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'seguridad' ? 'border-[#C4933F] text-[#C4933F]' : 'border-transparent text-[#6B7A94] dark:text-[#8899B4] hover:text-[#1B2E4B] dark:hover:text-[#E8EDF5]'}`}
            >
              <Shield size={14} /> Seguridad
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar">
          {error && (
            <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 flex gap-2.5 items-center animate-fade-in">
              <AlertCircle size={17} className="text-red-600 dark:text-red-400 shrink-0" />
              <div className="text-xs font-medium text-red-800 dark:text-red-300">
                {error}
              </div>
            </div>
          )}

          {activeTab === 'perfil' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  {imagenPreview ? (
                    <img src={imagenPreview} alt="Perfil" className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#0F1E2E] shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#E8EDF5] dark:bg-[#1E2D3D] flex items-center justify-center border-4 border-white dark:border-[#0F1E2E] shadow-sm">
                      <User size={32} className="text-[#6B7A94] dark:text-[#8899B4]" />
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-wait"
                  >
                    <Upload size={20} className="text-white" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-[10px] text-[#6B7A94] dark:text-[#8899B4] mt-2 uppercase font-semibold tracking-wider">Foto de Perfil</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Nombres</label>
                  <input 
                    type="text" 
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Apellidos</label>
                  <input 
                    type="text" 
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Correo Electrónico (No modificable)</label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-[#E8EDF5] dark:bg-[#0D1825] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm text-[#6B7A94] dark:text-[#8899B4] cursor-not-allowed opacity-80"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Contraseña Actual</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-2 text-[#6B7A94]">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-2 text-[#6B7A94]">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#6B7A94] dark:text-[#8899B4] mb-1 uppercase tracking-wide">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F6FA] dark:bg-[#0F1E2E] border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4933F]/40 text-[#1B2E4B] dark:text-[#E8EDF5]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-[#F5F6FA] dark:bg-[#0D1825] rounded-b-xl flex items-center justify-end gap-3 shrink-0 border-t border-[#E2E8F0] dark:border-[#1E2D3D]">
          <button 
            onClick={onClose}
            className="px-5 py-2 border border-[#CBD5E1] dark:border-[#1E2D3D] rounded-lg text-sm font-bold text-[#1B2E4B] dark:text-[#E8EDF5] hover:bg-[#E8EDF5] dark:hover:bg-[#1E2D3D] transition-colors"
          >
            Cerrar
          </button>
          <button 
            onClick={activeTab === 'perfil' ? handleSaveProfile : handleSavePassword}
            disabled={isLoading}
            className="px-6 py-2 bg-[#C4933F] hover:bg-[#A87A30] disabled:bg-[#C4933F]/50 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
