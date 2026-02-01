/**
 * FeedbackButton Component Tests
 *
 * Tests for the floating feedback button that opens the feedback modal.
 * The button should be visible in the bottom-left corner on all pages
 * (moved from bottom-right to avoid overlap with other UI elements).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { FeedbackButton } from './FeedbackButton';

// Mock html2canvas so useScreenshot.capture() resolves immediately
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/jpeg;base64,mock',
  }),
}));

describe('FeedbackButton', () => {
  it('renders floating button in bottom-left corner', () => {
    render(<FeedbackButton />);

    const button = screen.getByRole('button', { name: /feedback/i });
    expect(button).toBeInTheDocument();

    // Button should have fixed positioning styles for bottom-left corner
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('bottom-4');
    expect(button).toHaveClass('left-4');
  });

  it('clicking button opens feedback modal', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    const button = screen.getByRole('button', { name: /feedback/i });
    await user.click(button);

    // Modal should be visible after screenshot capture completes
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /feedback/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: /feedback message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('button has accessible label', () => {
    render(<FeedbackButton />);

    const button = screen.getByRole('button', { name: /feedback/i });
    expect(button).toHaveAccessibleName(/feedback/i);
  });

  it('button is visible on initial render', () => {
    render(<FeedbackButton />);

    const button = screen.getByRole('button', { name: /feedback/i });
    expect(button).toBeVisible();
  });
});
