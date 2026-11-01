
import { create } from 'zustand';
import type { Profile } from '@/types';

type AuthStatus = 'booting' | 'authenticated' | 'anonymous';

interface AuthState {
  user: Profile | null;
  accessToken: string | null;
  status: AuthStatus;

  setSession: (user: Profile, token: string) => void;
  setUser: (user: Profile) => void;
  setToken: (token: string) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

// Cross-tab authentication synchronization.
let authChannel: BroadcastChannel | null = null;

if (
  typeof window !== 'undefined' &&
  'BroadcastChannel' in window
) {
  authChannel = new BroadcastChannel('projectmatch_auth');
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for logout events from other browser tabs.
  if (authChannel) {
    authChannel.onmessage = (event) => {
      if (event.data === 'auth:logout') {
        set({
          user: null,
          accessToken: null,
          status: 'anonymous',
        });
      }
    };
  }

  return {
    user: null,
    accessToken: null,
    status: 'booting',

    // Save authenticated user and access token.
    setSession: (user, token) => {
      set({
        user,
        accessToken: token,
        status: 'authenticated',
      });
    },

    // Update user profile.
    setUser: (user) => {
      set({ user });
    },

    // Update token without changing authentication status.
    setToken: (token) => {
      set({ accessToken: token });
    },

    // Update authentication status.
    setStatus: (status) => {
      set({ status });
    },

    // Clear authentication data.
    clear: () => {
      set({
        user: null,
        accessToken: null,
        status: 'anonymous',
      });

      // Notify other browser tabs.
      authChannel?.postMessage('auth:logout');
    },
  };
});
