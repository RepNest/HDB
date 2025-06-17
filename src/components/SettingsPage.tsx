import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { debounce } from 'lodash';
import ThemeToggle from './ThemeToggle';
import { Tab, ITDTools, Config } from '../types';
import { useConfig } from './ConfigContext';
import { useErrorHandler } from '../hooks/useErrorHandler';

interface SettingsPageProps {
  pinnedTabs: Tab[];
}

const defaultITDTools: ITDTools = {
  appsOrder: ['0', '1', '2', '3', '4', '5', '6'],
  visibleApps: ['0', '1', '2', '3', '4', '5', '6'],
  buttonOrder: [
    'clearData',
    'goToQueryViewer',
    'goToCitrix',
    'goToNSD',
    'goToEpar',
    'goToSmartIT',
    'goToAzure',
    'goToEAMS',
    'goToCitrixManager',
  ],
  visibleITDButtons: [
    'clearData',
    'goToQueryViewer',
    'goToCitrix',
    'goToNSD',
    'goToEpar',
    'goToSmartIT',
    'goToAzure',
    'goToEAMS',
    'goToCitrixManager',
  ],
  isEditMode: false,
  navBackgroundColor: 'purple',
  isDarkMode: true,
  buttonSize: 'medium',
  tabBorderWidth: 'medium',
  highContrast: false,
  defaultHomepage: 'https://www.google.com',
};

const SettingsPage: React.FC<SettingsPageProps> = ({ pinnedTabs }) => {
  const { config, setConfig } = useConfig();
  const { error, handleError, clearError } = useErrorHandler();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [previewConfig, setPreviewConfig] = useState<ITDTools>(config.itdTools || defaultITDTools);
  const [isDarkMode, setIsDarkMode] = useState(config.itdTools?.isDarkMode ?? true);
  const [activeTab, setActiveTab] = useState<'General' | 'Appearance' | 'Privacy'>('General');
  const [homepage, setHomepage] = useState(config.itdTools?.defaultHomepage || 'https://www.google.com');

  useEffect(() => {
    setIsDarkMode(config.itdTools?.isDarkMode ?? true);
    setHomepage(config.itdTools?.defaultHomepage || 'https://www.google.com');
    setPreviewConfig(config.itdTools || defaultITDTools);
  }, [config.itdTools]);

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

  const debouncedSaveConfig = debounce(async (newConfig: Config) => {
    try {
      const success = await window.electronAPI.saveConfig(newConfig);
      if (!success) throw new Error('Failed to save config');
      setConfig(newConfig);
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

  const handleHomepageChange = (url: string) => {
    setHomepage(url);
    setPreviewConfig((prev) => ({ ...prev, defaultHomepage: url }));
  };

  const handleApply = () => {
    const updatedConfig: Config = { ...config, itdTools: previewConfig };
    debouncedSaveConfig(updatedConfig);
    document.documentElement.classList.toggle('dark', previewConfig.isDarkMode);
  };

  const handleSavePinnedTabs = async () => {
    try {
      const updatedConfig: Config = { ...config, pinnedTabs };
      const success = await window.electronAPI.saveConfig(updatedConfig);
      if (!success) throw new Error('Failed to save pinned tabs');
      setConfig(updatedConfig);
      console.log(`Saved ${pinnedTabs.length} pinned tabs at ${new Date().toISOString()}`);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error saving pinned tabs');
    }
  };

  const handleClearHistory = async () => {
    try {
      await window.electronAPI.saveHistory([]);
      const updatedConfig: Config = { ...config, history: [] };
      setConfig(updatedConfig);
      console.log('History cleared at ', new Date().toISOString());
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error clearing history');
    }
  };

  const handleResetDefaults = async () => {
    try {
      const updatedConfig: Config = { ...config, itdTools: defaultITDTools };
      const success = await window.electronAPI.saveConfig(updatedConfig);
      if (!success) throw new Error('Failed to reset defaults');
      setConfig(updatedConfig);
      setPreviewConfig(defaultITDTools);
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
      setHomepage('https://www.google.com');
      console.log('Settings reset to defaults at ', new Date().toISOString());
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Error resetting defaults');
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

  const tabs = [
    { id: 'General', label: 'General' },
    { id: 'Appearance', label: 'Appearance' },
    { id: 'Privacy', label: 'Privacy' },
  ] as const;

  return (
    <div
      className={clsx(
        'flex flex-col h-full p-6',
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900',
        previewConfig.highContrast && 'high-contrast'
      )}
      style={{ boxShadow: `var(--panel-neon-shadow-${previewConfig.navBackgroundColor || 'purple'})` }}
      role="main"
      aria-labelledby="settings-title"
      tabIndex={-1}
    >
      <h1 id="settings-title" className="text-2xl font-semibold mb-6">Settings</h1>
      {error && (
        <p className="text-red-500 text-xs mb-4" role="alert" aria-live="assertive">
          {error}
        </p>
      )}
      <div role="tablist" className="flex border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab.id
                ? `border-b-2 border-${previewConfig.navBackgroundColor || 'purple'}-500 text-${previewConfig.navBackgroundColor || 'purple'}-500`
                : isDarkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            )}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id.toLowerCase()}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto space-y-6" role="tabpanel" id={`${activeTab.toLowerCase()}-panel`} aria-live="polite">
        {activeTab === 'General' && (
          <>
            <div>
              <h2 className="text-base font-medium mb-2">Default Homepage</h2>
              <input
                type="text"
                value={homepage}
                onChange={(e) => handleHomepageChange(e.target.value)}
                className={clsx(
                  'w-full px-3 py-2 text-sm rounded border',
                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                )}
                placeholder="Enter homepage URL..."
                aria-label="Set default homepage URL"
              />
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                The URL to open when creating a new tab (e.g., https://www.google.com or spartan://history).
              </p>
            </div>
            <div>
              <h2 className="text-base font-medium mb-2">Save Pinned Tabs</h2>
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
                  isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600'
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
          </>
        )}
        {activeTab === 'Appearance' && (
          <>
            <div>
              <h2 className="text-base font-medium mb-2">Theme</h2>
              <ThemeToggle
                theme={theme}
                toggleTheme={toggleTheme}
                isDarkMode={previewConfig.isDarkMode ?? true}
                setIsDarkMode={(isDark) => setPreviewConfig((prev) => ({ ...prev, isDarkMode: isDark }))}
                saveConfig={async () => {}}
              />
            </div>
            <div>
              <h2 className="text-base font-medium mb-2">Navigation Color</h2>
              <div role="radiogroup" aria-label="Select navigation color" className="grid grid-cols-4 gap-3">
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
                      `w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center text-xs`,
                      previewConfig.navBackgroundColor === color && 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={color.charAt(0).toUpperCase() + color.slice(1)}
                    aria-label={`Select ${color} navigation color`}
                    aria-checked={previewConfig.navBackgroundColor === color}
                    role="radio"
                  >
                    <span className={clsx(isDarkMode ? 'text-white' : 'text-gray-900')}>
                      {color.charAt(0).toUpperCase()}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-base font-medium mb-2">Tab Border Width</h2>
              <div role="radiogroup" aria-label="Select tab border width" className="flex gap-3">
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
                        : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    )}
                    style={{ borderBottom: `${width} solid ${previewConfig.navBackgroundColor || 'purple'}-500` }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${label} tab border width`}
                    aria-checked={previewConfig.tabBorderWidth === value}
                    role="radio"
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-base font-medium mb-2">Sidebar Button Size</h2>
              <div role="radiogroup" aria-label="Select sidebar button size" className="flex gap-3">
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
                        : isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={`Select ${label} sidebar button size`}
                    aria-checked={previewConfig.buttonSize === value}
                    role="radio"
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-base font-medium mb-2">High Contrast Mode</h2>
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
                    : isDarkMode
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
          </>
        )}
        {activeTab === 'Privacy' && (
          <div>
            <h2 className="text-base font-medium mb-2">Clear Browsing History</h2>
            <motion.button
              onClick={handleClearHistory}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Space') {
                  handleClearHistory();
                  e.preventDefault();
                }
              }}
              className={clsx(
                'px-4 py-2 rounded text-sm transition-all',
                isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500 text-white hover:bg-red-600'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Clear browsing history"
            >
              Clear History
            </motion.button>
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              Removes all browsing history entries permanently.
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <motion.button
            onClick={handleApply}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Space') {
                handleApply();
                e.preventDefault();
              }
            }}
            className={clsx(
              'px-4 py-2 rounded text-sm transition-all',
              isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Apply customization settings"
          >
            Apply Settings
          </motion.button>
          <motion.button
            onClick={handleResetDefaults}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Space') {
                handleResetDefaults();
                e.preventDefault();
              }
            }}
            className={clsx(
              'px-4 py-2 rounded text-sm transition-all',
              isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Reset settings to defaults"
          >
            Reset Defaults
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsPage);