import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Activity,
  ListTodo,
  AlertCircle,
  PlayCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';

// تم إضافة getUsersStatus لجلب بيانات لوحة الصدارة
import { getLeads, getLogs, getMeetings, getUsers, getMyTasks, getTaskStatistics, getAllCalls, getAllVisits, populateLeadsWithCallsAndVisits, getDashboardData, getUsersStatus } from '../../queries/queries';
import { Lead, Log, Meeting, User as UserType, LeadStatus, Task, TaskStatistics } from '../../types';
import UserFilterSelect from '../leads/UserFilterSelect';
import LeadsSummaryCards from '../leads/LeadsSummaryCards';
import AgentLeaderboard from './AgentComponet';

interface DashboardProps {
  setCurrentView?: (view: string) => void;
}

// Custom hook for counting animation
const useCountAnimation = (endValue: number, duration: number = 2000, delay: number = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime - delay;
      const progress = Math.min(elapsed / duration, 1);

      // Smoother easing function for more fluid animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutCubic);

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [endValue, duration, delay]);

  return count;
};

// Custom hook for dashboard data processing
const useDashboardData = () => {
  const { user } = useAuth();
  
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 1000 * 60 * 5,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      const leadsData = await getLeads();
      // Try to populate with calls and visits data
      return await populateLeadsWithCallsAndVisits(leadsData);
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: getMeetings,
    staleTime: 1000 * 60 * 5,
  });
  const { data: dashoarddata } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<Log[]>({
    queryKey: ['logs'],
    queryFn: getLogs,
    staleTime: 1000 * 60 * 5,
  });

  const { data: myTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['myTasks'],
    queryFn: () => getMyTasks({ limit: 10 }),
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const { data: taskStatistics, isLoading: taskStatsLoading } = useQuery<TaskStatistics>({
    queryKey: ['taskStatistics'],
    queryFn: getTaskStatistics,
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const { data: allCalls = [] } = useQuery({
    queryKey: ['allCalls'],
    queryFn: getAllCalls,
    staleTime: 1000 * 60 * 5,
  });

  const { data: allVisits = [] } = useQuery({
    queryKey: ['allVisits'],
    queryFn: getAllVisits,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user performance data for the leaderboard
  const { data: userData = [], isLoading: userDataLoading } = useQuery({
    queryKey: ['userData'],
    queryFn: getUsersStatus,
    staleTime: 1000 * 60 * 5,
  });

  return {
    users,
    leads,
    meetings,
    logs,
    myTasks,
    taskStatistics,
    allCalls,
    dashoarddata,
    allVisits,
    userData, // <-- Expose the new data
    isLoading: leadsLoading || meetingsLoading || logsLoading || tasksLoading || taskStatsLoading || userDataLoading,
    user
  };
};

// Custom hook for lead filtering logic
const useLeadFiltering = (leads: Lead[], users: UserType[], user: any, selectedManager: UserType | null, selectedSalesRep: UserType | null) => {
  return useMemo(() => {
    let filteredLeads = leads;
    
    if (!user || !user.id || !user.role) return filteredLeads;

    if (user.role === 'sales_rep') {
      filteredLeads = leads.filter(lead => lead.owner?.id === user.id);
    } else if (user.role === 'team_leader') {
      if (selectedSalesRep) {
        // If a specific sales rep or team leader is selected, show only that person's leads
        filteredLeads = leads.filter(lead => lead.owner?.id === selectedSalesRep.id);
      } else {
        // Show team leader's own leads + their direct team members' leads
        // Get all sales reps under this team leader
        const directTeamMembers = users.filter(u => u.role === 'sales_rep' && u.teamLeaderId === user.id).map(u => u.id);
        
        // TEMPORARY: Show all leads for team leaders until team structure is fixed
        console.log('Team Leader Filtering Debug:', {
          teamLeader: user?.name || 'Unknown',
          teamLeaderId: user?.id || 'Unknown',
          directTeamMembers: directTeamMembers.length,
          totalLeads: leads.length
        });
        
        // For now, show all leads to ensure team leaders can see everything
        filteredLeads = leads;
      }
    } else if (user.role === 'sales_admin' || user.role === 'admin') {
      if (selectedSalesRep) {
        filteredLeads = leads.filter(lead => lead.owner?.id === selectedSalesRep.id);
      } else if (selectedManager) {
        const teamMembers = users.filter(u => u.role === 'sales_rep' && u.teamLeaderId === selectedManager.id).map(u => u.id);
        filteredLeads = leads.filter(lead => lead.owner?.id === selectedManager.id || teamMembers.includes(lead.owner?.id!));
      }
    }

    return filteredLeads;
  }, [leads, users, user, selectedManager, selectedSalesRep]);
};

// KPI Cards Component
const KPICards: React.FC<{ 
  totalProspects: number; 
  activeLeads: number; 
  todayMeetings: number; 
  followUpLeads: number; 
  t: (key: string) => string;
  navigate: (path: string) => void;
}> = ({ totalProspects, activeLeads, todayMeetings, followUpLeads, t, navigate }) => {
  const animatedTotalProspects = useCountAnimation(totalProspects, 1000, 0);
  const animatedActiveLeads = useCountAnimation(activeLeads, 1000, 100);
  const animatedTodayMeetings = useCountAnimation(todayMeetings, 1000, 200);
  const animatedFollowUpLeads = useCountAnimation(followUpLeads, 1000, 300);

  const kpiCards = [
    {
      title: t('totalLeads'),
      value: animatedTotalProspects.toString(),
      icon: Users,
      color: 'blue',
      description: t('overview'),
      onClick: () => navigate('/leads')
    },
    {
      title: t('activeLeads'),
      value: animatedActiveLeads.toString(),
      icon: TrendingUp,
      color: 'purple',
      description: t('overview'),
      onClick: () => navigate('/leads?filterType=status&filterValue=active')
    },
    {
      title: t('meetingScheduled'),
      value: animatedTodayMeetings.toString(),
      icon: Calendar,
      color: 'orange',
      description: t('overview'),
      info: true,
      onClick: () => navigate('/meetings')
    },
    {
      title: t('followUpLeads'),
      value: animatedFollowUpLeads.toString(),
      icon: CheckCircle,
      color: 'green',
      description: t('overview'),
      onClick: () => navigate('/leads?filterType=status&filterValue=follow_up')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {kpiCards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-xl shadow-lg hover:shadow-xl hover:bg-white/80 transition-all cursor-pointer group"
          onClick={card.onClick}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-full transition-colors bg-gradient-to-br from-white/60 to-white/30 ring-1 ring-white/60 shadow-sm`}>
              <card.icon className="h-6 w-6 text-blue-600" />
            </div>
            {card.info ? (
              <a
                href="#"
                className="text-xs text-blue-600 underline hover:text-blue-800"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate('/meetings');
                }}
              >
                {t('goToViewAllMeetings')}
              </a>
            ) : (
              <span className="text-sm font-medium text-gray-600">--</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
          <p className="text-sm text-gray-600">{card.description}</p>
        </motion.div>
      ))}
    </div>
  );
};

// Conversion Metrics Component
const ConversionMetrics: React.FC<{ 
  conversionRates: any; 
  totalProspects: number; 
  activeLeads: number; 
  t: (key: string) => string;
}> = ({ conversionRates, totalProspects, activeLeads, t }) => {
  const animatedLeadsToFollowUp = useCountAnimation(conversionRates.leadsToFollowUp, 1000, 400);
  const animatedCallCompletion = useCountAnimation(conversionRates.callCompletionRate, 1000, 500);
  const animatedMeetingSuccess = useCountAnimation(conversionRates.meetingsToDeals, 1000, 600);
  const animatedCallsToMeetings = useCountAnimation(conversionRates.callsToMeetings, 1000, 700);
  const animatedActiveLeadsRate = useCountAnimation(
    totalProspects ? Math.round((activeLeads / totalProspects) * 100) : 0,
    1000,
    800
  );

  const conversionMetrics = [
    {
      label: t('leadFollowUpRate'),
      value: `${animatedLeadsToFollowUp}%`,
      change: null
    },
    {
      label: t('callCompletionRate'),
      value: `${animatedCallCompletion}%`,
      change: null
    },
    {
      label: t('meetingSuccessRate'),
      value: `${animatedMeetingSuccess}%`,
      change: null
    },
    {
      label: t('callsToMeetingsRate'),
      value: `${animatedCallsToMeetings}%`,
      change: null
    },
    {
      label: t('activeLeadsRate'),
      value: `${animatedActiveLeadsRate}%`,
      change: null
    }
  ];

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <CheckCircle className="h-5 w-5 mr-2" />
        {t('conversionMetrics')}
      </h3>
      <p className="text-sm text-gray-600 mb-6">{t('monitorSalesPerformance')}</p>

      <div className="space-y-4">
        {conversionMetrics.map((metric, index) => {
          const percent = parseInt(metric.value.replace(/[^0-9]/g, ''));
          return (
            <div key={index} className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 mr-2">{metric.value}</span>
                  <span className="text-xs font-medium text-gray-600">--</span>
                </div>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: percent + '%' }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.15, ease: 'easeOut' }}
                  className="h-3 bg-blue-500 rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Conversion Chart Component
const ConversionChart: React.FC<{ 
  conversionRates: any; 
  t: (key: string) => string;
}> = ({ conversionRates, t }) => {
  const conversionChartData = [
    { stage: t('leadsToFollowUp'), value: conversionRates.leadsToFollowUp },
    { stage: t('callsToMeetings'), value: conversionRates.callsToMeetings },
    { stage: t('meetingsToDeals'), value: conversionRates.meetingsToDeals }
  ];

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-xl shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Target className="h-5 w-5 mr-2" />
        {t('conversionRates')}
      </h3>
      <p className="text-sm text-gray-600 mb-6">{t('visualizeSalesFunnel')}</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={conversionChartData} barCategoryGap={40}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 13 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} isAnimationActive>
            <LabelList dataKey="value" position="top" formatter={(v) => `${v}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Team Summary Component
const TeamSummary: React.FC<{ 
  metrics: { myLeads: number; teamLeads: number; totalLeads: number; teamMembers: number } | null;
  t: (key: string) => string;
  onViewMyLeads: () => void;
  onViewTeamLeads: () => void;
}> = ({ metrics, t, onViewMyLeads, onViewTeamLeads }) => {
  if (!metrics) return null;

  return (
    <motion.div
      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-blue-900 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {t('teamOverview') || 'Team Overview'}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewMyLeads}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
          >
            {t('viewMyLeads') || 'View My Leads'}
          </button>
          <button
            onClick={onViewTeamLeads}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          >
            {t('viewTeamLeads') || 'View Team Leads'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{metrics.totalLeads}</div>
          <div className="text-sm text-blue-700">{t('totalTeamLeads') || 'Total Team Leads'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{metrics.myLeads}</div>
          <div className="text-sm text-green-700">{t('yourLeads') || 'Your Leads'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{metrics.teamLeads}</div>
          <div className="text-sm text-purple-700">{t('directTeamMembersLeads') || "Direct Team Members' Leads"}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{metrics.teamMembers}</div>
          <div className="text-sm text-indigo-700">{t('directTeamMembers') || 'Direct Team Members'}</div>
        </div>
      </div>
    </motion.div>
  );
};

// Utility function to clean log descriptions by removing ID information
const cleanLogDescription = (description: string): string => {
  // Remove patterns like "id=59c7fa9e-5dd5-4352-bba0-87fd7f3070c2"
  let cleaned = description.replace(/,?\s*id=[a-f0-9-]+/gi, '');
  
  // Remove patterns like "Updated lead: id=..." from the beginning
  cleaned = cleaned.replace(/^Updated lead:\s*id=[a-f0-9-]+,?\s*/i, 'Updated lead: ');
  
  // Remove trailing commas and extra spaces
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
  
  // If the description starts with a comma, remove it
  cleaned = cleaned.replace(/^,\s*/, '');
  
  return cleaned;
};

// Tasks Card Component
const TasksCard: React.FC<{
  myTasks: Task[];
  taskStatistics: TaskStatistics | undefined;
  t: (key: string) => string;
  onNavigateToTasks: () => void;
}> = ({ myTasks, taskStatistics, t, onNavigateToTasks }) => {
  // Debug logging
  React.useEffect(() => {

  }, [myTasks, taskStatistics]);

  const formatDueDate = (dueDate: Date | {} | null) => {
    if (!dueDate) return '';
    
    try {
      let date: Date;
      
      if (dueDate instanceof Date) {
        date = dueDate;
      } else if (typeof dueDate === 'string') {
        date = new Date(dueDate);
      } else if (typeof dueDate === 'object' && 'toISOString' in dueDate) {
        date = new Date(dueDate as any);
      } else {
        return '';
      }

      if (isNaN(date.getTime())) return '';

      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return t('tasks:dashboard.today');
      if (diffDays === 1) return t('tasks:dashboard.tomorrow');
      if (diffDays < 0) return `${Math.abs(diffDays)} ${t('tasks:dashboard.daysOverdue')}`;
      if (diffDays <= 7) return `${diffDays} ${t('tasks:dashboard.daysLeft')}`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate task counts from myTasks data as fallback
  const pendingTasksCount = myTasks.filter(task => task.status === 'pending').length;
  const inProgressTasksCount = myTasks.filter(task => task.status === 'in_progress').length;
  const overdueTasksCount = myTasks.filter(task => {
    if (task.status === 'overdue') return true;
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
    
    try {
      let dueDate: Date;
      
      if (task.dueDate instanceof Date) {
        dueDate = task.dueDate;
      } else if (typeof task.dueDate === 'string') {
        dueDate = new Date(task.dueDate);
      } else if (typeof task.dueDate === 'object' && 'toISOString' in task.dueDate) {
        dueDate = new Date(task.dueDate as any);
      } else {
        return false;
      }

      if (isNaN(dueDate.getTime())) return false;

      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return dueDate.getTime() < today.getTime();
    } catch {
      return false;
    }
  }).length;

  const upcomingTasks = myTasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  ).slice(0, 5);

  const completedToday = myTasks.filter(task => {
    if (task.status !== 'completed' || !task.updatedAt) return false;
    try {
      let updatedDate: Date;
      
      if (task.updatedAt instanceof Date) {
        updatedDate = task.updatedAt;
      } else if (typeof task.updatedAt === 'string') {
        updatedDate = new Date(task.updatedAt);
      } else if (typeof task.updatedAt === 'object' && 'toISOString' in task.updatedAt) {
        updatedDate = new Date(task.updatedAt as any);
      } else {
        return false;
      }

      if (isNaN(updatedDate.getTime())) return false;

      const today = new Date();
      return updatedDate.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ListTodo className="h-5 w-5 mr-2" />
          {t('tasks:analysis.myTasks')}
        </h3>
        <button
          onClick={onNavigateToTasks}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          {t('viewAll') || 'View All'}
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {taskStatistics?.pendingTasks ?? pendingTasksCount}
          </div>
          <div className="text-xs text-blue-600">{t('tasks:dashboard.pending')}</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {taskStatistics?.inProgressTasks ?? inProgressTasksCount}
          </div>
          <div className="text-xs text-yellow-600">{t('tasks:dashboard.inProgress')}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completedToday}</div>
          <div className="text-xs text-green-600">{t('tasks:dashboard.completedToday')}</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {taskStatistics?.overdueTasks ?? overdueTasksCount}
          </div>
          <div className="text-xs text-red-600">{t('tasks:dashboard.overdue')}</div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {t('tasks:dashboard.upcomingTasks')}
        </h4>
        
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : myTasks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <ListTodo className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium mb-1">{t('noTasksYet') || 'No tasks yet'}</p>
            <p className="text-xs text-gray-400">{t('createFirstTask') || 'Create your first task to get started'}</p>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-300" />
            <p className="text-sm">{t('allTasksCompleted') || 'All tasks completed! Great job!'}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {(() => {
        const totalTasks = taskStatistics?.totalTasks ?? myTasks.length;
        const completedTasks = taskStatistics?.completedTasks ?? myTasks.filter(task => task.status === 'completed').length;
        
        if (totalTasks > 0) {
          return (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('overallProgress') || 'Overall Progress'}
                </span>
                <span className="text-sm text-gray-500">
                  {completedTasks} / {totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedTasks / totalTasks) * 100}%`
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round((completedTasks / totalTasks) * 100)}% {t('completed') || 'completed'}
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

// Recent Activity Component
const RecentActivity: React.FC<{ 
  logs: Log[]; 
  t: (key: string) => string;
}> = ({ logs, t }) => {
  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        {t('recentActivityFeed')}
      </h3>
      <p className="text-sm text-gray-600 mb-6">{t('latestActionsUpdates')}</p>

      <div className="space-y-4">
        {logs.slice(0, 10).map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start space-x-3"
          >
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {log.userName?.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{log.action}</p>
              <p className="text-xs text-gray-500">{
                (() => {
                  const cleanedDescription = cleanLogDescription(log.description);
                  return cleanedDescription.length > 100 ? cleanedDescription.substring(0, 100) + '...' : cleanedDescription;
                })()
              }</p>
              <p className="text-xs text-gray-500">{
                new Date(log.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }</p>
            </div>
          </motion.div>
        ))}
        {logs.length === 0 && (
          <p className="text-gray-500 text-center py-4">{t('noRecentActivities')}</p>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
  const { t } = useTranslation(['dashboard', 'common', 'tasks']);
  const navigate = useNavigate();
  
  // Get dashboard data
  const { users, leads, meetings, logs, myTasks, taskStatistics, allCalls, allVisits, isLoading, user,dashoarddata, userData } = useDashboardData();
  
  // Safety check - don't render if user is not available
  if (!user || !user.id || !user.role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">{t('common:loadingUserData')}</p>
        </div>
      </div>
    );
  }
  // Filter state
  const [selectedManager, setSelectedManager] = useState<UserType | null>(null);
  const [selectedSalesRep, setSelectedSalesRep] = useState<UserType | null>(null);
  const [showAllStatusCards, setShowAllStatusCards] = useState(false);

  // Filter leads based on user role and selections
  const filteredLeads = useLeadFiltering(leads, users, user, selectedManager, selectedSalesRep);

  // Calculate metrics
  const today = new Date().toISOString().split('T')[0];
  const totalProspects = filteredLeads.length;
  const activeLeads = filteredLeads.filter(l => 
    [LeadStatus.FRESH_LEAD, LeadStatus.FOLLOW_UP, LeadStatus.SCHEDULED_VISIT, LeadStatus.OPEN_DEAL,LeadStatus.VIP].includes(l.status)
  ).length;
  const todayMeetings = meetings.filter(m => m.date === today).length;
  const followUpLeads = filteredLeads.filter(l => l.status === LeadStatus.FOLLOW_UP).length;
 const { data: userDataAgend = [], isLoading: UserDataLOading, error: userDataError } = useQuery<UserStat[]>({
    queryKey: ['userStats'],
    queryFn: () => getUsersStatus(),

  });
  // Prepare leaderboard data by sorting userData
   const sortedLeaderboardData = useMemo(() => {
     if (!userDataAgend) return [];
     return [...userDataAgend].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
   }, [userData]);

  // Calculate conversion rates with actual data
  const calculateConversionRates = () => {
    // Get calls and visits from leads data (nested approach)
    let totalCalls = 0;
    let completedCalls = 0;
    let totalVisits = 0;
    let completedMeetings = 0;
    
    filteredLeads.forEach(lead => {
      // Count calls from leads data
      if (lead.calls && Array.isArray(lead.calls)) {
        totalCalls += lead.calls.length;

        
        completedCalls += lead.calls.filter((call: any) => 
           call.outcome !== 'Not Interested' 
        ).length;
      }
      // console.log(" Completed Calls = "+ completedCalls);
      
      // Count visits from leads data
      if (lead.meetings && Array.isArray(lead.meetings)) {
        totalVisits += lead?.meetings.length;
        completedMeetings += lead?.meetings.filter((meetings: any) => 
          meetings.status && (meetings.status === 'Completed')
        ).length;
      }
    });
    
    // Also try to get from global APIs as fallback
    const userLeadIds = filteredLeads.map(lead => lead.id);
    
    const globalCalls = allCalls.filter((call: any) => 
      userLeadIds.includes(call.leadId || call.lead_id)
    );
    
    const globalVisits = allVisits.filter((visit: any) => 
      userLeadIds.includes(visit.leadId || visit.lead_id)
    );
    
    // Use global data if no nested data found
    if (totalCalls === 0 && globalCalls.length > 0) {
      totalCalls = globalCalls.length;
      completedCalls = globalCalls.filter((call: any) => 
        call.outcome && call.outcome.toLowerCase() !== 'no answer' && call.outcome.toLowerCase() !== 'not answered'
      ).length;
    }
    
    if (totalVisits === 0 && globalVisits.length > 0) {
      totalVisits = globalVisits.length;
      completedMeetings = globalVisits.filter((meetings: any) => 
        meetings.status && (meetings.status === 'Completed')
      ).length;
    }
    
    const callCompletionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
    console.log(completedCalls);
    
    // Calculate calls to meetings rate properly
    // We need to count actual calls that led to meetings, not leads
    let callsResultingInMeetings = 0;
    
    // Method 1: Count calls from leads that have meetings
    const leadsWithMeetings = new Set(meetings.map(m => m.leadId).filter(Boolean));
    
    filteredLeads.forEach(lead => {
      if (leadsWithMeetings.has(lead.id)) {
        // Count calls for this lead since it has meetings
        if (lead.calls && Array.isArray(lead.calls)) {
          callsResultingInMeetings += lead.calls.length;
        } else {
          // Fallback to global calls for this lead
          const leadCalls = allCalls.filter((call: any) => 
            call.leadId === lead.id || call.lead_id === lead.id
          );
          callsResultingInMeetings += leadCalls.length;
        }
      }
    });
    
    // Alternative: If no meetings data, use successful call outcomes
    if (callsResultingInMeetings === 0) {
      filteredLeads.forEach(lead => {
        if (lead.calls && Array.isArray(lead.calls)) {
          callsResultingInMeetings += lead.calls.filter((call: any) => 
            call.outcome && (
              call.outcome.toLowerCase().includes('meeting') ||
              call.outcome.toLowerCase().includes('visit') ||
              call.outcome.toLowerCase().includes('appointment') ||
              call.outcome.toLowerCase() === 'Intersted' ||
              call.outcome.toLowerCase() === 'Follow Up Required'
            )
          ).length;
        }
      });
      
      // Also check global calls
      if (callsResultingInMeetings === 0) {
        const userLeadIds = filteredLeads.map(lead => lead.id);
        callsResultingInMeetings = allCalls.filter((call: any) => {
          const isUserCall = userLeadIds.includes(call.leadId || call.lead_id);
          const hasPositiveOutcome = call.outcome && (
            call.outcome.toLowerCase().includes('meeting') ||
            call.outcome.toLowerCase().includes('visit') ||
            call.outcome.toLowerCase().includes('appointment') ||
            call.outcome.toLowerCase() === 'interested' ||
            call.outcome.toLowerCase() === 'follow up'
          );
          return isUserCall && hasPositiveOutcome;
        }).length;
      }
    }
    
    const callsToMeetingsRate = totalCalls > 0 ? Math.round((callsResultingInMeetings / totalCalls) * 100) : 0;
    
    return {
      callCompletionRate,
      callsToMeetingsRate,
      totalCalls,
      totalVisits,
      completedCalls,
      completedMeetings,
      callsResultingInMeetings,
      leadsWithMeetingsCount: leadsWithMeetings.size
    };
  };

  const { callCompletionRate } = calculateConversionRates();
  
  // Debug logging for visits data
  // React.useEffect(() => {
  //   const leadsWithVisits = filteredLeads.filter(lead => lead.visits && lead.visits.length > 0);
    





  // }, [filteredLeads, allCalls, allVisits, totalCalls, totalVisits]);

  // Team leader specific metrics
  const teamLeaderMetrics = useMemo(() => {
    if (!user || user.role !== 'team_leader') return null;
    
    // If a specific person is selected, don't show team metrics
    if (selectedSalesRep) return null;
    
    // Get all sales reps under this team leader
  
    // TEMPORARY: Show all leads breakdown
    const myLeads = leads.filter(lead => lead.owner?.id === user.id);
    const teamLeads = leads.filter(lead => lead.owner?.id !== user.id);
    
    // console.log('Team Leader Metrics Debug:', {
    //   teamLeader: user?.name || 'Unknown',
    //   teamLeaderId: user?.id || 'Unknown',
    //   directTeamMembers: directTeamMembers.length,
    //   totalLeads: leads.length,
    //   myLeads: myLeads.length,
    //   teamLeads: teamLeads.length
    // });
    
    return {
      myLeads: myLeads.length,
      teamLeads: teamLeads.length,
      totalLeads: myLeads.length + teamLeads.length,
      teamMembers: users.length // Show all users as team members for now
    };
  }, [user, selectedSalesRep, leads, users]);

  // Conversion rates
  const conversionRates = {
    leadsToFollowUp: dashoarddata?.followUpRate,
    callsToMeetings:dashoarddata?.pendingCallsRate,
    meetingsToDeals: dashoarddata?.meetingSuccessRate ,
    callCompletionRate:  dashoarddata?.callCompletionRate,
  };

  // Prepare lead status cards data
  const dashboardCards = [
    { key: 'all', count: filteredLeads.length },
    { key: 'fresh_lead', count: filteredLeads.filter(lead => lead.status === LeadStatus.FRESH_LEAD).length },
    { key: 'cold_call', count: filteredLeads.filter(lead => lead.source === 'Cold Call').length },
    { key: 'follow_up', count: filteredLeads.filter(lead => lead.status === LeadStatus.FOLLOW_UP).length },
    { key: 'scheduled_visit', count: filteredLeads.filter(lead => lead.status === LeadStatus.SCHEDULED_VISIT).length },
    { key: 'open_deal', count: filteredLeads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length },
    { key: 'closed_deal', count: filteredLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length },
    { key: 'cancellation', count: filteredLeads.filter(lead => lead.status === LeadStatus.CANCELLATION).length },
    { key: 'no_answer', count: filteredLeads.filter(lead => lead.status === LeadStatus.NO_ANSWER).length },
    { key: 'not_intersted_now', count: filteredLeads.filter(lead => lead.status === LeadStatus.NOT_INTERSTED_NOW).length },
    { key: 'reservation', count: filteredLeads.filter(lead => lead.status === LeadStatus.RESERVATION).length },
  ];

  // Extract unique call outcomes and visit statuses
  const allCallOutcomes = Array.from(new Set(filteredLeads.flatMap(lead => 
    (lead.calls || []).map(call => call.outcome)
  ))).filter(Boolean);
  
  const allVisitStatuses = Array.from(new Set(filteredLeads.flatMap(lead => 
    (lead.visits || []).map(visit => visit.status)
  ))).filter(Boolean);

  const callOutcomeCards = allCallOutcomes.map(outcome => ({
    key: outcome,
    count: filteredLeads.filter(lead => 
      (lead.calls || []).some(call => call.outcome === outcome)
    ).length,
  }));

  const visitStatusCards = allVisitStatuses.map(status => ({
    key: status,
    count: filteredLeads.filter(lead => 
      (lead.visits || []).some(visit => visit.status === status)
    ).length,
  }));

  // Card click handlers
  const handleStatusCardClick = (key: string) => {
    navigate(`/leads?filterType=status&filterValue=${encodeURIComponent(key)}`);
  };

  const handleCallOutcomeCardClick = (key: string) => {
    navigate(`/leads?filterType=callOutcome&filterValue=${encodeURIComponent(key)}`);
  };

  const handleVisitStatusCardClick = (key: string) => {
    navigate(`/leads?filterType=visitStatus&filterValue=${encodeURIComponent(key)}`);
  };

  // Team leader quick actions
  const handleViewMyLeads = () => {
    navigate(`/leads?filterType=owner&filterValue=${user?.id}`);
  };

  const handleViewTeamLeads = () => {
    // Get all sales reps under this team leader
    const directTeamMembers = users.filter(u => u.role === 'sales_rep' && u.teamLeaderId === user?.id).map(u => u.id);
    
    navigate(`/leads?filterType=team&filterValue=${directTeamMembers.join(',')}`);
  };

  const handleNavigateToTasks = () => {
    if (setCurrentView) {
      setCurrentView('tasks');
    } else {
      navigate('/tasks');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 bg-transparent min-h-screen overflow-x-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="relative overflow-hidden mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 text-white">
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-10 h-48 w-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative p-6">
          <h1 className="text-3xl font-bold mb-2">
            {t('title')}, {user?.name}! 👋
          </h1>
          <p className="text-white/80">{t('overview')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards
        totalProspects={totalProspects}
        activeLeads={activeLeads}
        todayMeetings={todayMeetings}
        followUpLeads={followUpLeads}
        t={t}
        navigate={navigate}
      />
      
      {/* Agent Leaderboard */}
      <div className="mb-8">
        <AgentLeaderboard data={sortedLeaderboardData} />
        
      </div>

      {/* Show More/Less Toggle */}
      <div className="flex justify-end mb-6">
        {dashboardCards.length > 4 && (
          <button
            onClick={() => setShowAllStatusCards((v) => !v)}
            className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 text-base font-medium shadow-sm"
          >
            {showAllStatusCards ? (t('showLess') !== 'showLess' ? t('showLess') : 'Show Less') : (t('showMore') !== 'showMore' ? t('showMore') : 'Show More')}
          </button>
        )}
      </div>

      {/* User Filter Select */}
      {user && (
        <div className="mb-6">
          <UserFilterSelect
            currentUser={user as UserType}
            users={users}
            selectedManager={selectedManager}
            setSelectedManager={setSelectedManager}
            selectedSalesRep={selectedSalesRep}
            setSelectedSalesRep={setSelectedSalesRep}
          />
          
          {/* Filter Status Indicator */}
          {user.role === 'team_leader' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-sm text-blue-800">
                <Users className="h-4 w-4 mr-2" />
                {selectedSalesRep ? (
                  <span>
                    Showing leads for <strong>{selectedSalesRep.name}</strong>
                    {selectedSalesRep.role === 'team_leader' && <span className="text-blue-600 ml-1">(Team Leader)</span>}
                  </span>
                ) : (
                  <span>Showing leads for <strong>your team</strong> (your leads + your direct team members' leads)</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Summary for Team Leaders */}
      <TeamSummary 
        metrics={teamLeaderMetrics} 
        t={t} 
        onViewMyLeads={handleViewMyLeads}
        onViewTeamLeads={handleViewTeamLeads}
      />

      {/* Lead Summary Cards */}
      <LeadsSummaryCards
        statusCards={dashboardCards}
        callOutcomeCards={callOutcomeCards}
        visitStatusCards={visitStatusCards}
        onStatusCardClick={handleStatusCardClick}
        onCallOutcomeCardClick={handleCallOutcomeCardClick}
        onVisitStatusCardClick={handleVisitStatusCardClick}
        showAllStatusCards={showAllStatusCards}
        onShowAllStatusCardsToggle={() => setShowAllStatusCards((v) => !v)}
      />

      {/* Extra space */}
      <div className="mb-10" />

      {/* Tasks and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tasks Card */}
        <TasksCard 
          myTasks={myTasks}
          taskStatistics={taskStatistics}
          t={t}
          onNavigateToTasks={handleNavigateToTasks}
        />
        
        {/* Recent Activity */}
        <RecentActivity logs={logs} t={t} />
      </div>

      {/* Conversion Rates & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <ConversionChart conversionRates={conversionRates} t={t} />
        <ConversionMetrics 
          conversionRates={conversionRates} 
          totalProspects={totalProspects} 
          activeLeads={activeLeads} 
          t={t} 
        />
      </div>
    </motion.div>
  );
};

export default Dashboard;