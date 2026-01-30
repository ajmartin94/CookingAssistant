import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { CookingModeOverlay } from './CookingModeOverlay';
import type { Instruction } from '../../types';

const mockInstructions: Instruction[] = [
  { stepNumber: 1, instruction: 'Preheat oven to 350F' },
  { stepNumber: 2, instruction: 'Mix dry ingredients together' },
  { stepNumber: 3, instruction: 'Bake for 25 minutes', durationMinutes: 25 },
];

const defaultProps = {
  recipeTitle: 'Chocolate Cake',
  instructions: mockInstructions,
  onClose: vi.fn(),
  initialStep: 0,
};

describe('CookingModeOverlay', () => {
  it('should render step 1 with recipe data', () => {
    render(<CookingModeOverlay {...defaultProps} />);
    expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
    expect(screen.getByText('Preheat oven to 350F')).toBeInTheDocument();
  });

  it('should navigate steps with Next and Previous buttons', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('Mix dry ingredients together');

    await user.click(screen.getByRole('button', { name: /previous/i }));
    await screen.findByText('Preheat oven to 350F');
  });

  it('should disable Previous button on step 1', () => {
    render(<CookingModeOverlay {...defaultProps} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('should show correct step indicator', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate steps with arrow keys', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    await user.keyboard('{ArrowRight}');
    await screen.findByText('Mix dry ingredients together');

    await user.keyboard('{ArrowLeft}');
    await screen.findByText('Preheat oven to 350F');
  });

  it('should show progress bar reflecting current position', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '3');

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(progressBar).toHaveAttribute('aria-valuenow', '2');
  });

  it('should show empty state when instructions array is empty', () => {
    render(<CookingModeOverlay {...defaultProps} instructions={[]} />);
    expect(screen.getByText(/no steps available/i)).toBeInTheDocument();
  });

  it('should reset to step 1 when Start Over is clicked', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    await screen.findByText('Preheat oven to 350F');
  });

  it('should have correct ARIA attributes for dialog', () => {
    render(<CookingModeOverlay {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should resume from initialStep when provided', () => {
    render(<CookingModeOverlay {...defaultProps} initialStep={1} />);
    expect(screen.getByText('Mix dry ingredients together')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });

  it('should render step content with framer-motion animation', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /next/i }));
    // framer-motion renders with a style attribute containing transform
    const stepText = await screen.findByText('Mix dry ingredients together');
    expect(stepText).toBeInTheDocument();
    expect(stepText.closest('div')).toHaveAttribute('style');
  });

  it('should show Finish button instead of Next on last step', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    // Navigate to last step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
  });

  it('should show completion screen when Finish is clicked', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    // Navigate to last step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    await user.click(screen.getByRole('button', { name: /finish/i }));

    expect(screen.getByRole('heading', { name: /nice work/i })).toBeInTheDocument();
  });

  it('should have a menu button that opens the step menu', async () => {
    const user = userEvent.setup();
    render(<CookingModeOverlay {...defaultProps} />);

    const menuButton = screen.getByRole('button', { name: /menu|steps/i });
    await user.click(menuButton);

    // Step menu should list all steps by number
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });
});
