/**
 * TopBar Component
 *
 * Top navigation bar with mobile menu toggle, branding, and user menu.
 */

import { Menu, LogOut, User, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../../../contexts/SidebarContext';
import { useAuth } from '../../../contexts/AuthContext';
import { IconButton } from '../ui/IconButton';

export function TopBar() {
  const { openMobile } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <header
      className={`
        sticky top-0 z-30
        h-16 bg-white border-b border-neutral-200
        flex items-center justify-between px-4
        transition-all duration-200

        /* Adjust for sidebar width on desktop */
        lg:pl-6
      `}
    >
      {/* Left: Mobile menu button + Logo (mobile only) */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <IconButton
          icon={<Menu className="w-5 h-5" />}
          label="Open menu"
          variant="ghost"
          onClick={openMobile}
          className="lg:hidden"
        />

        {/* Mobile logo */}
        <Link to="/recipes" className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-neutral-900">
            CookBook
          </span>
        </Link>
      </div>

      {/* Right: User menu */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 text-neutral-600">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{user.username}</span>
            </div>

            <IconButton
              icon={<LogOut className="w-5 h-5" />}
              label="Logout"
              variant="ghost"
              onClick={logout}
            />
          </>
        )}
      </div>
    </header>
  );
}

export default TopBar;
