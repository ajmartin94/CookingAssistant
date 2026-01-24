/**
 * Sidebar Component
 *
 * Main sidebar container with collapse/expand functionality.
 * - Desktop: Fixed left, 280px expanded / 64px collapsed
 * - Mobile: Slide-in overlay from left
 */

import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Archive,
  Compass,
  Calendar,
  ShoppingCart,
  ChefHat,
  Plus,
  Settings,
} from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { SidebarActionButton } from './SidebarActionButton';

export interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const navigate = useNavigate();

  const handleNewRecipe = () => {
    navigate('/recipes/create');
    closeMobile();
  };

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
        className={`
          fixed top-0 left-0 z-40 h-full
          bg-white border-r border-neutral-200
          flex flex-col
          transition-all duration-200 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'lg:w-16' : 'lg:w-72'}
          w-72
        `}
      >
        {/* Logo / Header */}
        <div
          className={`
          flex items-center h-16 border-b border-neutral-200
          ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}
        `}
        >
          <Link to="/recipes" className="flex items-center gap-2" onClick={closeMobile}>
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-lg text-neutral-900">CookBook</span>
            )}
          </Link>

          {/* Collapse toggle - desktop only */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-500"
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
              <SidebarSection title="Recipes">
                <SidebarItem
                  icon={<BookOpen className="w-5 h-5" />}
                  label="My Recipes"
                  to="/recipes"
                />
                <SidebarItem
                  icon={<Archive className="w-5 h-5" />}
                  label="Libraries"
                  to="/libraries"
                />
                <SidebarItem
                  icon={<Compass className="w-5 h-5" />}
                  label="Discover"
                  to="/discover"
                />
              </SidebarSection>

              <SidebarSection title="Planning">
                <SidebarItem
                  icon={<Calendar className="w-5 h-5" />}
                  label="Meal Plan"
                  to="/planning"
                />
                <SidebarItem
                  icon={<ShoppingCart className="w-5 h-5" />}
                  label="Shopping List"
                  to="/shopping"
                />
              </SidebarSection>

              <SidebarSection title="Cooking">
                <SidebarItem
                  icon={<ChefHat className="w-5 h-5" />}
                  label="Cook Mode"
                  to="/cooking"
                />
              </SidebarSection>

              <SidebarSection title="Account">
                <SidebarItem
                  icon={<Settings className="w-5 h-5" />}
                  label="Settings"
                  to="/settings"
                />
              </SidebarSection>
            </>
          )}
        </nav>

        {/* Action button */}
        <div className="p-3 border-t border-neutral-200">
          <SidebarActionButton
            icon={<Plus className="w-5 h-5" />}
            label="New Recipe"
            onClick={handleNewRecipe}
          />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
