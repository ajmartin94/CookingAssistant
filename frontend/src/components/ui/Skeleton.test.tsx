import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('should render with shimmer animation class', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-shimmer');
    expect(skeleton).toHaveClass('skeleton');
  });

  it('should render with bg-hover background', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-hover');
  });

  it('should support width and height props', () => {
    render(<Skeleton width={200} height={20} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.style.width).toBe('200px');
    expect(skeleton.style.height).toBe('20px');
  });

  it('should support string width/height', () => {
    render(<Skeleton width="100%" height="2rem" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.style.width).toBe('100%');
    expect(skeleton.style.height).toBe('2rem');
  });

  it('should render circular variant with rounded-full', () => {
    render(<Skeleton variant="circular" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should render rectangular variant with rounded-lg', () => {
    render(<Skeleton variant="rectangular" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('should render text variant (default) with rounded', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded');
  });

  it('should be hidden from screen readers', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('should accept custom className', () => {
    render(<Skeleton className="my-custom-class" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('my-custom-class');
  });

  it('should support custom borderRadius', () => {
    render(<Skeleton borderRadius={8} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.style.borderRadius).toBe('8px');
  });
});
