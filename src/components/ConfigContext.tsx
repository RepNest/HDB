import React, { createContext, useContext, useCallback } from 'react';
import { Config } from '../types';

interface ConfigContextType {
  config: Config;
  setConfig: (config: Config) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const defaultConfig: Config = {
  sidebarCollapsed: false,
  apps: [],
  favorites: {},
  itdTools: {
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
  },
  history: [],
  createdAt: new Date().toISOString(),
  pinnedTabs: [],
};

export const ConfigProvider: React.FC<{
  children: React.ReactNode;
  config: Config;
  setConfig: (config: Config) => void;
}> = ({ children, config, setConfig }) => {
  const safeSetConfig = useCallback(
    (newConfig: Config) => {
      try {
        setConfig(newConfig);
      } catch (err) {
        console.error('Failed to set config:', err);
      }
    },
    [setConfig]
  );

  return (
    <ConfigContext.Provider value={{ config: config || defaultConfig, setConfig: safeSetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};