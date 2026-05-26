import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true, reconnectionAttempts: 5 });
  }
  return socket;
};

export const joinPartnerRoom = () => {
  getSocket().emit('join', { room: 'partners' });
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
