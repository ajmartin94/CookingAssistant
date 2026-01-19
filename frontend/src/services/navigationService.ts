/**
 * Navigation Service
 *
 * Provides programmatic navigation from outside React components.
 * The navigate function is set by NavigationSetter in App.tsx.
 */

type NavigateFunction = (to: string, options?: { replace?: boolean }) => void;

let navigateFunction: NavigateFunction | null = null;

export const setNavigate = (navigate: NavigateFunction) => {
  navigateFunction = navigate;
};

export const navigate = (to: string, options?: { replace?: boolean }) => {
  if (navigateFunction) {
    navigateFunction(to, options);
  } else {
    // Fallback for when navigate isn't set (e.g., during initial load)
    window.location.href = to;
  }
};
