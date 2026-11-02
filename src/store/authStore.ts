
import { create } from 'zustand';

import type {
  AuthSession,
  Profile,
} from '@/types';

interface AuthState {
  user: Profile | null;
  accessToken: string | null;
  session: AuthSession | null;

  status: 'booting' | 'authenticated' | 'anonymous';

  setSession: (
    user: Profile,
    token: string,
    session?: AuthSession | null
  ) => void;

  setUser: (user: Profile) => void;
  setToken: (token: string) => void;

  setStatus: (
    status: 'booting' | 'authenticated' | 'anonymous'
  ) => void;

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
  if (authChannel) {
    authChannel.onmessage = (event) => {
      if (event.data === 'auth:logout') {
        set({
          user: null,
          accessToken: null,
          session: null,
          status: 'anonymous',
        });
      }
    };
  }

  return {
    user: null,
    accessToken: null,
    session: null,
    status: 'booting',

    // Save user, access token and complete Supabase session.
    setSession: (user, token, session = null) => {
      set({
        user,
        accessToken: token,
        session,
        status: 'authenticated',
      });
    },

    setUser: (user) => {
      set({ user });
    },

    setToken: (token) => {
      set({
        accessToken: token,
        status: 'authenticated',
      });
    },

    setStatus: (status) => {
      set({ status });
    },

    // Clear all authentication information.
    clear: () => {
      set({
        user: null,
        accessToken: null,
        session: null,
        status: 'anonymous',
      });

      if (authChannel) {
        authChannel.postMessage('auth:logout');
      }
    },
  };
});
