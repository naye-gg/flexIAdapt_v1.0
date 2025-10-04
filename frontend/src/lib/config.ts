// Configuración de la aplicación
export const config = {
  // URLs del backend - TEMPORALMENTE HARDCODEADO PARA RAILWAY
  apiUrl: 'https://flexiadaptv10.up.railway.app/api',
  backendUrl: 'https://flexiadaptv10.up.railway.app',
  
  // Configuración de desarrollo
  isDevelopment: true,
  isProduction: false,
  
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
