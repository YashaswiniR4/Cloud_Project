import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logoutUser as apiLogoutUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => (
    localStorage.getItem('token') || 
    sessionStorage.getItem('token') || 
    localStorage.getItem('access_token') || 
    sessionStorage.getItem('access_token') || 
    null
  ));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token') || 
                          sessionStorage.getItem('token') || 
                          localStorage.getItem('access_token') || 
                          sessionStorage.getItem('access_token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          if (localStorage.getItem('token')) {
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (err) {
          console.error("Auth validation failed:", err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (authToken, userData, rememberMe = true) => {
    if (rememberMe) {
      localStorage.setItem('token', authToken);
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('access_token', authToken);
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    setToken(authToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiLogoutUser();
    } catch (e) {
      // Ignore API logout error
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
