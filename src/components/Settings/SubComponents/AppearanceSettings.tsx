// src/components/Settings/SubComponents/AppearanceSettings.tsx

import React, { useState, useEffect } from 'react';

const themes = ['light', 'dark', 'grey'] as const;
const colors = ['red', 'blue', 'green', 'purple', 'pink', 'orange', 'yellow', 'teal'] as const;

type Theme = typeof themes[number];
type Color = typeof colors[number];

interface AppearancePrefs {
  theme: Theme;
  accentColor: Color;
}

const AppearanceSettings: React.FC = () => {
  const [appearance, setAppearance] = useState<AppearancePrefs>({
    theme: 'dark',
    accentColor: 'purple',
  });

  useEffect(() => {
    const loadAppearance = async () => {
      const stored = await window.electronAPI.loadEncryptedData('appearance');
      if (stored && stored.theme && stored.accentColor) {
        setAppearance(stored);
        applyAppearance(stored);
      }
    };
    loadAppearance();
  }, []);

  const applyAppearance = (prefs: AppearancePrefs) => {
    document.body.classList.remove(...themes.map(t => `theme-${t}`));
    document.body.classList.add(`theme-${prefs.theme}`);

    document.body.classList.remove(...colors.map(c => `accent-${c}`));
    document.body.classList.add(`accent-${prefs.accentColor}`);
  };

  const handleThemeChange = async (theme: Theme) => {
    const updated = { ...appearance, theme };
    setAppearance(updated);
    applyAppearance(updated);
    await window.electronAPI.saveEncryptedData('appearance', updated);
  };

  const handleColorChange = async (accentColor: Color) => {
    const updated = { ...appearance, accentColor };
    setAppearance(updated);
    applyAppearance(updated);
    await window.electronAPI.saveEncryptedData('appearance', updated);
  };

  const getColorCode = (color: string) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'purple': return '#8b5cf6';
      case 'pink': return '#ec4899';
      case 'orange': return '#f97316';
      case 'yellow': return '#eab308';
      case 'teal': return '#14b8a6';
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="p-6 text-white space-y-6">
      <h2 className="text-2xl font-bold mb-4">Appearance Settings</h2>

      <div>
        <h3 className="text-lg mb-2">Theme</h3>
        <div className="flex space-x-4">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`px-4 py-2 rounded ${
                appearance.theme === t ? 'bg-purple-600' : 'bg-gray-700'
              } hover:bg-purple-500 transition`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg mb-2">Accent Color</h3>
        <div className="flex space-x-3 flex-wrap">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`w-8 h-8 rounded-full border-2 ${
                appearance.accentColor === color ? 'border-white scale-110' : 'border-transparent'
              } transition-transform`}
              title={color}
              style={{ backgroundColor: getColorCode(color) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
