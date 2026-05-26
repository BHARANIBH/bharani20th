import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
  }
  return socket;
};

export const joinOrderRoom = orderId => {
  const s = getSocket();
  s.emit('join', { room: `order:${orderId}` });
};

export const leaveOrderRoom = orderId => {
  const s = getSocket();
  s.emit('leave', { room: `order:${orderId}` });
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
