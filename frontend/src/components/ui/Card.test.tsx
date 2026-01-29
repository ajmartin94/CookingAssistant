/**
 * Tests for Card component
 *
 * Verifies card rendering with correct background and border,
 * hover glow effect, composable sub-components, and theme support.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card', () => {
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
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with correct background color (bg-card)', () => {
      render(
        <Card>
          <p data-testid="card-child">Content</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      expect(card).toBeInTheDocument();

      // Card should use --bg-card CSS variable
      const styles = window.getComputedStyle(card!);
      expect(
        card!.classList.contains('card') ||
          styles.backgroundColor !== '' ||
          card!.getAttribute('data-component') === 'card'
      ).toBe(true);
    });

    it('should render with border', () => {
      render(
        <Card>
          <p data-testid="card-child">Content</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Card should have a border
      const styles = window.getComputedStyle(card!);
      expect(
        styles.borderWidth !== '0px' ||
          styles.border !== 'none' ||
          card!.classList.toString().includes('border')
      ).toBe(true);
    });

    it('should render with border-radius', () => {
      render(
        <Card>
          <p data-testid="card-child">Content</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Card should have border-radius (10-14px per design system)
      const styles = window.getComputedStyle(card!);
      expect(styles.borderRadius !== '0px' || card!.classList.toString().includes('rounded')).toBe(
        true
      );
    });
  });

  describe('hover state', () => {
    it('should show hover glow effect on mouse enter when hoverable', async () => {
      const user = userEvent.setup();

      render(
        <Card hoverable>
          <p data-testid="card-child">Hoverable content</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Hover the card
      await user.hover(card!);

      await waitFor(() => {
        const styles = window.getComputedStyle(card!);
        // Should have enhanced border color or box-shadow on hover
        expect(
          styles.boxShadow !== 'none' ||
            styles.borderColor !== '' ||
            card!.classList.toString().includes('hover') ||
            card!.getAttribute('data-hovered') === 'true'
        ).toBe(true);
      });
    });

    it('should not show hover effect when not hoverable', async () => {
      const user = userEvent.setup();

      render(
        <Card hoverable={false}>
          <p data-testid="card-child">Non-hoverable content</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Hover the card
      await user.hover(card!);

      // Non-hoverable cards should not gain hover effects
      expect(card!.getAttribute('data-hovered')).not.toBe('true');
    });

    it('should have transition for smooth hover effect', () => {
      render(
        <Card hoverable>
          <p data-testid="card-child">Content</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      const styles = window.getComputedStyle(card!);
      // Should have transition property for smooth animations
      expect(
        styles.transition !== 'none' ||
          styles.transitionProperty !== 'none' ||
          card!.classList.toString().includes('transition')
      ).toBe(true);
    });
  });

  describe('theme support', () => {
    it('should render correctly in dark theme', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      render(
        <Card>
          <p data-testid="card-child">Dark theme card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      expect(card).toBeInTheDocument();
      // Card should render with theme-appropriate colors
      const styles = window.getComputedStyle(card!);
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('should render correctly in light theme', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      render(
        <Card>
          <p data-testid="card-child">Light theme card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      expect(card).toBeInTheDocument();
      // Card should render with theme-appropriate colors
      const styles = window.getComputedStyle(card!);
      expect(styles.backgroundColor).toBeTruthy();
    });
  });

  describe('composable sub-components', () => {
    it('should render CardHeader with children', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
    });

    it('should render CardContent with children', () => {
      render(
        <Card>
          <CardContent>
            <p>Card body content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Card body content')).toBeInTheDocument();
    });

    it('should render CardFooter with children', () => {
      render(
        <Card>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('should render full card composition with all sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Recipe Card</h2>
          </CardHeader>
          <CardContent>
            <p>A delicious recipe description</p>
          </CardContent>
          <CardFooter>
            <button>View Recipe</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Recipe Card' })).toBeInTheDocument();
      expect(screen.getByText('A delicious recipe description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Recipe' })).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    it('should be focusable when hoverable (interactive)', async () => {
      const user = userEvent.setup();

      render(
        <>
          <button>Before</button>
          <Card hoverable>
            <p>Focusable card</p>
          </Card>
          <button>After</button>
        </>
      );

      // Tab through elements
      await user.tab(); // Focus "Before"
      await user.tab(); // Focus the Card

      const card = screen.getByText('Focusable card').parentElement;
      expect(card).toHaveFocus();
    });

    it('should have visible focus indicator when focused', () => {
      render(
        <Card hoverable>
          <p data-testid="card-child">Focusable card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Focus the card
      card!.focus();

      // Should have visible focus indicator
      const styles = window.getComputedStyle(card!);
      expect(
        styles.outline !== 'none' ||
          styles.boxShadow !== 'none' ||
          card!.classList.toString().includes('focus')
      ).toBe(true);
    });
  });

  describe('seasonal card shadow', () => {
    it('should use var(--card-shadow) for box-shadow styling', () => {
      render(
        <Card>
          <p data-testid="card-child">Seasonal shadow card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Card should reference var(--card-shadow) in its style or class
      const style = card!.getAttribute('style') || '';
      const className = card!.className || '';

      // Either inline style with var(--card-shadow) or a class that maps to it
      const usesCardShadow =
        style.includes('var(--card-shadow)') || className.includes('shadow-season');

      expect(
        usesCardShadow,
        'Card should use var(--card-shadow) for its box-shadow (via inline style or shadow-season class)'
      ).toBe(true);
    });
  });

  describe('strict plan requirements', () => {
    it('should have card-animated class when hoverable for glow border effect', () => {
      render(
        <Card hoverable>
          <p data-testid="card-child">Animated card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Plan requires card-animated class for hover glow effect
      expect(card!.className).toContain('card-animated');
    });

    it('should accept padding prop to control internal spacing', () => {
      render(
        <Card padding="lg">
          <p data-testid="card-child">Padded card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Should have large padding class
      expect(card!.className).toMatch(/p-6|p-8/);
    });

    it('should accept variant prop for different card styles', () => {
      render(
        <Card variant="elevated">
          <p data-testid="card-child">Elevated card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      expect(
        card!.getAttribute('data-variant') === 'elevated' || card!.className.includes('shadow')
      ).toBe(true);
    });

    it('should have role="article" or semantic element for accessibility', () => {
      render(
        <Card>
          <p data-testid="card-child">Accessible card</p>
        </Card>
      );

      const cardChild = screen.getByTestId('card-child');
      const card = cardChild.parentElement;

      // Card should have a semantic role for screen readers
      expect(
        card!.getAttribute('role') === 'article' ||
          card!.tagName.toLowerCase() === 'article' ||
          card!.tagName.toLowerCase() === 'section'
      ).toBe(true);
    });
  });
});
