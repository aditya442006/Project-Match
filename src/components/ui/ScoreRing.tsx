import React from 'react';

export interface ScoreRingProps {
  score: number; // 0 to 1 or 0 to 100
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 54,
  strokeWidth = 5,
  showText = true,
  className = '',
}) => {
  // Normalize score to 0 - 100
  const normalized = score > 1 ? Math.min(100, Math.max(0, score)) : Math.min(100, Math.max(0, score * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  let colorClass = 'text-indigo-600 dark:text-indigo-400';
  if (normalized >= 80) {
    colorClass = 'text-emerald-500';
  } else if (normalized >= 50) {
    colorClass = 'text-indigo-600 dark:text-indigo-400';
  } else {
    colorClass = 'text-amber-500';
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-500 ease-out`}
          fill="transparent"
        />
      </svg>
      {showText && (
        <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-100">
          {Math.round(normalized)}%
        </span>
      )}
    </div>
  );
};
