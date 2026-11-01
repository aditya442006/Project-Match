import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 bg-transparent',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
