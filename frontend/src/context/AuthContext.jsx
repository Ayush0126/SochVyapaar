import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await api.auth.getMe();
      setUser(res.data);
    } catch (error) {
      console.error("Auth validation failed", error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    // Fetch user profile after setting token
    const userRes = await api.auth.getMe();
    setUser(userRes.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register(name, email, password);
    const accessToken = res.data.access_token;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    // Fetch user profile after setting token
    const userRes = await api.auth.getMe();
    setUser(userRes.data);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
