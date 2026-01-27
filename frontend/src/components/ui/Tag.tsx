/**
 * Tag Component
 *
 * A small tag/badge component for displaying metadata.
 */

import React from 'react';

export interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className = '' }: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        bg-hover text-text-secondary
        text-xs rounded
        ${className}
      `}
    >
      {children}
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
    accent: 'bg-accent text-white',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5
        text-[10px] font-medium
        rounded
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
