import React, { useState } from 'react';
import { Building2, MapPin, Users, Wrench } from 'lucide-react';
import PropertiesTab from './PropertiesTab';
import ProjectsTab from './ProjectsTab';
import ZonesTab from './ZonesTab';
import DevelopersTab from './DevelopersTab';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage(); // Add language context
  const { t } = useTranslation('inventory');
  const [activeTab, setActiveTab] = useState('properties');

  // Role-based access control
  const canManageInventory = user?.role === 'admin' || user?.role === 'sales_admin' || user?.role === 'team_leader';
  const canViewInventory = user?.role === 'sales_rep' || canManageInventory;

  const tabs = [
    { id: 'properties', label: t('properties'), icon: Building2, adminOnly: false },
    { id: 'projects', label: t('projects'), icon: Wrench, adminOnly: false },
    { id: 'zones', label: t('zones'), icon: MapPin, adminOnly: true },
    { id: 'developers', label: t('developers'), icon: Users, adminOnly: true }
  ];

  // Filter tabs based on user role
  const accessibleTabs = tabs.filter(tab => 
    !tab.adminOnly || canManageInventory
  );

  // Function to get the appropriate title based on active tab and language
  const getTitle = () => {
    const titles = {
      properties: {
        en: 'Properties',
        ar: 'العقارات'
      },
      projects: {
        en: 'Projects',
        ar: 'المشاريع'
      },
      zones: {
        en: 'Zones',
        ar: 'المناطق'
      },
      developers: {
        en: 'Developers',
        ar: 'المطورين'
      }
    };

    const currentTitle = titles[activeTab as keyof typeof titles];
    return currentTitle ? currentTitle[language as keyof typeof currentTitle] : 'Inventory';
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h1>
        <p className="text-gray-600">
          {canManageInventory ? t('description') : t('viewOnlyDescription')}
        </p>
        {!canManageInventory && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{t('viewOnlyMode')}:</strong> {t('viewOnlyMessage')}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex space-x-2 sm:space-x-8 border-b border-gray-200 px-2 sm:px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {accessibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-max py-3 px-3 sm:py-4 sm:px-2 text-sm sm:text-base font-medium flex items-center space-x-2 transition-colors duration-150 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 bg-transparent'
              }`}
            >
              <tab.icon className="h-5 w-5 sm:h-4 sm:w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'properties' && <PropertiesTab />}
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'zones' && <ZonesTab />}
          {activeTab === 'developers' && <DevelopersTab />}
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;