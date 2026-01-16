import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import UserMenu from './UserMenu';

const mockUser = {
  username: 'testuser',
  email: 'test@example.com',
};

describe('UserMenu', () => {
  describe('Rendering', () => {
    it('should render user menu button with avatar', () => {
      render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      expect(button).toBeInTheDocument();
    });

    it('should display user initials in avatar', () => {
      render(<UserMenu user={mockUser} />);

      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu', () => {
    it('should show dropdown when button is clicked', async () => {
      const { user } = render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should hide dropdown when clicked outside', async () => {
      const { user } = render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      expect(screen.getByText(/profile/i)).toBeInTheDocument();

      // Click outside
      await user.click(document.body);

      expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
    });

    it('should display username in dropdown', async () => {
      const { user } = render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    });

    it('should display email in dropdown', async () => {
      const { user } = render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });
  });

  describe('Logout', () => {
    it('should call onLogout when logout button is clicked', async () => {
      const onLogout = vi.fn();
      const { user } = render(<UserMenu user={mockUser} onLogout={onLogout} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for profile link', async () => {
      const { user } = render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      const profileLink = screen.getByRole('link', { name: /profile/i });
      expect(profileLink).toHaveAttribute('href', '/settings');
    });

    it('should have correct href for settings link', async () => {
      const { user } = render(<UserMenu user={mockUser} />);

      const button = screen.getByRole('button', { name: /user menu/i });
      await user.click(button);

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });
});
