import React, { useState } from 'react';

// Subcomponents
import GeneralSettings from '../../components/Settings/SubComponents/GeneralSettings';
import AppearanceSettings from '../../components/Settings/SubComponents/AppearanceSettings';
import ExtensionsSettings from '../../components/Settings/SubComponents/ExtensionsSettings';
import PrivacySettings from '../../components/Settings/SubComponents/PrivacySettings';

const SettingsTab = () => {
  const [selectedSection, setSelectedSection] = useState('General');

  const renderSection = () => {
    switch (selectedSection) {
      case 'General':
        return <GeneralSettings />;
      case 'Appearance':
        return <AppearanceSettings />;
      case 'Extensions':
        return <ExtensionsSettings />;
      case 'Privacy':
        return <PrivacySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Navigation */}
      <div className="w-64 bg-neutral-800 border-r border-neutral-700 p-4 space-y-2">
        {['General', 'Appearance', 'Extensions', 'Privacy'].map((section) => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            className={`w-full text-left px-3 py-2 rounded ${
              selectedSection === section ? 'bg-purple-600 text-white' : 'hover:bg-neutral-700'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">{renderSection()}</div>
    </div>
  );
};

export default SettingsTab;
