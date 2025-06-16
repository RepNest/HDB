import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle.tsx';
import { Config } from '../types';

interface CustomizeSpartanPanelProps {
  isOpen: boolean;
  toggle: () => void;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

const CustomizeSpartanPanel: React.FC<CustomizeSpartanPanelProps> = ({
  isOpen,
  toggle,
  config,
  setConfig,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? (savedTheme as 'light' | 'dark') : prefersDark ? 'dark' : 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    setConfig(prev => {
      const newConfig = {
        ...prev,
        itdTools: { ...prev.itdTools, isDarkMode: newTheme === 'dark' },
      };
      window.electronAPI.saveConfig(newConfig);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newConfig;
    });
  };

  const handleColorChange = (color: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        itdTools: { ...prev.itdTools, navBackgroundColor: color },
      };
      window.electronAPI.saveConfig(newConfig);
      return newConfig;
    });
  };

  const colors = ['purple', 'red', 'orange', 'green', 'yellow', 'blue', 'pink'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={clsx(
            'fixed top-[120px] right-0 h-[70vh] w-64 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sidebar-scroll z-50 shadow-lg'
          )}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Customize Spartan</h2>
            <button onClick={toggle} className="text-2xl">×</button>
          </div>

          <div className="mb-3">
            <h3 className="text-sm font-medium mb-1">Theme</h3>
            <ThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              isDarkMode={config.itdTools.isDarkMode ?? true}
              setIsDarkMode={(isDark) => {
                setConfig(prev => {
                  const newConfig = {
                    ...prev,
                    itdTools: { ...prev.itdTools, isDarkMode: isDark },
                  };
                  window.electronAPI.saveConfig(newConfig);
                  document.documentElement.classList.toggle('dark', isDark);
                  return newConfig;
                });
              }}
              saveConfig={async () => {}}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">Navigation Color</h3>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={clsx(
                    `w-8 h-8 rounded-full bg-${color}-500`,
                    config.itdTools.navBackgroundColor === color && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100'
                  )}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomizeSpartanPanel;