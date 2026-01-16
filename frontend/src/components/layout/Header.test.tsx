import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Header from './Header';

describe('Header', () => {
  describe('Rendering', () => {
    it('should render app logo', () => {
      render(<Header />);

      expect(screen.getByText(/cooking assistant/i)).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<Header />);

      expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument();
    });

    it('should render user menu button', () => {
      render(<Header user={{ username: 'testuser', email: 'test@example.com' }} />);

      expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });

    it('should render mobile menu toggle button', () => {
      render(<Header onMobileMenuToggle={() => {}} />);

      expect(screen.getByRole('button', { name: /toggle menu/i })).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when search is submitted', async () => {
      const onSearch = vi.fn();
      const { user } = render(<Header onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'pasta');
      await user.keyboard('{Enter}');

      expect(onSearch).toHaveBeenCalledWith('pasta');
    });

    it('should show search value in input', async () => {
      const { user } = render(<Header />);

      const searchInput = screen.getByPlaceholderText(/search recipes/i);
      await user.type(searchInput, 'chicken');

      expect(searchInput).toHaveValue('chicken');
    });
  });

  describe('Mobile Menu Toggle', () => {
    it('should call onMobileMenuToggle when hamburger is clicked', async () => {
      const onMobileMenuToggle = vi.fn();
      const { user } = render(<Header onMobileMenuToggle={onMobileMenuToggle} />);

      const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
      await user.click(toggleButton);

      expect(onMobileMenuToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sidebar Toggle', () => {
    it('should call onSidebarToggle when sidebar toggle is clicked', async () => {
      const onSidebarToggle = vi.fn();
      const { user } = render(<Header onSidebarToggle={onSidebarToggle} />);

      const toggleButton = screen.getByRole('button', { name: /toggle sidebar/i });
      await user.click(toggleButton);

      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });
  });
});
