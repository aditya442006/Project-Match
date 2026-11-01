import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  isOnline: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsOnline: (online: boolean) => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pm_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  theme: getInitialTheme(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pm_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('pm_theme', next);
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: next };
    });
  },

  setIsOnline: (online) => set({ isOnline: online }),
}));
