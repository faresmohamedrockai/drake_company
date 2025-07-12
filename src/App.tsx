import React, { useState, useEffect } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import LeadsList from './components/leads/LeadsList';
import InventoryManagement from './components/inventory/InventoryManagement';
import MeetingsManagement from './components/meetings/MeetingsManagement';
import ContractsManagement from './components/contracts/ContractsManagement';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import { AnimatePresence, motion } from 'framer-motion';
import './i18n';
import './styles/rtl.css';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { isRTL, rtlMargin } = useLanguage();
  const [currentView, setCurrentView] = useState('dashboard');

  // Update page title with company name
  useEffect(() => {
    const companyName = settings?.companyName || 'Propai';
    document.title = `${companyName} - Real Estate CRM`;
  }, [settings?.companyName]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} />;
      case 'leads':
        return <LeadsList />;
      case 'inventory':
        return <InventoryManagement />;
      case 'meetings':
        return <MeetingsManagement />;
      case 'contracts':
        return <ContractsManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className={`flex-1 overflow-y-auto transition-all ${rtlMargin('md:ml-64', 'md:mr-64')}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <DataProvider>
        <AuthProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </AuthProvider>
      </DataProvider>
    </LanguageProvider>
  );
};

export default App;