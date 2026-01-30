/**
 * Tests for MainLayout - Seasonal gradient bar
 *
 * Verifies that a gradient bar element exists at the top of the main content area
 * using the --season-gradient CSS variable.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../../test/test-utils';
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

describe('MainLayout - TopBar removal', () => {
  it('should not render a header element (TopBar) in the layout', () => {
    const { container } = render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    const header = container.querySelector('header');
    expect(
      header,
      'MainLayout should not contain a <header> element (TopBar should be removed)'
    ).toBeNull();
  });
});

describe('MainLayout - Logo in layout', () => {
  it('should render a logo link with "CookingAssistant" text in the layout', () => {
    render(
      <MainLayout>
        <div>Test content</div>
      </MainLayout>
    );

    // MainLayout itself (outside Sidebar) should contain a logo link
    const logoText = screen.getByText('CookingAssistant');
    const logoLink = logoText.closest('a');
    expect(logoLink).not.toBeNull();
    expect(logoLink).toHaveAttribute('href', '/home');

    // The logo should be outside the sidebar (in the main layout area)
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.contains(logoText)).toBe(false);
  });
});
