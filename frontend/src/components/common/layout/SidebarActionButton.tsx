/**
 * SidebarActionButton Component
 *
 * Primary action button at the bottom of the sidebar.
 */

import type { ReactNode } from 'react';
import { useSidebar } from '../../../contexts/SidebarContext';

export interface SidebarActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function SidebarActionButton({ icon, label, onClick }: SidebarActionButtonProps) {
  const { isCollapsed } = useSidebar();

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3
        bg-primary-500 text-white
        rounded-lg font-semibold
        hover:bg-primary-600
        transition-colors duration-200
        ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3 w-full'}
      `}
      title={isCollapsed ? label : undefined}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );
}

export default SidebarActionButton;
