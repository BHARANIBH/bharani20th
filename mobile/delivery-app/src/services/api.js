import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('delivery_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res  => res.data,
  err  => Promise.reject(err.response?.data || err),
);

export const deliveryAuthAPI = {
  sendOTP:   (phone)                      => api.post('/delivery/otp/send', { phone }),
  verifyOTP: (phone, otp, name, vehicle)  => api.post('/delivery/otp/verify', { phone, otp, name, vehicleType: vehicle }),
  getProfile: ()                          => api.get('/delivery/profile'),
};

export const deliveryOrderAPI = {
  getAvailable:     ()           => api.get('/delivery/orders'),
  getMyOrder:       ()           => api.get('/delivery/my-order'),
  updateStatus:     (orderId, orderStatus) => api.put(`/delivery/orders/${orderId}`, { orderStatus }),
  setAvailability:  (isAvailable) => api.put('/delivery/availability', { isAvailable }),
};
