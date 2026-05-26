import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLogoutHandler } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [isNewLogin, setIsNewLogin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('token');
        const u = await AsyncStorage.getItem('user');
        if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (tokenVal, userData) => {
    await AsyncStorage.setItem('token', tokenVal);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
    setIsNewLogin(true); // trigger welcome screen
  };

  const clearNewLogin = () => setIsNewLogin(false);

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  // Wire the global 401 auto-logout handler whenever logout changes
  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  const updateUser = async userData => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isNewLogin, clearNewLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
