import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

let accessToken = localStorage.getItem('vcom_access') || '';
let refreshToken = localStorage.getItem('vcom_refresh') || '';

export const setTokens = (access, refresh) => {
  accessToken = access || '';
  refreshToken = refresh || '';
  if (access) localStorage.setItem('vcom_access', access);
  else localStorage.removeItem('vcom_access');
  if (refresh) localStorage.setItem('vcom_refresh', refresh);
  else localStorage.removeItem('vcom_refresh');
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && refreshToken && !original._retry) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { data } = await refreshing;
        refreshing = null;
        setTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        setTokens(null, null);
        localStorage.removeItem('vcom_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export const getError = (err) =>
  err?.response?.data?.errors?.[0]?.message ||
  err?.response?.data?.message ||
  err?.message ||
  'Something went wrong';

export default api;
