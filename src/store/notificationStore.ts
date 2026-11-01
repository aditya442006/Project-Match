import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: Math.max(0, count) }),
  incrementUnreadCount: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrementUnreadCount: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  resetUnreadCount: () => set({ unreadCount: 0 }),
}));
