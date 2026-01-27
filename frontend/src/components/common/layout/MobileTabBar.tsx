/**
 * MobileTabBar Component
 *
 * Bottom navigation bar for mobile devices with 4 tabs:
 * Home, Cookbook, Plan, Shop
 */

import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Calendar, ShoppingCart } from 'lucide-react';

export interface MobileTabBarProps {
  className?: string;
}

interface TabConfig {
  path: string;
  label: string;
  icon: typeof Home;
}

const tabs: TabConfig[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/recipes', label: 'Cookbook', icon: BookOpen },
  { path: '/planning', label: 'Plan', icon: Calendar },
  { path: '/shopping', label: 'Shop', icon: ShoppingCart },
];

export function MobileTabBar({ className = '' }: MobileTabBarProps) {
  const location = useLocation();

  const isTabActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      data-testid="mobile-tab-bar"
      className={`
        fixed bottom-0 inset-x-0 z-50
        bg-card border-t border-default
        h-14 w-full
        flex items-stretch
        lg:hidden
        ${className}
      `}
    >
      {tabs.map(({ path, label, icon: Icon }) => {
        const isActive = isTabActive(path);
        return (
          <NavLink
            key={path}
            to={path}
            aria-current={isActive ? 'page' : undefined}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5
              text-xs font-medium
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset
              ${isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}
            `}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileTabBar;
