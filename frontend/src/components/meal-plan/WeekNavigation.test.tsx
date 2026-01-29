import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { WeekNavigation } from './WeekNavigation';

// Helper: get Monday of current week
function getCurrentWeekMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateLabel(weekStart: Date): RegExp {
  // Expected format: "Mon DD - Sun DD" e.g. "Jan 26 - Feb 1"
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const startMonth = months[weekStart.getMonth()];
  const startDay = String(weekStart.getDate()).padStart(2, '0');
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const endMonth = months[endDate.getMonth()];
  const endDay = String(endDate.getDate()).padStart(2, '0');
  return new RegExp(`${startMonth}\\s+${startDay}\\s*[-\u2013]\\s*${endMonth}\\s+${endDay}`);
}

function getNextWeekMonday(weekStart: Date): Date {
  const next = new Date(weekStart);
  next.setDate(next.getDate() + 7);
  return next;
}

function getPrevWeekMonday(weekStart: Date): Date {
  const prev = new Date(weekStart);
  prev.setDate(prev.getDate() - 7);
  return prev;
}

describe('WeekNavigation', () => {
  const currentMonday = getCurrentWeekMonday();
  const defaultProps = {
    weekStart: currentMonday,
    onWeekChange: vi.fn(),
  };

  it('should render prev button, next button, Today button, and date label', () => {
    render(<WeekNavigation {...defaultProps} />);

    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByText(formatDateLabel(currentMonday))).toBeInTheDocument();
  });

  it('should display date label in "Mon DD - Sun DD" format', () => {
    render(<WeekNavigation {...defaultProps} />);

    // The label should match the pattern for the current week
    expect(screen.getByText(formatDateLabel(currentMonday))).toBeInTheDocument();
  });

  it('should call onWeekChange with next week when clicking next button', async () => {
    const onWeekChange = vi.fn();
    const user = userEvent.setup();

    render(<WeekNavigation weekStart={currentMonday} onWeekChange={onWeekChange} />);

    await user.click(screen.getByRole('button', { name: /next/i }));

    const expectedNext = getNextWeekMonday(currentMonday);
    expect(onWeekChange).toHaveBeenCalledWith(expectedNext);
  });

  it('should call onWeekChange with previous week when clicking prev button', async () => {
    const onWeekChange = vi.fn();
    const user = userEvent.setup();

    render(<WeekNavigation weekStart={currentMonday} onWeekChange={onWeekChange} />);

    await user.click(screen.getByRole('button', { name: /prev/i }));

    const expectedPrev = getPrevWeekMonday(currentMonday);
    expect(onWeekChange).toHaveBeenCalledWith(expectedPrev);
  });

  it('should call onWeekChange with current week Monday when clicking Today button', async () => {
    const onWeekChange = vi.fn();
    const user = userEvent.setup();
    // Start on a different week so Today button is actionable
    const pastMonday = getPrevWeekMonday(currentMonday);

    render(<WeekNavigation weekStart={pastMonday} onWeekChange={onWeekChange} />);

    await user.click(screen.getByRole('button', { name: /today/i }));

    expect(onWeekChange).toHaveBeenCalledWith(currentMonday);
  });

  it('should disable Today button when already on current week', () => {
    render(<WeekNavigation {...defaultProps} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    expect(todayButton).toBeDisabled();
  });

  it('should enable Today button when on a different week', () => {
    const pastMonday = getPrevWeekMonday(currentMonday);

    render(<WeekNavigation weekStart={pastMonday} onWeekChange={vi.fn()} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    expect(todayButton).toBeEnabled();
  });
});
