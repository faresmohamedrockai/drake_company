import React, { useEffect } from 'react';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import axiosInterceptor from '../axiosInterceptor/axiosInterceptor';
import { Developer, Zone } from './types';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { rtlMargin } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const companyName = settings?.companyName || 'Propai';
    document.title = `${companyName} - Real Estate CRM`;
  }, [settings?.companyName]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto transition-all ${rtlMargin('md:ml-64', 'md:mr-64')}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="h-full"
          >
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsList />} />
              <Route path="/inventory" element={<InventoryManagement />} />
              <Route path="/meetings" element={<MeetingsManagement />} />
              <Route path="/contracts" element={<ContractsManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const queryClient = new QueryClient();

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <SettingsProvider>
              <QueryClientProvider client={queryClient}>
                <AppContent />
                <ToastContainer />
              </QueryClientProvider>
            </SettingsProvider>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;