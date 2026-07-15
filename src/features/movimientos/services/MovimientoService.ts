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
    serie?: string;
    correlativo: string;
    recibidode?: string;
  };
  recibidode?: string;
  cambio?: string;
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
      const url = qs ? `${API_URL}/movimiento/sede/${sedeId}?${qs}` : `${API_URL}/movimiento/sede/${sedeId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
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
  },

  cerrarCaja: async (token: string, usuarioSedeId: number): Promise<{
    success: boolean;
    message?: string;
    data?: {
      usuario_sede_id: number;
      sede_id: number;
      fecha_cierre: string;
      movimientos_cerrados: number;
      total_ingresos: number;
      total_egresos: number;
      saldo_cierre: number;
      cajas: Array<{
        caja_id: number;
        caja: string;
        movimientos_cerrados: number;
        total_ingresos: number;
        total_egresos: number;
        saldo_cierre: number;
        saldo_anterior: number;
        saldo_nuevo: number;
      }>;
    };
  }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/cerrar-caja`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuario_sede_id: usuarioSedeId })
      });
      return await response.json();
    } catch (error) {
      console.error('Error cerrando caja:', error);
      return { success: false, message: 'Error de red al cerrar caja' };
    }
  },

  getCierresBySede: async (token: string, sedeId: number): Promise<{
    success: boolean;
    message?: string;
    data?: Array<{
      id: number;
      sede_id: number;
      usuario_sede_id: number;
      fecha_cierre: string;
      movimientos_cerrados: number;
      total_ingresos: number;
      total_egresos: number;
      saldo_cierre: number;
      movimientos_ids: number[];
      usuario?: { nombre: string; apellido: string };
      cajas?: Array<{
        caja_id: number;
        caja: string;
        total_ingresos: number;
        total_egresos: number;
        saldo_cierre: number;
      }>;
    }>;
  }> => {
    try {
      // Como el endpoint /usuario-sede/ bloquea a los Administradores que no pertenecen a la sede,
      // usamos el endpoint global y filtramos localmente para evitar el error.
      const response = await fetch(`${API_URL}/movimiento/cerrados/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        return { success: false, message: result.message || 'Error al obtener datos' };
      }

      // Filtramos por sede en el frontend
      const movimientosSede = result.data.filter((m: any) => String(m.sede_id) === String(sedeId));

      const cierresMap = new Map<string, any>();
      
      movimientosSede.forEach((mov: any) => {
        const fecha = mov.updated_at;
        if (!fecha) return;

        if (!cierresMap.has(fecha)) {
          cierresMap.set(fecha, {
            id: new Date(fecha).getTime(), // Generar un ID único basado en el timestamp
            sede_id: mov.sede_id,
            usuario_sede_id: mov.usuario_sede_id,
            fecha_cierre: fecha,
            movimientos_cerrados: 0,
            total_ingresos: 0,
            total_egresos: 0,
            saldo_cierre: 0,
            movimientos_ids: [],
            usuario: mov.usuario,
            cajasMap: new Map<number, any>()
          });
        }
        
        const cierre = cierresMap.get(fecha);
        const monto = Number(mov.monto) || 0;
        const isIngreso = mov.tipo_movimiento === 1 || mov.tipo_movimiento === true;

        cierre.movimientos_cerrados += 1;
        if (mov.id) cierre.movimientos_ids.push(mov.id);
        if (isIngreso) {
          cierre.total_ingresos += monto;
          cierre.saldo_cierre += monto;
        } else {
          cierre.total_egresos += monto;
          cierre.saldo_cierre -= monto;
        }

        if (mov.caja_id) {
          if (!cierre.cajasMap.has(mov.caja_id)) {
            cierre.cajasMap.set(mov.caja_id, {
              caja_id: mov.caja_id,
              caja: mov.caja || 'Caja',
              total_ingresos: 0,
              total_egresos: 0,
              saldo_cierre: 0
            });
          }
          const cajaStats = cierre.cajasMap.get(mov.caja_id);
          if (isIngreso) {
            cajaStats.total_ingresos += monto;
            cajaStats.saldo_cierre += monto;
          } else {
            cajaStats.total_egresos += monto;
            cajaStats.saldo_cierre -= monto;
          }
        }
      });

      const cierresArray = Array.from(cierresMap.values()).map(c => {
        const cajas = Array.from(c.cajasMap.values());
        delete c.cajasMap;
        return { ...c, cajas };
      });

      return { success: true, data: cierresArray };

    } catch (error) {
      console.error('Error fetching cierres:', error);
      return { success: false, message: 'Error de red al obtener cierres' };
    }
  },

  getAllCierres: async (token: string): Promise<{
    success: boolean;
    message?: string;
    data?: Array<{
      id: number;
      sede_id: number;
      sede?: string;
      usuario_sede_id: number;
      fecha_cierre: string;
      movimientos_cerrados: number;
      total_ingresos: number;
      total_egresos: number;
      saldo_cierre: number;
      movimientos_ids: number[];
      usuario?: { nombre: string; apellido: string };
      cajas?: Array<{
        caja_id: number;
        caja: string;
        total_ingresos: number;
        total_egresos: number;
        saldo_cierre: number;
      }>;
    }>;
  }> => {
    try {
      const response = await fetch(`${API_URL}/movimiento/cerrados/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        return { success: false, message: result.message || 'Error al obtener datos' };
      }

      const cierresMap = new Map<string, any>();
      
      result.data.forEach((mov: any) => {
        const fecha = mov.updated_at;
        if (!fecha) return;

        if (!cierresMap.has(fecha)) {
          cierresMap.set(fecha, {
            id: new Date(fecha).getTime(),
            sede_id: mov.sede_id,
            sede: mov.sede,
            usuario_sede_id: mov.usuario_sede_id,
            fecha_cierre: fecha,
            movimientos_cerrados: 0,
            total_ingresos: 0,
            total_egresos: 0,
            saldo_cierre: 0,
            movimientos_ids: [],
            usuario: mov.usuario,
            cajasMap: new Map<number, any>()
          });
        }
        
        const cierre = cierresMap.get(fecha);
        const monto = Number(mov.monto) || 0;
        const isIngreso = mov.tipo_movimiento === 1 || mov.tipo_movimiento === true;

        cierre.movimientos_cerrados += 1;
        if (mov.id) cierre.movimientos_ids.push(mov.id);
        if (isIngreso) {
          cierre.total_ingresos += monto;
          cierre.saldo_cierre += monto;
        } else {
          cierre.total_egresos += monto;
          cierre.saldo_cierre -= monto;
        }

        const cajaId = mov.caja_id || 0;
        if (!cierre.cajasMap.has(cajaId)) {
          cierre.cajasMap.set(cajaId, {
            caja_id: cajaId,
            caja: mov.caja || 'Desconocida',
            total_ingresos: 0,
            total_egresos: 0,
            saldo_cierre: 0
          });
        }
        
        const cajaData = cierre.cajasMap.get(cajaId);
        if (isIngreso) {
          cajaData.total_ingresos += monto;
          cajaData.saldo_cierre += monto;
        } else {
          cajaData.total_egresos += monto;
          cajaData.saldo_cierre -= monto;
        }
      });

      const cierres = Array.from(cierresMap.values()).map(c => {
        const { cajasMap, ...rest } = c;
        return {
          ...rest,
          cajas: Array.from(cajasMap.values())
        };
      });

      return { success: true, data: cierres };
    } catch (error) {
      console.error('Error fetching cierres:', error);
      return { success: false, message: 'Error de red' };
    }
  }
};

