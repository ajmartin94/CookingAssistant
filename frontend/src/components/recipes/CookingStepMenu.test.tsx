import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { CookingStepMenu } from './CookingStepMenu';
import type { Instruction } from '../../types';

const mockInstructions: Instruction[] = [
  { stepNumber: 1, instruction: 'Preheat oven to 350F' },
  { stepNumber: 2, instruction: 'Mix dry ingredients together' },
  { stepNumber: 3, instruction: 'Bake for 25 minutes', durationMinutes: 25 },
];

const defaultProps = {
  instructions: mockInstructions,
  currentStep: 0,
  onStepSelect: vi.fn(),
  onClose: vi.fn(),
};

describe('CookingStepMenu', () => {
  it('should list all steps', () => {
    render(<CookingStepMenu {...defaultProps} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('should call onStepSelect with step index when a step is clicked', async () => {
    const onStepSelect = vi.fn();
    const user = userEvent.setup();
    render(<CookingStepMenu {...defaultProps} onStepSelect={onStepSelect} />);

    await user.click(screen.getByText('Step 2'));
    expect(onStepSelect).toHaveBeenCalledWith(1);
  });

  it('should visually highlight the current step', () => {
    render(<CookingStepMenu {...defaultProps} currentStep={1} />);

    const stepButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent?.startsWith('Step'));
    // The second step button should have an active/selected indicator
    expect(stepButtons[1].className).toMatch(/active|selected|current/i);
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CookingStepMenu {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
