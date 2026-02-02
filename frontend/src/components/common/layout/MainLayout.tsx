/**
 * MainLayout Component
 *
 * Main application layout with sidebar and content area.
 * Used for authenticated pages.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';

export interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      {/* Logo - fixed top-left, outside sidebar */}
      <Link to="/home" className="fixed top-0 left-0 z-50 flex items-center gap-2 h-16 px-4">
        <div className="w-8 h-8 bg-accent rounded-lg flex-shrink-0 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-text-primary" />
        </div>
        {!isCollapsed && (
          <span className="font-display font-bold text-base text-text-primary whitespace-nowrap">
            CookingAssistant
          </span>
        )}
      </Link>

      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Season gradient bar - full viewport width */}
      <div
        data-testid="season-gradient-bar"
        className="fixed top-0 left-0 w-full h-1 z-40"
        style={{ background: 'var(--season-gradient)' }}
      />

      {/* Main content area */}
      <div
        className={`
          transition-all duration-200
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
          pb-14 lg:pb-0
          pt-1
        `}
      >
        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile tab bar - mobile only */}
      <MobileTabBar />
    </div>
  );
}

export default MainLayout;
