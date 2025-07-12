import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Shield, Settings as SettingsIcon, Database, ChevronDown, ChevronLeft, ChevronRight, Lock, AlertTriangle } from 'lucide-react';
import UserManagement from './UserManagement';
import { useData } from '../../contexts/DataContext';
import Papa from 'papaparse'; 
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

const SYSTEM_SETTINGS_KEY = 'propai_system_settings';
const BACKUP_DATE_KEY = 'propai_last_backup_date';

const defaultSettings = {
  companyName: 'Propai Real Estate',
  companyImage: '', // Add company image field
  companyWebsite: 'www.propai.com',
  companyEmail: 'info@propai.com',
  companyAddress: '123 Main St, Alexandria, Egypt',
  notifications: {
    email: true,
    meeting: true,
    contract: true,
  },
};

const Settings: React.FC = () => {
  const { leads, properties, contracts, addLead, users, projects, developers, meetings, zones } = useData();
  const { user } = useAuth();
  const { t } = useTranslation('settings');
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeTab, setActiveTab] = useState('users');
  const [showMobileTabs, setShowMobileTabs] = useState(false);
  const { setGlobalSettings } = useSettings();

  // System Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data Management State
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem(BACKUP_DATE_KEY));

  // Check user access permissions
  const hasAdminAccess = user?.role === 'Admin';
  const hasSalesAdminAccess = user?.role === 'Sales Admin';
  const hasTeamLeaderAccess = user?.role === 'Team Leader';
  const hasSalesRepAccess = user?.role === 'Sales Rep';

  // Define tabs based on role permissions
  const getAvailableTabs = () => {
    const tabs = [
      { id: 'users', label: t('tabs.users'), icon: Users, adminOnly: true },
      { id: 'permissions', label: t('tabs.permissions'), icon: Shield, adminOnly: true },
      { id: 'system', label: t('tabs.system'), icon: SettingsIcon, adminOnly: true },
      { id: 'data', label: t('tabs.data'), icon: Database, adminOnly: true }
    ];

    return tabs.filter(tab => {
      if (tab.id === 'users') {
        return hasAdminAccess || hasSalesAdminAccess;
      }
      if (tab.id === 'permissions') {
        return hasAdminAccess || hasSalesAdminAccess;
      }
      if (tab.id === 'system') {
        return hasAdminAccess;
      }
      if (tab.id === 'data') {
        return hasAdminAccess || hasSalesAdminAccess;
      }
      return false;
    });
  };

  const availableTabs = getAvailableTabs();

  // Check if user has any access to settings
  const hasSettingsAccess = availableTabs.length > 0;

  // System Settings Handlers
  const handleSettingsChange = (field: string, value: any) => {
    setSettings((prev: any) => {
      const updated = { ...prev, [field]: value };
      setSettingsChanged(true);
      return updated;
    });
  };
  const handleNotificationChange = (type: string, value: boolean) => {
    setSettings((prev: any) => {
      const updated = { ...prev, notifications: { ...prev.notifications, [type]: value } };
      setSettingsChanged(true);
      return updated;
    });
  };
  const handleCompanyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleSettingsChange('companyImage', reader.result);
    };
    reader.readAsDataURL(file);
  };
  const handleSaveSettings = () => {
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings));
    setSaveSuccess(true);
    setSettingsChanged(false);
    setGlobalSettings(settings);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Data Export Helpers
  const downloadCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleExportLeads = () => downloadCSV(leads, 'leads.csv');
  const handleExportProperties = () => downloadCSV(properties, 'properties.csv');
  const handleExportContracts = () => downloadCSV(contracts, 'contracts.csv');

  // Data Import (Leads)
  const handleImportLeads = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const importedLeads = results.data.map((row: any) => ({
            ...row,
            id: undefined,
            createdAt: new Date().toISOString(),
            notes: [],
            calls: [],
            visits: [],
            createdBy: user?.name || 'System',
          }));
          importedLeads.forEach((lead: any) => addLead(lead));
          setImportSuccess('Leads imported successfully!');
        } catch (err) {
          setImportError('Failed to import leads.');
        }
        setImporting(false);
      },
      error: () => {
        setImportError('Failed to parse CSV.');
        setImporting(false);
      },
    });
  };

  // Data Backup
  const handleBackup = () => {
    const data = {
      users,
      leads,
      properties,
      projects,
      developers,
      meetings,
      contracts,
      zones,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `propai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toLocaleString();
    localStorage.setItem(BACKUP_DATE_KEY, now);
    setLastBackup(now);
  };

  // Access Denied Component
  const AccessDenied = () => (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h1>
            <p className="text-gray-600 mb-6">{t('accessDeniedMessage')}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('rolePermissions')}</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="text-left">
                <h3 className="font-semibold text-blue-600 mb-2">Admin</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• {t('role.admin.fullAccess')}</li>
                  <li>• {t('role.admin.createEditDeleteUsers')}</li>
                  <li>• {t('role.admin.accessSystemSettings')}</li>
                  <li>• {t('role.admin.viewAllLeadsPropertiesContracts')}</li>
                  <li>• {t('role.admin.fullReportingAnalytics')}</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-green-600 mb-2">Sales Admin</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• {t('role.salesAdmin.sameAsAdmin')}</li>
                  <li>• {t('role.salesAdmin.editUserRolesPermissions')}</li>
                  <li>• {t('role.salesAdmin.fullAccessLeadsInventory')}</li>
                  <li>• {t('role.salesAdmin.viewTeamPerformance')}</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-purple-600 mb-2">Team Leader</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• {t('role.teamLeader.viewManageLeadsBelongingToTeam')}</li>
                  <li>• {t('role.teamLeader.cannotRegisterDeleteUsers')}</li>
                  <li>• {t('role.teamLeader.assignLeadsToTeamMembers')}</li>
                  <li>• {t('role.teamLeader.accessTeamPerformanceReports')}</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-orange-600 mb-2">Sales Rep</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• {t('role.salesRep.viewCreateManageOwnLeads')}</li>
                  <li>• {t('role.salesRep.updateLeadStatusAddNotes')}</li>
                  <li>• {t('role.salesRep.cannotEditSavedLeadFields')}</li>
                  <li>• {t('role.salesRep.cannotDeleteLeads')}</li>
                  <li>• {t('role.salesRep.limitedAccessInventory')}</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>{t('currentRole')}: <span className="font-semibold">{user?.role}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // If no access, show access denied
  if (!hasSettingsAccess) {
    return <AccessDenied />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'permissions':
        return (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{t('rolePermissions')}</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{t('role.admin')}</h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <li>• {t('role.admin.fullAccess')}</li>
                  <li>• {t('role.admin.createEditDeleteUsers')}</li>
                  <li>• {t('role.admin.accessSystemSettings')}</li>
                  <li>• {t('role.admin.viewAllLeadsPropertiesContracts')}</li>
                  <li>• {t('role.admin.fullReportingAnalytics')}</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{t('role.salesAdmin')}</h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <li>• {t('role.salesAdmin.sameAsAdmin')}</li>
                  <li>• {t('role.salesAdmin.editUserRolesPermissions')}</li>
                  <li>• {t('role.salesAdmin.fullAccessLeadsInventory')}</li>
                  <li>• {t('role.salesAdmin.viewTeamPerformance')}</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{t('role.teamLeader')}</h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <li>• {t('role.teamLeader.viewManageLeadsBelongingToTeam')}</li>
                  <li>• {t('role.teamLeader.cannotRegisterDeleteUsers')}</li>
                  <li>• {t('role.teamLeader.assignLeadsToTeamMembers')}</li>
                  <li>• {t('role.teamLeader.accessTeamPerformanceReports')}</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{t('role.salesRep')}</h3>
                <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <li>• {t('role.salesRep.viewCreateManageOwnLeads')}</li>
                  <li>• {t('role.salesRep.updateLeadStatusAddNotes')}</li>
                  <li>• {t('role.salesRep.cannotEditSavedLeadFields')}</li>
                  <li>• {t('role.salesRep.cannotDeleteLeads')}</li>
                  <li>• {t('role.salesRep.limitedAccessInventory')}</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{t('systemSettings')}</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{t('generalSettings')}</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyName')}</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={e => handleSettingsChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyWebsite')}</label>
                    <input
                      type="text"
                      value={settings.companyWebsite}
                      onChange={e => handleSettingsChange('companyWebsite', e.target.value)}
                      placeholder={t('companyWebsitePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyEmail')}</label>
                    <input
                      type="email"
                      value={settings.companyEmail}
                      onChange={e => handleSettingsChange('companyEmail', e.target.value)}
                      placeholder={t('companyEmailPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyAddress')}</label>
                    <textarea
                      value={settings.companyAddress}
                      onChange={e => handleSettingsChange('companyAddress', e.target.value)}
                      placeholder={t('companyAddressPlaceholder')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('companyImageLogo')}</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={settings.companyImage || "/src/RockaidevLogo.jpg"}
                          alt="Company Logo"
                          className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-full border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.src = "/src/RockaidevLogo.jpg";
                          }}
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCompanyImageChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('companyImageLogoDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{t('notificationSettings')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.notifications.email}
                      onChange={e => handleNotificationChange('email', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">{t('emailNotifications')}</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="meetingReminders"
                      checked={settings.notifications.meeting}
                      onChange={e => handleNotificationChange('meeting', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="meetingReminders" className="ml-2 text-sm text-gray-700">{t('meetingReminders')}</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="contractAlerts"
                      checked={settings.notifications.contract}
                      onChange={e => handleNotificationChange('contract', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="contractAlerts" className="ml-2 text-sm text-gray-700">{t('contractAlerts')}</label>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  className={`w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold ${!settingsChanged ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleSaveSettings}
                  disabled={!settingsChanged}
                >
                  {t('saveSettings')}
                </button>
                {saveSuccess && <span className="text-green-600 font-medium">{t('saved')}</span>}
              </div>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{t('dataManagement')}</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{t('dataExport')}</h3>
                <div className="space-y-3 flex flex-col sm:flex-row flex-wrap gap-3">
                  <button onClick={handleExportLeads} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">{t('exportAllLeads')}</button>
                  <button onClick={handleExportProperties} className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">{t('exportProperties')}</button>
                  <button onClick={handleExportContracts} className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">{t('exportContracts')}</button>
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{t('dataImport')}</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                  <Database className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{t('importLeadsFromCSV')}</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportLeads}
                    className="mb-2 w-full"
                    disabled={importing}
                  />
                  {importing && <div className="text-blue-600 text-sm">{t('importing')}</div>}
                  {importSuccess && <div className="text-green-600 text-sm">{importSuccess}</div>}
                  {importError && <div className="text-red-600 text-sm">{importError}</div>}
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{t('dataBackup')}</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div>
                    <p className="text-yellow-800 mb-1 text-sm">{t('lastBackup')}: {lastBackup || t('never')}</p>
                  </div>
                  <button onClick={handleBackup} className="w-full sm:w-auto bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm">{t('createBackupNow')}</button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-start">{t('title')}</h1>
        <p className="text-gray-600 text-center sm:text-start text-sm sm:text-base">{t('description')}</p>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
        {/* Mobile Tab Selector */}
        <div className="sm:hidden">
          <button
            onClick={() => setShowMobileTabs(!showMobileTabs)}
            className="w-full flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50"
          >
            <span className="font-medium text-gray-900">
              {availableTabs.find(tab => tab.id === activeTab)?.label}
            </span>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${showMobileTabs ? 'rotate-180' : ''}`} />
          </button>
          
          {showMobileTabs && (
            <div className="border-b border-gray-200 bg-white">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowMobileTabs(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Enhanced Tabs with Horizontal Scrolling */}
        <div className="hidden sm:block">
          <div className="relative">
            {/* Scroll Container */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex min-w-max border-b border-gray-200 bg-gray-50">
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-blue-600 bg-white shadow-sm'
                        : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Scroll Indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;