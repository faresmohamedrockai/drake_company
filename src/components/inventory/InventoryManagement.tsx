import React, { useState } from 'react';
import { Building2, MapPin, Users, Wrench } from 'lucide-react';
import PropertiesTab from './PropertiesTab';
import ProjectsTab from './ProjectsTab';
import ZonesTab from './ZonesTab';
import DevelopersTab from './DevelopersTab';

const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('properties');

  const tabs = [
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'projects', label: 'Projects', icon: Wrench },
    { id: 'zones', label: 'Zones', icon: MapPin },
    { id: 'developers', label: 'Developers', icon: Users }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage properties, projects, zones, and developers</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex space-x-2 sm:space-x-8 border-b border-gray-200 px-2 sm:px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {tabs.map((tab) => (
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