import React from 'react';
import ExtensionsSettings from '../../components/Settings/SubComponents/ExtensionsSettings';
import PrivacyAndSecuritySettings from '../../components/Settings/SubComponents/PrivacyAndSecuritySettings';
import ClearBrowsingDataPage from '../../components/Settings/SubComponents/Privacy/ClearBrowsingDataPage';
import ClearOnClosePage from '../../components/Settings/SubComponents/Privacy/ClearOnClosePage';
import TypoProtectionPage from '../../components/Settings/SubComponents/Privacy/TypoProtectionPage';
import TrackingPreventionPage from '../../components/Settings/SubComponents/Privacy/TrackingPreventionPage';
import PrivacyPage from '../../components/Settings/SubComponents/Privacy/PrivacyPage';
import SecurityPage from '../../components/Settings/SubComponents/Privacy/SecurityPage';

export const ExtensionPage = () => {
  return (
    <div className="p-6">
      <ExtensionsSettings />
    </div>
  );
};

export const PrivacyAndSecurityPage = () => {
  return (
    <div className="p-6">
      <PrivacyAndSecuritySettings />
    </div>
  );
};

export const ClearBrowsingDataInternal = () => {
  return (
    <div className="p-6">
      <ClearBrowsingDataPage />
    </div>
  );
};

export const ClearOnCloseInternal = () => {
  return (
    <div className="p-6">
      <ClearOnClosePage />
    </div>
  );
};

export const TypoProtectionInternal = () => {
  return (
    <div className="p-6">
      <TypoProtectionPage />
    </div>
  );
};

export const TrackingPreventionInternal = () => {
  return (
    <div className="p-6">
      <TrackingPreventionPage />
    </div>
  );
};

export const PrivacyInternal = () => {
  return (
    <div className="p-6">
      <PrivacyPage />
    </div>
  );
};

export const SecurityInternal = () => {
  return (
    <div className="p-6">
      <SecurityPage />
    </div>
  );
};
