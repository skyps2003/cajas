export interface TipoComprobante {
  id: number;
  nombre: string;
  estado: boolean;
}

const API_URL = '/api';

export const TipoComprobanteService = {
  getTiposComprobante: async (token: string): Promise<{ success: boolean; data?: TipoComprobante[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching tipo comprobantes:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  createTipoComprobante: async (token: string, data: { nombre: string }): Promise<{ success: boolean; message?: string; id?: number }> => {
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

  getTipoComprobanteById: async (token: string, id: number): Promise<{ success: boolean; data?: TipoComprobante; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/tipo-comprobante/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching tipo comprobante by id:', error);
      return { success: false, message: 'Error de red' };
    }
  }
};
