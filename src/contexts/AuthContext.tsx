import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../features/auth/services/AuthService';


type UserRole = 'admin' | 'cajero';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  imagen?: string;
  sede?: string;
  sedeId?: number;
  // Datos de sesión cajero
  empresaId?: number;
  usuarioSedeId?: number;
  cajaId?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        // Option 1: Validate token and fetch profile
        const response = await AuthService.getProfile(storedToken);
        if (response.success && response.user) {
          
          // Fetch sede just like in login
          let sedeName: string | undefined;
          let sedeId: number | undefined;
          
          if (response.user.rol === 2) { // 2 = Cajero
            try {
              const sedesData = await AuthService.getMisSedes(storedToken);
              const savedSedeId = localStorage.getItem('sede_id');
              
              if (sedesData.success && sedesData.data && sedesData.data.length > 0) {
                let miSede = sedesData.data.find((s: any) => String(s.sede_id) === savedSedeId);
                
                if (!miSede) {
                  // Fallback to first if none saved
                  miSede = sedesData.data[0];
                }
                
                if (miSede) {
                  sedeName = miSede.sede_nombre;
                  sedeId = miSede.sede_id;
                  localStorage.setItem('sede_id', String(miSede.sede_id));
                  localStorage.setItem('sede_nombre', miSede.sede_nombre);
                  localStorage.setItem('usuario_sede_id', String(miSede.usuario_sede_id));
                }
              }
            } catch (e) {
              console.error('Error fetching sede on init:', e);
            }
          }

          const savedUsuarioSedeId = localStorage.getItem('usuario_sede_id');

          setUser({
            id: String(response.user.id),
            name: `${response.user.nombre} ${response.user.apellido}`,
            email: response.user.correo,
            role: response.user.rol === 1 ? 'admin' : 'cajero',
            token: storedToken,
            imagen: response.user.imagen,
            sede: sedeName,
            sedeId: sedeId,
            usuarioSedeId: savedUsuarioSedeId ? Number(savedUsuarioSedeId) : undefined,
          });
        } else {
          console.error('Fallo al inicializar la sesión:', response);
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData: User, token: string) => {
    setUser({ ...userData, token });
    localStorage.setItem('auth_token', token);
    if (userData.usuarioSedeId) localStorage.setItem('usuario_sede_id', String(userData.usuarioSedeId));
    if (userData.sedeId) localStorage.setItem('sede_id', String(userData.sedeId));
    if (userData.sede) localStorage.setItem('sede_nombre', userData.sede);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario_sede_id');
    localStorage.removeItem('sede_id');
    localStorage.removeItem('sede_nombre');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
