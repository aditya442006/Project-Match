import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../src/store/authStore';
import type { Profile } from '../src/types';

describe('authStore (in-memory token handling)', () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  const mockUser: Profile = {
    id: 'user-123',
    email: 'student@college.edu',
    name: 'Alice Student',
    role: 'student',
    is_verified: true,
    skills: [],
    preferred_tech: [],
    interests: [],
    looking_for: ['project'],
    experience: [],
    availability: {
      hours_per_week: 10,
      timezone: 'UTC',
      slots: [],
    },
  };

  it('initializes with booting status or anonymous when cleared', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.status).toBe('anonymous');
  });

  it('stores access token in-memory only and never touches localStorage for tokens', () => {
    useAuthStore.getState().setSession(mockUser, 'test-access-token-123');

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('user-123');
    expect(state.accessToken).toBe('test-access-token-123');
    expect(state.status).toBe('authenticated');

    // Confirm tokens are never stored in localStorage
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
    expect(storedToken).toBeNull();
  });

  it('clears state on logout', () => {
    useAuthStore.getState().setSession(mockUser, 'test-token');
    useAuthStore.getState().clear();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.status).toBe('anonymous');
  });
});
