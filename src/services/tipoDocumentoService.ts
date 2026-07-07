export interface TipoDocumentoResponse {
  id: number;
  nombre_tipo_documento: string;
  descripcion: string;
  formatos_permitidos: string;
  obligatorio: number | boolean | string;
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

const API_BASE_URL = '/api';

export const tipoDocumentoService = {
  getAll: async (token: string): Promise<TipoDocumentoResponse[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-documentos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const result: ApiResponse<TipoDocumentoResponse[]> = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getAll Tipos Documentos):', error);
      throw new Error(`Error al obtener tipos de documentos: ${error.message || 'Desconocido'}`);
    }
  },

  create: async (token: string, payload: any): Promise<number> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-documentos`, {
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
      console.error('API Error (create Tipo Documento):', error);
      throw new Error(`Error al crear tipo de documento: ${error.message || 'Desconocido'}`);
    }
  },

  update: async (token: string, id: number, payload: any): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-documentos/${id}`, {
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
      console.error(`API Error (update Tipo Documento ${id}):`, error);
      throw new Error(`Error al actualizar tipo de documento: ${error.message || 'Desconocido'}`);
    }
  },

  delete: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-documentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (delete Tipo Documento ${id}):`, error);
      throw new Error(`Error al eliminar tipo de documento: ${error.message || 'Desconocido'}`);
    }
  },

  toggleStatus: async (token: string, id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/tipos-documentos/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      console.error(`API Error (toggleStatus Tipo Documento ${id}):`, error);
      throw new Error(`Error al cambiar estado: ${error.message || 'Desconocido'}`);
    }
  }
};
