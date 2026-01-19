/**
 * SidebarSection Component
 *
 * Collapsible group of sidebar items with a title.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';

export interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function SidebarSection({ title, children, defaultExpanded = true }: SidebarSectionProps) {
  const { isCollapsed } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // In collapsed mode, always show items (no section headers)
  if (isCollapsed) {
    return <div className="space-y-1">{children}</div>;
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between
          px-3 py-2 text-xs font-semibold uppercase tracking-wider
          text-neutral-500 hover:text-neutral-700
          transition-colors duration-200
        "
      >
        {title}
        <ChevronDown
          className={`
            w-4 h-4 transition-transform duration-200
            ${isExpanded ? '' : '-rotate-90'}
          `}
        />
      </button>

      <div
        className={`
          space-y-1 overflow-hidden transition-all duration-200
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        {children}
      </div>
    </div>
  );
}

export default SidebarSection;
