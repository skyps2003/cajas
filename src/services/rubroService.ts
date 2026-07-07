export interface RubroResponse {
  id: number;
  nombre_rubro: string;
  codigo_sunat: string;
  descripcion: string;
  tipo_detraccion: string | null;
  estado: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = '/api';

export const rubroService = {
  getAll: async (token: string): Promise<RubroResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rubros`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<RubroResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll Rubros):', error);
      throw new Error(`Error al obtener rubros: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, payload: any): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rubros`, {
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
      console.error('API Error (create Rubro):', error);
      throw new Error(`Error al crear rubro: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, payload: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rubros/${id}`, {
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
      console.error(`API Error (update Rubro ${id}):`, error);
      throw new Error(`Error al actualizar rubro: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rubros/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete Rubro ${id}):`, error);
      throw new Error(`Error al eliminar rubro: ${error.message || 'Desconocido'}`);
    }
  },

  toggleStatus: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rubros/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (toggleStatus Rubro ${id}):`, error);
      throw new Error(`Error al cambiar estado: ${error.message || 'Desconocido'}`);
    }
  }
};
