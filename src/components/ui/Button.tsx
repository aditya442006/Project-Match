import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variantClasses = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm focus:ring-indigo-500 border border-transparent dark:bg-indigo-600 dark:hover:bg-indigo-500',
      secondary:
        'bg-slate-800 text-white hover:bg-slate-900 shadow-sm focus:ring-slate-700 border border-transparent dark:bg-slate-700 dark:hover:bg-slate-600',
      outline:
        'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-indigo-500 shadow-xs',
      ghost:
        'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:ring-indigo-500 border border-transparent',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500 border border-transparent dark:bg-rose-700 dark:hover:bg-rose-600',
      subtle:
        'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60 focus:ring-indigo-500',
    };

    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
      icon: 'p-2 h-10 w-10 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
