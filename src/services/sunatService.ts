// Servicio SUNAT - Consulta de RUC via proxy /api/peru → https://api.apis.net.pe
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

    const response = await fetch(`/api/peru/v1/ruc?numero=${ruc}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`RUC ${ruc} no encontrado en SUNAT.`);
      }
      throw new Error(`Error al consultar SUNAT (${response.status}). Intente nuevamente.`);
    }

    const data = await response.json();

    // Detectar tipo según dígitos del RUC
    const tipoContribuyente = sunatService.detectTipoContribuyente(ruc);

    // La API devuelve distintos campos según tipo
    // Para persona jurídica: razonSocial, nombreComercial, direccion, estado
    // Para persona natural: nombre, apellidoPaterno, apellidoMaterno, direccion, estado
    let razonSocial = '';
    if (tipoContribuyente === 'Persona Natural') {
      const nombres = (data.nombre || data.nombres || '').trim();
      const apPat = (data.apellidoPaterno || '').trim();
      const apMat = (data.apellidoMaterno || '').trim();
      
      if (apPat || apMat) {
        // Formato: APELLIDO PATERNO APELLIDO MATERNO, NOMBRES
        razonSocial = `${apPat} ${apMat}`.trim();
        if (nombres) {
          razonSocial += `, ${nombres}`;
        }
        razonSocial = razonSocial.toUpperCase();
      } else {
        razonSocial = nombres.toUpperCase();
      }
      
      if (!razonSocial) {
        razonSocial = data.razonSocial || '';
      }
    } else {
      razonSocial = data.razonSocial || data.nombre || '';
    }

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
