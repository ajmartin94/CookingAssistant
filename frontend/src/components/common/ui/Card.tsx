/**
 * Card Component
 *
 * Flexible card container with shadow variants.
 */

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  default: 'bg-card shadow-soft',
  elevated: 'bg-card shadow-soft-md',
  outline: 'bg-card border border-default',
  interactive:
    'bg-card shadow-soft hover:shadow-soft-md transition-shadow duration-200 cursor-pointer',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-xl overflow-hidden
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components for structured content
export const CardHeader = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`border-b border-default pb-4 mb-4 ${className}`}>{children}</div>;

export const CardContent = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

export const CardFooter = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`border-t border-default pt-4 mt-4 ${className}`}>{children}</div>;

export default Card;
