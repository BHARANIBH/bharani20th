import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Global logout reference — set by AuthContext on mount
let _logoutFn = null;
export const setLogoutHandler = (fn) => { _logoutFn = fn; };

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    // Token expired or invalid → auto logout
    if (err.response?.status === 401) {
      if (_logoutFn) _logoutFn();
      return Promise.reject({ message: 'Session expired. Please login again.' });
    }
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return Promise.reject({ message: 'Request timed out. Server may be busy.' });
    }
    if (!err.response) {
      return Promise.reject({ message: 'Cannot reach server. Make sure backend is running.' });
    }
    const msg = err.response?.data?.message || err.response?.data || 'Something went wrong';
    return Promise.reject({ message: typeof msg === 'string' ? msg : 'Request failed' });
  }
);

export const authAPI = {
  sendOTP:       phone        => api.post('/otp/send', { phone }),
  verifyOTP:     (phone, otp) => api.post('/otp/verify', { phone, otp }),
  getProfile:    ()           => api.get('/otp/profile'),
  updateProfile: data         => api.put('/otp/profile', data),
};

export const productAPI = {
  getAll: () => api.get('/admin/products'),
};

export const orderAPI = {
  create:      data  => api.post('/orders', data),
  getMyOrders: phone => api.get(`/orders/my/${phone}`),
  getById:     id    => api.get(`/orders/${id}`),
  /* Live cutting */
  requestLive: id    => api.post(`/orders/${id}/request-live`),
};

export const addressAPI = {
  getAll:    () => api.get('/addresses'),
  create:    data => api.post('/addresses', data),
  remove:    id   => api.delete(`/addresses/${id}`),
  removeAll: ()   => api.delete('/addresses'),
};

export const paymentAPI = {
  createOrder: data => api.post('/payments/create-order', data),
  verify:      data => api.post('/payments/verify', data),
};

export default api;
