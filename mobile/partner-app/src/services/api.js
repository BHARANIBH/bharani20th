import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('partner_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res  => res.data,
  err  => Promise.reject(err.response?.data || err),
);

export const partnerAuthAPI = {
  sendOTP:   (phone)                        => api.post('/partner/otp/send', { phone }),
  verifyOTP: (phone, otp, name, restaurant) => api.post('/partner/otp/verify', { phone, otp, name, restaurantName: restaurant }),
  getProfile:()                             => api.get('/partner/profile'),
};

export const partnerOrderAPI = {
  getOrders:    ()                     => api.get('/partner/orders'),
  updateStatus: (orderId, orderStatus) => api.put(`/partner/orders/${orderId}`, { orderStatus }),
  getStats:     ()                     => api.get('/partner/stats'),
  /* Live cutting */
  sendLiveUrl:  (orderId, liveUrl)     => api.post(`/orders/${orderId}/send-live-url`, { liveUrl }),
  partnerBusy:  (orderId)              => api.post(`/orders/${orderId}/partner-busy`),
};
