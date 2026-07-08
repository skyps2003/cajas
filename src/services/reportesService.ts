export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export const reportesService = {
  getMovimientos: async (token: string, fechaInicio: string, fechaFin: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/movimientos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getMovimientos):', error);
      throw new Error('Error al obtener reporte de movimientos');
    }
  },

  getIngresos: async (token: string, fechaInicio: string, fechaFin: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/ingresos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getIngresos):', error);
      throw new Error('Error al obtener reporte de ingresos');
    }
  },

  getEgresos: async (token: string, fechaInicio: string, fechaFin: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/egresos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getEgresos):', error);
      throw new Error('Error al obtener reporte de egresos');
    }
  },

  getCajas: async (token: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/cajas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getCajas):', error);
      throw new Error('Error al obtener reporte de cajas');
    }
  },

  getUsuarios: async (token: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getUsuarios):', error);
      throw new Error('Error al obtener reporte de usuarios');
    }
  },

  getEmpresas: async (token: string): Promise<any[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/empresas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getEmpresas):', error);
      throw new Error('Error al obtener reporte de empresas');
    }
  },

  getMovimientosSede: async (token: string, fechaInicio?: string, fechaFin?: string): Promise<any[]> => {
    try {
      let url = `${API_BASE_URL}/reportes/movimientos-sede`;
      if (fechaInicio && fechaFin) {
        url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('API Error (getMovimientosSede):', error);
      throw new Error('Error al obtener reporte de movimientos por sede');
    }
  }
};

