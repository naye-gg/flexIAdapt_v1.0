// Configuración de la aplicación
export const config = {
  // URLs del backend
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  
  // Configuración de desarrollo
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
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
