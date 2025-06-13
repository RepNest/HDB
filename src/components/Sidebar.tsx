import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronRightIcon, ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  navColor: string;
  handleNewTab: (url: string) => void;
  handleQueryViewer: () => void;
}

interface ITDButton {
  id: string;
  name: string;
  command: string;
  isQueryViewer?: boolean;
}

export default function Sidebar({ isOpen, toggle, navColor, handleNewTab, handleQueryViewer }: SidebarProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [buttons, setButtons] = useState<ITDButton[]>([]);
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [buttonOrder, setButtonOrder] = useState<string[]>([]);

  // Default ITD Tools buttons
  const defaultButtons: ITDButton[] = [
    { id: 'informs', name: 'Go to INFORMS', command: 'https://informs.miamidade.gov' },
    { id: 'citrix', name: 'Go to Citrix', command: 'https://xenapp.cloud.com' },
    {
      id: 'queryViewer',
      name: 'Go to Query Viewer',
      command: 'https://ehrprd.miamidade.gov/psc/EHR92PRD_2/EMPLOYEE/HRMS/q/?ICAction=ICQryNameURL=PUBLIC.MD_HELPDESK_ID_SEARCH',
      isQueryViewer: true,
    },
    { id: 'activeDirectory', name: 'Active Directory Search', command: 'https://portal.azure.com' },
    { id: 'dtpw', name: 'Go to DTPW', command: 'https://prdentext.miamidade.gov' },
  ];

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI.getConfig();
        console.log('Sidebar config loaded:', config.itdTools);

        const configButtons = config.itdTools?.visibleITDButtons?.length
          ? defaultButtons.filter(btn => config.itdTools.visibleITDButtons.includes(btn.id))
          : defaultButtons;

        const order = config.itdTools?.buttonOrder?.length
          ? config.itdTools.buttonOrder.filter(id => configButtons.some(btn => btn.id === id))
          : configButtons.map(btn => btn.id);

        console.log('Config buttons:', configButtons);
        console.log('Button order:', order);

        setButtons(configButtons);
        setVisibleButtons(configButtons.map(btn => btn.id));
        setButtonOrder(order);
        setIsEditMode(config.itdTools.isEditMode || false);

        // Save defaults if config is empty
        if (!config.itdTools?.visibleITDButtons?.length) {
          const newConfig = {
            ...config,
            itdTools: {
              ...config.itdTools,
              visibleITDButtons: defaultButtons.map(btn => btn.id),
              buttonOrder: defaultButtons.map(btn => btn.id),
            },
          };
          await window.electronAPI.saveConfig(newConfig);
          console.log('Saved default buttons to config');
        }
      } catch (err) {
        console.error('Failed to load sidebar config:', err);
        setButtons(defaultButtons);
        setVisibleButtons(defaultButtons.map(btn => btn.id));
        setButtonOrder(defaultButtons.map(btn => btn.id));
        console.log('Fallback to default buttons:', defaultButtons);
      }
    };
    loadConfig();
  }, []);

  const handleButtonClick = (btn: ITDButton) => {
    console.log('Button clicked:', btn.id);
    if (btn.isQueryViewer) {
      handleQueryViewer();
    } else {
      handleNewTab(btn.command);
    }
  };

  const handleToggleEditMode = async () => {
    try {
      const config = await window.electronAPI.getConfig();
      const newConfig = {
        ...config,
        itdTools: { ...config.itdTools, isEditMode: !isEditMode },
      };
      await window.electronAPI.saveConfig(newConfig);
      setIsEditMode(!isEditMode);
      console.log('Edit mode toggled:', !isEditMode);
    } catch (err) {
      console.error('Failed to toggle edit mode:', err);
    }
  };

  const handleHideButton = async (id: string) => {
    const newVisible = visibleButtons.filter(btnId => btnId !== id);
    const newOrder = buttonOrder.filter(btnId => btnId !== id);
    try {
      const config = await window.electronAPI.getConfig();
      const newConfig = {
        ...config,
        itdTools: {
          ...config.itdTools,
          visibleITDButtons: newVisible,
          buttonOrder: newOrder,
        },
      };
      await window.electronAPI.saveConfig(newConfig);
      setVisibleButtons(newVisible);
      setButtonOrder(newOrder);
      setButtons(buttons.filter(btn => btn.id !== id));
      console.log('Button hidden:', id);
    } catch (err) {
      console.error('Failed to hide button:', err);
    }
  };

  const handleMoveButton = async (id: string, direction: 'up' | 'down') => {
    const index = buttonOrder.indexOf(id);
    if (direction === 'up' && index > 0) {
      const newOrder = [...buttonOrder];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      try {
        const config = await window.electronAPI.getConfig();
        const newConfig = {
          ...config,
          itdTools: { ...config.itdTools, buttonOrder: newOrder },
        };
        await window.electronAPI.saveConfig(newConfig);
        setButtonOrder(newOrder);
        console.log('Button moved up:', id);
      } catch (err) {
        console.error('Failed to move button:', err);
      }
    } else if (direction === 'down' && index < buttonOrder.length - 1) {
      const newOrder = [...buttonOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      try {
        const config = await window.electronAPI.getConfig();
        const newConfig = {
          ...config,
          itdTools: { ...config.itdTools, buttonOrder: newOrder },
        };
        await window.electronAPI.saveConfig(newConfig);
        setButtonOrder(newOrder);
        console.log('Button moved down:', id);
      } catch (err) {
        console.error('Failed to move button:', err);
      }
    }
  };

  const orderedButtons = buttonOrder
    .map(id => buttons.find(btn => btn.id === id))
    .filter((btn): btn is ITDButton => !!btn);

  console.log('Rendering ordered buttons:', orderedButtons);

  return (
    <div
      className={clsx(
        'h-full flex flex-col transition-all duration-300 sidebar-scroll',
        `bg-${navColor}-600 dark:bg-${navColor}-300`,
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4">
        {isOpen && <h2 className="text-lg font-semibold text-white dark:text-gray-900">ITD Tools</h2>}
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-400 rounded-full"
        >
          {isOpen ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {orderedButtons.length === 0 && isOpen && (
          <p className="text-white dark:text-gray-900">No buttons available</p>
        )}
        {orderedButtons.map((btn, idx) => (
          <div key={btn.id} className="flex items-center gap-2">
            <button
              onClick={() => handleButtonClick(btn)}
              className={clsx(
                'flex-1 flex items-center gap-2 px-4 py-2 text-white dark:text-gray-900 rounded-lg transition-all',
                isEditMode ? 'bg-gray-600 dark:bg-gray-300' : 'bg-gray-700 dark:bg-gray-200 hover:bg-purple-600 dark:hover:bg-gray-400'
              )}
              title={btn.name}
              disabled={isEditMode}
            >
              <span className="truncate">{isOpen ? btn.name : btn.name[0]}</span>
            </button>
            {isEditMode && isOpen && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveButton(btn.id, 'up')}
                  className="w-6 h-6 flex items-center justify-center text-white dark:text-gray-900 bg-gray-800 dark:bg-gray-400 hover:bg-purple-600 rounded"
                  disabled={idx === 0}
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveButton(btn.id, 'down')}
                  className="w-6 h-6 flex items-center justify-center text-white dark:text-gray-900 bg-gray-800 dark:bg-gray-400 hover:bg-purple-600 rounded"
                  disabled={idx === orderedButtons.length - 1}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleHideButton(btn.id)}
                  className="w-6 h-6 flex items-center justify-center text-red-300 dark:text-red-600 bg-gray-800 dark:bg-gray-400 hover:bg-red-600 rounded"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {isOpen && (
        <div className="p-4">
          <button
            onClick={handleToggleEditMode}
            className="w-full flex items-center justify-center px-4 py-2 text-white dark:text-gray-900 bg-purple-600 dark:bg-gray-300 hover:bg-purple-700 dark:hover:bg-gray-400 rounded-lg"
          >
            <Cog6ToothIcon className="w-5 h-5 mr-2" />
            {isEditMode ? 'Save' : 'Settings'}
          </button>
        </div>
      )}
    </div>
  );
}