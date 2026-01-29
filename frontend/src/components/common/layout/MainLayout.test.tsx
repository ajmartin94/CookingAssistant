/**
 * Tests for MainLayout - Seasonal gradient bar
 *
 * Verifies that a gradient bar element exists at the top of the main content area
 * using the --season-gradient CSS variable.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '../../../test/test-utils';
import { MainLayout } from './MainLayout';

describe('MainLayout - Seasonal gradient bar', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-season');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-season');
  });

  it('should render a gradient bar element at the top of the content area', () => {
    const { container } = render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    // There should be a gradient bar div with data-testid or identifiable role
    const gradientBar = container.querySelector('[data-testid="season-gradient-bar"]');
    expect(
      gradientBar,
      'Expected a gradient bar element with data-testid="season-gradient-bar"'
    ).not.toBeNull();
  });

  it('should have gradient bar with 4px height', () => {
    const { container } = render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    const gradientBar = container.querySelector('[data-testid="season-gradient-bar"]');
    expect(gradientBar).not.toBeNull();

    // Check for h-1 class (4px in Tailwind) or inline style
    const hasCorrectHeight =
      gradientBar!.className.includes('h-1') || (gradientBar as HTMLElement).style.height === '4px';
    expect(hasCorrectHeight, 'Gradient bar should be 4px tall (h-1 or height: 4px)').toBe(true);
  });

  it('should use var(--season-gradient) for the gradient bar background', () => {
    const { container } = render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    const gradientBar = container.querySelector(
      '[data-testid="season-gradient-bar"]'
    ) as HTMLElement;
    expect(gradientBar).not.toBeNull();

    // The gradient bar should reference var(--season-gradient) in its style
    const style = gradientBar.getAttribute('style') || '';
    expect(
      style.includes('var(--season-gradient)'),
      'Gradient bar should use var(--season-gradient) for its background'
    ).toBe(true);
  });
});
