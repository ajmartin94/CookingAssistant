import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import AppShell from './AppShell';

const mockUser = {
  username: 'testuser',
  email: 'test@example.com',
};

describe('AppShell', () => {
  describe('Rendering', () => {
    it('should render children content', () => {
      render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render the header', () => {
      render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });

    it('should render the sidebar', () => {
      render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render sidebar navigation links', () => {
      render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /libraries/i })).toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle', () => {
    it('should toggle sidebar when toggle button is clicked', async () => {
      const { user, container } = render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      expect(sidebar).toHaveClass('w-16');
    });
  });

  describe('Mobile Navigation', () => {
    it('should open mobile nav when hamburger is clicked', async () => {
      const { user } = render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      // Mobile nav should not be visible initially
      expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();

      // Click the hamburger menu
      const hamburger = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(hamburger);

      // Mobile nav should now be visible
      expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('should call onSearch when search is submitted', async () => {
      const onSearch = vi.fn();
      const { user } = render(
        <AppShell user={mockUser} onSearch={onSearch}>
          <div>Test Content</div>
        </AppShell>
      );

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'pasta');
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('pasta');
    });
  });

  describe('Logout', () => {
    it('should call onLogout when logout is clicked', async () => {
      const onLogout = vi.fn();
      const { user } = render(
        <AppShell user={mockUser} onLogout={onLogout}>
          <div>Test Content</div>
        </AppShell>
      );

      // Open user menu
      const userMenuButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(userMenuButton);

      // Click logout
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout', () => {
    it('should have main content area', () => {
      render(
        <AppShell user={mockUser}>
          <div>Test Content</div>
        </AppShell>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render children inside main content area', () => {
      render(
        <AppShell user={mockUser}>
          <div data-testid="page-content">Page Content</div>
        </AppShell>
      );

      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByTestId('page-content'));
    });
  });
});
