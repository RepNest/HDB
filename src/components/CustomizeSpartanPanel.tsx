import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { debounce } from 'lodash';
import ThemeToggle from './ThemeToggle';
import { Tab, ITDTools } from '../types';
import { useConfig } from './ConfigContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface CustomizeSpartanPanelProps {
  isOpen: boolean;
  toggle: () => void;
  pinnedTabs: Tab[];
}

const CustomizeSpartanPanel: React.FC<CustomizeSpartanPanelProps> = ({
  isOpen,
  toggle,
  pinnedTabs,
}) => {
  const { config, setConfig } = useConfig();
  const { error, handleError, clearError } = useErrorHandler();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [previewConfig, setPreviewConfig] = useState<ITDTools>(config.itdTools);

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

  const debouncedSaveConfig = debounce(async (newConfig: ITDTools) => {
    try {
      const updatedConfig = { ...config, itdTools: newConfig };
      const success = await window.electronAPI.saveConfig(updatedConfig);
      if (!success) throw new Error('Failed to save config');
      setConfig(updatedConfig);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error saving configuration');
    }
  }, 300);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    setPreviewConfig((prev) => ({ ...prev, isDarkMode: newTheme === 'dark' }));
  };

  const handleColorChange = (color: string) => {
    setPreviewConfig((prev) => ({ ...prev, navBackgroundColor: color }));
  };

  const handleBorderWidthChange = (width: 'thin' | 'medium' | 'thick') => {
    setPreviewConfig((prev) => ({ ...prev, tabBorderWidth: width }));
  };

  const handleHighContrastToggle = () => {
    setPreviewConfig((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const handleButtonSizeChange = (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    setPreviewConfig((prev) => ({ ...prev, buttonSize: size }));
  };

  const handleApply = () => {
    debouncedSaveConfig(previewConfig);
    document.documentElement.classList.toggle('dark', previewConfig.isDarkMode);
  };

  const handleSavePinnedTabs = async () => {
    try {
      const updatedConfig = { ...config, pinnedTabs };
      const success = await window.electronAPI.saveConfig(updatedConfig);
      if (!success) throw new Error('Failed to save pinned tabs');
      setConfig(updatedConfig);
      console.log(`Saved ${pinnedTabs.length} pinned tabs at ${new Date().toISOString()}`);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error saving pinned tabs');
    }
  };

  const colors = ['purple', 'red', 'orange', 'green', 'yellow', 'blue', 'pink'];
  const borderWidths = [
    { value: 'thin', label: 'Thin (1px)', width: '1px' },
    { value: 'medium', label: 'Medium (2px)', width: '2px' },
    { value: 'thick', label: 'Thick (4px)', width: '4px' },
  ];
  const buttonSizes = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'X-Large' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={clsx(
          'fixed top-[160px] h-[80vh] w-144 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6 sidebar-scroll z-[1100] shadow-lg customize-spartan-panel',
          'right-[calc(100%-80rem)]',
          previewConfig.highContrast && 'high-contrast'
        )}
        style={{ boxShadow: `var(--panel-neon-shadow-${previewConfig.navBackgroundColor || 'purple'})` }}
        role="dialog"
        aria-labelledby="customize-spartan-title"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            toggle();
            e.preventDefault();
          }
        }}
      >
        <h2 id="customize-spartan-title" className="text-xl font-semibold mb-4">Customize Spartan</h2>
        <button
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
              toggle();
              e.preventDefault();
            }
          }}
          className="absolute top-4 right-4 text-3xl"
          aria-label="Close customization panel"
        >
          ×
        </button>

        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Theme</h3>
          <ThemeToggle
            theme={theme}
            toggleTheme={toggleTheme}
            isDarkMode={previewConfig.isDarkMode ?? true}
            setIsDarkMode={(isDark) => setPreviewConfig((prev) => ({ ...prev, isDarkMode: isDark }))}
            saveConfig={async () => {}}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Navigation Color</h3>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((color) => (
              <motion.button
                key={color}
                onClick={() => handleColorChange(color)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Space') {
                    handleColorChange(color);
                    e.preventDefault();
                  }
                }}
                className={clsx(
                  `w-10 h-10 rounded-full bg-${color}-500`,
                  previewConfig.navBackgroundColor === color && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
              <motion.button
                key={value}
                onClick={() => handleBorderWidthChange(value as 'thin' | 'medium' | 'thick')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Space') {
                    handleBorderWidthChange(value as 'thin' | 'medium' | 'thick');
                    e.preventDefault();
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded text-sm transition-all',
                  previewConfig.tabBorderWidth === value
                    ? 'bg-purple-600 text-white'
                    : previewConfig.isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                )}
                style={{ borderBottom: `${width} solid ${previewConfig.navBackgroundColor || 'purple'}-500` }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Select ${label} tab border width`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Sidebar Button Size</h3>
          <div className="flex gap-3">
            {buttonSizes.map(({ value, label }) => (
              <motion.button
                key={value}
                onClick={() => handleButtonSizeChange(value as 'small' | 'medium' | 'large' | 'xlarge')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Space') {
                    handleButtonSizeChange(value as 'small' | 'medium' | 'large' | 'xlarge');
                    e.preventDefault();
                  }
                }}
                className={clsx(
                  'px-4 py-2 rounded text-sm transition-all',
                  previewConfig.buttonSize === value
                    ? 'bg-purple-600 text-white'
                    : previewConfig.isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Select ${label} sidebar button size`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">High Contrast Mode</h3>
          <motion.button
            onClick={handleHighContrastToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Space') {
                handleHighContrastToggle();
                e.preventDefault();
              }
            }}
            className={clsx(
              'px-4 py-2 rounded text-sm transition-all',
              previewConfig.highContrast
                ? 'bg-purple-600 text-white'
                : previewConfig.isDarkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={previewConfig.highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
          >
            {previewConfig.highContrast ? 'Disable' : 'Enable'} High Contrast
          </motion.button>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-medium mb-2">Save Pinned Tabs</h3>
          <motion.button
            onClick={handleSavePinnedTabs}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Space') {
                handleSavePinnedTabs();
                e.preventDefault();
              }
            }}
            className={clsx(
              'px-4 py-2 rounded text-sm transition-all',
              previewConfig.isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600'
            )}
            disabled={pinnedTabs.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Save pinned tabs"
          >
            Save {pinnedTabs.length} Pinned Tab{pinnedTabs.length !== 1 ? 's' : ''}
          </motion.button>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            {pinnedTabs.length === 0 ? 'No pinned tabs to save' : `Saves ${pinnedTabs.length} pinned tab${pinnedTabs.length !== 1 ? 's' : ''} for next session`}
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-xs mt-1" role="alert">
            {error}
          </p>
        )}

        <motion.button
          onClick={handleApply}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Space') {
              handleApply();
              e.preventDefault();
            }
          }}
          className={clsx(
            'w-full px-4 py-2 rounded text-sm transition-all',
            previewConfig.isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Apply customization settings"
        >
          Apply Settings
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(CustomizeSpartanPanel);