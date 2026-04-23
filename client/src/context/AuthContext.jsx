import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import http from '../api/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = ({ token, user: userData }) => {
    localStorage.setItem('campus_pro_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('campus_pro_token');
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('campus_pro_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await http.get('/auth/me');
        setUser(response.data.data);
      } catch {
        localStorage.removeItem('campus_pro_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateUser, isAdmin: user?.role === 'admin' }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
