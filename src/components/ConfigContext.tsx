import React, { createContext, useState, useEffect } from 'react';
import { Config } from '../types';

interface ConfigContextType {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export const ConfigContext = createContext<ConfigContextType | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Config>({
    sidebarCollapsed: false,
    apps: [],
    favorites: {},
    itdTools: {
      appsOrder: [],
      visibleApps: [],
      buttonOrder: [],
      visibleITDButtons: [],
      isEditMode: false,
      navBackgroundColor: 'purple',
      isDarkMode: true,
      buttonSize: 'medium',
      tabBorderWidth: 'medium',
      highContrast: false,
    },
    history: [],
    createdAt: new Date().toISOString(),
    pinnedTabs: [],
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await window.electronAPI.getConfig();
        setConfig(savedConfig);
        document.documentElement.classList.toggle('dark', savedConfig.itdTools.isDarkMode ?? true);
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = React.useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};