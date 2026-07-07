export interface ContribuyenteResponse {
  id: number;
  id_sede: number;
  sede?: string;
  sede_nombre?: string;
  razon_social: string;
  ruc: string;
  correo: string;
  direccion: string;
  tipo_ruc: number;
  observaciones?: string;
  estado: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE_URL = '/api';

export const contribuyenteService = {
  getAll: async (token: string): Promise<ContribuyenteResponse[]> => {
    try {
      const sedeId = localStorage.getItem('sede_id');
      const url = sedeId ? `${API_BASE_URL}/contribuyentes/?sede_id=${sedeId}` : `${API_BASE_URL}/contribuyentes/`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<ContribuyenteResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll Contribuyentes):', error);
      throw new Error(`Error al obtener contribuyentes: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, contribuyente: any): Promise<number> => {
    try {
      const sedeId = localStorage.getItem('sede_id');
      const body = {
        ...contribuyente,
        id_sede: contribuyente.id_sede || Number(sedeId)
      };

      if (!body.id_sede) {
        throw new Error('Debe seleccionar una sede');
      }

      const response = await fetch(`${API_BASE_URL}/contribuyentes/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result.id;
    } catch (error: any) {
      console.error('API Error (create Contribuyente):', error);
      throw new Error(`Error al crear contribuyente: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, contribuyente: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contribuyentes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contribuyente),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (update Contribuyente ${id}):`, error);
      throw new Error(`Error al actualizar contribuyente: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contribuyentes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete Contribuyente ${id}):`, error);
      throw new Error(`Error al eliminar contribuyente: ${error.message || 'Desconocido'}`);
    }
  },

  toggleStatus: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contribuyentes/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error(`API Error (toggleStatus Contribuyente ${id}):`, error);
      throw new Error(`Error al cambiar estado de contribuyente: ${error.message || 'Desconocido'}`);
    }
  }
};
