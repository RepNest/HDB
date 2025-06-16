import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ThemeToggle from './ThemeToggle';
import { Config, Tab } from '../types'; // Added Tab import

interface CustomizeSpartanPanelProps {
  isOpen: boolean;
  toggle: () => void;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  pinnedTabs: Tab[];
}

const CustomizeSpartanPanel: React.FC<CustomizeSpartanPanelProps> = ({
  isOpen,
  toggle,
  config,
  setConfig,
  pinnedTabs,
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
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        itdTools: { ...prev.itdTools, isDarkMode: newTheme === 'dark' },
      };
      window.electronAPI.saveConfig(newConfig);
      return newConfig;
    });
  };

  const handleColorChange = (color: string) => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        itdTools: { ...prev.itdTools, navBackgroundColor: color },
      };
      window.electronAPI.saveConfig(newConfig);
      return newConfig;
    });
  };

  const handleBorderWidthChange = (width: 'thin' | 'medium' | 'thick') => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        itdTools: { ...prev.itdTools, tabBorderWidth: width },
      };
      window.electronAPI.saveConfig(newConfig);
      return newConfig;
    });
  };

  const handleHighContrastToggle = () => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        itdTools: { ...prev.itdTools, highContrast: !prev.itdTools.highContrast },
      };
      window.electronAPI.saveConfig(newConfig);
      return newConfig;
    });
  };

  const handleSavePinnedTabs = () => {
    setConfig((prev) => {
      const newConfig = {
        ...prev,
        pinnedTabs,
      };
      window.electronAPI.saveConfig(newConfig);
      return newConfig;
    });
  };

  const colors = ['purple', 'red', 'orange', 'green', 'yellow', 'blue', 'pink'];
  const borderWidths = [
    { value: 'thin', label: 'Thin (1px)', width: '1px' },
    { value: 'medium', label: 'Medium (2px)', width: '2px' },
    { value: 'thick', label: 'Thick (4px)', width: '4px' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={clsx(
            'fixed top-[160px] h-[80vh] w-144 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6 sidebar-scroll z-[1100] shadow-lg customize-spartan-panel',
            'right-[calc(100%-80rem)]'
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Customize Spartan</h2>
            <button onClick={toggle} className="text-3xl" aria-label="Close customization panel">
              ×
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Theme</h3>
            <ThemeToggle
              theme={theme}
              toggleTheme={toggleTheme}
              isDarkMode={config.itdTools.isDarkMode ?? true}
              setIsDarkMode={(isDark) => {
                setConfig((prev) => {
                  const newConfig = {
                    ...prev,
                    itdTools: { ...prev.itdTools, isDarkMode: isDark },
                  };
                  window.electronAPI.saveConfig(newConfig);
                  return newConfig;
                });
              }}
              saveConfig={async () => {}}
            />
          </div>

          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Navigation Color</h3>
            <div className="grid grid-cols-4 gap-3">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={clsx(
                    `w-10 h-10 rounded-full bg-${color}-500`,
                    config.itdTools.navBackgroundColor === color && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100'
                  )}
                  title={color.charAt(0).toUpperCase() + color.slice(1)}
                  aria-label={`Select ${color} navigation color`}
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Tab Border Width</h3>
            <div className="flex gap-3">
              {borderWidths.map(({ value, label, width }) => (
                <button
                  key={value}
                  onClick={() => handleBorderWidthChange(value as 'thin' | 'medium' | 'thick')}
                  className={clsx(
                    'px-4 py-2 rounded text-sm transition-all',
                    config.itdTools.tabBorderWidth === value
                      ? 'bg-purple-600 text-white'
                      : config.itdTools.isDarkMode // Fixed: Replaced isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  )}
                  style={{ borderBottom: `${width} solid ${config.itdTools.navBackgroundColor || 'purple'}-500` }}
                  aria-label={`Select ${label} tab border width`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">High Contrast Mode</h3>
            <button
              onClick={handleHighContrastToggle}
              className={clsx(
                'px-4 py-2 rounded text-sm transition-all',
                config.itdTools.highContrast
                  ? 'bg-purple-600 text-white'
                  : config.itdTools.isDarkMode // Fixed: Replaced isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              )}
              aria-label={config.itdTools.highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            >
              {config.itdTools.highContrast ? 'Disable' : 'Enable'} High Contrast
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-medium mb-2">Save Pinned Tabs</h3>
            <button
              onClick={handleSavePinnedTabs}
              className={clsx(
                'px-4 py-2 rounded text-sm transition-all',
                config.itdTools.isDarkMode // Fixed: Replaced isDarkMode
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              )}
              disabled={pinnedTabs.length === 0}
              aria-label="Save pinned tabs"
            >
              Save {pinnedTabs.length} Pinned Tab{pinnedTabs.length !== 1 ? 's' : ''}
            </button>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              {pinnedTabs.length === 0 ? 'No pinned tabs to save' : `Saves ${pinnedTabs.length} pinned tab${pinnedTabs.length !== 1 ? 's' : ''} for next session`}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomizeSpartanPanel;