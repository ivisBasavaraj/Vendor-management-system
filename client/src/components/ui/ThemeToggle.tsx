import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  // Check for user preferences or previously set theme
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      
      // Check for user's system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  });

  useEffect(() => {
    // Apply theme to document when it changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <label className={`theme-toggle ${className}`}>
      <input 
        type="checkbox" 
        checked={darkMode} 
        onChange={toggleTheme} 
        className="sr-only"
      />
      <div className="theme-toggle-track">
        <MoonIcon className="theme-toggle-icon theme-toggle-moon h-3 w-3" />
        <SunIcon className="theme-toggle-icon theme-toggle-sun h-3 w-3" />
        <div className="theme-toggle-thumb" />
      </div>
    </label>
  );
};

export default ThemeToggle; 