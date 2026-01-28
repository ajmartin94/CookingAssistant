/**
 * SidebarItem Component
 *
 * Navigation item for the sidebar with icon, label, and active state.
 */

import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSidebar } from '../../../contexts/SidebarContext';

export interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  to: string;
  badge?: number;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, to, badge, onClick }: SidebarItemProps) {
  const { isCollapsed, closeMobile } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  const handleClick = () => {
    closeMobile();
    onClick?.();
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-colors duration-200
        group relative
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
        ${
          isActive
            ? 'bg-accent-subtle text-accent font-medium'
            : 'text-text-secondary hover:bg-hover hover:text-text-primary'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      {() => (
        <>
          <span className="w-5 h-5 flex-shrink-0">{icon}</span>

          {isCollapsed ? (
            <>
              {/* Screen reader text for collapsed state */}
              <span className="sr-only">{label}</span>
              {/* Tooltip for collapsed state */}
              <div
                className="
                  absolute left-full ml-2 px-2 py-1
                  bg-primary text-text-primary text-sm rounded
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-opacity duration-200
                  whitespace-nowrap z-50
                  pointer-events-none
                "
                aria-hidden="true"
              >
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-2 bg-accent text-text-primary text-xs px-1.5 py-0.5 rounded-full">
                    {badge}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="flex-1 truncate">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="bg-accent text-text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </>
          )}
        </>
      )}
    </NavLink>
  );
}

export default SidebarItem;
