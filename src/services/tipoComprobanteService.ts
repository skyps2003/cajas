export interface TipoComprobante {
  id: number;
  nombre: string;
  estado: boolean;
}

const API_URL = '/api';

export const tipoComprobanteService = {
  getTipos: async (token: string): Promise<{ success: boolean; data?: TipoComprobante[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching tipos de comprobante:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  createTipo: async (token: string, data: { nombre: string }): Promise<{ success: boolean; message?: string; id?: number }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating tipo comprobante:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  updateTipo: async (token: string, id: number, data: { nombre: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating tipo comprobante:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  deleteTipo: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting tipo comprobante:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  toggleStatus: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error toggling tipo comprobante status:', error);
      return { success: false, message: 'Error de red' };
    }
  }
};
