// Servicio SUNAT - Consulta de RUC via proxy https://api.apis.net.pe → https://api.apis.net.pe
// RUC que comienza en 10 = Persona Natural
// RUC que comienza en 20 = Persona Jurídica

export interface SunatRucResponse {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  tipoContribuyente: 'Persona Natural' | 'Persona Jurídica';
  estado: 'ACTIVO' | 'INACTIVO';
  direccionFiscal: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export const sunatService = {
  /**
   * Detecta el tipo de contribuyente según el primer par de dígitos del RUC.
   * 10 → Persona Natural
   * 20 → Persona Jurídica
   */
  detectTipoContribuyente: (ruc: string): 'Persona Natural' | 'Persona Jurídica' => {
    const prefix = ruc.substring(0, 2);
    return prefix === '10' ? 'Persona Natural' : 'Persona Jurídica';
  },

  /**
   * Consulta datos de RUC en tiempo real a través del proxy Vite → api.apis.net.pe
   */
  consultarRuc: async (ruc: string): Promise<SunatRucResponse> => {
    if (!ruc || ruc.length !== 11 || !/^\d+$/.test(ruc)) {
      throw new Error('El RUC debe tener exactamente 11 dígitos numéricos.');
    }

    const API_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_URL}/consulta-documento/ruc/${ruc}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`RUC ${ruc} no encontrado en SUNAT.`);
      }
      throw new Error(`Error al consultar SUNAT (${response.status}). Intente nuevamente.`);
    }

    const res = await response.json();
    if (!res.success) throw new Error('RUC no encontrado');
    const data = res.data;

    // Detectar tipo según dígitos del RUC
    const tipoContribuyente = sunatService.detectTipoContribuyente(ruc);

    const razonSocial = data.razonSocial || data.nombre || '';

    const estadoRaw = (data.estado || '').toUpperCase();
    const estado: 'ACTIVO' | 'INACTIVO' =
      estadoRaw.includes('ACTIVO') || estadoRaw.includes('HABIDO') ? 'ACTIVO' : 'INACTIVO';

    return {
      ruc,
      razonSocial,
      nombreComercial: data.nombreComercial || '',
      tipoContribuyente,
      estado,
      direccionFiscal: data.direccion || data.direccionFiscal || '',
      ubigeo: data.ubigeo || '',
      departamento: data.departamento || '',
      provincia: data.provincia || '',
      distrito: data.distrito || '',
    };
  },
};


