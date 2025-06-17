import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { AppConfig, ITDButton, Favorites } from '../types';
import SidebarButtons from './SidebarButtons';
import { useConfig } from './ConfigContext';

const itdButtons: ITDButton[] = [
  { 
    id: 'clearData', 
    text: 'Go to INFORMS', 
    url: 'https://informs.miamidade.gov', 
    favicon: 'https://informs.miamidade.gov/favicon.ico' 
  },
  { 
    id: 'goToQueryViewer', 
    text: 'Go to Query Viewer', 
    url: 'https://ehrprd.miamidade.gov/psc/EHR92PRD_2/EMPLOYEE/HRMS/q/?ICAction=ICQryNameURL=PUBLIC.MD_HELPDESK_ID_SEARCH', 
    favicon: 'https://ehrprd.miamidade.gov/favicon.ico' 
  },
  { 
    id: 'goToCitrix', 
    text: 'Go to Citrix', 
    url: 'https://xenapp.cloud.com/monitor?customerId=MiamiDadeCou', 
    favicon: 'https://xenapp.cloud.com/favicon.ico' 
  },
  {
    id: 'goToNSD',
    text: 'Go to NSD',
    favicon: 'https://nsd.miamidade.gov/favicon.ico',
    submenu: [
      { 
        id: 'goToActiveDirectorySearch', 
        text: 'Active Directory Search', 
        url: 'https://nsd.miamidade.gov/active-directory/user/', 
        favicon: 'https://nsd.miamidade.gov/favicon.ico' 
      },
      { 
        id: 'goToCalendars', 
        text: 'Calendars', 
        url: 'https://nsd.miamidade.gov/calendar/calendar-main', 
        favicon: 'https://nsd.miamidade.gov/favicon.ico' 
      },
      { 
        id: 'goToNetworkTools', 
        text: 'Network Tools', 
        url: 'https://nsd.miamidade.gov/apps/app-list/net', 
        favicon: 'https://nsd.miamidade.gov/favicon.ico' 
      },
    ],
  },
  { 
    id: 'goToEpar', 
    text: 'Go to EPAR', 
    url: 'https://hrprd.miamidade.gov/psp/HRPRD/EMPLOYEE/HRMS/c/MAINTAIN_SECURITY.USERMAINT.GBL?FolderPath=PORTAL_ROOT_OBJECT.PT_PEOPLETOOLS.PT_SECURITY.PT_USER_PROFILES.PT_USERMAINT_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder', 
    favicon: 'https://hrprd.miamidade.gov/favicon.ico' 
  },
  { 
    id: 'goToSmartIT', 
    text: 'Go to Smart IT', 
    url: 'https://miamidade-smartit.us.onbmc.com/smartit/app/#/create/smart-recorder', 
    favicon: 'https://miamidade-smartit.us.onbmc.com/favicon.ico' 
  },
  { 
    id: 'goToAzure', 
    text: 'Go to Azure', 
    url: 'https://portal.azure.com/#view/Microsoft_Azure_PIMCommon/ActivationMenuBlade/~/aadmigratedroles', 
    favicon: 'https://portal.azure.com/favicon.ico' 
  },
  {
    id: 'goToEAMS',
    text: 'Go to EAMS',
    favicon: 'https://prdentext.miamidade.gov/favicon.ico',
    submenu: [
      { 
        id: 'goToDTPW', 
        text: 'DTPW (TRANSIT)', 
        url: 'https://prdentext.miamidade.gov:7443/web/base/logindisp?tenant=MDTPROD', 
        favicon: 'https://prdentext.miamidade.gov/favicon.ico' 
      },
      { 
        id: 'goToPROS', 
        text: 'PROS (PARKS)', 
        url: 'https://prdentext.miamidade.gov:7443/web/base/logindisp?tenant=PRKPROD', 
        favicon: 'https://prdentext.miamidade.gov/favicon.ico' 
      },
    ],
  },
  { 
    id: 'goToCitrixManager', 
    text: 'Go to Citrix (Manager)', 
    url: 'https://xenapp.cloud.com/manage/webstudio/home', 
    favicon: 'https://xenapp.cloud.com/favicon.ico' 
  },
];

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  navColor: string;
  handleNewTab: (url: string) => void;
  handleQueryViewer: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen: propIsOpen, toggle, navColor, handleNewTab, handleQueryViewer }) => {
  const { config, setConfig } = useConfig();
  const [apps, setApps] = useState<AppConfig[]>(config.apps);
  const [visibleAppsIndices, setVisibleAppsIndices] = useState<string[]>(config.itdTools.visibleApps);
  const [favorites, setFavorites] = useState<Favorites>(config.favorites);
  const [itdToolsButtons, setITDToolsButtons] = useState<ITDButton[]>(itdButtons);
  const [visibleITDButtons, setVisibleITDButtons] = useState<string[]>(config.itdTools.visibleITDButtons);
  const [isEditMode, setIsEditMode] = useState(config.itdTools.isEditMode);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(config.itdTools.isDarkMode);
  const [buttonSize, setButtonSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(config.itdTools.buttonSize);
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const [showNeonHue, setShowNeonHue] = useState(false);
  const minimizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const colorMap: Record<string, string> = {
    purple: '168, 85, 247',
    red: '239, 68, 68',
    orange: '249, 115, 22',
    green: '34, 197, 94',
    yellow: '234, 179, 8',
    blue: '59, 130, 246',
    pink: '236, 72, 153',
  };

  const neonShadow = showNeonHue
    ? `0 0 12px 4px rgba(${colorMap[navColor] || colorMap.purple}, 0.6)`
    : 'none';

  useEffect(() => {
    setApps(config.apps);
    setVisibleAppsIndices(config.itdTools.visibleApps);
    setFavorites(config.favorites);
    setIsEditMode(config.itdTools.isEditMode);
    setIsDarkMode(config.itdTools.isDarkMode);
    setButtonSize(config.itdTools.buttonSize);
    setIsOpen(!config.sidebarCollapsed);

    const visibleButtons = config.itdTools.visibleITDButtons || itdButtons.filter(b => b.id !== 'goToCitrixManager').map(b => b.id);
    const orderedButtons = config.itdTools.buttonOrder
      .map(buttonId => itdButtons.find(b => b.id === buttonId))
      .filter((b): b is ITDButton => !!b && visibleButtons.includes(b.id));
    setITDToolsButtons(orderedButtons.length > 0 ? orderedButtons : itdButtons.filter(b => visibleButtons.includes(b.id)));
    setVisibleITDButtons(visibleButtons);
  }, [config]);

  const saveConfig = async (
    newAppsOrder: string[],
    newVisibleApps: string[],
    newButtonOrder: string[],
    newVisibleITDButtons: string[],
    newEditMode: boolean,
    newButtonSize: 'small' | 'medium' | 'large' | 'xlarge',
    newSidebarCollapsed: boolean
  ) => {
    try {
      const updatedConfig = {
        ...config,
        sidebarCollapsed: newSidebarCollapsed,
        itdTools: {
          ...config.itdTools,
          appsOrder: newAppsOrder,
          visibleApps: newVisibleApps,
          buttonOrder: newButtonOrder,
          visibleITDButtons: newVisibleITDButtons,
          isEditMode: newEditMode,
          navBackgroundColor: navColor,
          isDarkMode: isDarkMode,
          buttonSize: newButtonSize,
        },
      };
      const success = await window.electronAPI.saveConfig(updatedConfig);
      if (success) {
        setConfig(updatedConfig);
        console.log('Config saved with navColor:', navColor, 'sidebarCollapsed:', newSidebarCollapsed);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const launchApp = (cmd: string) => {
    const isURL = /^https?:\/\//i.test(cmd);
    if (isURL) {
      handleNewTab(cmd);
    } else {
      window.electronAPI.launchApp(cmd);
    }
  };

  const handleMouseEnter = () => {
    if (minimizeTimeoutRef.current) {
      clearTimeout(minimizeTimeoutRef.current);
      minimizeTimeoutRef.current = null;
    }
    setIsOpen(true);
    setShowNeonHue(true);
    saveConfig(
      visibleAppsIndices,
      visibleAppsIndices,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonSize,
      false
    );
  };

  const handleMouseLeave = () => {
    minimizeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setShowNeonHue(false);
      saveConfig(
        visibleAppsIndices,
        visibleAppsIndices,
        itdToolsButtons.map(b => b.id),
        visibleITDButtons,
        isEditMode,
        buttonSize,
        true
      );
    }, 300);
  };

  const handleToggle = () => {
    toggle();
    setIsOpen(!isOpen);
    saveConfig(
      visibleAppsIndices,
      visibleAppsIndices,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonSize,
      isOpen
    );
  };

  return (
    <div
      className={clsx(
        'h-full flex flex-col sidebar-scroll sidebar-container',
        `bg-${navColor}-600 dark:bg-${navColor}-300`,
        isOpen ? 'w-80' : 'w-20'
      )}
      style={{ boxShadow: neonShadow, transition: 'width 0.3s ease-in-out, box-shadow 0.2s ease-in-out' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Sidebar"
    >
      <div className="py-6 px-3 toggle-button-container">
        <button
          onClick={handleToggle}
          className={clsx(
            'mb-6 text-2xl hover:text-purple-600 self-center',
            isDarkMode ? 'text-white' : 'text-gray-900'
          )}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          ☰
        </button>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll px-3">
        <SidebarButtons
          apps={apps}
          visibleAppsIndices={visibleAppsIndices}
          favorites={favorites}
          itdToolsButtons={itdToolsButtons}
          visibleITDButtons={visibleITDButtons}
          isEditMode={isEditMode}
          isDarkMode={isDarkMode}
          buttonSize={buttonSize}
          isOpen={isOpen}
          navColor={navColor}
          handleNewTab={handleNewTab}
          handleQueryViewer={handleQueryViewer}
          saveConfig={(newAppsOrder, newVisibleApps, newButtonOrder, newVisibleITDButtons, newEditMode, newButtonSize) =>
            saveConfig(newAppsOrder, newVisibleApps, newButtonOrder, newVisibleITDButtons, newEditMode, newButtonSize, !isOpen)
          }
          launchApp={launchApp}
          setVisibleAppsIndices={setVisibleAppsIndices}
          setITDToolsButtons={setITDToolsButtons}
          setVisibleITDButtons={setVisibleITDButtons}
          setIsEditMode={setIsEditMode}
        />
      </div>
    </div>
  );
};

export default React.memo(Sidebar);