import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';

let socket: Socket | null = null;
let isReconnectingWithFreshToken = false;

export const getSocket = (): Socket | null => {
  return socket;
};

export const initSocket = (token: string): Socket => {
  if (socket) {
    if (socket.connected) {
      return socket;
    }
    socket.disconnect();
  }

  socket = io(env.VITE_SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    isReconnectingWithFreshToken = false;
  });

  socket.on('connect_error', async (err) => {
    if (err.message === 'unauthorized' || (err as { data?: { message?: string } })?.data?.message === 'unauthorized') {
      if (!isReconnectingWithFreshToken) {
        isReconnectingWithFreshToken = true;
        try {
          const res = await authApi.refresh();
          const newToken = res.data?.session?.access_token;
          if (newToken) {
            useAuthStore.getState().setToken(newToken);
            updateSocketToken(newToken);
            return;
          }
        } catch {
          useAuthStore.getState().clear();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } else {
        useAuthStore.getState().clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  });

  return socket;
};

export const updateSocketToken = (newToken: string) => {
  if (socket) {
    socket.auth = { token: newToken };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    initSocket(newToken);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
