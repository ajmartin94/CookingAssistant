/**
 * Context Card Component
 *
 * Smart context card for displaying contextual information on the home page.
 * Examples: Tonight's Meal, Plan Your Week, Shopping Needed
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface ContextCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  to?: string;
  onClick?: () => void;
}

export function ContextCard({ title, subtitle, badge, children, to, onClick }: ContextCardProps) {
  const content = (
    <>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">{title}</span>
          {badge && (
            <span className="bg-accent text-text-primary px-2 py-0.5 rounded text-xs font-medium">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
      </div>
      {children}
    </>
  );

  const cardClassName = `
    bg-card border border-default rounded-xl p-4
    transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
    ${to || onClick ? 'hover:border-text-muted cursor-pointer' : ''}
  `;

  if (to) {
    return (
      <Link to={to} data-testid="context-card" className={cardClassName} tabIndex={0}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        data-testid="context-card"
        className={`${cardClassName} w-full text-left`}
        tabIndex={0}
      >
        {content}
      </button>
    );
  }

  return (
    <div data-testid="context-card" className={cardClassName} tabIndex={0}>
      {content}
    </div>
  );
}

export default ContextCard;
