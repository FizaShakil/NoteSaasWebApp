import { useState, useEffect } from 'react';
import { tokenUtils } from '../utils/api';

/**
 * Custom hook to manage authentication state
 * Provides a centralized way to check if user is authenticated
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return tokenUtils.isAuthenticated();
  });

  useEffect(() => {
    // Check authentication status on mount and when storage changes
    const checkAuth = () => {
      setIsAuthenticated(tokenUtils.isAuthenticated());
    };

    // Listen for storage changes (e.g., logout in another tab)
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return { isAuthenticated };
};
