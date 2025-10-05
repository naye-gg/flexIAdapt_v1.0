// Configuración de entorno - cambiar aquí para alternar entre desarrollo y producción
const USE_LOCAL_BACKEND = false; // Cambiar a false para usar Railway

// URLs de backend
const BACKEND_URLS = {
  local: {
    apiUrl: 'http://localhost:5000/api',
    backendUrl: 'http://localhost:5000',
  },
  production: {
    apiUrl: 'https://flexiadaptv10-production.up.railway.app/api',
    backendUrl: 'https://flexiadaptv10-production.up.railway.app',
  }
};

// Configuración de la aplicación
export const config = {
  // URLs del backend (automático según USE_LOCAL_BACKEND)
  ...(USE_LOCAL_BACKEND ? BACKEND_URLS.local : BACKEND_URLS.production),
  
  // Configuración de desarrollo
  isDevelopment: USE_LOCAL_BACKEND,
  isProduction: !USE_LOCAL_BACKEND,
  
  // Configuración de la app
  appName: 'FlexiAdapt',
  version: '1.0.0',
};

// Helper para construir URLs de la API
export const apiEndpoint = (path: string): string => {
  // Remover '/' al inicio si existe
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${config.apiUrl}/${cleanPath}`;
};

// Helper para URLs del backend (archivos, etc.)
export const backendEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${config.backendUrl}/${cleanPath}`;
};
