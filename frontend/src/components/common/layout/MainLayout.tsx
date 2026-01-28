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
import { MobileTabBar } from './MobileTabBar';

export interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`
          transition-all duration-200
          lg:ml-72
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
          pb-14 lg:pb-0
        `}
      >
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile tab bar - mobile only */}
      <MobileTabBar />
    </div>
  );
}

export default MainLayout;
