import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle.tsx';
import { Config, ITDTools } from '../types';

interface CustomizeSpartanPanelProps {
  isOpen: boolean;
  toggle: () => void;
  navColor: string;
  setNavColor: (color: string) => void;
  saveConfig: (config: Config) => Promise<void>;
}

const CustomizeSpartanPanel: React.FC<CustomizeSpartanPanelProps> = ({
  isOpen,
  toggle,
  navColor,
  setNavColor,
  saveConfig,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? (savedTheme as 'light' | 'dark') : prefersDark ? 'dark' : 'light';
    setTheme(initialTheme);
    setIsDarkMode(initialTheme === 'dark');
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDarkMode(newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    handleSaveConfig({ isDarkMode: newTheme === 'dark' });
  };

  const handleSaveConfig = async (updates: Partial<ITDTools>) => {
    const currentConfig = await window.electronAPI.getConfig();
    const updatedConfig: Config = {
      ...currentConfig,
      itdTools: {
        ...currentConfig.itdTools,
        ...updates,
      },
    };
    await saveConfig(updatedConfig);
  };

  const handleColorChange = (color: string) => {
    setNavColor(color);
    handleSaveConfig({ navBackgroundColor: color });
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
            'fixed top-0 right-0 h-full w-64 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sidebar-scroll z-50 shadow-lg'
          )}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Customize Spartan</h2>
            <button onClick={toggle} className="text-2xl">×</button>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Theme</h3>
            <ThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              saveConfig={handleSaveConfig}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Navigation Color</h3>
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={clsx(
                    `w-8 h-8 rounded-full bg-${color}-500`,
                    navColor === color && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100'
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