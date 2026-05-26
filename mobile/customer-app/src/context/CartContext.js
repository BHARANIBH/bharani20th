import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('cart').then(c => { if (c) setItems(JSON.parse(c)); });
  }, []);

  const save = async updated => {
    setItems(updated);
    await AsyncStorage.setItem('cart', JSON.stringify(updated));
  };

  const addItem = product => {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      save(items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      save([...items, { ...product, qty: 1 }]);
    }
  };

  const removeItem = id => save(items.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    save(items.map(i => i.id === id ? { ...i, qty } : i));
  };

  const clearCart = () => save([]);

  const total     = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
