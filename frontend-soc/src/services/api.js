import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT Bearer token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') || 
                  localStorage.getItem('access_token') || 
                  sessionStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// --- Authentication APIs ---
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const verifyEmail = async (data) => {
  const response = await api.post('/auth/verify-email', data);
  return response.data;
};

export const resendOTP = async (data) => {
  const response = await api.post('/auth/resend-otp', data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (err) {
    return { message: 'Logged out' };
  }
};

// --- Corporate Employee Portal APIs ---
export const logPortalActivity = async (payload) => {
  const response = await api.post('/portal/activity', payload);
  return response.data;
};

export const uploadPortalDocument = async (formData) => {
  const response = await api.post('/portal/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPortalDocuments = async (userId) => {
  const response = await api.get('/portal/documents', {
    params: { user_id: userId }
  });
  return response.data;
};

export const getPortalActivityHistory = async (userId) => {
  const response = await api.get('/portal/activity-history', {
    params: { user_id: userId }
  });
  return response.data;
};

// --- Incident Investigation & UBA APIs ---
export const getIncidents = async () => {
  const response = await api.get('/incidents');
  return response.data;
};

export const getUBAProfiles = async () => {
  const response = await api.get('/uba/profiles');
  return response.data;
};

// --- SOC Operations APIs ---
export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getMetrics = async () => {
  const response = await api.get('/metrics');
  return response.data;
};

export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getLogs = async () => {
  const response = await api.get('/logs');
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get('/alerts');
  return response.data;
};

export const getRemediations = async () => {
  const response = await api.get('/remediations');
  return response.data;
};

export const clearRemediations = async () => {
  const response = await api.delete('/remediations/clear');
  return response.data;
};

export const getThreats = async () => {
  const response = await api.get('/threats');
  return response.data;
};

export const simulateCloudTrailLog = async (payload) => {
  const response = await api.post('/simulate/cloudtrail', payload);
  return response.data;
};

export const simulateSSHAttack = async (payload) => {
  const response = await api.post('/simulate/ssh-attack', payload);
  return response.data;
};

export const simulateHTTPAttack = async (payload) => {
  const response = await api.post('/simulate/http-attack', payload);
  return response.data;
};

export default api;
