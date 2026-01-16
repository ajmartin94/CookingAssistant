import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Sidebar from './Sidebar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Sidebar', () => {
  describe('Rendering', () => {
    it('should render navigation items', () => {
      render(<Sidebar />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /libraries/i })).toBeInTheDocument();
    });

    it('should render coming soon items', () => {
      render(<Sidebar />);

      expect(screen.getByText(/meal planning/i)).toBeInTheDocument();
      expect(screen.getByText(/cooking mode/i)).toBeInTheDocument();
    });

    it('should render settings link', () => {
      render(<Sidebar />);

      expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for dashboard', () => {
      render(<Sidebar />);

      const link = screen.getByRole('link', { name: /dashboard/i });
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('should have correct href for recipes', () => {
      render(<Sidebar />);

      const link = screen.getByRole('link', { name: /my recipes/i });
      expect(link).toHaveAttribute('href', '/recipes');
    });

    it('should have correct href for libraries', () => {
      render(<Sidebar />);

      const link = screen.getByRole('link', { name: /libraries/i });
      expect(link).toHaveAttribute('href', '/libraries');
    });

    it('should have correct href for settings', () => {
      render(<Sidebar />);

      const link = screen.getByRole('link', { name: /settings/i });
      expect(link).toHaveAttribute('href', '/settings');
    });
  });

  describe('Collapsed State', () => {
    it('should have full width when not collapsed', () => {
      const { container } = render(<Sidebar isCollapsed={false} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
    });

    it('should have narrow width when collapsed', () => {
      const { container } = render(<Sidebar isCollapsed={true} />);

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-16');
    });

    it('should hide text labels when collapsed', () => {
      render(<Sidebar isCollapsed={true} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink.querySelector('.sidebar-label')).toHaveClass('hidden');
    });
  });

  describe('Toggle Button', () => {
    it('should call onToggle when toggle button is clicked', async () => {
      const onToggle = vi.fn();
      const { user } = render(<Sidebar onToggle={onToggle} />);

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i });
      await user.click(toggleButton);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should show expand label when collapsed', () => {
      render(<Sidebar isCollapsed={true} onToggle={() => {}} />);

      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    });
  });
});
