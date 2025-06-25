// src/components/Settings/SubComponents/GeneralSettings.tsx

import React from 'react';
import { useNavigate } from '../../../hooks/useNavigate';

const GeneralSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 text-white space-y-6">
      <h2 className="text-2xl font-bold">General Settings</h2>

      <div className="bg-neutral-900 border border-gray-700 rounded p-4 space-y-4">
        <div
          className="hover:bg-gray-800 p-3 rounded cursor-pointer"
          onClick={() => navigate('about:settings/passwords')}
        >
          <h3 className="font-semibold text-lg">Passwords</h3>
          <p className="text-sm text-gray-400">Manage saved usernames and passwords securely.</p>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
