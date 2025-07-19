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
import { getContracts, getDevelopers, getLeads, getLogs, getMeetings, getProjects, getProperties, getUsers, getZones } from './queries/queries';

// Custom hook for managing persisted view state with URL sync
const usePersistedView = (defaultView: string) => {
  const [currentView, setCurrentView] = useState(() => {
    // First try to get from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlView = urlParams.get('page');

    if (urlView && ['dashboard', 'leads', 'inventory', 'meetings', 'contracts', 'reports', 'settings'].includes(urlView)) {
      return urlView;
    }

    // Then try to get the saved view from sessionStorage
    const savedView = sessionStorage.getItem('propai-current-view');
    return savedView || defaultView;
  });

  // Update URL and sessionStorage whenever currentView changes
  useEffect(() => {
    // Update URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentView);
    window.history.replaceState({}, '', url.toString());

    // Save to sessionStorage
    sessionStorage.setItem('propai-current-view', currentView);
  }, [currentView]);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = urlParams.get('page');

      if (urlView && ['dashboard', 'leads', 'inventory', 'meetings', 'contracts', 'reports', 'settings'].includes(urlView)) {
        setCurrentView(urlView);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return [currentView, setCurrentView] as const;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const { rtlMargin } = useLanguage();


  const [currentView, setCurrentView] = usePersistedView('dashboard');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated) {
      queryClient.prefetchQuery({
        queryKey: ['developers'],
        queryFn: () => getDevelopers(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['zones'],
        queryFn: () => getZones(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['leads'],
        queryFn: () => getLeads(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['users'],
        queryFn: () => getUsers(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['properties'],
        queryFn: () => getProperties(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['meetings'],
        queryFn: () => getMeetings(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['contracts'],
        queryFn: () => getContracts(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['logs'],
        queryFn: () => getLogs(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
      queryClient.prefetchQuery({
        queryKey: ['projects'],
        queryFn: () => getProjects(),
        staleTime: 1000 * 60 * 5 // 5 minutes
      });
    }
  }, [isAuthenticated]);


  // Update page title with company name
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
      <main className={`flex-1 overflow-y-auto transition-all ${rtlMargin('md:ml-80', 'md:mr-80')}`}>
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