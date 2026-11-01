import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
              isActive
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
