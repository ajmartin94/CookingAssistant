/**
 * Sidebar Component
 *
 * Main sidebar container with collapse/expand functionality.
 * - Desktop: Fixed left, 220px expanded / 64px collapsed
 * - Mobile: Slide-in overlay from left
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  Calendar,
  ShoppingCart,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';
import { SidebarItem } from './SidebarItem';
import { FeedbackModal } from '../../feedback/FeedbackModal';
import { useScreenshot } from '../../../hooks/useScreenshot';

export interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { screenshot, isCapturing, capture } = useScreenshot();

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
        {/* Spacer for logo area */}
        <div className="h-16" />

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

        {/* Collapse toggle - desktop only */}
        <div className="p-3">
          <button
            onClick={toggleCollapse}
            data-testid="sidebar-collapse"
            className="hidden lg:flex items-center justify-center w-full h-10 rounded-lg hover:bg-hover text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Feedback + Settings at bottom */}
        <div className="p-3 border-t border-default">
          <button
            aria-label="Give Feedback"
            onClick={() => {
              capture();
              setIsFeedbackOpen(true);
              closeMobile();
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-hover hover:text-text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent w-full ${isCollapsed ? 'justify-center' : ''}`}
          >
            <MessageSquare className="w-5 h-5" />
            {isCollapsed ? <span className="sr-only">Feedback</span> : <span>Feedback</span>}
          </button>
          <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" to="/settings" />
        </div>
      </aside>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        screenshotState={{ isCapturing, screenshot }}
      />
    </>
  );
}

export default Sidebar;
