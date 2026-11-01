import { create } from 'zustand';
import type { Profile } from '@/types';

interface AuthState {
  user: Profile | null;
  accessToken: string | null;
  status: 'booting' | 'authenticated' | 'anonymous';
  setSession: (user: Profile, token: string) => void;
  setUser: (user: Profile) => void;
  setToken: (token: string) => void;
  setStatus: (status: 'booting' | 'authenticated' | 'anonymous') => void;
  clear: () => void;
}

// BroadcastChannel for cross-tab auth sync
let authChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  authChannel = new BroadcastChannel('projectmatch_auth');
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for logout broadcasts across tabs
  if (authChannel) {
    authChannel.onmessage = (event) => {
      if (event.data === 'auth:logout') {
        set({ user: null, accessToken: null, status: 'anonymous' });
      }
    };
  }

  return {
    user: null,
    accessToken: null,
    status: 'booting',

    setSession: (user: Profile, token: string) => {
      set({
        user,
        accessToken: token,
        status: 'authenticated',
      });
    },

    setUser: (user: Profile) => {
      set({ user });
    },

    setToken: (token: string) => {
      set({ accessToken: token, status: 'authenticated' });
    },

    setStatus: (status: 'booting' | 'authenticated' | 'anonymous') => {
      set({ status });
    },

    clear: () => {
      set({
        user: null,
        accessToken: null,
        status: 'anonymous',
      });
      if (authChannel) {
        authChannel.postMessage('auth:logout');
      }
    },
  };
});
