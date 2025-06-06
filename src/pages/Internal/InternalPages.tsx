import React from 'react';
import ExtensionsSettings from '../../components/Settings/SubComponents/ExtensionsSettings';
import PrivacySettings from '../../components/Settings/SubComponents/PrivacySettings';

export const ExtensionPage = () => {
  return (
    <div className="p-6">
      <ExtensionsSettings />
    </div>
  );
};

export const HistoryPage = () => {
  return (
    <div className="p-6">
      <PrivacySettings />
    </div>
  );
};