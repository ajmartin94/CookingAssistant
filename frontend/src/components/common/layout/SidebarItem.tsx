/**
 * SidebarItem Component
 *
 * Navigation item for the sidebar with icon, label, and active state.
 */

import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSidebar } from '../../../contexts/SidebarContext';

export interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  to: string;
  badge?: number;
  onClick?: () => void;
}

export function SidebarItem({
  icon,
  label,
  to,
  badge,
  onClick,
}: SidebarItemProps) {
  const { isCollapsed, closeMobile } = useSidebar();

  const handleClick = () => {
    closeMobile();
    onClick?.();
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        transition-colors duration-200
        group relative
        ${
          isActive
            ? 'bg-primary-100 text-primary-700 font-medium'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>

      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {isCollapsed && (
        <div
          className="
            absolute left-full ml-2 px-2 py-1
            bg-neutral-900 text-white text-sm rounded
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-opacity duration-200
            whitespace-nowrap z-50
            pointer-events-none
          "
        >
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
    </NavLink>
  );
}

export default SidebarItem;
