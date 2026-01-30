/**
 * Quick Actions Component
 *
 * Grid of quick action links to main features.
 */

import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, MessageSquare, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface QuickAction {
  to: string;
  icon: ReactNode;
  label: string;
  description: string;
}

const actions: QuickAction[] = [
  {
    to: '/shopping',
    icon: <ShoppingCart className="w-5 h-5" />,
    label: 'Go Shopping',
    description: 'View your shopping list',
  },
  {
    to: '/recipes/create',
    icon: <Plus className="w-5 h-5" />,
    label: 'Add Recipe',
    description: 'Import or create new',
  },
  {
    to: '/reflections',
    icon: <MessageSquare className="w-5 h-5" />,
    label: 'Recent Reflection',
    description: 'Record cooking notes',
  },
];

export function QuickActions() {
  return (
    <div data-testid="quick-actions" className="flex flex-col gap-3">
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          aria-label={action.label}
          data-testid="quick-action"
          className="
            card-animated bg-card border border-default rounded-xl p-4
            flex items-center gap-4
            hover:border-text-muted hover:bg-hover
            transition-all duration-200
            group
          "
        >
          <div className="w-10 h-10 rounded-lg bg-hover flex items-center justify-center text-text-secondary">
            {action.icon}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">{action.label}</div>
            <div className="text-xs text-text-muted">{action.description}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
        </Link>
      ))}
    </div>
  );
}

export default QuickActions;
