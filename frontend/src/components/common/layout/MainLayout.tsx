/**
 * MainLayout Component
 *
 * Main application layout with sidebar and content area.
 * Used for authenticated pages.
 */

import type { ReactNode } from 'react';
import { useSidebar } from '../../../contexts/SidebarContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-neutral-50 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`
          transition-all duration-200
          lg:ml-72
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
        `}
      >
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
