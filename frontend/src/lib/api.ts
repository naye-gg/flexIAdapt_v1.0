import { apiEndpoint } from "./config";
import { authenticatedFetch } from "../hooks/useAuth";

// Helper function for authenticated API requests
async function authApiRequest(method: string, url: string, data?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('teacherToken') || '',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  return authenticatedFetch(url, options);
}

// Students API
export const studentsApi = {
  getAll: () => authenticatedFetch(apiEndpoint("students").then((res: Response) => res.json()),
  getById: (id: string) => authenticatedFetch(apiEndpoint(`students/${id}`).then((res: Response) => res.json()),
  create: (data: any) => authApiRequest("POST", apiEndpoint("students", data).then((res: Response) => res.json()),
  update: (id: string, data: any) => authApiRequest("PUT", apiEndpoint(`students/${id}`, data).then((res: Response) => res.json()),
  delete: (id: string) => authApiRequest("DELETE", apiEndpoint(`students/${id}`),
};

// Teacher Perspectives API
export const perspectivesApi = {
  get: (studentId: string) => authenticatedFetch(apiEndpoint(`students/${studentId}/perspective`).then((res: Response) => res.json()),
  create: (studentId: string, data: any) => 
    authApiRequest("POST", apiEndpoint(`students/${studentId}/perspective`, data).then((res: Response) => res.json()),
  update: (studentId: string, data: any) => 
    authApiRequest("PUT", apiEndpoint(`students/${studentId}/perspective`, data).then((res: Response) => res.json()),
};

// Evidence API
export const evidenceApi = {
  getAll: () => authenticatedFetch(apiEndpoint("evidence").then((res: Response) => res.json()),
  getByStudent: (studentId: string) => 
    authenticatedFetch(apiEndpoint(`students/${studentId}/evidence`).then((res: Response) => res.json()),
  upload: async (studentId: string, formData: FormData) => {
    const token = localStorage.getItem('teacherToken');
    const response = await fetch(apiEndpoint(`students/${studentId}/evidence`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': token || '',
      },
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload evidence');
    }
    
    return response.json();
  },
  analyze: (evidenceId: string) => 
    authApiRequest("POST", apiEndpoint(`evidence/${evidenceId}/analyze`).then((res: Response) => res.json()),
};

// Learning Profiles API
export const profilesApi = {
  get: (studentId: string) => 
    authenticatedFetch(apiEndpoint(`students/${studentId}/learning-profile`).then((res: Response) => res.json()),
  generate: (studentId: string) => 
    authApiRequest("POST", apiEndpoint(`students/${studentId}/generate-ai-profile`).then((res: Response) => res.json()),
};

// Teacher Perspectives API
export const perspectivesApi = {
  get: (studentId: string) => fetch(apiEndpoint(`students/${studentId}/perspective`).then(res => res.json()),
  create: (studentId: string, data: any) => 
    apiRequest("POST", apiEndpoint(`students/${studentId}/perspective`, data).then(res => res.json()),
  update: (studentId: string, data: any) => 
    apiRequest("PUT", apiEndpoint(`students/${studentId}/perspective`, data).then(res => res.json()),
};

// Evidence API
export const evidenceApi = {
  getAll: () => fetch(apiEndpoint("evidence").then(res => res.json()),
  getByStudent: (studentId: string) => 
    fetch(apiEndpoint(`students/${studentId}/evidence`).then(res => res.json()),
  upload: async (studentId: string, formData: FormData) => {
    const response = await fetch(apiEndpoint(`students/${studentId}/evidence`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },
  analyze: (evidenceId: string) => 
    apiRequest("POST", apiEndpoint(`evidence/${evidenceId}/analyze`).then(res => res.json()),
};

// Learning Profiles API
export const profilesApi = {
  get: (studentId: string) => fetch(apiEndpoint(`students/${studentId}/profile`).then(res => res.json()),
  generate: (studentId: string) => 
    apiRequest("POST", apiEndpoint(`students/${studentId}/profile/generate`).then(res => res.json()),
};

// Statistics API
export const statsApi = {
  get: () => fetch(apiEndpoint("stats").then(res => res.json()),
};

// File download helper
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
