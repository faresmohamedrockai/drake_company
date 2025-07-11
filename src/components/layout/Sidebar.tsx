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
  BarChart3
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
        <div className="flex items-center mb-4 justify-between group relative">
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
          {/* Dropdown on hover (desktop), always visible on mobile */}
          <div className="absolute right-0 top-16 z-20 hidden group-hover:block md:block">
            <div className="bg-white shadow-lg rounded-lg py-2 px-4 min-w-[180px] border border-gray-100 flex flex-row items-center justify-between gap-2">
              <button
                onClick={logout}
                className="text-left px-2 py-2 text-red-600 hover:bg-red-50 rounded transition-colors font-semibold"
                style={{ flex: 1 }}
              >
                Logout
              </button>
              <button
                onClick={() => setProfileModalOpen(true)}
                className="text-right px-2 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors font-semibold"
                style={{ flex: 1 }}
              >
                Profile
              </button>
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
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg border border-gray-200"
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