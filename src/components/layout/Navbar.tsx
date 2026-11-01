import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Avatar } from '@/components/ui/Avatar';
import {
  Bell,
  Search,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  FolderGit2,
  Users2,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleSidebar, theme, toggleTheme } = useUiStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm font-black text-lg tracking-wider">
              PM
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight hidden sm:inline">
              Project<span className="text-indigo-600 dark:text-indigo-400">Match</span>
            </span>
          </Link>
        </div>

        {/* Middle: Global Search */}
        {user && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects, skills, or colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
              />
            </div>
          </form>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <>
              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Avatar Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="User menu"
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
                >
                  <Avatar src={user.avatar_url} name={user.name} size="sm" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile/me"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/teams"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Users2 className="w-4 h-4 text-slate-400" />
                        My Teams
                      </Link>
                      <Link
                        to="/projects"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <FolderGit2 className="w-4 h-4 text-slate-400" />
                        Explore Projects
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-xl transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
