import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/utils/logger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingTimeout?: number; // Timeout in milliseconds to auto-reset loading state
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  loading = false,
  loadingTimeout = APP_CONFIG.TIMEOUTS.BUTTON_LOADING,
  disabled,
  className,
  children,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(loading);

  // Sync external loading state with internal state
  useEffect(() => {
    setInternalLoading(loading);
  }, [loading]);

  // Auto-reset loading state if it gets stuck
  useEffect(() => {
    if (internalLoading && loadingTimeout > 0) {
      const timeout = setTimeout(() => {
        logger.warn('Button loading state timeout - auto-resetting');
        setInternalLoading(false);
      }, loadingTimeout);

      return () => clearTimeout(timeout);
    }
  }, [internalLoading, loadingTimeout]);

  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
    ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500'
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || internalLoading}
      {...props}
    >
      {internalLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
