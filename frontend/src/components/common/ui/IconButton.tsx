/**
 * IconButton Component
 *
 * Icon-only button with accessibility support.
 */

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string; // Required for accessibility
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variantStyles = {
  primary: 'bg-accent text-text-on-accent hover:bg-accent-hover focus:ring-accent',
  secondary: 'bg-secondary text-text-secondary hover:bg-hover focus:ring-accent',
  ghost: 'text-text-secondary hover:bg-hover focus:ring-accent',
  outline: 'border border-default text-text-secondary hover:bg-hover focus:ring-accent',
};

const sizeStyles = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center rounded-md
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        aria-label={label}
        title={label}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : (
          <span className={iconSizes[size]}>{icon}</span>
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
