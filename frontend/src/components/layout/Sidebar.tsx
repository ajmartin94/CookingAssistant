import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    path: '/recipes',
    label: 'My Recipes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    path: '/libraries',
    label: 'Libraries',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    path: '/planning',
    label: 'Meal Planning',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    comingSoon: true,
  },
  {
    path: '/cooking',
    label: 'Cooking Mode',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    comingSoon: true,
  },
];

const settingsItem: NavItem = {
  path: '/settings',
  label: 'Settings',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const linkBaseClasses = 'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors';
  const activeLinkClasses = 'bg-primary-100 text-primary-700';
  const inactiveLinkClasses = 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900';
  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-neutral-200 h-full flex flex-col transition-all duration-200`}
    >
      {/* Toggle button */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-lg font-semibold text-primary-500">Cooking Assistant</span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" role="navigation">
        {navItems.map((item) => (
          item.comingSoon ? (
            <div
              key={item.path}
              className={`${linkBaseClasses} ${disabledClasses}`}
              title={`${item.label} - Coming soon`}
            >
              {item.icon}
              <span className={`sidebar-label flex-1 ${isCollapsed ? 'hidden' : ''}`}>
                {item.label}
              </span>
              {!isCollapsed && (
                <span className="text-xs bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
              }
            >
              {item.icon}
              <span className={`sidebar-label ${isCollapsed ? 'hidden' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          )
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-neutral-200">
        <NavLink
          to={settingsItem.path}
          className={({ isActive }) =>
            `${linkBaseClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
          }
        >
          {settingsItem.icon}
          <span className={`sidebar-label ${isCollapsed ? 'hidden' : ''}`}>
            {settingsItem.label}
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
