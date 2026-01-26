/**
 * Skeleton Component
 *
 * A loading placeholder with shimmer animation effect.
 * Supports different variants: rectangular (default), rounded, and circular.
 */

import React from 'react';

export interface SkeletonProps {
  /** Width of the skeleton in pixels or CSS value */
  width?: number | string;
  /** Height of the skeleton in pixels or CSS value */
  height?: number | string;
  /** Shape variant of the skeleton */
  variant?: 'rectangular' | 'rounded' | 'circular';
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  className = '',
  'data-testid': testId,
}: SkeletonProps): JSX.Element {
  const variantClasses = {
    rectangular: 'rounded',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`skeleton animate-shimmer bg-[var(--bg-hover)] ${variantClasses[variant]} ${className}`}
      style={style}
      data-testid={testId}
      aria-hidden="true"
      role="presentation"
    />
  );
}
