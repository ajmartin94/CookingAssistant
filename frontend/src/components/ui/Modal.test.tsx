import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Modal from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(<Modal {...defaultProps} footer={<button>Save</button>} />);

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('should have dialog role', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal attribute', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Sizes', () => {
    it('should render medium size by default', () => {
      const { container } = render(<Modal {...defaultProps} />);

      expect(container.querySelector('.max-w-md')).toBeInTheDocument();
    });

    it('should render small size', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />);

      expect(container.querySelector('.max-w-sm')).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />);

      expect(container.querySelector('.max-w-lg')).toBeInTheDocument();
    });

    it('should render xl size', () => {
      const { container } = render(<Modal {...defaultProps} size="xl" />);

      expect(container.querySelector('.max-w-xl')).toBeInTheDocument();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const { user } = render(<Modal {...defaultProps} title="Title" onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /close modal/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const onClose = vi.fn();
      const { user, container } = render(<Modal {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when Escape key is pressed', async () => {
      const onClose = vi.fn();
      const { user } = render(<Modal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-labelledby when title is provided', () => {
      render(<Modal {...defaultProps} title="Modal Title" />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should render close button with accessible label', () => {
      render(<Modal {...defaultProps} title="Title" />);

      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when open', () => {
      render(<Modal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });
  });
});
