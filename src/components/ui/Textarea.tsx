import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:text-rose-200'
              : 'border-slate-300 dark:border-slate-700'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
