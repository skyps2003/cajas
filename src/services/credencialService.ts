const API_BASE_URL = '/api';

export interface CredencialResponse {
  id: number;
  id_registro_contribuyentes: number;
  contribuyente: string;
  tipo_credencial: string;
  usuario: string;
  clave: string;
  observaciones: string;
  estado: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface CredencialCreatePayload {
  id_tipo_credencial: number;
  usuario: string;
  clave: string;
  observaciones: string;
}

export interface CredencialUpdatePayload {
  id_tipo_credencial: number;
  usuario: string;
  clave: string;
  observaciones: string;
  estado: number;
}

export const credencialService = {
  getCredenciales: async (token: string): Promise<CredencialResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/credenciales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  createCredencial: async (contribuyenteId: number, data: CredencialCreatePayload, token: string): Promise<{ id: number, message: string }> => {
    const response = await fetch(`${API_BASE_URL}/credenciales/contribuyente/${contribuyenteId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  },

  updateCredencial: async (id: number, data: CredencialUpdatePayload, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/credenciales/${id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  },

  deleteCredencial: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/credenciales/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  },

  activateCredencial: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/credenciales/activate/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  }
};
