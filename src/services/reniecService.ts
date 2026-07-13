export const reniecService = {
  consultarDNI: async (dni: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://caja.corporacionjjja.com/api';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/consulta-documento/dni/${dni}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('DNI no encontrado o error en el servicio de RENIEC');
      }
      const res = await response.json();
      if (!res.success) throw new Error('DNI no encontrado');
      const data = res.data;
      return {
        nombre: data.nombres,
        apellido: `${data.apellidoPaterno} ${data.apellidoMaterno}`
      };
    } catch (error: any) {
      console.error('Error al consultar RENIEC:', error);
      throw new Error(error.message || 'Error al consultar el DNI');
    }
  }
};


