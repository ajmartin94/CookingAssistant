import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { QuickActions } from './QuickActions';

describe('QuickActions', () => {
  it('should show "View your shopping list" for shopping action', () => {
    render(<QuickActions />);

    expect(screen.getByText('View your shopping list')).toBeInTheDocument();
  });

  it('should show "Record cooking notes" for reflection action', () => {
    render(<QuickActions />);

    expect(screen.getByText('Record cooking notes')).toBeInTheDocument();
  });

  it('should keep "Import or create new" for add recipe action', () => {
    render(<QuickActions />);

    expect(screen.getByText('Import or create new')).toBeInTheDocument();
  });

  it('should not show placeholder data in quick action descriptions', () => {
    render(<QuickActions />);

    expect(screen.queryByText('12 items across 2 stores')).not.toBeInTheDocument();
    expect(screen.queryByText(/Pasta was too salty/)).not.toBeInTheDocument();
  });
});
