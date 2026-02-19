import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
const refreshUser = async () => {
    try {
      // TAMA: authApi.me() dahil 'import { auth as authApi }' ang nasa taas mo
      const data = await authApi.me(); 
      setUser(data);
      return data;
    } catch (err) {
      console.error("Refresh Error:", err);
      return null;
    }
  };
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // const login = (userData, token) => {
  //   localStorage.setItem('token', token);
  //   setUser(userData);
  // };

  // AuthContext.jsx
const login = async (userData, token) => {
    setLoading(true);
    localStorage.setItem('token', token);
    try {
        const freshUser = await refreshUser(); 
        return freshUser; // IBABALIK ANG FRESH DATA
    } finally {
        setLoading(false);
    }
};

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
