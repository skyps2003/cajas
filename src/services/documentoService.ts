const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';

export interface DocumentoResponse {
  id: number;
  nombre_documento: string;
  ruta_documento: string;
  observaciones: string;
  estado: boolean | number;
  created_at: string;
  contribuyente: string;
  rubro: string;
  tipo_documento: string;
}

export const documentoService = {
  getDocumentos: async (token: string): Promise<DocumentoResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/documentos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result.data || [];
  },

  createDocumento: async (formData: FormData, token: string): Promise<{ id: number, message: string }> => {
    const response = await fetch(`${API_BASE_URL}/documentos`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
        // Note: Do not set Content-Type manually when sending FormData, fetch handles it automatically to set boundary
      },
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Validation errors:', errorData);
      throw new Error(`HTTP error ${response.status}: ${JSON.stringify(errorData)}`);
    }
    const result = await response.json();
    return result;
  },

  updateDocumento: async (id: number, formData: FormData, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/documentos/${id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Validation errors:', errorData);
      throw new Error(`HTTP error ${response.status}: ${JSON.stringify(errorData)}`);
    }
    const result = await response.json();
    return result;
  },

  deleteDocumento: async (id: number, token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/documentos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const result = await response.json();
    return result;
  },

  downloadDocumento: async (id: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/documentos/download/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    
    // Extract filename from Content-Disposition header or fall back
    const disposition = response.headers.get('Content-Disposition');
    let filename = `documento_${id}`;
    if (disposition) {
      const match = disposition.match(/filename="?(.+?)"?$/);
      if (match) filename = match[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};

