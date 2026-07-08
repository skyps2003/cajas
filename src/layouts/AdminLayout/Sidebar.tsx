import React, { useState } from 'react';
import {
  LayoutGrid,
  Settings,
  Users,
  MapPin,
  Wallet,
  Landmark,
  SlidersHorizontal,
  
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  User,
  
  
  KeyRound,
  Tags,
  Smartphone,
  ClipboardList
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, useAuth } from '../../contexts';
import { ProfileModal } from './ProfileModal';
import { useToast } from '../../components/Toast/ToastContext';

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
  role: 'admin' | 'cajero';
  isMobileOpen?: boolean;
  toggleMobileSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar, role, isMobileOpen, toggleMobileSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isContribuyentesOpen, setIsContribuyentesOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { showToast: _showToast } = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const isLightMode = theme === 'light';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleConfig = () => {
    if (!isExpanded) toggleSidebar();
    setIsConfigOpen(!isConfigOpen);
  };

  const toggleContribuyentes = () => {
    if (!isExpanded) toggleSidebar();
    setIsContribuyentesOpen(!isContribuyentesOpen);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside
        className={`fixed md:relative h-full top-0 left-0 transition-all duration-300 ease-in-out bg-[var(--sidebar-bg)] text-[var(--sidebar-text-hover)] flex flex-col py-6 shadow-elevated z-50 md:z-auto
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`flex justify-center items-center mb-4 transition-all duration-300 ${isExpanded ? 'px-6' : 'px-2'}`}>
          <div className="w-8 h-8 rounded-lg bg-[var(--sidebar-active)] text-white flex items-center justify-center font-bold text-sm transition-all duration-300">
            JJ
          </div>
        </div>

      {/* Toggle Sidebar Button - Modern Outward Bump Style */}
      <div className="hidden md:flex absolute -right-[24px] top-10 w-[26px] h-20 z-50 items-center justify-end pointer-events-none text-[var(--sidebar-border)]">
        <svg width="26" height="80" viewBox="0 0 26 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-0 top-0">
          {/* Fill shape to cover the sidebar border and color the bump */}
          <path 
            d="M 0 0 L 1.5 0 C 1.5 12, 1.5 16, 13.5 16 C 25.5 16, 25.5 24, 25.5 40 C 25.5 56, 25.5 64, 13.5 64 C 1.5 64, 1.5 68, 1.5 80 L 0 80 Z" 
            fill="var(--sidebar-bg)" 
          />
          {/* Stroke shape to draw the curved border */}
          <path 
            d="M 1.5 0 C 1.5 12, 1.5 16, 13.5 16 C 25.5 16, 25.5 24, 25.5 40 C 25.5 56, 25.5 64, 13.5 64 C 1.5 64, 1.5 68, 1.5 80" 
            stroke="currentColor" 
            strokeWidth="1" 
          />
        </svg>
        <button
          onClick={toggleSidebar}
          className="pointer-events-auto absolute right-0 w-6 h-6 flex items-center justify-center text-[#B47541] hover:text-[#8e5c33] hover:scale-110 active:scale-95 transition-all duration-300 drop-shadow-sm"
          title={isExpanded ? "Contraer menú" : "Expandir menú"}
        >
          {isExpanded ? <ChevronLeft size={18} strokeWidth={2.5} /> : <ChevronRight size={18} strokeWidth={2.5} />}
        </button>
      </div>

      {/* Profile Section */}
      <div 
        className={`flex flex-col items-center w-full mb-6 mt-2 cursor-pointer group ${!isExpanded ? 'px-2' : 'px-4'}`}
        onClick={() => setIsProfileModalOpen(true)}
        title="Editar Perfil"
      >
        <div className="relative">
          {user?.imagen ? (
            <img 
              src={user.imagen.startsWith('http') || user.imagen.startsWith('data:') ? user.imagen : `https://caja.corporacionjjja.com/${user.imagen}`} 
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#C4933F] mb-3 shrink-0 group-hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#C4933F]/15 dark:bg-[#C4933F]/20 mb-3 shrink-0 group-hover:bg-[#C4933F]/30 transition-colors">
              <User size={22} className="text-[#C4933F]" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity h-12 w-12">
            <Settings size={16} className="text-white" />
          </div>
        </div>
        
        {isExpanded && (
          <div className="text-center transition-opacity duration-300 flex flex-col items-center">
            <h3 className="text-[13px] font-semibold text-[var(--sidebar-text-hover)] tracking-wide">{user?.name || 'Usuario'}</h3>
            <span className="text-[10px] font-bold text-[#C4933F] uppercase tracking-widest mt-0.5">
              {role === 'admin' ? 'Administrador' : 'Cajero'}
            </span>
            {role !== 'admin' && (
              <span className="text-[10px] text-[var(--sidebar-text)] mt-1 flex items-center gap-1">
                <MapPin size={10} />
                {user?.sede || 'Sede no establecida'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-full px-6 mb-4">
         <div className="border-t border-[var(--sidebar-border)] w-full"></div>
      </div>

      {/* Main Menu Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar">

        <nav className="px-4 space-y-1">
          {/* Dashboard Item */}
          <button
            onClick={() => navigate(`/${role}/dashboard`)}
            className={`w-full flex items-center rounded-lg transition-all duration-200 ${
              isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
            } ${
              location.pathname.includes('/dashboard')
                ? 'bg-[#C4933F] text-white font-semibold'
                : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-hover)]'
            }`}
            title={!isExpanded ? "Dashboard" : undefined}
          >
            <LayoutGrid size={18} className="shrink-0" strokeWidth={1.8} />
            {isExpanded && <span className="ml-3 text-sm whitespace-nowrap">Dashboard</span>}
          </button>

          {role === 'admin' ? (
            /* Menú Administrador */
            <div className="pt-1 space-y-1">
              {/* Contribuyentes Collapsible */}
              <button
                onClick={toggleContribuyentes}
                className={`w-full flex items-center justify-between rounded-lg text-[var(--sidebar-text-hover)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 ${
                  isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
                }`}
                title={!isExpanded ? "Contribuyentes" : undefined}
              >
                <div className="flex items-center">
                  <Users size={18} className="shrink-0" strokeWidth={1.8} />
                  {isExpanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">Contribuyentes</span>}
                </div>
                {isExpanded && (
                  isContribuyentesOpen ? <ChevronDown size={15} className="text-[var(--sidebar-text)]" /> : <ChevronRight size={15} className="text-[var(--sidebar-text)]" />
                )}
              </button>

              {/* Sub-items Contribuyentes Admin */}
              {isExpanded && isContribuyentesOpen && (
                <div className="mt-1 ml-4 py-1 space-y-1">
                  <SubMenuItem 
                    isActive={location.pathname === '/admin/contribuyentes'} 
                    icon={<ClipboardList size={16} />} 
                    label="Lista de contribuyentes" 
                    onClick={() => navigate('/admin/contribuyentes')}
                  />
                  <SubMenuItem 
                    isActive={location.pathname === '/admin/contribuyentes/rubros'} 
                    icon={<Tags size={16} />} 
                    label="Rubros" 
                    onClick={() => navigate('/admin/contribuyentes/rubros')} 
                  />
                  <SubMenuItem 
                    isActive={location.pathname === '/admin/contribuyentes/tipos-credencial'} 
                    icon={<KeyRound size={16} />} 
                    label="Tipos de credenciales" 
                    onClick={() => navigate('/admin/contribuyentes/tipos-credencial')} 
                  />
                  <SubMenuItem 
                    isActive={location.pathname === '/admin/contribuyentes/tipos-telefono'} 
                    icon={<Smartphone size={16} />} 
                    label="Tipos de teléfono" 
                    onClick={() => navigate('/admin/contribuyentes/tipos-telefono')} 
                  />
                  <SubMenuItem 
                    isActive={location.pathname === '/admin/contribuyentes/tipos-documento'} 
                    icon={<SlidersHorizontal size={16} />} 
                    label="Tipos de documentos" 
                    onClick={() => navigate('/admin/contribuyentes/tipos-documento')} 
                  />
                </div>
              )}

              <button
                onClick={toggleConfig}
                className={`w-full flex items-center justify-between rounded-lg text-[var(--sidebar-text-hover)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 mt-1 ${
                  isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
                }`}
                title={!isExpanded ? "Configuración" : undefined}
              >
                <div className="flex items-center">
                  <Settings size={18} className="shrink-0" strokeWidth={1.8} />
                  {isExpanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">Configuración</span>}
                </div>
                {isExpanded && (
                  isConfigOpen ? <ChevronDown size={15} className="text-[var(--sidebar-text)]" /> : <ChevronRight size={15} className="text-[var(--sidebar-text)]" />
                )}
              </button>

              {/* Sub-items Admin */}
              {isExpanded && isConfigOpen && (
                <div className="mt-1 ml-4 py-1 space-y-1">
                  <SubMenuItem isActive={location.pathname.includes('/admin/usuarios')} icon={<Users size={16} />} label="Usuarios" onClick={() => navigate('/admin/usuarios')} />
                  <SubMenuItem isActive={location.pathname.includes('/admin/sedes')} icon={<MapPin size={16} />} label="Sedes" onClick={() => navigate('/admin/sedes')} />
                  <SubMenuItem isActive={location.pathname.includes('/admin/cajas')} icon={<Wallet size={16} />} label="Tipos de Caja" onClick={() => navigate('/admin/cajas')} />
                  <SubMenuItem isActive={location.pathname.includes('/admin/empresas')} icon={<Landmark size={16} />} label="Empresas" onClick={() => navigate('/admin/empresas')} />
                  <SubMenuItem isActive={location.pathname.includes('/admin/aprobaciones')} icon={<SlidersHorizontal size={16} />} label="Movimientos" onClick={() => navigate('/admin/aprobaciones')} />
                </div>
              )}
            </div>
          ) : (
            /* Menú Cajero */
            <>
              <button
                onClick={() => navigate('/cajero/movimientos')}
                className={`w-full flex items-center rounded-lg transition-all duration-200 mt-1 ${
                  isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
                } ${
                  location.pathname.includes('/cajero/movimientos')
                    ? 'bg-[#C4933F] text-white font-semibold'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-hover)]'
                }`}
                title={!isExpanded ? "Movimientos" : undefined}
              >
                <Wallet size={18} className="shrink-0" strokeWidth={1.8} />
                {isExpanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">Movimientos</span>}
              </button>

              {/* Contribuyentes Collapsible */}
              <button
                onClick={toggleContribuyentes}
                className={`w-full flex items-center justify-between rounded-lg text-[var(--sidebar-text-hover)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 mt-1 ${
                  isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
                }`}
                title={!isExpanded ? "Contribuyentes" : undefined}
              >
                <div className="flex items-center">
                  <Users size={18} className="shrink-0" strokeWidth={1.8} />
                  {isExpanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">Contribuyentes</span>}
                </div>
                {isExpanded && (
                  isContribuyentesOpen ? <ChevronDown size={15} className="text-[var(--sidebar-text)]" /> : <ChevronRight size={15} className="text-[var(--sidebar-text)]" />
                )}
              </button>

              {/* Sub-items Contribuyentes Cajero */}
              {isExpanded && isContribuyentesOpen && (
                <div className="mt-1 ml-4 py-1 space-y-1">
                  <SubMenuItem 
                    isActive={location.pathname === '/cajero/contribuyentes'} 
                    icon={<ClipboardList size={16} />} 
                    label="Lista de contribuyentes" 
                    onClick={() => navigate('/cajero/contribuyentes')}
                  />
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="px-3 border-t border-[var(--sidebar-border)] pt-3 space-y-1 mt-auto">
        {/* Modo Claro Toggle */}
        <div 
          className={`w-full flex items-center rounded-lg text-[var(--sidebar-text-hover)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 cursor-pointer ${
            isExpanded ? 'px-3 py-2.5 justify-between' : 'p-3 justify-center'
          }`}
          onClick={toggleTheme}
          title={!isExpanded ? (isLightMode ? 'Modo Oscuro' : 'Modo Claro') : undefined}
        >
          <div className="flex items-center">
            <Sun size={18} className="shrink-0" strokeWidth={1.8} />
            {isExpanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">{isLightMode ? 'Modo Oscuro' : 'Modo Claro'}</span>}
          </div>
          {isExpanded && (
            <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors duration-300 ${isLightMode ? 'bg-[#C4933F]' : 'bg-[var(--sidebar-border)]'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transform transition-transform duration-300 ${isLightMode ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          )}
        </div>

        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center rounded-lg text-[var(--sidebar-text-hover)] hover:bg-[var(--sidebar-hover)] transition-all duration-200 ${
            isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
          }`}
          title={!isExpanded ? "Cerrar Sesión" : undefined}
        >
          <LogOut size={18} className="shrink-0" strokeWidth={1.8} />
          {isExpanded && <span className="ml-3 font-medium text-sm whitespace-nowrap">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
};

interface SubMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
  actionIcon?: React.ReactNode;
  actionTitle?: string;
  onActionClick?: (e: React.MouseEvent) => void;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ 
  icon, 
  label, 
  onClick, 
  isActive,
  actionIcon,
  actionTitle,
  onActionClick
}) => {
  return (
    <div className="relative group/item flex items-center w-full">
      <button 
        onClick={onClick} 
        className={`w-full flex items-center px-3 py-2 rounded-md transition-colors duration-200 ${
          isActive 
            ? 'bg-[#C4933F] text-white font-semibold' 
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-hover)]'
        }`}
      >
        <div className={isActive ? 'text-white' : 'text-[var(--sidebar-text)] group-hover/item:text-[var(--sidebar-text-hover)] transition-colors'}>
          {icon}
        </div>
        <span className="ml-3 text-sm whitespace-nowrap pr-8">
          {label}
        </span>
      </button>
      {actionIcon && onActionClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActionClick(e);
          }}
          className={`absolute right-2 p-1 rounded-md transition-all duration-200 cursor-pointer ${
            isActive 
              ? 'text-white/80 hover:text-white hover:bg-white/10' 
              : 'text-[var(--sidebar-text)] hover:text-[#C4933F] hover:bg-[var(--sidebar-hover)]'
          }`}
          title={actionTitle}
        >
          {actionIcon}
        </button>
      )}
    </div>
  );
};

export default Sidebar;
