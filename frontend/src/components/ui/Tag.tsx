/**
 * Tag Component
 *
 * A small tag/badge component for displaying metadata.
 */

import React from 'react';

export interface TagProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  onRemove?: () => void;
}

const tagVariantClasses = {
  default: 'bg-hover text-text-secondary',
  success: 'bg-success text-text-primary',
  warning: 'bg-warning text-text-primary',
  error: 'bg-error text-text-primary',
};

export function Tag({ children, className = '', variant = 'default', onRemove }: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        ${tagVariantClasses[variant]}
        text-xs rounded
        ${className}
      `}
      data-variant={variant}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center hover:opacity-70"
          aria-label="Remove"
        >
          &times;
        </button>
      )}
    </span>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'accent';
}

export function Badge({ children, className = '', variant = 'accent' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-hover text-text-secondary',
    accent: 'bg-accent text-text-on-accent',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5
        text-[10px] font-medium
        rounded-full
        ${variantClasses[variant]}
        ${className}
      `}
      data-variant={variant}
    >
      {children}
    </span>
  );
}
