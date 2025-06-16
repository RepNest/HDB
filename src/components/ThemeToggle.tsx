import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import { ThemeToggleProps } from '../types';

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  toggleTheme,
  isDarkMode,
  setIsDarkMode,
}) => {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggle = () => {
    toggleTheme();
    setIsDarkMode(!isDarkMode);
  };

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.toggle('dark', !isDarkMode);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    document.documentElement.classList.toggle('dark', isDarkMode);
  };

  return (
    <div
      className={clsx(
        'theme-toggle-container rounded-full p-1 w-16 h-8 flex items-center',
        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center',
          theme === 'light' ? 'bg-yellow-400' : 'bg-gray-800'
        )}
        animate={{ x: theme === 'light' ? 0 : 32 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={handleToggle}
        role="switch"
        aria-checked={theme === 'dark'}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleToggle();
            e.preventDefault();
          }
        }}
      >
        {theme === 'light' ? (
          <SunIcon className="w-4 h-4 text-white" />
        ) : (
          <MoonIcon className="w-4 h-4 text-yellow-400" />
        )}
      </motion.div>
    </div>
  );
};

export default ThemeToggle;