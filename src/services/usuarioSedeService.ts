export interface UsuarioSedeResponse {
  id: number;
  usuario_id: number;
  usuario: string;
  sede_id: number;
  sede: string;
  estado: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const usuarioSedeService = {
  getAll: async (token: string): Promise<UsuarioSedeResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario-sede`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<UsuarioSedeResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll UsuarioSede):', error);
      throw new Error(`Error al obtener asignaciones: ${error.message || 'Desconocido'}`);
    }
  },

  getById: async (token: string, id: number): Promise<UsuarioSedeResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario-sede/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<UsuarioSedeResponse> = await response.json();
      if (!result.data) throw new Error('Asignación not found');
      return result.data;
    } catch (error: any) {
      console.error(`API Error (getById UsuarioSede ${id}):`, error);
      throw new Error(`Error al obtener asignación: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, data: { usuario_id: number; sede_id: number }): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario-sede`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result.id;
    } catch (error: any) {
      console.error('API Error (create UsuarioSede):', error);
      throw new Error(`Error al crear asignación: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, data: { usuario_id: number; sede_id: number }): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario-sede/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (update UsuarioSede ${id}):`, error);
      throw new Error(`Error al actualizar asignación: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario-sede/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete UsuarioSede ${id}):`, error);
      throw new Error(`Error al eliminar asignación: ${error.message || 'Desconocido'}`);
    }
  },

  updateEstado: async (token: string, id: number, estado: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuario-sede/estado/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error(`API Error (updateEstado UsuarioSede ${id}):`, error);
      return { success: false, message: `Error al cambiar estado de asignación: ${error.message || 'Desconocido'}` };
    }
  }
};

