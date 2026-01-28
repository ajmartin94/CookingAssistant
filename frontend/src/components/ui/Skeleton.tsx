/**
 * Skeleton Loading Component
 *
 * Displays a shimmer animation placeholder for loading states.
 * Uses the animate-shimmer CSS class defined in theme.css.
 */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

const variantStyles: Record<string, string> = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
};

export function Skeleton({
  width,
  height,
  borderRadius,
  variant = 'text',
  className = '',
}: SkeletonProps) {
  const variantClass = variantStyles[variant] || variantStyles.text;

  return (
    <div
      data-testid="skeleton"
      className={`skeleton animate-shimmer bg-hover ${variantClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
      aria-hidden="true"
    />
  );
}
