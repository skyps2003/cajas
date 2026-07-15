export interface MovimientoResponse {
  id: number;
  empresa_id?: number;
  caja_id?: number;
  tipo_comprobante_id?: number;
  empresa?: string;
  caja?: string;
  tipo_comprobante?: string;
  nombre?: string;
  apellido?: string;
  sede?: string;
  tipo_movimiento: boolean; // true = INGRESO, false = EGRESO
  monto: number;
  fecha?: string;
  hora?: string;
  descripcion?: string;
  serie?: string;
  correlativo?: string;
  ruc?: string;
  razon_social?: string;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
  };
  factura?: {
    ruc: string;
    razon_social: string;
    serie: string;
    correlativo: string;
  };
  boleta?: {
    serie: string;
    correlativo: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const movimientoService = {
  getMovimientosBySede: async (token: string, sedeId: number): Promise<{ success: boolean; data?: MovimientoResponse[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/sede/${sedeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data)) {
        result.data = result.data.map((m: any) => ({
          ...m,
          monto: Number(m.monto),
          tipo_movimiento: m.tipo_movimiento === 1 || m.tipo_movimiento === true
        }));
      } else {
        result.data = [];
      }
      return result;
    } catch (error) {
      console.error(`Error fetching movimientos for sede ${sedeId}:`, error);
      return { success: false, message: 'Error de red' };
    }
  },

  getMovimientos: async (token: string): Promise<{ success: boolean; data?: MovimientoResponse[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data.data)) {
        result.data = result.data.data.map((m: any) => ({
          ...m,
          monto: Number(m.monto),
          tipo_movimiento: m.tipo_movimiento === 1 || m.tipo_movimiento === true
        }));
      } else if (result.success && result.data && Array.isArray(result.data)) {
        result.data = result.data.map((m: any) => ({
          ...m,
          monto: Number(m.monto),
          tipo_movimiento: m.tipo_movimiento === 1 || m.tipo_movimiento === true
        }));
      } else {
        result.data = [];
      }
      return result;
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      return { success: false, message: 'Error de red al obtener movimientos' };
    }
  },

  getMovimientoById: async (token: string, id: number): Promise<{ success: boolean; data?: MovimientoResponse; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data) {
        result.data.monto = Number(result.data.monto);
        result.data.tipo_movimiento = result.data.tipo_movimiento === 1 || result.data.tipo_movimiento === true;
      }
      return result;
    } catch (error) {
      console.error('Error fetching movimiento por id:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  createMovimiento: async (token: string, data: Partial<MovimientoResponse>): Promise<{ success: boolean; message?: string; id?: number }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating movimiento:', error);
      return { success: false, message: 'Error de red al registrar movimiento' };
    }
  },

  updateMovimiento: async (token: string, id: number, data: Partial<MovimientoResponse>): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating movimiento:', error);
      return { success: false, message: 'Error de red al actualizar movimiento' };
    }
  },

  deleteMovimiento: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting movimiento:', error);
      return { success: false, message: 'Error de red al eliminar movimiento' };
    }
  },

  getMovimientosCerrados: async (token: string): Promise<{ success: boolean; data?: MovimientoResponse[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/cerrados/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data)) {
        result.data = result.data.map((m: any) => ({
          ...m,
          monto: Number(m.monto),
          tipo_movimiento: m.tipo_movimiento === 1 || m.tipo_movimiento === true
        }));
      } else {
        result.data = [];
      }
      return result;
    } catch (error) {
      console.error('Error fetching movimientos cerrados:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  getMovimientosCerradosBySede: async (token: string, sedeId: number): Promise<{ success: boolean; data?: MovimientoResponse[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/cerrados/usuario-sede/${sedeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data)) {
        result.data = result.data.map((m: any) => ({
          ...m,
          monto: Number(m.monto),
          tipo_movimiento: m.tipo_movimiento === 1 || m.tipo_movimiento === true
        }));
      } else {
        result.data = [];
      }
      return result;
    } catch (error) {
      console.error(`Error fetching movimientos cerrados for sede ${sedeId}:`, error);
      return { success: false, message: 'Error de red' };
    }
  }
};

