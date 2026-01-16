import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '../../test/test-utils';
import Toast, { ToastContainer } from './Toast';

describe('Toast', () => {
  const defaultProps = {
    id: 'test-toast',
    type: 'success' as const,
    message: 'Success message',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toast message', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should have alert role', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<Toast {...defaultProps} />);

      expect(screen.getByRole('button', { name: /close notification/i })).toBeInTheDocument();
    });
  });

  describe('Types', () => {
    it('should render success type with correct styling', () => {
      render(<Toast {...defaultProps} type="success" />);

      expect(screen.getByRole('alert')).toHaveClass('bg-success-50');
    });

    it('should render error type with correct styling', () => {
      render(<Toast {...defaultProps} type="error" message="Error" />);

      expect(screen.getByRole('alert')).toHaveClass('bg-error-50');
    });

    it('should render warning type with correct styling', () => {
      render(<Toast {...defaultProps} type="warning" message="Warning" />);

      expect(screen.getByRole('alert')).toHaveClass('bg-warning-50');
    });

    it('should render info type with correct styling', () => {
      render(<Toast {...defaultProps} type="info" message="Info" />);

      expect(screen.getByRole('alert')).toHaveClass('bg-primary-50');
    });
  });

  describe('Auto-dismiss', () => {
    it('should call onClose after default duration', () => {
      const onClose = vi.fn();
      render(<Toast {...defaultProps} onClose={onClose} />);

      // Fast-forward past the duration (4000ms) + exit animation (300ms)
      act(() => {
        vi.advanceTimersByTime(4300);
      });

      expect(onClose).toHaveBeenCalledWith('test-toast');
    });

    it('should call onClose after custom duration', () => {
      const onClose = vi.fn();
      render(<Toast {...defaultProps} onClose={onClose} duration={2000} />);

      act(() => {
        vi.advanceTimersByTime(2300);
      });

      expect(onClose).toHaveBeenCalledWith('test-toast');
    });
  });

  describe('Manual Close', () => {
    it('should call onClose when close button is clicked', async () => {
      vi.useRealTimers(); // Use real timers for user interaction
      const onClose = vi.fn();
      const { user } = render(<Toast {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /close notification/i }));

      // Wait for exit animation
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(onClose).toHaveBeenCalledWith('test-toast');
    });
  });
});

describe('ToastContainer', () => {
  const mockToasts = [
    { id: '1', type: 'success' as const, message: 'Success 1', onClose: vi.fn() },
    { id: '2', type: 'error' as const, message: 'Error 2', onClose: vi.fn() },
  ];

  it('should render nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={() => {}} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render all toasts', () => {
    render(<ToastContainer toasts={mockToasts} onClose={() => {}} />);

    expect(screen.getByText('Success 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
  });

  it('should be positioned in top-right corner', () => {
    const { container } = render(<ToastContainer toasts={mockToasts} onClose={() => {}} />);

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('fixed', 'top-4', 'right-4');
  });

  it('should have high z-index', () => {
    const { container } = render(<ToastContainer toasts={mockToasts} onClose={() => {}} />);

    const containerDiv = container.firstChild as HTMLElement;
    expect(containerDiv).toHaveClass('z-50');
  });
});
