import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom hook that provides navigation with forced refresh
 * This ensures components properly re-render when navigating
 */
export const useNavigateWithRefresh = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateWithRefresh = useCallback((path: string, options?: { replace?: boolean }) => {
    console.log('Navigating from', location.pathname, 'to', path);
    
    // If we're already on the target path, force a refresh
    if (location.pathname === path) {
      console.log('Same path detected, forcing reload');
      window.location.reload();
      return;
    }

    // For admin routes that have navigation issues, use window.location.href
    // This ensures a complete page reload and proper component mounting
    if (path.includes('/admin/vendors/') || path.includes('/admin/consultants/')) {
      console.log('Using window.location.href for admin route');
      window.location.href = path;
      return;
    }

    // For other routes, use normal navigation
    navigate(path, { replace: options?.replace || false });
    
    // Force scroll to top
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
  }, [navigate, location.pathname]);

  return navigateWithRefresh;
};

export default useNavigateWithRefresh;