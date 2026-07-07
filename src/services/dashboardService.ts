
const API_BASE_URL = '/api';

export interface DashboardPrincipal {
  totalIngresos: number;
  totalEgresos: number;
  saldoGeneral: number;
  totalMovimientos: number;
  totalUsuarios: number;
  totalCajas: number;
  totalEmpresas: number;
}

export interface DashboardMensual {
  mes: string;
  ingresos: number;
  egresos: number;
}

export interface AlertaCaja {
  caja: string;
  saldo: number;
  monto_min?: number;
  monto_max?: number;
  alerta: string;
}

export interface RankingEmpresa {
  nombre: string;
  movimientos: number;
  color?: string;
}

export interface RankingUsuario {
  nombre: string;
  movimientos: number;
  color?: string;
}

export const dashboardService = {
  getPrincipal: async (token: string): Promise<DashboardPrincipal> => {
    const response = await fetch(`${API_BASE_URL}/reportes/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data;
  },

  getMensual: async (token: string): Promise<DashboardMensual[]> => {
    const response = await fetch(`${API_BASE_URL}/reportes/dashboard/mensual`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  getRankingEmpresas: async (token: string): Promise<RankingEmpresa[]> => {
    const response = await fetch(`${API_BASE_URL}/reportes/dashboard/empresas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  getRankingUsuarios: async (token: string): Promise<RankingUsuario[]> => {
    const response = await fetch(`${API_BASE_URL}/reportes/dashboard/usuarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  getAlertasCajas: async (token: string): Promise<AlertaCaja[]> => {
    const response = await fetch(`${API_BASE_URL}/reportes/dashboard/alertas-cajas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  getEmpresasDetalle: async (token: string): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/empresa/detalle`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.data || [];
  }
  
};
