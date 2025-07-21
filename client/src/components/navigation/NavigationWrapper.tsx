import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

/**
 * NavigationWrapper component that ensures proper re-rendering when routes change
 * This helps fix navigation issues where components don't update properly
 */
const NavigationWrapper: React.FC<NavigationWrapperProps> = ({ children }) => {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Force unmount and remount when location changes
    setMounted(false);
    
    const timer = setTimeout(() => {
      setMounted(true);
      console.log('Navigation changed to:', location.pathname);
    }, 10);

    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, [location.pathname]);

  // Don't render children until properly mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Use location.pathname and timestamp as key to force component re-mount
  return (
    <div key={`${location.pathname}-${Date.now()}`}>
      {children}
    </div>
  );
};

export default NavigationWrapper;