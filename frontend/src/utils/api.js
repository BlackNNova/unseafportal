// API Configuration Utility
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.funding-unseaf.org';

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Generic fetch wrapper with default configuration
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, config);
    
    // For non-JSON responses (like file downloads), return the response directly
    if (!response.headers.get('content-type')?.includes('application/json')) {
      return response;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Convenience methods for different HTTP verbs
export const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
    
  put: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
    
  delete: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
    
  patch: (endpoint, data, options = {}) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data)
    }),
};

// Export the base URL for components that need it
export { API_BASE_URL };

export default api;
