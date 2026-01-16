import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import MobileNav from './MobileNav';

describe('MobileNav', () => {
  describe('Rendering', () => {
    it('should not render when closed', () => {
      const { container } = render(<MobileNav isOpen={false} onClose={() => {}} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render navigation when open', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
    });

    it('should render all navigation links when open', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /libraries/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });

    it('should render coming soon items', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      expect(screen.getByText(/meal planning/i)).toBeInTheDocument();
      expect(screen.getByText(/cooking mode/i)).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    });

    it('should render app title', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      expect(screen.getByText(/cooking assistant/i)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const { user } = render(<MobileNav isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close menu/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      const { user, container } = render(<MobileNav isOpen={true} onClose={onClose} />);

      // The backdrop is the first child with the bg-neutral-900/50 class
      const backdrop = container.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when a link is clicked', async () => {
      const onClose = vi.fn();
      const { user } = render(<MobileNav isOpen={true} onClose={onClose} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      await user.click(dashboardLink);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for dashboard', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      const link = screen.getByRole('link', { name: /dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('should have correct href for recipes', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      const link = screen.getByRole('link', { name: /my recipes/i });
      expect(link).toHaveAttribute('href', '/recipes');
    });

    it('should have correct href for libraries', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      const link = screen.getByRole('link', { name: /libraries/i });
      expect(link).toHaveAttribute('href', '/libraries');
    });

    it('should have correct href for settings', () => {
      render(<MobileNav isOpen={true} onClose={() => {}} />);

      const link = screen.getByRole('link', { name: /settings/i });
      expect(link).toHaveAttribute('href', '/settings');
    });
  });
});
