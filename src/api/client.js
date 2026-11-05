import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
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

// Cross-tab sync: when another tab rotates tokens, pick them up here so a stale
// tab never tries to refresh with an already-rotated token.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'vcom_access') accessToken = e.newValue || '';
    if (e.key === 'vcom_refresh') refreshToken = e.newValue || '';
  });
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      // Always read the freshest refresh token (another tab may have rotated it)
      const currentRefresh = localStorage.getItem('vcom_refresh') || refreshToken;
      if (!currentRefresh) {
        setTokens(null, null);
        localStorage.removeItem('vcom_user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        refreshing =
          refreshing ||
          axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: currentRefresh });
        const { data } = await refreshing;
        refreshing = null;
        setTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        // Only wipe the session when the refresh itself was rejected as invalid
        // (400/401/403). Network blips, cold starts and 429 must NOT log the user out.
        if (e.response && [400, 401, 403].includes(e.response.status)) {
          setTokens(null, null);
          localStorage.removeItem('vcom_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
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
