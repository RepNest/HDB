import React from 'react';
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
  const handleToggle = () => {
    toggleTheme();
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="theme-toggle-container bg-gray-200 dark:bg-gray-700 rounded-full p-1 w-16 h-8 flex items-center">
      <motion.div
        className={clsx(
          'w-6 h-6 rounded-full flex items-center justify-center',
          theme === 'light' ? 'bg-yellow-400' : 'bg-gray-800'
        )}
        animate={{ x: theme === 'light' ? 0 : 32 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={handleToggle}
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