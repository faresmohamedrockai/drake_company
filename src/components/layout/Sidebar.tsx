import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Users, 
  Building2, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Building
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Building2 },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="bg-white shadow-lg h-screen w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center">
          <Building className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-xl font-bold text-gray-900">Propai</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
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
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name.charAt(0)}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 text-sm font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md ml-4"
            style={{ minWidth: 0 }}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;