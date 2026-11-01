import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  Users,
  SendHorizontal,
  Bell,
  ShieldAlert,
  X,
  PlusCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Find Teammates', path: '/matching', icon: Sparkles, badge: 'AI' },
    { label: 'Explore Projects', path: '/projects', icon: FolderKanban },
    { label: 'My Teams', path: '/teams', icon: Users },
    { label: 'Requests', path: '/requests', icon: SendHorizontal },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
  ];

  if (isAdmin) {
    navItems.push({
      label: 'Admin Panel',
      path: '/admin',
      icon: ShieldAlert,
    });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Navigation</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action: New Project */}
        <div className="p-4 pb-2">
          <NavLink
            to="/projects/new"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Post a Project</span>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.badge === 'AI'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        {user && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                {user.college ? user.college.slice(0, 2).toUpperCase() : 'PM'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                  {user.college || 'Student'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.branch ? `${user.branch}${user.year ? ` · Yr ${user.year}` : ''}` : 'ProjectMatch'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
