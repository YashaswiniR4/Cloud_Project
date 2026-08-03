import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
