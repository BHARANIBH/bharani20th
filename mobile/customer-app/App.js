import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider }    from './src/context/AuthContext';
import { CartProvider }    from './src/context/CartContext';
import { AddressProvider } from './src/context/AddressContext';
import AppNavigator        from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AddressProvider>
        <CartProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </CartProvider>
      </AddressProvider>
    </AuthProvider>
  );
}
