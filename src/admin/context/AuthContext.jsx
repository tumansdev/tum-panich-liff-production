import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const AUTH_KEY = 'tumpanich_admin_auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved auth on init
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      try {
        const { token: savedToken, admin: savedAdmin } = JSON.parse(saved);
        setToken(savedToken);
        setAdmin(savedAdmin);
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Login failed');
    }

    const { token: newToken, admin: adminData } = data.data;
    setToken(newToken);
    setAdmin(adminData);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token: newToken, admin: adminData }));

    return adminData;
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem(AUTH_KEY);
  };

  // API call helper with auth
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const value = {
    admin,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
    apiCall,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
