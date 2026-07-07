export const reniecService = {
  consultarDNI: async (dni: string) => {
    try {
      // Usar el proxy configurado en vite.config.ts para evitar errores de CORS
      const response = await fetch(`/api/peru/v1/dni?numero=${dni}`);
      if (!response.ok) {
        throw new Error('DNI no encontrado o error en el servicio de RENIEC');
      }
      const data = await response.json();
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
