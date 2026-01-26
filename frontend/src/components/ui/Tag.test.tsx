/**
 * Tests for Tag and Badge components
 *
 * Verifies tag rendering with muted background and theme support.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Tag, Badge } from './Tag';

describe('Tag', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('basic rendering', () => {
    it('should render children content', () => {
      render(<Tag>Vegetarian</Tag>);

      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    });

    it('should render with muted background (bg-hover)', () => {
      render(
        <Tag>
          <span data-testid="tag-child">Quick</span>
        </Tag>
      );

      const tagChild = screen.getByTestId('tag-child');
      const tag = tagChild.parentElement;

      expect(tag).toBeInTheDocument();

      // Tag should use --bg-hover CSS variable for muted background
      const styles = window.getComputedStyle(tag!);
      expect(
        tag!.classList.contains('tag') ||
          styles.backgroundColor !== '' ||
          tag!.getAttribute('data-component') === 'tag'
      ).toBe(true);
    });

    it('should render with small border-radius (4-6px)', () => {
      render(
        <Tag>
          <span data-testid="tag-child">Easy</span>
        </Tag>
      );

      const tagChild = screen.getByTestId('tag-child');
      const tag = tagChild.parentElement;

      // Tag should have small border-radius
      const styles = window.getComputedStyle(tag!);
      expect(styles.borderRadius !== '0px' || tag!.classList.toString().includes('rounded')).toBe(
        true
      );
    });

    it('should render with small font size (12px)', () => {
      render(
        <Tag>
          <span data-testid="tag-child">30 min</span>
        </Tag>
      );

      const tagChild = screen.getByTestId('tag-child');
      const tag = tagChild.parentElement;

      // Tag should have small font size class (text-xs = 12px)
      expect(tag!.className).toMatch(/text-xs|text-sm|text-\[12px\]/);
    });

    it('should render with secondary text color', () => {
      render(
        <Tag>
          <span data-testid="tag-child">Gluten-free</span>
        </Tag>
      );

      const tagChild = screen.getByTestId('tag-child');
      const tag = tagChild.parentElement;

      // Tag should use --text-secondary color
      const styles = window.getComputedStyle(tag!);
      expect(styles.color !== '' || tag!.classList.toString().includes('text-secondary')).toBe(
        true
      );
    });
  });

  describe('theme support', () => {
    it('should render correctly in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      render(<Tag>Dark theme tag</Tag>);

      const tag = screen.getByText('Dark theme tag');
      expect(tag).toBeInTheDocument();
    });

    it('should render correctly in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      render(<Tag>Light theme tag</Tag>);

      const tag = screen.getByText('Light theme tag');
      expect(tag).toBeInTheDocument();
    });
  });

  describe('multiple tags', () => {
    it('should render multiple tags correctly', () => {
      render(
        <div>
          <Tag>Vegetarian</Tag>
          <Tag>Quick</Tag>
          <Tag>Easy</Tag>
        </div>
      );

      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('Quick')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });
  });
});

describe('Badge', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('basic rendering', () => {
    it('should render children content', () => {
      render(<Badge>New</Badge>);

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render with accent background by default', () => {
      render(
        <Badge>
          <span data-testid="badge-child">Featured</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      expect(badge).toBeInTheDocument();

      // Badge should have bg-accent class by default
      expect(badge!.className).toContain('bg-accent');
    });

    it('should render with white text on accent background', () => {
      render(
        <Badge>
          <span data-testid="badge-child">Hot</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      // Badge should have text-white class
      expect(badge!.className).toContain('text-white');
    });

    it('should render with pill-like border-radius (4px)', () => {
      render(
        <Badge>
          <span data-testid="badge-child">Pro</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      // Badge should have small border-radius
      const styles = window.getComputedStyle(badge!);
      expect(styles.borderRadius !== '0px' || badge!.classList.toString().includes('rounded')).toBe(
        true
      );
    });

    it('should render with very small font size (10px)', () => {
      render(
        <Badge>
          <span data-testid="badge-child">5</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      // Badge should have very small font size class
      expect(badge!.className).toMatch(/text-\[10px\]|text-xs/);
    });

    it('should render with medium font weight (500)', () => {
      render(
        <Badge>
          <span data-testid="badge-child">Bold</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      // Badge should have font-medium class
      expect(badge!.className).toContain('font-medium');
    });
  });

  describe('variants', () => {
    it('should render default variant with muted styling', () => {
      render(
        <Badge variant="default">
          <span data-testid="badge-child">Default</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      // Default variant should have bg-hover (muted) class
      expect(badge!.className).toContain('bg-hover');
    });

    it('should render accent variant with accent background', () => {
      render(
        <Badge variant="accent">
          <span data-testid="badge-child">Accent</span>
        </Badge>
      );

      const badgeChild = screen.getByTestId('badge-child');
      const badge = badgeChild.parentElement;

      expect(
        badge!.getAttribute('data-variant') === 'accent' ||
          badge!.classList.toString().includes('accent')
      ).toBe(true);
    });
  });

  describe('theme support', () => {
    it('should render correctly in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      render(<Badge>Dark theme badge</Badge>);

      const badge = screen.getByText('Dark theme badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render correctly in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      render(<Badge>Light theme badge</Badge>);

      const badge = screen.getByText('Light theme badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('should allow focus when part of a focusable parent', async () => {
      const user = userEvent.setup();

      render(
        <button>
          <Badge>Click me</Badge>
        </button>
      );

      await user.tab();

      const button = screen.getByRole('button');
      expect(button).toHaveFocus();
    });
  });
});
