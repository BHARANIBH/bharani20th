import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const [selectedAddress, setSelectedAddressState] = useState(null);

  // Load persisted address on boot
  useEffect(() => {
    AsyncStorage.getItem('selected_address').then(val => {
      if (val) setSelectedAddressState(JSON.parse(val));
    }).catch(() => {});
  }, []);

  const setSelectedAddress = async (addr) => {
    setSelectedAddressState(addr);
    if (addr) {
      await AsyncStorage.setItem('selected_address', JSON.stringify(addr));
    } else {
      await AsyncStorage.removeItem('selected_address');
    }
  };

  return (
    <AddressContext.Provider value={{ selectedAddress, setSelectedAddress }}>
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => useContext(AddressContext);
