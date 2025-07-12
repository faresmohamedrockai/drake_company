import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { 
  Home, 
  Users, 
  Building2, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Building,
  Menu,
  BarChart3,
  Globe
} from 'lucide-react';
import { User as UserType } from '../../types';
import UserProfileModal from '../settings/UserProfileModal';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Building2 },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Sidebar content for reuse
  const sidebarContent = (
    <div className="bg-white shadow-lg h-full w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {settings?.companyImage ? (
              <img 
                src={settings.companyImage} 
                alt="Company Logo" 
                className="h-8 w-8 rounded-lg mr-3 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Building className={`h-8 w-8 text-blue-600 mr-3 ${settings?.companyImage ? 'hidden' : ''}`} />
            <h1 className="text-xl font-bold text-gray-900">{settings?.companyName || 'Propai'}</h1>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleLanguage}
              className="relative inline-flex h-9 w-20 items-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl"
              role="switch"
              aria-checked={language === 'ar'}
              aria-label="Toggle language"
            >
              <span className="sr-only">Toggle language</span>
              <span
                className={`inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                  language === 'ar' ? 'translate-x-12' : 'translate-x-1'
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-blue-600" />
              </span>
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <span className={`text-xs font-bold transition-all duration-300 ${
                  language === 'en' ? 'text-blue-100 opacity-0' : 'text-white opacity-100'
                }`}>EN</span>
                <span className={`text-xs font-bold transition-all duration-300 ${
                  language === 'ar' ? 'text-blue-100 opacity-0' : 'text-white opacity-100'
                }`}>عربي</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            // Check if user has access to this menu item
            const hasAccess = !item.adminOnly || 
              user?.role === 'Admin' || 
              user?.role === 'Sales Admin' || 
              user?.role === 'Team Leader';
            
            if (!hasAccess) return null;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false); // close sidebar on mobile after click
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center">
            <button
              className="h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl border-4 border-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 relative overflow-hidden"
              onClick={() => setProfileModalOpen(true)}
              aria-label="Open profile"
            >
              {(user as UserType)?.avatar ? (
                <img src={(user as UserType)?.avatar} alt="avatar" className="object-cover w-full h-full rounded-full" />
              ) : (
                user?.name ? user.name.charAt(0) : '?' 
              )}
            </button>
            <div className="ml-3">
              <div className="text-base font-semibold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
          </div>

        </div>
      </div>
      {/* Profile Modal */}
      {profileModalOpen && (
        <UserProfileModal user={user as UserType} onClose={() => setProfileModalOpen(false)} />
      )}
    </div>
  );

  return (
    <>
      {/* Hamburger menu for mobile */}
      <button
        className={`md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6 text-blue-600" />
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
          {/* Sidebar */}
          <div className="relative z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-30">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;