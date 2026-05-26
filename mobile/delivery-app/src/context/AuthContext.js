import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [agent, setAgent]     = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('delivery_token');
        const a = await AsyncStorage.getItem('delivery_user');
        if (t && a) { setToken(t); setAgent(JSON.parse(a)); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (tokenVal, agentData) => {
    await AsyncStorage.setItem('delivery_token', tokenVal);
    await AsyncStorage.setItem('delivery_user', JSON.stringify(agentData));
    setToken(tokenVal);
    setAgent(agentData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['delivery_token', 'delivery_user']);
    setToken(null);
    setAgent(null);
  };

  return (
    <AuthContext.Provider value={{ agent, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
