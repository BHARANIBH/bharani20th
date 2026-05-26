import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [partner, setPartner] = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('partner_token');
        const p = await AsyncStorage.getItem('partner_user');
        if (t && p) { setToken(t); setPartner(JSON.parse(p)); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = async (tokenVal, partnerData) => {
    await AsyncStorage.setItem('partner_token', tokenVal);
    await AsyncStorage.setItem('partner_user', JSON.stringify(partnerData));
    setToken(tokenVal);
    setPartner(partnerData);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['partner_token', 'partner_user']);
    setToken(null);
    setPartner(null);
  };

  return (
    <AuthContext.Provider value={{ partner, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
