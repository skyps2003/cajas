const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export interface TelefonoResponse {
  id: number;
  id_registro_contribuyentes: number;
  razon_social: string;
  id_tipo_telefono: number;
  tipo_telefono: string;
  numero: string;
  nombre_contacto: string;
  descripcion: string;
  principal: boolean | number;
  estado: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface TelefonoCreatePayload {
  numero: string;
  id_tipo_telefono: number;
  nombre_contacto: string;
  descripcion: string;
  principal: boolean;
}

export interface TelefonoUpdatePayload {
  id_registro_contribuyentes: number;
  id_tipo_telefono: number;
  numero: string;
  nombre_contacto: string;
  descripcion: string;
  principal: boolean;
  estado: boolean;
}

export const telefonoService = {
  getTelefonos: async (token: string): Promise<TelefonoResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/telefonos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  createTelefono: async (contribuyenteId: number, data: TelefonoCreatePayload, token: string): Promise<{ id: number, message: string }> => {
    const response = await fetch(`${API_BASE_URL}/telefonos/contribuyente/${contribuyenteId}`, {
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

  updateTelefono: async (id: number, data: TelefonoUpdatePayload, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/telefonos/${id}`, {
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

  deleteTelefono: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/telefonos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  },

  deactivateTelefono: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/telefonos/deactivate/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  },

  setPrincipalTelefono: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/telefonos/principal/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  }
};

