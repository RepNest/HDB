import React, { useState, useRef, useEffect, memo } from 'react';
import clsx from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Tab } from '../types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';

interface TabsProps {
  tabs: Tab[];
  activeTabId: number;
  onTabClick: (id: number) => void;
  onCloseTab: (id: number) => void;
  onCloseOtherTabs: (id: number) => void;
  onReopenClosedTab: () => void;
  onNewTab: () => void;
  onReorderTabs: (sourceIndex: number, destinationIndex: number) => void;
  onPinTab: (id: number) => void;
  onReplaceTab: (id: number, url: string) => void;
  navColor: string;
  isDarkMode: boolean;
  tabBorderWidth?: 'thin' | 'medium' | 'thick';
  highContrast?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onCloseTab,
  onCloseOtherTabs,
  onReopenClosedTab,
  onNewTab,
  onReorderTabs,
  onPinTab,
  onReplaceTab,
  navColor,
  isDarkMode,
  tabBorderWidth = 'medium',
  highContrast = false,
}) => {
  const [contextMenu, setContextMenu] = useState<{ tabId: number; x: number; y: number } | null>(null);
  const [hoverTabId, setHoverTabId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    onReorderTabs(result.source.index, result.destination.index);
  };

  const handleMouseEnter = (tabId: number) => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverTabId(tabId);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoverTabId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onTabClick(tabId);
      e.preventDefault();
    }
  };

  const handleContextMenuKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      action();
      e.preventDefault();
    }
  };

  const itdTools = [
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="tabs" direction="horizontal">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={clsx(
              'flex items-center border-b overflow-x-auto z-[900] w-full',
              isDarkMode ? 'bg-[var(--tab-bg-dark)] border-[var(--tab-border-dark)]' : 'bg-[var(--tab-bg-light)] border-[var(--tab-border-light)]'
            )}
          >
            <AnimatePresence>
              {tabs.map((tab, index) => (
                <Draggable key={tab.id} draggableId={tab.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <motion.div
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={clsx(
                          'flex items-center px-4 py-2 cursor-pointer border-r transition-all relative group',
                          tab.pinned
                            ? 'min-w-[50px] max-w-[50px]'
                            : 'min-w-[150px] max-w-[200px]',
                          activeTabId === tab.id
                            ? `border-b-[length:var(--tab-border-width-${tabBorderWidth})]`
                            : 'hover:bg-gray-600',
                          snapshot.isDragging && 'bg-gray-500'
                        )}
                        style={{
                          backgroundColor: activeTabId === tab.id
                            ? `var(--tab-active-bg-${isDarkMode ? 'dark' : 'light'})`
                            : `var(--tab-bg-${isDarkMode ? 'dark' : 'light'})`,
                          color: highContrast
                            ? isDarkMode
                              ? '#FFFFFF'
                              : '#000000'
                            : activeTabId === tab.id
                            ? `var(--tab-active-text-${isDarkMode ? 'dark' : 'light'})`
                            : `var(--tab-text-${isDarkMode ? 'dark' : 'light'})`,
                          borderBottomColor: activeTabId === tab.id ? `${navColor}-500` : 'transparent',
                          borderRightColor: `var(--tab-border-${isDarkMode ? 'dark' : 'light'})`,
                          boxShadow: activeTabId === tab.id ? `var(--tab-neon-shadow-${navColor})` : 'none',
                        }}
                        onClick={() => onTabClick(tab.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
                        }}
                        onMouseEnter={() => handleMouseEnter(tab.id)}
                        onMouseLeave={handleMouseLeave}
                        onKeyDown={(e) => handleKeyDown(e, tab.id)}
                        tabIndex={0}
                        role="tab"
                        aria-selected={activeTabId === tab.id}
                        aria-label={`Tab: ${tab.title || 'New Tab'}`}
                      >
                        {tab.favicon && (
                          <img
                            src={tab.favicon}
                            alt=""
                            className="inline w-4 h-4 mr-2"
                            onError={(e) => {
                              e.currentTarget.src = '/default-favicon.png';
                            }}
                          />
                        )}
                        <span className={clsx('truncate flex-1', tab.pinned && 'hidden')}>
                          {tab.title || 'New Tab'}
                        </span>
                        {!tab.pinned && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseTab(tab.id);
                            }}
                            className={clsx(
                              'ml-2 w-5 h-5 flex items-center justify-center rounded-full transition-all',
                              isDarkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-400'
                            )}
                            style={{ color: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : 'inherit' }}
                            aria-label={`Close ${tab.title || 'New Tab'}`}
                          >
                            <XMarkIcon className="w-4 h-4" style={{ fill: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : 'inherit' }} />
                          </button>
                        )}
                        {hoverTabId === tab.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={clsx(
                              'absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 rounded-lg shadow-md z-[920]'
                            )}
                            style={{
                              backgroundColor: `var(--tab-bg-${isDarkMode ? 'dark' : 'light'})`,
                              borderColor: `var(--tab-border-${isDarkMode ? 'dark' : 'light'})`,
                              color: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : `var(--tab-active-text-${isDarkMode ? 'dark' : 'light'})`,
                              boxShadow: `var(--tab-neon-shadow-${navColor})`,
                              minWidth: '200px',
                            }}
                          >
                            <div className="flex items-center">
                              {tab.favicon && (
                                <img src={tab.favicon} alt="" className="w-4 h-4 mr-2" />
                              )}
                              <span className="text-sm font-bold truncate">{tab.title || 'New Tab'}</span>
                            </div>
                            <p className="text-xs mt-1 truncate">{tab.url}</p>
                          </motion.div>
                        )}
                        {contextMenu?.tabId === tab.id && (
                          <div
                            ref={contextMenuRef}
                            className={clsx(
                              'absolute border rounded-lg shadow-md p-2 z-[910]'
                            )}
                            style={{
                              backgroundColor: `var(--tab-bg-${isDarkMode ? 'dark' : 'light'})`,
                              borderColor: `var(--tab-border-${isDarkMode ? 'dark' : 'light'})`,
                              color: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : `var(--tab-active-text-${isDarkMode ? 'dark' : 'light'})`,
                            }}
                            role="menu"
                            aria-label="Tab context menu"
                          >
                            <button
                              onClick={() => {
                                onCloseTab(tab.id);
                                setContextMenu(null);
                              }}
                              onKeyDown={(e) => handleContextMenuKeyDown(e, () => {
                                onCloseTab(tab.id);
                                setContextMenu(null);
                              })}
                              className={clsx(
                                'block w-full text-left px-4 py-2 text-sm transition-all',
                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              )}
                              role="menuitem"
                              tabIndex={0}
                            >
                              Close Tab
                            </button>
                            <button
                              onClick={() => {
                                onCloseOtherTabs(tab.id);
                                setContextMenu(null);
                              }}
                              onKeyDown={(e) => handleContextMenuKeyDown(e, () => {
                                onCloseOtherTabs(tab.id);
                                setContextMenu(null);
                              })}
                              className={clsx(
                                'block w-full text-left px-4 py-2 text-sm transition-all',
                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              )}
                              role="menuitem"
                              tabIndex={0}
                            >
                              Close Other Tabs
                            </button>
                            <button
                              onClick={() => {
                                onReopenClosedTab();
                                setContextMenu(null);
                              }}
                              onKeyDown={(e) => handleContextMenuKeyDown(e, () => {
                                onReopenClosedTab();
                                setContextMenu(null);
                              })}
                              className={clsx(
                                'block w-full text-left px-4 py-2 text-sm transition-all',
                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              )}
                              role="menuitem"
                              tabIndex={0}
                            >
                              Reopen Closed Tab
                            </button>
                            <button
                              onClick={() => {
                                onPinTab(tab.id);
                                setContextMenu(null);
                              }}
                              onKeyDown={(e) => handleContextMenuKeyDown(e, () => {
                                onPinTab(tab.id);
                                setContextMenu(null);
                              })}
                              className={clsx(
                                'block w-full text-left px-4 py-2 text-sm transition-all',
                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              )}
                              role="menuitem"
                              tabIndex={0}
                            >
                              {tab.pinned ? 'Unpin Tab' : 'Pin Tab'}
                            </button>
                            <button
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                              onKeyDown={(e) => handleContextMenuKeyDown(e, () => setDropdownOpen(!dropdownOpen))}
                              className={clsx(
                                'block w-full text-left px-4 py-2 text-sm transition-all',
                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                              )}
                              role="menuitem"
                              tabIndex={0}
                              aria-haspopup="true"
                              aria-expanded={dropdownOpen}
                            >
                              Open in Current Tab ▼
                            </button>
                            {dropdownOpen && (
                              <div
                                ref={dropdownRef}
                                className={clsx(
                                  'absolute left-full top-0 mt-0 ml-1 border rounded-lg shadow-md p-2 z-[910]'
                                )}
                                style={{
                                  backgroundColor: `var(--tab-bg-${isDarkMode ? 'dark' : 'light'})`,
                                  borderColor: `var(--tab-border-${isDarkMode ? 'dark' : 'light'})`,
                                  color: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : `var(--tab-active-text-${isDarkMode ? 'dark' : 'light'})`,
                                }}
                                role="menu"
                                aria-label="ITD tools submenu"
                              >
                                {itdTools.map((tool) => (
                                  <div key={tool.id}>
                                    {tool.submenu ? (
                                      <div className="relative">
                                        <button
                                          className={clsx(
                                            'block w-full text-left px-4 py-2 text-sm transition-all',
                                            isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                          )}
                                          onClick={() => setActiveDropdown(activeDropdown === tool.id ? null : tool.id)}
                                          onKeyDown={(e) => handleContextMenuKeyDown(e, () => setActiveDropdown(activeDropdown === tool.id ? null : tool.id))}
                                          role="menuitem"
                                          tabIndex={0}
                                          aria-haspopup="true"
                                          aria-expanded={activeDropdown === tool.id}
                                        >
                                          {tool.text}
                                        </button>
                                        {activeDropdown === tool.id && (
                                          <div
                                            className={clsx(
                                              'absolute left-full top-0 ml-1 border rounded-lg shadow-md p-2'
                                            )}
                                            style={{
                                              backgroundColor: `var(--tab-bg-${isDarkMode ? 'dark' : 'light'})`,
                                              borderColor: `var(--tab-border-${isDarkMode ? 'dark' : 'light'})`,
                                              color: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : `var(--tab-active-text-${isDarkMode ? 'dark' : 'light'})`,
                                            }}
                                            role="menu"
                                            aria-label={`${tool.text} submenu`}
                                          >
                                            {tool.submenu.map((subItem) => (
                                              <button
                                                key={subItem.id}
                                                onClick={() => {
                                                  onReplaceTab(tab.id, subItem.url);
                                                  setDropdownOpen(false);
                                                  setActiveDropdown(null);
                                                  setContextMenu(null);
                                                }}
                                                onKeyDown={(e) => handleContextMenuKeyDown(e, () => {
                                                  onReplaceTab(tab.id, subItem.url);
                                                  setDropdownOpen(false);
                                                  setActiveDropdown(null);
                                                  setContextMenu(null);
                                                })}
                                                className={clsx(
                                                  'block w-full text-left px-4 py-2 text-sm transition-all',
                                                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                                )}
                                                role="menuitem"
                                                tabIndex={0}
                                              >
                                                {subItem.text}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          onReplaceTab(tab.id, tool.url!);
                                          setDropdownOpen(false);
                                          setContextMenu(null);
                                        }}
                                        onKeyDown={(e) => handleContextMenuKeyDown(e, () => {
                                          onReplaceTab(tab.id, tool.url!);
                                          setDropdownOpen(false);
                                          setContextMenu(null);
                                        })}
                                        className={clsx(
                                          'block w-full text-left px-4 py-2 text-sm transition-all',
                                          isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                        )}
                                        role="menuitem"
                                        tabIndex={0}
                                      >
                                        {tool.text}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Draggable>
              ))}
            </AnimatePresence>
            {provided.placeholder}
            <button
              onClick={onNewTab}
              className={clsx(
                'px-4 py-2 text-sm transition-all',
                isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-200'
              )}
              style={{ color: highContrast ? (isDarkMode ? '#FFFFFF' : '#000000') : 'inherit' }}
              aria-label="Open new tab"
            >
              +
            </button>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default memo(Tabs);