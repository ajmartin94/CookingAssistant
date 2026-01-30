import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { CookingCompletionScreen } from './CookingCompletionScreen';

const defaultProps = {
  recipeTitle: 'Chocolate Cake',
  onDone: vi.fn(),
};

describe('CookingCompletionScreen', () => {
  it('should render congratulations heading and recipe title', () => {
    render(<CookingCompletionScreen {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /nice work/i })).toBeInTheDocument();
    expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
  });

  it('should allow user to set a star rating', async () => {
    const user = userEvent.setup();
    render(<CookingCompletionScreen {...defaultProps} />);

    const stars = screen.getAllByRole('button', { name: /star/i });
    await user.click(stars[3]); // click 4th star

    // 4th star should be active/filled
    expect(stars[3]).toHaveAttribute('aria-pressed', 'true');
  });

  it('should allow user to type notes', async () => {
    const user = userEvent.setup();
    render(<CookingCompletionScreen {...defaultProps} />);

    const textarea = screen.getByRole('textbox', { name: /notes/i });
    await user.type(textarea, 'Delicious recipe!');
    expect(textarea).toHaveValue('Delicious recipe!');
  });

  it('should call onDone when Done button is clicked', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<CookingCompletionScreen {...defaultProps} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /done/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
