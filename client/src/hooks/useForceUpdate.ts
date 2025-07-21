import { useState, useCallback } from 'react';

/**
 * Custom hook that provides a function to force component re-render
 * Useful for fixing navigation issues where components don't update properly
 */
export const useForceUpdate = () => {
  const [, setTick] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  
  return forceUpdate;
};

export default useForceUpdate;