export interface TipoTelefonoResponse {
  id: number;
  nombre: string;
  estado: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  id?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const tipoTelefonoService = {
  getAll: async (token: string): Promise<TipoTelefonoResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-telefonos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<TipoTelefonoResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll Tipos Telefonos):', error);
      throw new Error(`Error al obtener tipos de teléfonos: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, payload: any): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-telefonos`, {
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
      const result: ApiResponse<any> = await response.json();
      return result.id || 0;
    } catch (error: any) {
      console.error('API Error (create Tipo Telefono):', error);
      throw new Error(`Error al crear tipo de teléfono: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, payload: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-telefonos/${id}`, {
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
      console.error(`API Error (update Tipo Telefono ${id}):`, error);
      throw new Error(`Error al actualizar tipo de teléfono: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-telefonos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete Tipo Telefono ${id}):`, error);
      throw new Error(`Error al eliminar tipo de teléfono: ${error.message || 'Desconocido'}`);
    }
  }
};

