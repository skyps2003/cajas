export interface SedeResponse {
  id: number;
  nombre: string;
  direccion: string;
  color: string;
  latitud?: string | null;
  longitud?: string | null;
  estado: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api'; // Actualizado con URL de producción

export const sedeService = {
  getAll: async (token: string): Promise<SedeResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sede`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<SedeResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll):', error);
      throw new Error(`Error al obtener sedes: ${error.message || 'Desconocido'}`);
    }
  },

  getById: async (token: string, id: number): Promise<SedeResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sede/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<SedeResponse> = await response.json();
      if (!result.data) throw new Error('Sede not found');
      return result.data;
    } catch (error: any) {
      console.error(`API Error (getById ${id}):`, error);
      throw new Error(`Error al obtener sede: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, sede: Partial<SedeResponse>): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sede`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sede),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result.id;
    } catch (error: any) {
      console.error('API Error (create):', error);
      throw new Error(`Error al crear sede: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, sede: Partial<SedeResponse>): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sede/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sede),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (update ${id}):`, error);
      throw new Error(`Error al actualizar sede: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sede/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete ${id}):`, error);
      throw new Error(`Error al eliminar sede: ${error.message || 'Desconocido'}`);
    }
  },

  toggleStatus: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sede/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error en el servidor');
    } catch (error: any) {
      console.error(`API Error (toggleStatus ${id}):`, error);
      throw new Error(`Error al cambiar estado de sede: ${error.message || 'Desconocido'}`);
    }
  }
};

