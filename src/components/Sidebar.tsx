import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Config, AppConfig, ITDButton, Favorites } from '../types';
import SidebarButtons from './SidebarButtons.tsx';

const itdButtons: ITDButton[] = [
  { id: 'clearData', text: 'Go to INFORMS', url: 'https://informs.miamidade.gov' },
  { id: 'goToQueryViewer', text: 'Go to Query Viewer', url: 'https://ehrprd.miamidade.gov/psc/EHR92PRD_2/EMPLOYEE/HRMS/q/?ICAction=ICQryNameURL=PUBLIC.MD_HELPDESK_ID_SEARCH' },
  { id: 'goToCitrix', text: 'Go to Citrix', url: 'https://xenapp.cloud.com/monitor?customerId=MiamiDadeCou' },
  {
    id: 'goToNSD',
    text: 'Go to NSD',
    submenu: [
      { id: 'goToActiveDirectorySearch', text: 'Active Directory Search', url: 'https://nsd.miamidade.gov/active-directory/user/' },
      { id: 'goToCalendars', text: 'Calendars', url: 'https://nsd.miamidade.gov/calendar/calendar-main' },
      { id: 'goToNetworkTools', text: 'Network Tools', url: 'https://nsd.miamidade.gov/apps/app-list/net' },
    ],
  },
  { id: 'goToEpar', text: 'Go to EPAR', url: 'https://hrprd.miamidade.gov/psp/HRPRD/EMPLOYEE/HRMS/c/MAINTAIN_SECURITY.USERMAINT.GBL?FolderPath=PORTAL_ROOT_OBJECT.PT_PEOPLETOOLS.PT_SECURITY.PT_USER_PROFILES.PT_USERMAINT_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder' },
  { id: 'goToSmartIT', text: 'Go to Smart IT', url: 'https://miamidade-smartit.us.onbmc.com/smartit/app/#/create/smart-recorder' },
  { id: 'goToAzure', text: 'Go to Azure', url: 'https://portal.azure.com/#view/Microsoft_Azure_PIMCommon/ActivationMenuBlade/~/aadmigratedroles' },
  {
    id: 'goToEAMS',
    text: 'Go to EAMS',
    submenu: [
      { id: 'goToDTPW', text: 'DTPW (TRANSIT)', url: 'https://prdentext.miamidade.gov:7443/web/base/logindisp?tenant=MDTPROD' },
      { id: 'goToPROS', text: 'PROS (PARKS)', url: 'https://prdentext.miamidade.gov:7443/web/base/logindisp?tenant=PRKPROD' },
    ],
  },
  { id: 'goToCitrixManager', text: 'Go to Citrix (Manager)', url: 'https://xenapp.cloud.com/manage/webstudio/home' },
];

const defaultConfig: Config = {
  apps: [
    { name: 'Notepad', command: 'notepad.exe' },
    { name: 'Calculator', command: 'calc.exe' },
    { name: 'Active Directory', command: 'powershell.exe -ExecutionPolicy Bypass -File "C:\\Scripts\\ADUC_Launcher.ps1"', iconPath: './icons/objsel_106-4.png' },
    { name: 'Mainframe', command: 'cmd /c "C:\\Program Files (x86)\\MochaSoft\\Mocha TN3270 for Vista\\tn3270.exe"', iconPath: './icons/tn3270_32512.ico' },
    { name: 'Lockout Status Tool', command: 'cmd /c "C:\\Program Files (x86)\\Windows Resource Kits\\Tools\\lockoutstatus.exe"', iconPath: './icons/lockoutstatus_106.ico' },
    { name: 'Teamviewer', command: '"C:\\Program Files\\TeamViewer\\TeamViewer.exe"', iconPath: './icons/TeamViewer_101.ico' },
    { name: 'CmRC Viewer', command: 'powershell.exe -ExecutionPolicy Bypass -File "C:\\Scripts\\CMRC_Launcher.ps1"', iconPath: './icons/CmRCViewer_IDR_RCVIEWER.ico' },
  ],
  favorites: {
    ' ': [{ name: 'Google', url: 'https://www.google.com', favicon: 'https://www.google.com/favicon.ico' }],
    'Frequent Sites': [
      { name: 'ITD Intra', url: 'https://miamidadecounty.sharepoint.com/sites/ITD-Intra', favicon: 'https://miamidadecounty.sharepoint.com/favicon.ico' },
      { name: 'Outlook', url: 'https://outlook.office.com', favicon: 'https://outlook.office.com/favicon.ico' },
      { name: 'Citrix Secure Sign In', url: 'https://xenapp.cloud.com', favicon: 'https://xenapp.cloud.com/favicon.ico' },
      { name: 'Sign In - Webex', url: 'https://desktop.wxcc-us1.cisco.com/iframe-widget', favicon: 'https://desktop.wxcc-us1.cisco.com/favicon.ico' },
      { name: 'IT Service Desk - Home', url: 'https://miamidadecounty.sharepoint.com/sites/ITServiceDesk', favicon: 'https://miamidadecounty.sharepoint.com/favicon.ico' },
    ],
  },
  itdTools: {
    buttonOrder: itdButtons.map(b => b.id),
    visibleITDButtons: itdButtons.filter(b => b.id !== 'goToCitrixManager').map(b => b.id),
    appsOrder: ['2', '3', '4', '5', '6'],
    visibleApps: ['2', '3', '4', '5', '6'],
    isEditMode: false,
    navBackgroundColor: 'purple',
    isDarkMode: true,
    buttonSize: 'medium',
  },
  sidebarCollapsed: false,
  history: [],
  createdAt: '2025-01-01T00:00:00.000Z',
};

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  navColor: string;
  handleNewTab: (url: string) => void;
  handleQueryViewer: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen: propIsOpen, toggle, navColor, handleNewTab, handleQueryViewer }) => {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [visibleAppsIndices, setVisibleAppsIndices] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Favorites>({});
  const [itdToolsButtons, setITDToolsButtons] = useState<ITDButton[]>(itdButtons);
  const [visibleITDButtons, setVisibleITDButtons] = useState<string[]>(itdButtons.map(b => b.id));
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [buttonSize, setButtonSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const [showNeonHue, setShowNeonHue] = useState(false);
  const minimizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map navColor to RGB values for box-shadow
  const colorMap: Record<string, string> = {
    purple: '168, 85, 247', // purple-500
    red: '239, 68, 68', // red-500
    orange: '249, 115, 22', // orange-500
    green: '34, 197, 94', // green-500
    yellow: '234, 179, 8', // yellow-500
    blue: '59, 130, 246', // blue-500
    pink: '236, 72, 153', // pink-500
  };

  const neonShadow = showNeonHue
    ? `0 0 12px 4px rgba(${colorMap[navColor] || colorMap.purple}, 0.6)`
    : 'none';

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config: Config = await window.electronAPI.getConfig();
        console.log('Sidebar config loaded:', config);
        if (config.apps.length) {
          const appsOrder = config.itdTools.appsOrder || config.apps.map((_, i) => i.toString()).filter(i => !['0', '1'].includes(i));
          const visibleApps = config.itdTools.visibleApps || config.apps.map((_, i) => i.toString()).filter(i => !['0', '1'].includes(i));
          setApps(config.apps);
          setVisibleAppsIndices(visibleApps);
          console.log('Apps set:', config.apps, 'Visible indices:', visibleApps);
        } else {
          console.warn('No apps in config, using defaultConfig.apps');
          setApps(defaultConfig.apps);
          setVisibleAppsIndices(defaultConfig.itdTools.visibleApps);
        }
        setFavorites(config.favorites || {});
        if (config.itdTools.buttonOrder) {
          const visibleButtons = config.itdTools.visibleITDButtons || itdButtons.filter(b => b.id !== 'goToCitrixManager').map(b => b.id);
          const orderedButtons = config.itdTools.buttonOrder
            .map(buttonId => itdButtons.find(b => b.id === buttonId))
            .filter((b): b is ITDButton => !!b && visibleButtons.includes(b.id));
          setITDToolsButtons(orderedButtons.length > 0 ? orderedButtons : itdButtons.filter(b => visibleButtons.includes(b.id)));
          setVisibleITDButtons(visibleButtons);
        }
        setIsEditMode(config.itdTools.isEditMode || false);
        setIsDarkMode(config.itdTools.isDarkMode !== false);
        setButtonSize(config.itdTools.buttonSize || 'medium');
        setIsOpen(!config.sidebarCollapsed);
      } catch (err) {
        console.error('Failed to load config:', err);
        setApps(defaultConfig.apps);
        setVisibleAppsIndices(defaultConfig.itdTools.visibleApps);
        setFavorites(defaultConfig.favorites);
        setITDToolsButtons(itdButtons.filter(b => b.id !== 'goToCitrixManager'));
        setVisibleITDButtons(itdButtons.filter(b => b.id !== 'goToCitrixManager').map(b => b.id));
      }
    };
    loadConfig();
  }, []);

  const saveConfig = async (
    newAppsOrder: string[],
    newVisibleApps: string[],
    newButtonOrder: string[],
    newVisibleITDButtons: string[],
    newEditMode: boolean,
    newButtonSize: 'small' | 'medium' | 'large',
    newSidebarCollapsed: boolean
  ) => {
    const currentConfig = await window.electronAPI.getConfig();
    const updatedConfig: Config = {
      ...currentConfig,
      sidebarCollapsed: newSidebarCollapsed,
      itdTools: {
        ...currentConfig.itdTools,
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
    await window.electronAPI.saveConfig(updatedConfig);
    console.log('Config saved with navColor:', navColor, 'sidebarCollapsed:', newSidebarCollapsed);
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
    console.log('Mouse entered sidebar, showNeonHue:', true, 'navColor:', navColor);
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
      console.log('Mouse left sidebar, showNeonHue:', false, 'navColor:', navColor);
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

  console.log('Sidebar render, className:', {
    isOpen,
    showNeonHue,
    navColor,
    neonShadow,
  }); // Debug render

  return (
    <div
      className={clsx(
        'h-full flex flex-col sidebar-scroll sidebar-container',
        `bg-${navColor}-600 dark:bg-${navColor}-300`,
        isOpen ? 'w-64' : 'w-16'
      )}
      style={{ boxShadow: neonShadow, transition: 'width 0.3s ease-in-out, box-shadow 0.2s ease-in-out' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="py-4 px-2 toggle-button-container">
        <button
          onClick={handleToggle}
          className={clsx(
            'mb-4 text-white hover:text-purple-600 self-center',
            isDarkMode ? 'text-white' : 'text-gray-900'
          )}
        >
          ☰
        </button>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll px-2">
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

export default Sidebar;