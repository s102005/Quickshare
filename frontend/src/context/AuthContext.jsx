import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Read existing token from browser localStorage (if user previously logged in)
  const [token, setToken] = useState(localStorage.getItem('quickshare_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default Axios Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('quickshare_token', token);
      fetchUserProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('quickshare_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Fetch the logged-in user profile from /api/auth/me
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.response?.data?.message);
      // Auto-logout if token is expired
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password) => {
    const response = await axios.post('/api/auth/register', { name, email, password });
    if (response.data.token) {
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  // Login function
  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    if (response.data.token) {
      setToken(response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('quickshare_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext easily in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
