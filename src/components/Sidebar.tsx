import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Config, AppConfig, ITDButton, Favorites } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  navColor: string;
  handleNewTab: (url: string) => void;
  handleQueryViewer: () => void;
}

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
    visibleITDButtons: itdButtons.map(b => b.id),
    appsOrder: ['0', '1', '2', '3', '4', '5', '6'],
    visibleApps: ['0', '1', '2', '3', '4', '5', '6'],
    isEditMode: false,
    navBackgroundColor: 'purple',
    isDarkMode: true,
    buttonSize: 'medium',
  },
  sidebarCollapsed: false,
  history: [],
  createdAt: '2025-01-01T00:00:00.000Z',
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, navColor, handleNewTab, handleQueryViewer }) => {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [visibleAppsIndices, setVisibleAppsIndices] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Favorites>({});
  const [itdToolsButtons, setITDToolsButtons] = useState<ITDButton[]>(itdButtons);
  const [visibleITDButtons, setVisibleITDButtons] = useState<string[]>(itdButtons.map(b => b.id));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeInputMenu, setActiveInputMenu] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<{ section: 'apps' | 'itdTools'; index: number } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [buttonSize, setButtonSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config: Config = await window.electronAPI.getConfig();
        console.log('Sidebar config loaded:', config);
        if (config.apps.length) {
          const appsOrder = config.itdTools.appsOrder || config.apps.map((_, i) => i.toString());
          const visibleApps = config.itdTools.visibleApps || config.apps.map((_, i) => i.toString());
          const orderedApps = appsOrder
            .map(appIndex => config.apps[parseInt(appIndex)])
            .filter((app): app is AppConfig => !!app && visibleApps.includes(appIndex));
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
          const visibleButtons = config.itdTools.visibleITDButtons || itdButtons.map(b => b.id);
          const orderedButtons = config.itdTools.buttonOrder
            .map(buttonId => itdButtons.find(b => b.id === buttonId))
            .filter((b): b is ITDButton => !!b && visibleButtons.includes(b.id));
          setITDToolsButtons(orderedButtons.length > 0 ? orderedButtons : itdButtons.filter(b => visibleButtons.includes(b.id)));
          setVisibleITDButtons(visibleButtons);
        }
        setIsEditMode(config.itdTools.isEditMode || false);
        setIsDarkMode(config.itdTools.isDarkMode !== false);
        setButtonSize(config.itdTools.buttonSize || 'medium');
      } catch (err) {
        console.error('Failed to load config:', err);
        setApps(defaultConfig.apps);
        setVisibleAppsIndices(defaultConfig.itdTools.visibleApps);
        setFavorites(defaultConfig.favorites);
        setITDToolsButtons(itdButtons);
        setVisibleITDButtons(itdButtons.map(b => b.id));
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
    newButtonSize: 'small' | 'medium' | 'large'
  ) => {
    const currentConfig = await window.electronAPI.getConfig();
    const updatedConfig: Config = {
      ...currentConfig,
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
    console.log('Config saved with navColor:', navColor);
  };

  const launchApp = (cmd: string) => {
    const isURL = /^https?:\/\//i.test(cmd);
    if (isURL) {
      handleNewTab(cmd);
    } else {
      window.electronAPI.launchApp(cmd);
    }
  };

  const openInTab = (url: string) => {
    handleNewTab(url);
  };

  const handleITDButtonClick = (button: ITDButton) => {
    if (isEditMode) return;
    if (button.id === 'goToQueryViewer') {
      handleQueryViewer();
    } else if (button.submenu) {
      setActiveDropdown(activeDropdown === button.id ? null : button.id);
      setActiveInputMenu(null);
    } else if (button.url) {
      openInTab(button.url);
    }
  };

  const handleSubmenuClick = (subItem: { id: string; text: string; url: string }) => {
    if (isEditMode) return;
    if (subItem.id === 'goToActiveDirectorySearch') {
      setActiveInputMenu('active-directory-search');
      setActiveDropdown(null);
    } else {
      openInTab(subItem.url);
      setActiveDropdown(null);
    }
  };

  const handleInputSubmit = () => {
    if (!userId.trim()) {
      return;
    }
    const profileUrl = `https://nsd.miamidade.gov/active-directory/user/${encodeURIComponent(userId)}`;
    openInTab(profileUrl);
    setActiveInputMenu(null);
    setUserId('');
  };

  const handleHideApp = (index: string) => {
    const newVisibleApps = visibleAppsIndices.filter(i => i !== index);
    setVisibleAppsIndices(newVisibleApps);
    saveConfig(
      newVisibleApps,
      newVisibleApps,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonSize
    );
  };

  const handleHideITDButton = (id: string) => {
    const newVisibleButtons = visibleITDButtons.filter(i => i !== id);
    setVisibleITDButtons(newVisibleButtons);
    setITDToolsButtons(itdToolsButtons.filter(b => newVisibleButtons.includes(b.id)));
    saveConfig(
      visibleAppsIndices,
      visibleAppsIndices,
      newVisibleButtons,
      newVisibleButtons,
      isEditMode,
      buttonSize
    );
  };

  const handleUnhideApp = (index: string) => {
    const newVisibleApps = [...visibleAppsIndices, index];
    setVisibleAppsIndices(newVisibleApps);
    saveConfig(
      newVisibleApps,
      newVisibleApps,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonSize
    );
  };

  const handleUnhideITDButton = (id: string) => {
    const newVisibleButtons = [...visibleITDButtons, id];
    const restoredButton = itdButtons.find(b => b.id === id);
    if (restoredButton) {
      setITDToolsButtons([...itdToolsButtons, restoredButton]);
      setVisibleITDButtons(newVisibleButtons);
      saveConfig(
        visibleAppsIndices,
        visibleAppsIndices,
        newVisibleButtons,
        newVisibleButtons,
        isEditMode,
        buttonSize
      );
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, section: 'apps' | 'itdTools', index: number) => {
    if (!isEditMode) return;
    setDraggedIndex({ section, index });
    e.dataTransfer.setData('text/plain', JSON.stringify({ section, index }));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, section: 'apps' | 'itdTools', index: number) => {
    if (!isEditMode || !draggedIndex || (draggedIndex.section === section && draggedIndex.index === index)) return;
    if (draggedIndex.section !== section) return;
    e.preventDefault();
    e.currentTarget.classList.add('border-2', 'border-blue-500');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('border-2', 'border-blue-500');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, section: 'apps' | 'itdTools', targetIndex: number) => {
    if (!isEditMode || !draggedIndex || draggedIndex.section !== section || draggedIndex.index === targetIndex) return;
    e.preventDefault();
    if (section === 'apps') {
      const newAppsOrder = [...visibleAppsIndices];
      const [draggedApp] = newAppsOrder.splice(draggedIndex.index, 1);
      newAppsOrder.splice(targetIndex, 0, draggedApp);
      setVisibleAppsIndices(newAppsOrder);
      saveConfig(
        newAppsOrder,
        newAppsOrder,
        itdToolsButtons.map(b => b.id),
        visibleITDButtons,
        isEditMode,
        buttonSize
      );
    } else {
      const newButtons = [...itdToolsButtons];
      const [draggedButton] = newButtons.splice(draggedIndex.index, 1);
      newButtons.splice(targetIndex, 0, draggedButton);
      setITDToolsButtons(newButtons);
      saveConfig(
        visibleAppsIndices,
        visibleAppsIndices,
        newButtons.map(b => b.id),
        visibleITDButtons,
        isEditMode,
        buttonSize
      );
    }
    setDraggedIndex(null);
    e.currentTarget.classList.remove('border-2', 'border-blue-500');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedIndex(null);
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div
      className={clsx(
        'h-full flex flex-col sidebar-scroll',
        `bg-${navColor}-600 dark:bg-${navColor}-300`,
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="py-4 px-2">
        <button
          onClick={toggle}
          className={clsx(
            'mb-4 text-white hover:text-purple-600 self-center',
            isDarkMode ? 'text-white' : 'text-gray-900'
          )}
        >
          ☰
        </button>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll px-2">
        <div
          className={clsx(
            'flex items-center justify-between text-sm mb-1',
            isOpen ? 'pl-2' : '',
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          <span>Apps</span>
          {isOpen && (
            <button
              onClick={() => {
                const newEditMode = !isEditMode;
                setIsEditMode(newEditMode);
                saveConfig(
                  visibleAppsIndices,
                  visibleAppsIndices,
                  itdToolsButtons.map(b => b.id),
                  visibleITDButtons,
                  newEditMode,
                  buttonSize
                );
              }}
              className={clsx(
                'text-lg',
                isDarkMode ? 'text-white hover:text-purple-600' : 'text-gray-900 hover:text-purple-500'
              )}
              title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            >
              ⚙️
            </button>
          )}
        </div>
        {visibleAppsIndices.map((appIndex, idx) => {
          const app = apps[parseInt(appIndex)];
          if (!app) {
            console.warn(`App at index ${appIndex} is undefined`);
            return null;
          }
          return (
            <div
              key={appIndex}
              draggable={isEditMode && isOpen}
              onDragStart={(e) => handleDragStart(e, 'apps', idx)}
              onDragOver={(e) => handleDragOver(e, 'apps', idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'apps', idx)}
              onDragEnd={handleDragEnd}
              className={clsx(
                'my-1 rounded-xl flex items-center',
                isEditMode && isOpen && 'shake cursor-move'
              )}
            >
              <button
                onClick={() => launchApp(app.command)}
                className={clsx(
                  'flex-1 py-2 px-2 rounded-xl transition-all flex items-center text-white',
                  isOpen ? 'justify-start' : 'justify-center h-10',
                  isEditMode && 'cursor-move',
                  buttonSize === 'small' && 'text-sm',
                  buttonSize === 'medium' && 'text-base',
                  buttonSize === 'large' && 'text-lg',
                  `bg-${navColor}-700 dark:bg-${navColor}-200 hover:bg-${navColor}-800 dark:hover:bg-${navColor}-400`
                )}
                title={app.name}
                disabled={isEditMode}
              >
                {app.iconPath ? (
                  <img src={app.iconPath} alt={app.name} className="w-5 h-5 mr-2" />
                ) : (
                  <span className="font-bold">{app.icon || app.name[0]}</span>
                )}
                {isOpen && <span className="ml-2 truncate">{app.name}</span>}
              </button>
              {isEditMode && isOpen && (
                <button
                  onClick={() => handleHideApp(appIndex)}
                  className="ml-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
                  title="Hide this app"
                >
                  X
                </button>
              )}
            </div>
          );
        })}
        {isEditMode && isOpen && apps.length > visibleAppsIndices.length && (
          <div className="mt-2">
            {apps.map((app, idx) => {
              const indexStr = idx.toString();
              if (visibleAppsIndices.includes(indexStr)) return null;
              return (
                <div key={indexStr} className="flex items-center my-1">
                  <span className={clsx('flex-1 text-sm pl-2 truncate', isDarkMode ? 'text-white' : 'text-gray-900')}>
                    {app.name}
                  </span>
                  <button
                    onClick={() => handleUnhideApp(indexStr)}
                    className="w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-green-600"
                    title="Unhide this app"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div
          className={clsx(
            'text-sm mt-4 mb-1',
            isOpen ? 'pl-2' : '',
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          ITD Tools
        </div>
        {itdToolsButtons.map((button, idx) => (
          <div
            key={button.id}
            draggable={isEditMode && isOpen}
            onDragStart={(e) => handleDragStart(e, 'itdTools', idx)}
            onDragOver={(e) => handleDragOver(e, 'itdTools', idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'itdTools', idx)}
            onDragEnd={handleDragEnd}
            className={clsx(
              'my-1 rounded-xl flex items-center flex-col',
              isEditMode && isOpen && 'shake cursor-move'
            )}
          >
            <div className="flex items-center w-full">
              <button
                onClick={() => handleITDButtonClick(button)}
                className={clsx(
                  'flex-1 py-2 px-2 rounded-xl transition-all flex items-center text-white',
                  isOpen ? 'justify-start' : 'justify-center h-10',
                  isEditMode && 'cursor-move',
                  buttonSize === 'small' && 'text-sm',
                  buttonSize === 'medium' && 'text-base',
                  buttonSize === 'large' && 'text-lg',
                  `bg-${navColor}-700 dark:bg-${navColor}-200 hover:bg-${navColor}-800 dark:hover:bg-${navColor}-400`
                )}
                title={button.text}
                disabled={isEditMode}
              >
                <span className="font-bold">{button.text[0]}</span>
                {isOpen && <span className="ml-2 truncate">{button.text}</span>}
                {button.submenu && isOpen && (
                  <span className="ml-2">
                    {activeDropdown === button.id ? '▲' : '▼'}
                  </span>
                )}
              </button>
              {isEditMode && isOpen && (
                <button
                  onClick={() => handleHideITDButton(button.id)}
                  className="ml-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
                  title="Hide this button"
                >
                  X
                </button>
              )}
            </div>
            {(button.id === 'goToNSD' || button.id === 'goToEAMS') && activeDropdown === button.id && button.submenu && isOpen && !isEditMode && (
              <div className="w-full mt-1">
                {button.submenu.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubmenuClick(subItem)}
                    className={clsx(
                      'block w-full text-left py-1 px-2 rounded text-sm',
                      isDarkMode ? 'bg-gray-900 hover:bg-purple-600 text-white' : 'bg-gray-300 hover:bg-purple-500 text-gray-900'
                    )}
                  >
                    {subItem.text}
                  </button>
                ))}
              </div>
            )}
            {activeInputMenu === 'active-directory-search' && button.id === 'goToNSD' && isOpen && !isEditMode && (
              <div
                className={clsx(
                  'w-full mt-1 rounded p-2',
                  isDarkMode ? 'bg-gray-900' : 'bg-gray-300'
                )}
              >
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                  className={clsx(
                    'w-full px-2 py-1 rounded text-sm',
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                  )}
                  autoFocus
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleInputSubmit}
                    className="px-2 py-1 bg-purple-600 rounded text-sm text-white hover:bg-purple-500"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => {
                      setActiveInputMenu(null);
                      setUserId('');
                    }}
                    className={clsx(
                      'px-2 py-1 rounded text-sm',
                      isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-400 text-gray-900 hover:bg-gray-300'
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {!(button.id === 'goToNSD' || button.id === 'goToEAMS') && activeDropdown === button.id && button.submenu && isOpen && !isEditMode && (
              <div className="ml-4 mt-1">
                {button.submenu.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubmenuClick(subItem)}
                    className={clsx(
                      'block w-full text-left py-1 px-2 rounded text-sm',
                      isDarkMode ? 'bg-gray-900 hover:bg-purple-600 text-white' : 'bg-gray-300 hover:bg-purple-500 text-gray-900'
                    )}
                  >
                    {subItem.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {isEditMode && isOpen && itdButtons.length > visibleITDButtons.length && (
          <div className="mt-2">
            {itdButtons.map(button => {
              if (visibleITDButtons.includes(button.id)) return null;
              return (
                <div key={button.id} className="flex items-center my-1">
                  <span className={clsx('flex-1 text-sm pl-2 truncate', isDarkMode ? 'text-white' : 'text-gray-900')}>
                    {button.text}
                  </span>
                  <button
                    onClick={() => handleUnhideITDButton(button.id)}
                    className="w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-green-600"
                    title="Unhide this button"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;