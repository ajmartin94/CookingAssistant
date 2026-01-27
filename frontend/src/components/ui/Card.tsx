/**
 * Card Component
 *
 * A composable card component with Card, CardHeader, CardContent, and CardFooter.
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', hoverable = false }: CardProps) {
  return (
    <div
      className={`
        bg-card border border-default rounded-xl
        ${hoverable ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-accent/10 hover:border-accent/30 focus:outline-none focus:ring-2 focus:ring-accent-subtle' : ''}
        ${className}
      `}
      tabIndex={hoverable ? 0 : undefined}
      data-hoverable={hoverable || undefined}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`px-4 py-3 border-b border-default ${className}`}>{children}</div>;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`px-4 py-3 border-t border-default ${className}`}>{children}</div>;
}
