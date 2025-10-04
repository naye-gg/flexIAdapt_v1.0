import { apiEndpoint } from "./config";

// Helper function for authenticated API requests
async function authApiRequest(method: string, endpoint: string, data?: any) {
  const fullUrl = apiEndpoint(endpoint);
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
  
  console.log(`🔗 ${method} ${fullUrl}`);
  
  const response = await fetch(fullUrl, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Helper for GET requests
async function authenticatedGet(endpoint: string) {
  return authApiRequest('GET', endpoint);
}

// API functions
export const studentsApi = {
  getAll: () => authenticatedGet('students'),
  getById: (id: string) => authenticatedGet(`students/${id}`),
  create: (data: any) => authApiRequest('POST', 'students', data),
  update: (id: string, data: any) => authApiRequest('PUT', `students/${id}`, data),
  delete: (id: string) => authApiRequest('DELETE', `students/${id}`),
};

export const statsApi = {
  getAll: () => authenticatedGet('stats'),
};

export const evidenceApi = {
  getAll: () => authenticatedGet('evidence'),
  getByStudent: (studentId: string) => authenticatedGet(`students/${studentId}/evidence`),
  create: async (studentId: string, formData: FormData) => {
    const fullUrl = apiEndpoint(`students/${studentId}/evidence`);
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('teacherToken') || '',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  }
};

export const chatApi = {
  getByStudent: (studentId: string) => authenticatedGet(`students/${studentId}/chats`),
  create: (studentId: string, data: any) => authApiRequest('POST', `students/${studentId}/chats`, data),
  getMessages: (chatId: string) => authenticatedGet(`chats/${chatId}/messages`),
  sendMessage: (chatId: string, data: any) => authApiRequest('POST', `chats/${chatId}/messages`, data),
};
