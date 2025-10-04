import { config } from './config.js';

const isDevelopment = config.NODE_ENV === 'development';
const isProduction = config.NODE_ENV === 'production';

export const logger = {
  // Siempre mostrar errores
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error || '');
  },

  // Información importante del sistema (siempre mostrar)
  info: (message: string) => {
    console.log(`ℹ️  ${message}`);
  },

  // Logs de debug (solo en desarrollo)
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔍 ${message}`, data || '');
    }
  },

  // Logs de API calls (solo errores en producción)
  api: (method: string, path: string, status: number, time?: number, error?: string) => {
    const timeStr = time ? ` in ${time}ms` : '';
    const errorStr = error ? ` :: ${error}` : '';
    
    if (isProduction) {
      // En producción, solo logs de errores (4xx, 5xx)
      if (status >= 400) {
        console.log(`🔴 [${method}] ${path} ${status}${timeStr}${errorStr}`);
      }
    } else {
      // En desarrollo, todos los logs
      const emoji = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
      console.log(`${emoji} [${method}] ${path} ${status}${timeStr}${errorStr}`);
    }
  },

  // Logs de AI (optimizados para producción)
  ai: (message: string, model?: string, tokens?: number) => {
    if (isDevelopment) {
      const details = model ? ` (${model}${tokens ? `, ${tokens} tokens` : ''})` : '';
      console.log(`🤖 ${message}${details}`);
    } else if (message.includes('Error') || message.includes('Failed')) {
      // Solo errores de AI en producción
      console.log(`🤖 ${message}`);
    }
  },

  // Logs de autenticación (solo en desarrollo)
  auth: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔐 ${message}`, data || '');
    }
  },

  // Métricas de rendimiento (siempre importantes)
  perf: (operation: string, duration: number, details?: string) => {
    const detailsStr = details ? ` - ${details}` : '';
    console.log(`⏱️  ${operation}: ${duration}ms${detailsStr}`);
  }
};

// Función para medir tiempo de ejecución
export const measure = async <T>(
  operation: string,
  fn: () => Promise<T>,
  logDetails?: string
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.perf(operation, duration, logDetails);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${operation} failed after ${duration}ms`, error);
    throw error;
  }
};
