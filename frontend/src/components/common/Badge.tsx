import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
}) => {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    neutral: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === 'success'
                ? 'bg-emerald-400'
                : variant === 'warning'
                ? 'bg-amber-400'
                : variant === 'teal'
                ? 'bg-teal-400'
                : 'bg-red-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              variant === 'success'
                ? 'bg-emerald-500'
                : variant === 'warning'
                ? 'bg-amber-500'
                : variant === 'teal'
                ? 'bg-teal-500'
                : 'bg-red-500'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
};
