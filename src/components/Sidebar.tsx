import React, { useState, useEffect } from 'react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

interface AppButton {
  iconPath?: string;
  name: string;
  command: string;
  icon?: string;
}

interface ITDButton {
  id: string;
  text: string;
  url?: string;
  submenu?: { id: string; text: string; url: string }[];
}

interface Config {
  apps: AppButton[];
  favorites: { [folder: string]: { name: string; url: string; favicon?: string }[] };
  itdTools: {
    appsOrder: string[];
    visibleApps: string[];
    buttonOrder: string[];
    visibleITDButtons: string[];
    isEditMode: boolean;
    buttonBackgroundColor: string;
    isDarkMode: boolean;
    buttonSize: 'small' | 'medium' | 'large';
  };
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
    buttonBackgroundColor: 'purple-bg',
    isDarkMode: true,
    buttonSize: 'medium',
  },
};

export default function Sidebar({ isOpen, toggle }: SidebarProps) {
  const [apps, setApps] = useState<AppButton[]>([]);
  const [visibleAppsIndices, setVisibleAppsIndices] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<{ [folder: string]: { name: string; url: string; favicon?: string }[] }>({});
  const [itdToolsButtons, setITDToolsButtons] = useState<ITDButton[]>(itdButtons);
  const [visibleITDButtons, setVisibleITDButtons] = useState<string[]>(itdButtons.map(b => b.id));
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeInputMenu, setActiveInputMenu] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<{ section: 'apps' | 'itdTools'; index: number } | null>(null);
  const [buttonBackgroundColor, setButtonBackgroundColor] = useState<string>('purple-bg');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [buttonSize, setButtonSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Load config with robust fallback
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI?.getConfig?.();
        console.log('Sidebar config loaded:', config);
        if (config?.apps?.length) {
          const appsOrder = config.itdTools?.appsOrder || config.apps.map((_: any, i: number) => i.toString());
          const visibleApps = config.itdTools?.visibleApps || config.apps.map((_: any, i: number) => i.toString());
          const orderedApps = appsOrder
            .map((id: string) => ({ id, app: config.apps[parseInt(id)] }))
            .filter(({ app, id }): app is AppButton => !!app && visibleApps.includes(id))
            .map(({ app }) => app);
          setApps(config.apps);
          setVisibleAppsIndices(visibleApps);
          console.log('Apps set:', config.apps, 'Visible indices:', visibleApps);
        } else {
          console.warn('No apps in config, using defaultConfig.apps');
          setApps(defaultConfig.apps);
          setVisibleAppsIndices(defaultConfig.itdTools.visibleApps);
        }
        setFavorites(config?.favorites || {});
        if (config?.itdTools?.buttonOrder) {
          const visibleButtons = config.itdTools?.visibleITDButtons || itdButtons.map(b => b.id);
          const orderedButtons = config.itdTools.buttonOrder
            .map((id: string) => itdButtons.find(b => b.id === id))
            .filter((b): b is ITDButton => !!b && visibleButtons.includes(b.id));
          setITDToolsButtons(orderedButtons.length > 0 ? orderedButtons : itdButtons.filter(b => visibleButtons.includes(b.id)));
          setVisibleITDButtons(visibleButtons);
        }
        setIsEditMode(config?.itdTools?.isEditMode || false);
        setButtonBackgroundColor(config?.itdTools?.buttonBackgroundColor || 'purple-bg');
        setIsDarkMode(config?.itdTools?.isDarkMode !== false);
        setButtonSize(config?.itdTools?.buttonSize || 'medium');
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

  // Save config
  const saveConfig = async (
    newAppsOrder: string[],
    newVisibleApps: string[],
    newButtonOrder: string[],
    newVisibleITDButtons: string[],
    newEditMode: boolean,
    newButtonBackgroundColor: string,
    newIsDarkMode: boolean,
    newButtonSize: 'small' | 'medium' | 'large'
  ) => {
    const currentConfig = await window.electronAPI?.getConfig?.();
    const updatedConfig = {
      ...currentConfig,
      itdTools: {
        appsOrder: newAppsOrder,
        visibleApps: newVisibleApps,
        buttonOrder: newButtonOrder,
        visibleITDButtons: newVisibleITDButtons,
        isEditMode: newEditMode,
        buttonBackgroundColor: newButtonBackgroundColor,
        isDarkMode: newIsDarkMode,
        buttonSize: newButtonSize,
      },
    };
    if (window.electronAPI?.saveConfig) {
      await window.electronAPI.saveConfig(updatedConfig);
    }
  };

  const launchApp = (cmd: string) => {
    const isURL = /^https?:\/\//i.test(cmd);
    if (isURL) {
      const event = new CustomEvent('open-tab', { detail: { url: cmd } });
      window.dispatchEvent(event);
    } else {
      window.electronAPI?.launchApp(cmd);
    }
  };

  const openInTab = (url: string) => {
    const event = new CustomEvent('open-tab', { detail: { url } });
    window.dispatchEvent(event);
  };

  // Handle ITD Tools button click
  const handleITDButtonClick = (button: ITDButton) => {
    if (isEditMode) return;
    if (button.submenu) {
      setActiveDropdown(activeDropdown === button.id ? null : button.id);
      setActiveInputMenu(null);
    } else if (button.url) {
      openInTab(button.url);
    }
  };

  // Handle submenu item click
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

  // Handle Active Directory Search input
  const handleInputSubmit = () => {
    if (!userId.trim()) {
      return;
    }
    const profileUrl = `https://nsd.miamidade.gov/active-directory/user/${encodeURIComponent(userId)}`;
    openInTab(profileUrl);
    setActiveInputMenu(null);
    setUserId('');
  };

  // Handle hide button
  const handleHideApp = (index: string) => {
    const newVisibleApps = visibleAppsIndices.filter(i => i !== index);
    setVisibleAppsIndices(newVisibleApps);
    saveConfig(
      newVisibleApps,
      newVisibleApps,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonBackgroundColor,
      isDarkMode,
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
      buttonBackgroundColor,
      isDarkMode,
      buttonSize
    );
  };

  // Handle unhide button
  const handleUnhideApp = (index: string) => {
    const newVisibleApps = [...visibleAppsIndices, index];
    setVisibleAppsIndices(newVisibleApps);
    saveConfig(
      newVisibleApps,
      newVisibleApps,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonBackgroundColor,
      isDarkMode,
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
        buttonBackgroundColor,
        isDarkMode,
        buttonSize
      );
    }
  };

  // Drag-and-drop handlers
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
        buttonBackgroundColor,
        isDarkMode,
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
        buttonBackgroundColor,
        isDarkMode,
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

  // Handle customization
  const handleColorChange = (color: string) => {
    setButtonBackgroundColor(color);
    saveConfig(
      visibleAppsIndices,
      visibleAppsIndices,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      color,
      isDarkMode,
      buttonSize
    );
  };

  const handleThemeChange = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    saveConfig(
      visibleAppsIndices,
      visibleAppsIndices,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonBackgroundColor,
      newIsDarkMode,
      buttonSize
    );
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    setButtonSize(size);
    saveConfig(
      visibleAppsIndices,
      visibleAppsIndices,
      itdToolsButtons.map(b => b.id),
      visibleITDButtons,
      isEditMode,
      buttonBackgroundColor,
      isDarkMode,
      size
    );
  };

  return (
    <div className={clsx(
      'h-full flex flex-col',
      isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-black',
      isOpen ? 'w-72' : 'w-20'
    )}>
      <div className="py-5 px-3">
        <button onClick={toggle} className="mb-5 text-2xl text-white hover:text-purple-600 self-center">☰</button>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll px-3">
        <div className={clsx('flex items-center justify-between text-base mb-2', isOpen ? 'pl-3' : '', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
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
                  buttonBackgroundColor,
                  isDarkMode,
                  buttonSize
                );
              }}
              className={clsx('text-xl', isDarkMode ? 'text-white hover:text-purple-600' : 'text-black hover:text-purple-500')}
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
                'my-2 rounded-xl flex items-center',
                isEditMode && isOpen && 'shake cursor-move'
              )}
            >
              <button
                onClick={() => launchApp(app.command)}
                className={clsx(
                  'flex-1 py-3 px-3 rounded-xl transition-all flex items-center text-white',
                  isOpen ? 'justify-start' : 'justify-center h-12',
                  isEditMode && 'cursor-move',
                  buttonSize === 'small' && 'text-sm',
                  buttonSize === 'medium' && 'text-lg',
                  buttonSize === 'large' && 'text-xl',
                  buttonBackgroundColor === 'green-bg' && 'bg-green-500 hover:bg-green-600',
                  buttonBackgroundColor === 'purple-bg' && 'bg-purple-500 hover:bg-purple-600',
                  buttonBackgroundColor === 'blue-bg' && 'bg-blue-500 hover:bg-blue-600',
                  buttonBackgroundColor === 'red-bg' && 'bg-red-600 hover:bg-red-700',
                  buttonBackgroundColor === 'orange-bg' && 'bg-orange-600 hover:bg-orange-700',
                  buttonBackgroundColor === 'pink-bg' && 'bg-pink-500 hover:bg-pink-600',
                  buttonBackgroundColor === 'yellow-bg' && 'bg-yellow-500 hover:bg-yellow-600',
                  buttonBackgroundColor === 'gray-bg' && 'bg-gray-700 hover:bg-gray-800'
                )}
                title={app.name}
                disabled={isEditMode}
              >
                {app.iconPath ? (
                  <img src={app.iconPath} alt={app.name} className="w-6 h-6 mr-3" />
                ) : (
                  <span className="font-bold text-lg">{app.icon || app.name[0]}</span>
                )}
                {isOpen && <span className="ml-3 text-base truncate">{app.name}</span>}
              </button>
              {isEditMode && isOpen && (
                <button
                  onClick={() => handleHideApp(appIndex)}
                  className="ml-3 w-6 h-6 bg-red-500 rounded-full text-white text-sm flex items-center justify-center hover:bg-red-600"
                  title="Hide this app"
                >
                  X
                </button>
              )}
            </div>
          );
        })}
        {isEditMode && isOpen && apps.length > visibleAppsIndices.length && (
          <div className="mt-3">
            {apps.map((app, idx) => {
              const indexStr = idx.toString();
              if (visibleAppsIndices.includes(indexStr)) return null;
              return (
                <div key={indexStr} className="flex items-center my-2">
                  <span className={clsx('flex-1 text-base pl-3 truncate', isDarkMode ? 'text-white' : 'text-black')}>
                    {app.name}
                  </span>
                  <button
                    onClick={() => handleUnhideApp(indexStr)}
                    className="w-6 h-6 bg-green-500 rounded-full text-white text-sm flex items-center justify-center hover:bg-green-600"
                    title="Unhide this app"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className={clsx('text-base mt-5 mb-2', isOpen ? 'pl-3' : '', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
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
              'my-2 rounded-xl flex items-center flex-col',
              isEditMode && isOpen && 'shake cursor-move'
            )}
          >
            <div className="flex items-center w-full">
              <button
                onClick={() => handleITDButtonClick(button)}
                className={clsx(
                  'flex-1 py-3 px-3 rounded-xl transition-all flex items-center text-white',
                  isOpen ? 'justify-start' : 'justify-center h-12',
                  isEditMode && 'cursor-move',
                  buttonSize === 'small' && 'text-sm',
                  buttonSize === 'medium' && 'text-lg',
                  buttonSize === 'large' && 'text-xl',
                  buttonBackgroundColor === 'green-bg' && 'bg-green-500 hover:bg-green-600',
                  buttonBackgroundColor === 'purple-bg' && 'bg-purple-500 hover:bg-purple-600',
                  buttonBackgroundColor === 'blue-bg' && 'bg-blue-500 hover:bg-blue-600',
                  buttonBackgroundColor === 'red-bg' && 'bg-red-600 hover:bg-red-700',
                  buttonBackgroundColor === 'orange-bg' && 'bg-orange-600 hover:bg-orange-700',
                  buttonBackgroundColor === 'pink-bg' && 'bg-pink-500 hover:bg-pink-600',
                  buttonBackgroundColor === 'yellow-bg' && 'bg-yellow-500 hover:bg-yellow-600',
                  buttonBackgroundColor === 'gray-bg' && 'bg-gray-700 hover:bg-gray-800'
                )}
                title={button.text}
                disabled={isEditMode}
              >
                <span className="font-bold text-lg">{button.text[0]}</span>
                {isOpen && <span className="ml-3 text-base truncate">{button.text}</span>}
                {button.submenu && isOpen && (
                  <span className="ml-3 text-lg">
                    {activeDropdown === button.id ? '▲' : '▼'}
                  </span>
                )}
              </button>
              {isEditMode && isOpen && (
                <button
                  onClick={() => handleHideITDButton(button.id)}
                  className="ml-3 w-6 h-6 bg-red-500 rounded-full text-white text-sm flex items-center justify-center hover:bg-red-600"
                  title="Hide this button"
                >
                  X
                </button>
              )}
            </div>
            {(button.id === 'goToNSD' || button.id === 'goToEAMS') && activeDropdown === button.id && button.submenu && isOpen && !isEditMode && (
              <div className="w-full mt-2">
                {button.submenu.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubmenuClick(subItem)}
                    className={clsx(
                      'block w-full text-left py-2 px-3 rounded text-base',
                      isDarkMode ? 'bg-gray-900 hover:bg-purple-600 text-white' : 'bg-gray-300 hover:bg-purple-500 text-black'
                    )}
                  >
                    {subItem.text}
                  </button>
                ))}
              </div>
            )}
            {activeInputMenu === 'active-directory-search' && button.id === 'goToNSD' && isOpen && !isEditMode && (
              <div className={clsx(
                'w-full mt-2 rounded p-3',
                isDarkMode ? 'bg-gray-900' : 'bg-gray-300'
              )}>
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                  className={clsx(
                    'w-full px-3 py-2 rounded text-base',
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
                  )}
                  autoFocus
                />
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={handleInputSubmit}
                    className="px-3 py-2 bg-purple-600 rounded text-base text-white hover:bg-purple-500"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => {
                      setActiveInputMenu(null);
                      setUserId('');
                    }}
                    className={clsx(
                      'px-3 py-2 rounded text-base',
                      isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-400 text-black hover:bg-gray-300'
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {!(button.id === 'goToNSD' || button.id === 'goToEAMS') && activeDropdown === button.id && button.submenu && isOpen && !isEditMode && (
              <div className="ml-5 mt-2">
                {button.submenu.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubmenuClick(subItem)}
                    className={clsx(
                      'block w-full text-left py-2 px-3 rounded text-base',
                      isDarkMode ? 'bg-gray-900 hover:bg-purple-600 text-white' : 'bg-gray-300 hover:bg-purple-500 text-black'
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
          <div className="mt-3">
            {itdButtons.map(button => {
              if (visibleITDButtons.includes(button.id)) return null;
              return (
                <div key={button.id} className="flex items-center my-2">
                  <span className={clsx('flex-1 text-base pl-3 truncate', isDarkMode ? 'text-white' : 'text-black')}>
                    {button.text}
                  </span>
                  <button
                    onClick={() => handleUnhideITDButton(button.id)}
                    className="w-6 h-6 bg-green-500 rounded-full text-white text-sm flex items-center justify-center hover:bg-green-600"
                    title="Unhide this button"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {isEditMode && isOpen && (
          <div className={clsx(
            'mt-5 p-3 rounded',
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          )}>
            <div className="mb-3">
              <span className={clsx('text-base', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                Button Background Color
              </span>
              <div className="flex flex-wrap gap-3 mt-2">
                {['green-bg', 'purple-bg', 'blue-bg', 'red-bg', 'orange-bg', 'pink-bg', 'yellow-bg', 'gray-bg'].map(color => (
                  <button
                    key={color}
                    className={clsx(
                      'w-8 h-8 rounded-full',
                      color === 'green-bg' && 'bg-green-500',
                      color === 'purple-bg' && 'bg-purple-500',
                      color === 'blue-bg' && 'bg-blue-500',
                      color === 'red-bg' && 'bg-red-600',
                      color === 'orange-bg' && 'bg-orange-600',
                      color === 'pink-bg' && 'bg-pink-500',
                      color === 'yellow-bg' && 'bg-yellow-500',
                      color === 'gray-bg' && 'bg-gray-700',
                      buttonBackgroundColor === color && 'ring-2 ring-white'
                    )}
                    onClick={() => handleColorChange(color)}
                    title={`Set color to ${color.replace('-bg', '')}`}
                  />
                ))}
              </div>
            </div>
            <div className="mb-3 flex items-center">
              <span className={clsx('text-base mr-3', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                Theme
              </span>
              <button
                onClick={handleThemeChange}
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  isDarkMode ? 'bg-gray-600 text-yellow-400' : 'bg-gray-300 text-gray-800'
                )}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <div>
              <span className={clsx('text-base', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                Button Size
              </span>
              <input
                type="range"
                min="1"
                max="3"
                value={{ small: 1, medium: 2, large: 3 }[buttonSize]}
                onChange={(e) => {
                  const sizeMap: { [key in '1' | '2' | '3']: 'small' | 'medium' | 'large' } = {
                    '1': 'small',
                    '2': 'medium',
                    '3': 'large',
                  };
                  const value = e.target.value as '1' | '2' | '3';
                  handleSizeChange(sizeMap[value]);
                }}
                className="w-full mt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}