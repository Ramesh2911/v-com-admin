import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { setTokens } from '../api/client';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vcom_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vcom_access');
    if (!token || !user) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        const fresh = { ...res.data.data };
        setUser(fresh);
        localStorage.setItem('vcom_user', JSON.stringify(fresh));
      })
      .catch(() => {
        setUser(null);
        setTokens(null, null);
        localStorage.removeItem('vcom_user');
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    if (!Array.isArray(u.permissions) || !u.permissions.length) {
      throw new Error('This account does not have admin panel access');
    }
    setTokens(accessToken, refreshToken);
    localStorage.setItem('vcom_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await authApi.logout({});
    } catch {
      /* ignore */
    }
    setTokens(null, null);
    localStorage.removeItem('vcom_user');
    setUser(null);
  };

  const refreshMe = async () => {
    try {
      const res = await authApi.me();
      const fresh = { ...res.data.data };
      setUser(fresh);
      localStorage.setItem('vcom_user', JSON.stringify(fresh));
      return fresh;
    } catch {
      return user;
    }
  };

  const can = (code) => (user?.permissions || []).includes(code);
  const canAny = (...codes) => codes.some((c) => can(c));

  const value = useMemo(
    () => ({ user, loading, login, logout, can, canAny, refreshMe, refreshUser: refreshMe }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
