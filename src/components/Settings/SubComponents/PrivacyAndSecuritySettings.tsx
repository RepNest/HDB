// src/pages/internal/InternalPages.tsx
import React from 'react';
import { useNavigate } from '../../../hooks/useNavigate';

const PrivacyAndSecuritySettings = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Privacy and Security Settings</h1>

      {/* Top Quick Access Button Bar */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('about:settings/clearbrowsingdata')}
          className="border border-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          🗑️ Clear Browsing Data
        </button>
        <button
          onClick={() => navigate('about:settings/typoprotection')}
          className="border border-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          🔤 Typo Protection
        </button>
        <button
          onClick={() => navigate('about:settings/clearonclose')}
          className="border border-gray-600 px-4 py-2 rounded hover:bg-gray-700"
        >
          🧹 Clear Browsing Data on Close
        </button>
      </div>

      {/* Section Navigation Menu */}
      <div className="bg-neutral-900 border border-gray-700 rounded p-4 space-y-4">
        {[
          {
            label: 'Tracking Prevention',
            description:
              'Manage how websites use trackers to collect information about your browsing.',
            path: 'about:settings/trackingprevention',
          },
          {
            label: 'Clear Browsing Data',
            description:
              'Clear your history, passwords, cookies, and more from this profile.',
            path: 'about:settings/clearbrowsingdata',
          },
          {
            label: 'Privacy',
            description: 'Control what data gets saved and shared.',
            path: 'about:settings/privacy',
          },
          {
            label: 'Security',
            description: 'Manage security-related browser settings.',
            path: 'about:settings/security',
          },
          {
            label: 'Search and Connected Experiences',
            description:
              'Manage your Edge search, connected features, and Microsoft services.',
            path: 'about:settings/connectedexperiences',
          },
        ].map(({ label, description, path }) => (
          <div
            key={label}
            className="hover:bg-gray-800 p-3 rounded cursor-pointer"
            onClick={() => navigate(path)}
          >
            <h3 className="font-semibold text-lg">{label}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyAndSecuritySettings;