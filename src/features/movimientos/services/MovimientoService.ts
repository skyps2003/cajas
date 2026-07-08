export interface Movimiento {
  id?: number;
  empresa_id?: number;
  usuario_sede_id?: number;
  caja_id: number;
  tipo_comprobante_id: number;
  tipo_movimiento: boolean; // true = INGRESO, false = EGRESO
  monto: number;
  descripcion: string;
  ruc?: string;
  razon_social?: string;
  serie?: string;
  correlativo?: string;
  fecha?: string; // or created_at
  hora?: string;
  empresa?: string;
  caja?: string;
  tipo_comprobante?: string;
  updated_at?: string;
  estado?: boolean;
  usuario_id?: number;
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

export const MovimientoService = {
  getMovimientos: async (token: string, filters?: { empresa_id?: number; caja_id?: number; tipo_movimiento?: boolean; fecha_desde?: string; fecha_hasta?: string }): Promise<{ success: boolean; data?: Movimiento[]; message?: string }> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.empresa_id) queryParams.append('empresa_id', String(filters.empresa_id));
        if (filters.caja_id) queryParams.append('caja_id', String(filters.caja_id));
        if (filters.tipo_movimiento !== undefined) queryParams.append('tipo_movimiento', String(filters.tipo_movimiento));
        if (filters.fecha_desde) queryParams.append('fecha_desde', filters.fecha_desde);
        if (filters.fecha_hasta) queryParams.append('fecha_hasta', filters.fecha_hasta);
      }
      const qs = queryParams.toString();
      const url = qs ? `${API_URL}/movimiento?${qs}` : `${API_URL}/movimiento`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  getMovimientosBySede: async (token: string, sedeId: number, filters?: { fecha_inicio?: string; fecha_fin?: string }): Promise<{ success: boolean; data?: Movimiento[]; message?: string }> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
        if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
      }
      const qs = queryParams.toString();
      const cacheBuster = `_t=${new Date().getTime()}`;
      const finalQs = qs ? `${qs}&${cacheBuster}` : cacheBuster;
      const url = `${API_URL}/movimiento/sede/${sedeId}?${finalQs}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching movimientos by sede:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  getMovimientoById: async (token: string, id: number): Promise<{ success: boolean; data?: Movimiento; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching movimiento by id:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  createMovimiento: async (token: string, data: Omit<Movimiento, 'id' | 'estado'>): Promise<{ success: boolean; message?: string; id?: number }> => {
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
      return { success: false, message: 'Error de red' };
    }
  },

  updateMovimiento: async (token: string, id: number, data: Partial<Movimiento>): Promise<{ success: boolean; message?: string }> => {
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
      return { success: false, message: 'Error de red' };
    }
  },

  deleteMovimiento: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting movimiento:', error);
      return { success: false, message: 'Error de red' };
    }
  }
};

