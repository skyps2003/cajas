export interface UsuarioResponse {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: number;
  estado: boolean | number;
  imagen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const usuarioService = {
  getAll: async (token: string): Promise<UsuarioResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<UsuarioResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll Usuarios):', error);
      throw new Error(`Error al obtener usuarios: ${error.message || 'Desconocido'}`);
    }
  },

  getById: async (token: string, id: number): Promise<UsuarioResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<UsuarioResponse> = await response.json();
      if (!result.data) throw new Error('Usuario not found');
      return result.data;
    } catch (error: any) {
      console.error(`API Error (getById Usuario ${id}):`, error);
      throw new Error(`Error al obtener usuario: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, usuario: any): Promise<number> => {
    try {
      const formData = new FormData();
      Object.keys(usuario).forEach(key => {
        if (usuario[key] !== undefined && usuario[key] !== null) {
          formData.append(key, usuario[key] instanceof File ? usuario[key] : String(usuario[key]));
        }
      });

      const response = await fetch(`${API_BASE_URL}/usuario`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result.id;
    } catch (error: any) {
      console.error('API Error (create Usuario):', error);
      throw new Error(`Error al crear usuario: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, usuario: any): Promise<void> => {
    try {
      const formData = new FormData();
      Object.keys(usuario).forEach(key => {
        if (usuario[key] !== undefined && usuario[key] !== null) {
          formData.append(key, usuario[key] instanceof File ? usuario[key] : String(usuario[key]));
        }
      });

      const response = await fetch(`${API_BASE_URL}/usuario/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (update Usuario ${id}):`, error);
      throw new Error(`Error al actualizar usuario: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete Usuario ${id}):`, error);
      throw new Error(`Error al eliminar usuario: ${error.message || 'Desconocido'}`);
    }
  },

  toggleStatus: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error(`API Error (toggleStatus Usuario ${id}):`, error);
      throw new Error(`Error al cambiar estado de usuario: ${error.message || 'Desconocido'}`);
    }
  },

  changePassword: async (token: string, id: number, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/password/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ password })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (changePassword Usuario ${id}):`, error);
      throw new Error(`Error al cambiar contraseña: ${error.message || 'Desconocido'}`);
    }
  },

  updateProfile: async (token: string, data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  changeProfilePassword: async (token: string, data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario/profile/password`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password_actual: data.currentPassword,
          password_nueva: data.newPassword
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error changing profile password:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  uploadImage: async (token: string, file: File): Promise<{ success: boolean; url?: string; message?: string }> => {
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const response = await fetch(`${API_BASE_URL}/usuario/upload`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Error en servidor al subir imagen');
      const result = await response.json();
      return { success: true, url: result.url || result.path || result.imagen };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, message: 'Error subiendo imagen' };
    }
  }
};

