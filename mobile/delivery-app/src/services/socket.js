import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
  }
  return socket;
};

export const joinDeliveryRoom = () => {
  getSocket().emit('join', { room: 'delivery' });
};

export const sendAgentLocation = (orderId, lat, lng) => {
  getSocket().emit('agent:location', { orderId, lat, lng });
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
