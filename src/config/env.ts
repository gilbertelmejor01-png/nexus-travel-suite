// Configuración de variables de entorno
export const config = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1/chat/completions'
  },
  firebase: {
    // Agregar aquí las configuraciones de Firebase si es necesario
  }
};

// Función para verificar que las variables de entorno estén configuradas
export const validateConfig = () => {
  if (!config.openai.apiKey) {
    console.warn('VITE_OPENAI_API_KEY no está configurada en las variables de entorno');
    return false;
  }
  return true;
};
