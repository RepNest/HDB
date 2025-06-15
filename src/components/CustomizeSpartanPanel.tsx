import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Config } from '../types';

interface CustomizeSpartanPanelProps {
  isOpen: boolean;
  isDarkMode: boolean;
  navColor: string;
  localNavColor: string;
  handleToggleTheme: (dark: boolean) => void;
  handleChangeNavColor: (color: string) => void;
  customizeRef: React.RefObject<HTMLDivElement>;
  customizeButtonRef: React.RefObject<HTMLButtonElement>;
}

const CustomizeSpartanPanel: React.FC<CustomizeSpartanPanelProps> = ({
  isOpen,
  isDarkMode,
  navColor,
  localNavColor,
  handleToggleTheme,
  handleChangeNavColor,
  customizeRef,
  customizeButtonRef,
}) => {
  if (!isOpen) return null;

  const renderCustomizePanel = () => {
    const root = document.getElementById('customize-spartan-root');
    if (!root) {
      console.error('Customize Spartan root div not found');
      return null;
    }

    console.log('Rendering Customize Spartan panel');

    return (
      <motion.div
        ref={customizeRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute bg-neutral-900 dark:bg-gray-100 border border-gray-700 dark:border-gray-300 rounded-xl shadow-md p-6 z-[10000] overflow-y-auto sidebar-scroll"
        style={{
          top: 110,
          right: customizeButtonRef.current
            ? window.innerWidth - customizeButtonRef.current.getBoundingClientRect().right + 16
            : 16,
          width: '600px',
          height: 'calc(80vh - 100px)',
        }}
      >
        <h2 className="text-lg font-semibold text-white dark:text-gray-900 mb-4">Customize Spartan</h2>
        <div className="flex flex-col items-center space-y-6">
          <div className="theme-toggle-container flex rounded-full bg-gray-700/50 dark:bg-gray-200/50 backdrop-blur-sm shadow-inner p-2 w-96">
            <button
              onClick={() => handleToggleTheme(true)}
              className={clsx(
                'flex items-center justify-center w-1/2 py-3 rounded-full transition-all text-lg',
                isDarkMode ? `bg-${navColor}-600 text-white` : 'bg-transparent text-gray-300 dark:text-gray-600 hover:bg-gray-300 dark:hover:bg-gray-400'
              )}
            >
              <span className="text-2xl mr-2">☀️</span> Light
            </button>
            <button
              onClick={() => handleToggleTheme(false)}
              className={clsx(
                'flex items-center justify-center w-1/2 py-2 rounded-full transition-all text-lg',
                !isDarkMode ? `bg-${navColor}-600 text-white` : 'bg-transparent text-gray-300 dark:text-gray-600 hover:bg-gray-300 dark:hover:bg-gray-400'
              )}
            >
              <span className="text-2xl mr-2">🌙</span> Dark
            </button>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-base font-medium text-white dark:text-gray-900 mb-2">Interface Palette</h3>
            <div className="flex flex-wrap justify-center items-center gap-1 rounded-full bg-gray-700/50 dark:bg-gray-200/50 backdrop-blur-sm shadow-inner p-2 w-96">
              <button
                onClick={() => handleChangeNavColor('purple')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-purple-600 hover:bg-purple-700',
                  localNavColor === 'purple' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Purple"
              />
              <button
                onClick={() => handleChangeNavColor('red')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-red-600 hover:bg-red-700',
                  localNavColor === 'red' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Red"
              />
              <button
                onClick={() => handleChangeNavColor('orange')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-orange-600 hover:bg-orange-700',
                  localNavColor === 'orange' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Orange"
              />
              <button
                onClick={() => handleChangeNavColor('green')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-green-600 hover:bg-green-700',
                  localNavColor === 'green' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Green"
              />
              <button
                onClick={() => handleChangeNavColor('yellow')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-yellow-600 hover:bg-yellow-700',
                  localNavColor === 'yellow' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Yellow"
              />
              <button
                onClick={() => handleChangeNavColor('blue')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-blue-600 hover:bg-blue-700',
                  localNavColor === 'blue' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Blue"
              />
              <button
                onClick={() => handleChangeNavColor('pink')}
                className={clsx(
                  'w-14 h-14 rounded-full transition-all bg-pink-600 hover:bg-pink-700',
                  localNavColor === 'pink' ? 'ring-2 ring-white dark:ring-gray-900' : ''
                )}
                title="Pink"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return renderCustomizePanel();
};

export default CustomizeSpartanPanel;