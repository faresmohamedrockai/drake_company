import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTranslation } from 'react-i18next';
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { motion } from 'framer-motion';

import { useQuery } from '@tanstack/react-query';
import { getLeads, getLogs, getMeetings } from '../../queries/queries';
import { Lead, Log, Meeting } from '../../types';
import { Activity } from '../../types';

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

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
  const { user } = useAuth();
  const { getStatistics, getPreviousStats, getChangeForStat, activities, leads, users } = useData();
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  
  const stats = getStatistics(user ? { name: user.name, role: user.role, teamId: user.teamId } : undefined);
  const prevStats = getPreviousStats ? getPreviousStats() || stats : stats; // fallback to current if none


  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: getLeads,
    staleTime: 1000 * 60 * 5,
  });
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: getMeetings,
    staleTime: 1000 * 60 * 5,
  });
  const { data: logs = [], isLoading: logsLoading } = useQuery<Log[]>({
    queryKey: ['logs'],
    queryFn: getLogs,
    staleTime: 1000 * 60 * 5,
  });

  const today = new Date().toISOString().split('T')[0];
  const totalProspects = leads.length;
  const activeLeads = leads.filter(l => ['fresh_lead', 'follow_up', 'scheduled_visit', 'open_deal'].includes(l.status)).length;
  const todayMeetings = meetings.filter(m => m.date === today).length;
  const followUpLeads = leads.filter(l => l.status === 'follow_up').length;

  // Conversion rates (customize as needed)
  const conversionRates = {
    leadsToFollowUp: totalProspects ? Math.round((followUpLeads / totalProspects) * 100) : 0,
    callsToMeetings: 0, // Add logic if you have call data
    meetingsToDeals: meetings.length ? Math.round((meetings.filter(m => m.status === 'Completed').length / meetings.length) * 100) : 0,
    callCompletionRate: 0, // Add logic if you have call data
  };

  // Animated counts for KPI cards
  const animatedTotalProspects = useCountAnimation(totalProspects, 1000, 0);
  const animatedActiveLeads = useCountAnimation(activeLeads, 1000, 100);
  const animatedTodayMeetings = useCountAnimation(todayMeetings, 1000, 200);
  const animatedFollowUpLeads = useCountAnimation(followUpLeads, 1000, 300);

  const kpiCards = [
    {
      title: t('totalLeads'),
      value: animatedTotalProspects.toString(),
      change: null, // You can implement change logic if you want
      icon: Users,
      description: t('overview')
    },
    {
      title: t('activeLeads'),
      value: animatedActiveLeads.toString(),
      change: null,
      icon: TrendingUp,
      description: t('overview')
    },
    {
      title: t('meetingScheduled'),
      value: animatedTodayMeetings.toString(),
      change: null,
      icon: Calendar,
      description: t('overview'),
      info: true
    },
    {
      title: t('followUpLeads'),
      value: animatedFollowUpLeads.toString(),
      change: null,
      icon: CheckCircle,
      description: t('overview')
    }
  ];

  // Animated conversion rates
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

  // Prepare data for Recharts
  const conversionChartData = [
    { stage: t('leadsToFollowUp'), value: conversionRates.leadsToFollowUp },
    { stage: t('callsToMeetings'), value: conversionRates.callsToMeetings },
    { stage: t('meetingsToDeals'), value: conversionRates.meetingsToDeals }
  ];

  // --- LEADS SUMMARY CARDS LOGIC (copied and adapted from LeadsList) ---
  // Helper to add spaces to camelCase or PascalCase
  function addSpacesToCamelCase(text: string) {
    return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\b([A-Z])([A-Z]+)\b/g, '$1 $2');
  }
  // Helper to get translated label for cards, fallback to humanized label
  function getCardLabel(key: string, t: (k: string) => string) {
    const translated = t(key);
    return translated !== key ? translated : addSpacesToCamelCase(key);
  }
  // Status cards
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedSalesRep, setSelectedSalesRep] = useState('');
  // Filter leads based on user role and selected manager/sales rep
  let filteredLeads = leads;
  if (user?.role === 'sales_rep') {
    filteredLeads = leads.filter(lead => lead.assignedTo === user.name);
  } else if (user?.role === 'team_leader') {
    const salesReps = users.filter(u => u.role === 'sales_rep' && u.teamId === user.name).map(u => u.name);
    filteredLeads = leads.filter(lead => lead.assignedTo === user.name || salesReps.includes(lead.assignedTo));
    if (selectedSalesRep) {
      filteredLeads = filteredLeads.filter(lead => lead.assignedTo === selectedSalesRep);
    }
  } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
    if (selectedManager) {
      const salesReps = users.filter(u => u.role === 'sales_rep' && u.teamId === selectedManager).map(u => u.name);
      filteredLeads = leads.filter(lead => lead.assignedTo === selectedManager || salesReps.includes(lead.assignedTo));
    }
    if (selectedSalesRep) {
      filteredLeads = filteredLeads.filter(lead => lead.assignedTo === selectedSalesRep);
    }
  }
  // Use filteredLeads for dashboardCards, callOutcomeCards, visitStatusCards
  const dashboardCards = [
    { key: 'all', count: filteredLeads.length },
    { key: 'duplicate', count: filteredLeads.filter((lead, idx, arr) => arr.findIndex(l => (l.phone && l.phone === lead.phone) || (l.email && l.email === lead.email)) !== idx).length },
    { key: 'fresh_lead', count: filteredLeads.filter(lead => lead.status === 'fresh_lead').length },
    { key: 'cold_call', count: filteredLeads.filter(lead => lead.source === 'Cold Call').length },
    { key: 'follow_up', count: filteredLeads.filter(lead => lead.status === 'follow_up').length },
    { key: 'scheduled_visit', count: filteredLeads.filter(lead => lead.status === 'scheduled_visit').length },
    { key: 'open_deal', count: filteredLeads.filter(lead => lead.status === 'open_deal').length },
    { key: 'closed_deal', count: filteredLeads.filter(lead => lead.status === 'closed_deal').length },
    { key: 'cancellation', count: filteredLeads.filter(lead => lead.status === 'cancellation').length },
    { key: 'no_answer', count: filteredLeads.filter(lead => lead.status === 'no_answer').length },
    { key: 'not_interested_now', count: filteredLeads.filter(lead => lead.status === 'not_interested_now').length },
    { key: 'reservation', count: filteredLeads.filter(lead => lead.status === 'reservation').length },
  ];
  const compactCards = dashboardCards.slice(0, 4);
  const fullCards = dashboardCards;

  // Extract unique call outcomes and visit statuses
  const allCallOutcomes = Array.from(new Set(filteredLeads.flatMap(lead => (lead.calls || []).map(call => call.outcome)))).filter(Boolean);
  const allVisitStatuses = Array.from(new Set(filteredLeads.flatMap(lead => (lead.visits || []).map(visit => visit.status)))).filter(Boolean);

  // Count leads for each outcome/status (always from all leads)
  const callOutcomeCards = allCallOutcomes.map(outcome => ({
    key: outcome,
    count: filteredLeads.filter(lead => (lead.calls || []).some(call => call.outcome === outcome)).length,
  }));
  const visitStatusCards = allVisitStatuses.map(status => ({
    key: status,
    count: filteredLeads.filter(lead => (lead.visits || []).some(visit => visit.status === status)).length,
  }));

  // --- END LEADS SUMMARY CARDS LOGIC ---

  // Card click handlers for navigation
  const handleStatusCardClick = (key: string) => {
    navigate(`/leads?filterType=status&filterValue=${encodeURIComponent(key)}`);
  };
  const handleCallOutcomeCardClick = (key: string) => {
    navigate(`/leads?filterType=callOutcome&filterValue=${encodeURIComponent(key)}`);
  };
  const handleVisitStatusCardClick = (key: string) => {
    navigate(`/leads?filterType=visitStatus&filterValue=${encodeURIComponent(key)}`);
  };

  const [showAllStatusCards, setShowAllStatusCards] = useState(false);


  return (
    <motion.div
      className="p-6 bg-gray-50 min-h-screen"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('title')}, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">{t('overview')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, index) => {
          let changeType = 'neutral';
          if (typeof card.change === 'number') {
            if (card.change > 0) changeType = 'increase';
            else if (card.change < 0) changeType = 'decrease';
          }
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${index === 0 ? 'bg-blue-100' :
                  index === 1 ? 'bg-purple-100' :
                    index === 2 ? 'bg-orange-100' :
                      index === 3 ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                  <card.icon className={`h-6 w-6 ${index === 0 ? 'text-blue-600' :
                    index === 1 ? 'text-purple-600' :
                      index === 2 ? 'text-orange-600' :
                        index === 3 ? 'text-green-600' : 'text-gray-600'
                    }`} />
                </div>
                {card.info ? (
                  <a
                    href="#"
                    className="text-xs text-blue-600 underline hover:text-blue-800 cursor-pointer"
                    onClick={e => {
                      e.preventDefault();
                      if (setCurrentView) {
                        setCurrentView('meetings');
                      }
                    }}
                  >
                    {t('goToViewAllMeetings')}
                  </a>
                ) : (
                  <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-green-600' :
                    changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                    {card.change !== null && card.change !== undefined ? <>{card.change > 0 && '+'}{card.change}%</> : '--'}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Toggle for Status Cards */}
      <div className="flex justify-end mb-6"> {/* Increased mb-2 to mb-6 for more space below cards */}
        {dashboardCards.length > 4 && (
          <button
            onClick={() => setShowAllStatusCards((v) => !v)}
            className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 text-base font-medium shadow-sm"
          >
            {showAllStatusCards ? (t('showLess') !== 'showLess' ? t('showLess') : 'Show Less') : (t('showMore') !== 'showMore' ? t('showMore') : 'Show More')}
          </button>
        )}
      </div>
      {/* User Filter Select for Manager/Sales Rep */}
      {user && (
        <UserFilterSelect
          currentUser={user}
          users={users as import('../../contexts/AuthContext').User[]}
          selectedManager={selectedManager}
          setSelectedManager={setSelectedManager}
          selectedSalesRep={selectedSalesRep}
          setSelectedSalesRep={setSelectedSalesRep}
        />
      )}
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

      {/* Add extra space between cards and Conversion Rates & Metrics */}
      <div className="mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Conversion Rates Chart */}
        <motion.div
          className="bg-white p-6 rounded-lg shadow-md"
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

        {/* Conversion Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {t('conversionMetrics')}
          </h3>
          <p className="text-sm text-gray-600 mb-6">{t('monitorSalesPerformance')}</p>

          <div className="space-y-4">
            {conversionMetrics.map((metric, index) => {
              let changeType = 'neutral';
              if (typeof metric.change === 'number') {
                if (metric.change > 0) changeType = 'increase';
                else if (metric.change < 0) changeType = 'decrease';
              }
              // Extract numeric value for progress bar
              const percent = parseInt(metric.value.replace(/[^0-9]/g, ''));
              return (
                <div key={index} className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-gray-900 mr-2">{metric.value}</span>
                      <span className={`text-xs font-medium ${changeType === 'increase' ? 'text-green-600' :
                        changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {metric.change !== null && metric.change !== undefined ? <>{metric.change > 0 && '+'}{metric.change}%</> : '--'}
                      </span>
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
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          {t('recentActivityFeed')}
        </h3>
        <p className="text-sm text-gray-600 mb-6">{t('latestActionsUpdates')}</p>

        <div className="space-y-4">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {log.userName?.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{log.action}</p>
                <p className="text-xs text-gray-500">{log.description}</p>
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
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-500 text-center py-4">{t('noRecentActivities')}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;