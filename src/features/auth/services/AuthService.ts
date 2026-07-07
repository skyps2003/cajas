export interface ApiUser {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: number;
  estado?: boolean;
  imagen?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: ApiUser;
}

const API_URL = '/api';

export const AuthService = {
  login: async (correo: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, password }),
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Error de conexión con el servidor.',
      };
    }
  },

  getProfile: async (token: string): Promise<{ success: boolean; user?: ApiUser; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      let user = data.user || data.usuario || (data.data && data.data.user) || (data.data && data.data.usuario) || data.data;
      if (!user && data.id) {
        user = data;
      }
      
      const success = data.success !== false && !!user;
      
      return { ...data, success, user };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  },

  verifyEmailForRecovery: async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error solicitar OTP:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  verifyOtp: async (email: string, otp: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, otp }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validar OTP:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  resetPassword: async (email: string, otp: string, password: string, confirmPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, otp, password, confirmPassword }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error restablecer contraseña:', error);
      return { success: false, message: 'Error de conexión con el servidor.' };
    }
  },

  getMisSedes: async (token: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/mis-sedes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching mis-sedes:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }
};
