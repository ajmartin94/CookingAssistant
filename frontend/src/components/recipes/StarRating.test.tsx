import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('should render 5 star buttons', () => {
    render(<StarRating value={0} onChange={vi.fn()} />);

    const stars = screen.getAllByRole('button', { name: /star/i });
    expect(stars).toHaveLength(5);
  });

  it('should call onChange with 4 when 4th star is clicked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StarRating value={0} onChange={onChange} />);

    const stars = screen.getAllByRole('button', { name: /star/i });
    await user.click(stars[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should mark selected stars as pressed', () => {
    render(<StarRating value={3} onChange={vi.fn()} />);

    const stars = screen.getAllByRole('button', { name: /star/i });
    expect(stars[0]).toHaveAttribute('aria-pressed', 'true');
    expect(stars[1]).toHaveAttribute('aria-pressed', 'true');
    expect(stars[2]).toHaveAttribute('aria-pressed', 'true');
    expect(stars[3]).toHaveAttribute('aria-pressed', 'false');
    expect(stars[4]).toHaveAttribute('aria-pressed', 'false');
  });
});
