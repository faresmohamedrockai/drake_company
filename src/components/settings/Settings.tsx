import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Shield, Settings as SettingsIcon, Database } from 'lucide-react';
import UserManagement from './UserManagement';
import { useData } from '../../contexts/DataContext';
import Papa from 'papaparse'; 

const SYSTEM_SETTINGS_KEY = 'propai_system_settings';
const BACKUP_DATE_KEY = 'propai_last_backup_date';

const defaultSettings = {
  companyName: 'Propai Real Estate',
  currency: 'USD',
  timeZone: 'UTC',
  notifications: {
    email: true,
    meeting: true,
    contract: true,
  },
};

const Settings: React.FC = () => {
  const { leads, properties, contracts, addLead, users, projects, developers, meetings, zones } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

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

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'permissions', label: 'Permissions', icon: Shield, adminOnly: true },
    { id: 'system', label: 'System Settings', icon: SettingsIcon, adminOnly: false },
    { id: 'data', label: 'Data Management', icon: Database, adminOnly: true }
  ];

  const availableTabs = tabs.filter(tab => 
    !tab.adminOnly || user?.role === 'Admin' || user?.role === 'Sales Admin'
  );

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
  const handleSaveSettings = () => {
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings));
    setSaveSuccess(true);
    setSettingsChanged(false);
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'permissions':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Role Permissions</h2>
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Full access to all modules and features</li>
                  <li>• Can create, edit, and delete users</li>
                  <li>• Access to system settings and configurations</li>
                  <li>• Can view all leads, properties, and contracts</li>
                  <li>• Full reporting and analytics access</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sales Admin</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Same as Admin except cannot delete users</li>
                  <li>• Can edit user roles and permissions</li>
                  <li>• Full access to leads and inventory management</li>
                  <li>• Can view team performance metrics</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Leader</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Can view and manage leads belonging to their team</li>
                  <li>• Cannot register or delete users</li>
                  <li>• Can assign leads to team members</li>
                  <li>• Access to team performance reports</li>
                </ul>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sales Rep</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Can view, create, and manage their own leads</li>
                  <li>• Can update lead status and add notes</li>
                  <li>• Cannot edit saved lead fields (except status and notes)</li>
                  <li>• Cannot delete leads</li>
                  <li>• Limited access to inventory (view only)</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={e => handleSettingsChange('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                    <select
                      value={settings.currency}
                      onChange={e => handleSettingsChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EGP">EGP (ج.م)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                    <select
                      value={settings.timeZone}
                      onChange={e => handleSettingsChange('timeZone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.notifications.email}
                      onChange={e => handleNotificationChange('email', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">Email notifications for new leads</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="meetingReminders"
                      checked={settings.notifications.meeting}
                      onChange={e => handleNotificationChange('meeting', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="meetingReminders" className="ml-2 text-sm text-gray-700">Meeting reminders</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="contractAlerts"
                      checked={settings.notifications.contract}
                      onChange={e => handleNotificationChange('contract', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="contractAlerts" className="ml-2 text-sm text-gray-700">Contract status alerts</label>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center space-x-4">
                <button
                  className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold ${!settingsChanged ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleSaveSettings}
                  disabled={!settingsChanged}
                >
                  Save Settings
                </button>
                {saveSuccess && <span className="text-green-600 font-medium">Saved!</span>}
              </div>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Export</h3>
                <div className="space-y-3 flex flex-wrap gap-3">
                  <button onClick={handleExportLeads} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Export All Leads</button>
                  <button onClick={handleExportProperties} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Export Properties</button>
                  <button onClick={handleExportContracts} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">Export Contracts</button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Import</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Import leads from CSV file</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportLeads}
                    className="mb-2"
                    disabled={importing}
                  />
                  {importing && <div className="text-blue-600">Importing...</div>}
                  {importSuccess && <div className="text-green-600">{importSuccess}</div>}
                  {importError && <div className="text-red-600">{importError}</div>}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Backup</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-yellow-800 mb-1">Last backup: {lastBackup || 'Never'}</p>
                  </div>
                  <button onClick={handleBackup} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">Create Backup Now</button>
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex space-x-8 border-b border-gray-200 px-6">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 text-sm font-medium flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;