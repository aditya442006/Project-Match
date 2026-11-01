import React from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  max?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  readOnly = false,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: max }).map((_, idx) => {
        const starVal = idx + 1;
        const isFilled = starVal <= value;
        return (
          <button
            key={starVal}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starVal)}
            className={`p-0.5 rounded transition-transform ${
              readOnly
                ? 'cursor-default'
                : 'hover:scale-110 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            }`}
            aria-label={`${starVal} of ${max} stars`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-300 dark:text-slate-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
