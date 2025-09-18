import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './components/auth/Login';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import LeadsList from './components/leads/LeadsList';
import InventoryManagement from './components/inventory/InventoryManagement';
import MeetingsManagement from './components/meetings/MeetingsManagement';
import TasksManagement from './components/tasks/TasksManagement';
import ContractsManagement from './components/contracts/ContractsManagement';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import { AnimatePresence, motion } from 'framer-motion';
import './i18n';
import './styles/rtl.css';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import {
  getNotificationData, markNotificationAsSeen, getDevelopers, getZones, getLeads,
  getUsers, getProperties, getMeetings, getContracts, getLogs, getProjects, getTaskStatistics
} from './queries/queries';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './components/notification/NotificationBell';
import { NotificationModal } from './components/notification/NotificationModal';
import { Notification } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { settings } = useSettings();
  const { rtlMargin } = useLanguage();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: notifications, dataUpdatedAt } = useQuery<Notification[]>({
    queryKey: ['notificationData'],
    queryFn: getNotificationData,
    staleTime: 1000 * 60 * 5,
    enabled: !!isAuthenticated,
    refetchInterval: 1000 * 30,
  });

  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const unreadCount = notifications?.filter(n => !n.isSeen).length || 0;

  useEffect(() => {
    const lastSeenTimestamp = parseInt(localStorage.getItem('lastNotificationTimestamp') || '0', 10);
    if (dataUpdatedAt && dataUpdatedAt > lastSeenTimestamp && unreadCount > 0) {
      setHasNewNotifications(true);
    }
  }, [dataUpdatedAt, unreadCount]);

  const markAsSeenMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsSeen(notificationId),
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<Notification[]>(['notificationData'], (oldData) => {
        if (!oldData) return [];
        return oldData.map(n => n.id === updatedNotification.id ? { ...n, isSeen: true } : n);
      });
    },
    onError: (error) => {
      console.error("Failed to mark notification as seen:", error);
    }
  });

  const handleBellClick = () => {
    if (dataUpdatedAt) {
      localStorage.setItem('lastNotificationTimestamp', dataUpdatedAt.toString());
    }
    setHasNewNotifications(false);
    setIsModalOpen(true);
  };

  const handleNotificationItemClick = (notification: Notification) => {
    if (!notification.isSeen) {
      markAsSeenMutation.mutate(notification.id);
    }
    setIsModalOpen(false);

    const route = notification.notificationData?.route;
    if (route) {
      const routesMap: Record<string, string> = {
        leads: "/leads",
        "meeting-view": "/meetings",
        tasks: "/tasks",
      };
      
      const targetRouteKey = Object.keys(routesMap).find(key => route.includes(key));
      const targetRoute = targetRouteKey ? routesMap[targetRouteKey] : null;

      if (targetRoute) {
        navigate(targetRoute);
      } else {
        console.warn(`No route mapping found for: ${route}`);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ['notificationData'] });
      
      queryClient.prefetchQuery({ queryKey: ['developers'], queryFn: getDevelopers, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['zones'], queryFn: getZones, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['leads'], queryFn: getLeads, staleTime: 1000 * 60 * 5 });
      if (user?.role === 'admin' || user?.role === 'sales_admin') {
        queryClient.prefetchQuery({ queryKey: ['users'], queryFn: getUsers, staleTime: 1000 * 60 * 5 });
      }
      queryClient.prefetchQuery({ queryKey: ['properties'], queryFn: getProperties, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['meetings'], queryFn: getMeetings, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['contracts'], queryFn: getContracts, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['logs'], queryFn: getLogs, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['projects'], queryFn: getProjects, staleTime: 1000 * 60 * 5 });
      queryClient.prefetchQuery({ queryKey: ['taskStatistics'], queryFn: getTaskStatistics, staleTime: 1000 * 60 * 5 });
    }
  }, [isAuthenticated, queryClient, user?.role]);

  useEffect(() => {
    const companyName = settings?.companyName || 'Propai';
    document.title = `${companyName} - Real Estate CRM`;
  }, [settings?.companyName]);

  useEffect(() => {
    const companyImage = import.meta.env.VITE_COMPANY_IMAGE;
    if (companyImage) {
      const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
      existingFavicons.forEach(favicon => favicon.remove());
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/x-icon';
      favicon.href = companyImage;
      document.head.appendChild(favicon);
    }
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <Sidebar />
      <main className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden transition-all relative ${rtlMargin('md:ml-[var(--sidebar-width,16rem)]', 'md:mr-[var(--sidebar-width,16rem)]')}`}>
        <div className={`hidden md:block absolute inset-y-0 ${rtlMargin('left-0', 'right-0')} w-px bg-gray-200`} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="h-full"
          >
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<LeadsList />} />
              <Route path="/inventory" element={<InventoryManagement />} />
              <Route path="/meetings" element={<MeetingsManagement />} />
              <Route path="/tasks" element={<TasksManagement />} />
              <Route path="/contracts" element={<ContractsManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <NotificationBell
        hasNew={hasNewNotifications}
        onClick={handleBellClick}
        notificationCount={unreadCount}
      />

      <AnimatePresence>
        {isModalOpen && (
          <NotificationModal
            notifications={notifications || []}
            onClose={() => setIsModalOpen(false)}
            onItemClick={handleNotificationItemClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  const queryClient = new QueryClient();

  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <QueryClientProvider client={queryClient}>
              <AppContent />
              <ToastContainer />
            </QueryClientProvider>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;