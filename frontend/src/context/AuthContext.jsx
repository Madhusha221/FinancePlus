import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile/');
      setUser(res.data.user);
      setSettings(res.data.settings);
    } catch (err) {
      setUser(null);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    await fetchProfile();
  };

  const register = async (userData) => {
    await api.post('/auth/register/', userData);
    await login(userData.username, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setSettings(null);
  };

  const updateSettings = async (newSettings) => {
    const res = await api.put('/auth/settings/', newSettings);
    setSettings(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, register, logout, updateSettings, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
