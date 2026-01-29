export interface WeekNavigationProps {
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

import { getCurrentWeekMonday } from '../../utils/dateUtils';

function formatDateLabel(weekStart: Date): string {
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
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekNavigation({ weekStart, onWeekChange }: WeekNavigationProps) {
  const currentMonday = getCurrentWeekMonday();
  const isCurrentWeek = isSameDate(weekStart, currentMonday);

  const handlePrev = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(prev);
  };

  const handleNext = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    onWeekChange(next);
  };

  const handleToday = () => {
    onWeekChange(currentMonday);
  };

  return (
    <nav className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        aria-label="Previous week"
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-card text-text-primary hover:bg-hover transition btn-animated"
      >
        Prev
      </button>
      <button
        onClick={handleToday}
        disabled={isCurrentWeek}
        aria-label="Today"
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-text-on-accent hover:bg-accent-hover transition btn-animated disabled:opacity-50"
      >
        Today
      </button>
      <button
        onClick={handleNext}
        aria-label="Next week"
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-card text-text-primary hover:bg-hover transition btn-animated"
      >
        Next
      </button>
      <span data-testid="week-date-range" className="text-sm text-text-secondary ml-1">
        {formatDateLabel(weekStart)}
      </span>
    </nav>
  );
}
