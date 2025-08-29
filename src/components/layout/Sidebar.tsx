import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Users,
  Building2,
  Calendar,
  FileText,
  Settings,
  Building,
  Menu,
  BarChart3,
  Globe,
  CheckSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { User as UserType } from '../../types';
import UserProfileModal from '../settings/UserProfileModal';
import { useLocation, Link } from 'react-router-dom';

// Remove SidebarProps
// interface SidebarProps {
//   currentView: string;
//   setCurrentView: (view: string) => void;
// }

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { language, setLanguage, isRTL, rtlPosition } = useLanguage();
  const { t } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored === 'true';
  });
  const location = useLocation();

  // Language toggle removed from header in this design

  const sections = useMemo(() => ([
    {
      id: 'main',
      title: t('navigation.main', { defaultValue: 'Main' }),
      items: [
        { id: 'dashboard', label: t('navigation.dashboard'), icon: Home, path: '/dashboard' },
        { id: 'leads', label: t('navigation.leads'), icon: Users, path: '/leads' },
        { id: 'inventory', label: t('navigation.inventory'), icon: Building2, path: '/inventory' },
      ]
    },
    {
      id: 'workflows',
      title: t('navigation.workflows', { defaultValue: 'Workflows' }),
      items: [
        { id: 'meetings', label: t('navigation.meetings'), icon: Calendar, path: '/meetings' },
        { id: 'tasks', label: t('navigation.tasks'), icon: CheckSquare, path: '/tasks' },
        { id: 'contracts', label: t('navigation.contracts'), icon: FileText, path: '/contracts', adminOnly: true, salesAdminOnly: true },
      ]
    },
    {
      id: 'analytics',
      title: t('navigation.analytics', { defaultValue: 'Analytics' }),
      items: [
        { id: 'reports', label: t('navigation.reports'), icon: BarChart3, path: '/reports', adminOnly: true },
        { id: 'settings', label: t('navigation.settings'), icon: Settings, path: '/settings' },
      ]
    }
  ]), [t]);

  // Sync CSS var for layout width
  useEffect(() => {
    const width = isCollapsed ? '5rem' : '16rem';
    document.documentElement.style.setProperty('--sidebar-width', width);
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Sidebar content for reuse
  const sidebarContent = (

    <div className={`bg-white h-full flex flex-col ${rtlPosition('border-r', 'border-l')} border-gray-200 shadow-sm`} style={{ width: isCollapsed ? '5rem' : '16rem' }}>
      {/* Branding Header */}
      <div className={`px-4 py-3 ${rtlPosition('pl-5', 'pr-5')} border-b relative`}>
        <div className="absolute inset-y-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" style={{ [isRTL ? 'right' : 'left']: 0 as unknown as string }} />
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <div className="flex items-center min-w-0">
            {settings?.companyImage ? (
              <img
                src={settings.companyImage}
                alt="Company Logo"
                className={`h-8 w-8 rounded-md object-cover ring-1 ring-blue-100`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Building className={`h-8 w-8 text-blue-600 ${!isCollapsed ? rtlPosition('mr-3', 'ml-3') : ''} ${settings?.companyImage ? 'hidden' : ''}`} />
            {!isCollapsed && (() => {
              const companyName = settings?.companyName || 'Rockai Dev';
              return (
                <div className="min-w-0 mx-3">
                  <h1
                    className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[160px]"
                    title={companyName}
                  >
                    {companyName}
                  </h1>
                  <span className="block text-xs text-gray-500 truncate max-w-[160px]">CRM</span>
                </div>
              );
            })()}
          </div>
          {/* Language toggle at header corner */}

          {!isCollapsed && (
            <div className={`absolute top-2 ${rtlPosition('right-2', 'left-2')}`}>
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 transition-colors"
                aria-label="Toggle language"
                title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                <Globe className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        {sections.map((section, sectionIdx) => (
          <div key={section.id} className="mb-3">
            {/* Section title or divider */}
            {isCollapsed ? (
              sectionIdx > 0 ? (
                <div className="my-2 mx-2 h-px bg-gray-100" />
              ) : null
            ) : (
              <div className={`px-3 py-1 text-[11px] tracking-wider text-gray-400 ${rtlPosition('text-left', 'text-right')}`}>
                {section.title}
              </div>
            )}
            <ul className="mt-1 space-y-1">
              {section.items.map((item) => {
                // Check if user has access to this menu item
                const hasAccess = !item.adminOnly ||
                  user?.role === 'admin' ||
                  user?.role === 'sales_admin' ||
                  user?.role === 'team_leader';
                if (!hasAccess) return null;

                const active = location.pathname.startsWith(item.path);

                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => setSidebarOpen(false)}
                      className={`group w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''} ${isCollapsed ? 'justify-center px-0' : rtlPosition('px-3', 'px-3')} py-2 rounded-md transition-colors duration-150 ${active
                          ? `${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-blue-600 to-blue-500 text-white shadow-sm`
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-700'
                        }`}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isCollapsed ? '' : rtlPosition('mr-3', 'ml-3')} ${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}`} />
                      {!isCollapsed && (
                        <span className={`text-sm font-medium truncate ${isRTL ? 'text-right flex-1' : ''}`}>{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-3 py-3 border-t">
        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={() => setIsCollapsed(false)}
              className="h-10 w-10 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-sm"
              aria-label="Open menu"
              title="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm bg-blue-600 text-white flex items-center justify-center flex-shrink-0"
              onClick={() => setProfileModalOpen(true)}
              aria-label="Open profile"
            >
              {user?.image ? (
                <img src={user?.image} alt="avatar" className="object-cover w-full h-full" />
              ) : (
                <span className="font-semibold">{user?.name ? user.name.charAt(0) : '?'}</span>
              )}
            </button>
            <div className={`min-w-0 mx-3 flex-1`}>
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.role}</div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
              aria-label="Collapse sidebar"
              title="Collapse"
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        )}
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
        className={`md:hidden fixed top-4 z-50 bg-white p-2 rounded-full shadow-lg border border-gray-200 transition-all duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${isRTL ? 'left-4' : 'right-4'}`}
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
          <div className={`relative z-50 ${isRTL ? 'ml-auto' : ''}`} style={{ width: isCollapsed ? '5rem' : '16rem' }}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-30 ${rtlPosition('md:left-0', 'md:right-0')}`}
        style={{ width: 'var(--sidebar-width, 16rem)' }}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;