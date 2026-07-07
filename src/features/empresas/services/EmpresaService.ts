export interface Empresa {
  id: number;
  razon_social: string;
  ruc: string;
  direccion: string;
  estado: boolean;
  color: string;
}

const API_URL = '/api';

export const EmpresaService = {
  getEmpresas: async (token: string): Promise<{ success: boolean; data?: Empresa[]; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/empresa`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching empresas:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  createEmpresa: async (token: string, data: Omit<Empresa, 'id' | 'estado'>): Promise<{ success: boolean; message?: string; data?: Empresa }> => {
    try {
      const response = await fetch(`${API_URL}/empresa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating empresa:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  updateEmpresa: async (token: string, id: number, data: Partial<Empresa>): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/empresa/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating empresa:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  deleteEmpresa: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/empresa/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting empresa:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  toggleStatus: async (token: string, id: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_URL}/empresa/deactivate/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error toggling status:', error);
      return { success: false, message: 'Error de red' };
    }
  },

  // SUNAT / RENIEC using apis.net.pe v1 (free, no API key required) via Vite proxy
  consultarDocumento: async (documento: string): Promise<{ success: boolean; razon_social?: string; direccion?: string; message?: string }> => {
    try {
      if (documento.length === 8) {
        // DNI
        const response = await fetch(`/api/peru/v1/dni?numero=${documento}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, message: errData.error || 'DNI no encontrado o inválido' };
        }
        const data = await response.json();
        return { success: true, razon_social: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`, direccion: '' };

      } else if (documento.length === 11) {
        // RUC
        const response = await fetch(`/api/peru/v1/ruc?numero=${documento}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, message: errData.error || 'RUC no encontrado o inválido' };
        }
        const data = await response.json();
        return { success: true, razon_social: data.nombre, direccion: data.direccion };
      }
      return { success: false, message: 'Documento debe tener 8 (DNI) u 11 (RUC) dígitos' };
    } catch (error) {
      console.error('Error fetching sunat/reniec data:', error);
      return { success: false, message: 'Error de conexión con servicio externo' };
    }
  }
};
