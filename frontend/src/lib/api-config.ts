import { apiEndpoint, config } from './config';

// API Configuration usando la configuración centralizada
export const API_CONFIG = {
  BASE_URL: config.apiUrl,
  ENDPOINTS: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    ME: 'auth/me',
    STUDENTS: 'students',
    STUDENT: 'students',
    EVIDENCE: 'evidence',
    STATS: 'stats',
    CHAT: 'chats',
    UPLOAD: 'upload'
  }
};
  
// Helper to build full API URLs usando nuestra función centralizada
export const buildApiUrl = (endpoint: string) => {
  return apiEndpoint(endpoint);
};

// Helper function for making API requests with proper URLs
export const makeApiRequest = async (endpoint: string, options?: RequestInit) => {
  const url = buildApiUrl(endpoint);
  console.log('🔗 Making API request to:', url);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

// Exportar endpoints específicos ya construidos
export const API_ENDPOINTS = {
  LOGIN: buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN),
  REGISTER: buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER),
  ME: buildApiUrl(API_CONFIG.ENDPOINTS.ME),
  STUDENTS: buildApiUrl(API_CONFIG.ENDPOINTS.STUDENTS),
  EVIDENCE: buildApiUrl(API_CONFIG.ENDPOINTS.EVIDENCE),
  STATS: buildApiUrl(API_CONFIG.ENDPOINTS.STATS),
  CHAT: buildApiUrl(API_CONFIG.ENDPOINTS.CHAT),
  UPLOAD: buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD),
};
