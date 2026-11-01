import React, { useState } from 'react';
import { getInitials } from '@/lib/format';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  indicator?: 'online' | 'offline' | null;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  indicator = null,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const indicatorSizes = {
    xs: 'w-1.5 h-1.5 right-0 bottom-0',
    sm: 'w-2 h-2 right-0 bottom-0',
    md: 'w-2.5 h-2.5 right-0.5 bottom-0.5',
    lg: 'w-3 h-3 right-0.5 bottom-0.5',
    xl: 'w-3.5 h-3.5 right-1 bottom-1',
  };

  const showImage = src && !imageError;

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-900`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-medium flex items-center justify-center ring-2 ring-white dark:ring-slate-900 select-none shadow-xs`}
        >
          {getInitials(name)}
        </div>
      )}

      {indicator && (
        <span
          className={`absolute rounded-full border-2 border-white dark:border-slate-900 ${
            indicatorSizes[size]
          } ${indicator === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}
        />
      )}
    </div>
  );
};
