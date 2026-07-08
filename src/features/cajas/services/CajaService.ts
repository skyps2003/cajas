export interface Caja {
  id: number;
  nombre: string;
  codigo: string;
  saldo: number;
  monto_min: number;
  monto_max: number;
  estado: boolean;
  color?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const CajaService = {
  getCajas: async (token: string): Promise<{ success: boolean; data?: Caja[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/caja`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching cajas:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  getCajasSedeSaldos: async (
    token: string
  ): Promise<{ success: boolean; data?: Caja[]; message?: string }> => {
    try {
      const sedeId = localStorage.getItem('selected_sede_id');

      if (!sedeId) {
        return {
          success: false,
          message: 'No hay sede seleccionada'
        };
      }

      const response = await fetch(
        `${API_URL}/caja/sede-saldos?sede_id=${sedeId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return await response.json();

    } catch (error) {
      console.error('Error fetching cajas sede saldos:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  getCajasSedeSaldosById: async (token: string, sedeId: number): Promise<{ success: boolean; data?: Caja[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/caja/sede-saldos/${sedeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching cajas sede saldos by id:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  createCaja: async (token: string, data: Omit<Caja, 'id' | 'estado'>): Promise<{ success: boolean; message?: string; id?: number }> => {
    try {
      const response = await fetch(`${API_URL}/caja`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating caja:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  updateCaja: async (token: string, id: number, data: Partial<Caja>): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/caja/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating caja:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  deleteCaja: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/caja/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting caja:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  toggleStatus: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/caja/deactivate/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error toggling status:', error);
      return { success: false, message: 'Error de red' };
    }
  }
};

