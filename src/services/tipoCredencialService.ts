export interface TipoCredencialResponse {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const tipoCredencialService = {
  getAll: async (token: string): Promise<TipoCredencialResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-credenciales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<TipoCredencialResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll Tipos Credenciales):', error);
      throw new Error(`Error al obtener tipos de credenciales: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, payload: any): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-credenciales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result.id || 0;
    } catch (error: any) {
      console.error('API Error (create Tipo Credencial):', error);
      throw new Error(`Error al crear tipo de credencial: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, payload: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-credenciales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (update Tipo Credencial ${id}):`, error);
      throw new Error(`Error al actualizar tipo de credencial: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-credenciales/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete Tipo Credencial ${id}):`, error);
      throw new Error(`Error al eliminar tipo de credencial: ${error.message || 'Desconocido'}`);
    }
  },

  toggleStatus: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-credenciales/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (toggleStatus Tipo Credencial ${id}):`, error);
      throw new Error(`Error al cambiar estado: ${error.message || 'Desconocido'}`);
    }
  }
};

