/**
 * Sidebar Component
 *
 * Main sidebar container with collapse/expand functionality.
 * - Desktop: Fixed left, 220px expanded / 64px collapsed
 * - Mobile: Slide-in overlay from left
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  Calendar,
  ShoppingCart,
  ChefHat,
  Settings,
} from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';
import { SidebarItem } from './SidebarItem';

export interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`
          fixed top-0 left-0 z-40 h-full
          bg-card border-r border-default
          flex flex-col
          transition-all duration-200 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-16' : 'lg:w-[220px]'}
          w-[220px]
        `}
      >
        {/* Logo / Header */}
        <div
          className={`
          flex items-center h-16 border-b border-default
          ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}
        `}
        >
          <Link
            to="/home"
            className="flex items-center gap-2 min-w-0 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
            onClick={closeMobile}
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex-shrink-0 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-text-primary" />
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-base text-text-primary whitespace-nowrap">
                CookingAssistant
              </span>
            )}
          </Link>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={toggleCollapse}
            data-testid="sidebar-collapse"
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-hover text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {children || (
            <>
              <SidebarItem icon={<Home className="w-5 h-5" />} label="Home" to="/home" />
              <SidebarItem icon={<BookOpen className="w-5 h-5" />} label="Cookbook" to="/recipes" />
              <SidebarItem
                icon={<Calendar className="w-5 h-5" />}
                label="Meal Plan"
                to="/planning"
              />
              <SidebarItem
                icon={<ShoppingCart className="w-5 h-5" />}
                label="Shopping"
                to="/shopping"
              />
            </>
          )}
        </nav>

        {/* Settings at bottom */}
        <div className="p-3 border-t border-default">
          <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" to="/settings" />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
