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
  const { getStatistics, getPreviousStats, getChangeForStat, activities } = useData();
  const { t } = useTranslation('dashboard');
  
  const stats = getStatistics(user ? { name: user.name, role: user.role, teamId: user.teamId } : undefined);
  const prevStats = getPreviousStats ? getPreviousStats() || stats : stats; // fallback to current if none

  // Get real number of follow up leads
  const followUpLeads = typeof stats.totalProspects === 'number' && stats.totalProspects > 0
    ? Math.round((stats.conversionRates.leadsToFollowUp / 100) * stats.totalProspects)
    : 0;

  // Animated counts for KPI cards
  const animatedTotalProspects = useCountAnimation(stats.totalProspects, 1000, 0);
  const animatedActiveLeads = useCountAnimation(stats.activeLeads, 1000, 100);
  const animatedTodayMeetings = useCountAnimation(stats.todayMeetings, 1000, 200);
  const animatedFollowUpLeads = useCountAnimation(followUpLeads, 1000, 300);

  const kpiCards = [
    {
      title: t('totalLeads'),
      value: animatedTotalProspects.toString(),
      change: getChangeForStat(stats.totalProspects, prevStats.totalProspects),
      icon: Users,
      description: t('overview')
    },
    {
      title: t('activeLeads'),
      value: animatedActiveLeads.toString(),
      change: getChangeForStat(stats.activeLeads, prevStats.activeLeads),
      icon: TrendingUp,
      description: t('overview')
    },
    {
      title: t('meetingScheduled'),
      value: animatedTodayMeetings.toString(),
      change: getChangeForStat(stats.todayMeetings, prevStats.todayMeetings),
      icon: Calendar,
      description: t('overview'),
      info: true
    },
    {
      title: t('followUpLeads'),
      value: animatedFollowUpLeads.toString(),
      change: getChangeForStat(followUpLeads, Math.round((prevStats.conversionRates.leadsToFollowUp / 100) * prevStats.totalProspects)),
      icon: CheckCircle,
      description: t('overview')
    }
  ];

  const conversionRates = [
    { stage: t('leadsToFollowUp'), rate: stats.conversionRates.leadsToFollowUp, color: 'bg-blue-500' },
    { stage: t('callsToMeetings'), rate: stats.conversionRates.callsToMeetings, color: 'bg-gray-400' },
    { stage: t('meetingsToDeals'), rate: stats.conversionRates.meetingsToDeals, color: 'bg-gray-300' }
  ];

  // Animated conversion rates
  const animatedLeadsToFollowUp = useCountAnimation(stats.conversionRates.leadsToFollowUp, 1000, 400);
  const animatedCallCompletion = useCountAnimation(stats.conversionRates.callCompletionRate, 1000, 500);
  const animatedMeetingSuccess = useCountAnimation(stats.conversionRates.meetingsToDeals, 1000, 600);
  const animatedCallsToMeetings = useCountAnimation(stats.conversionRates.callsToMeetings, 1000, 700);
  const animatedActiveLeadsRate = useCountAnimation(
    Math.round((stats.activeLeads / Math.max(stats.totalProspects, 1)) * 100), 
    1000, 
    800
  );

  const conversionMetrics = [
    {
      label: t('leadFollowUpRate'),
      value: `${animatedLeadsToFollowUp}%`,
      change: getChangeForStat(stats.conversionRates.leadsToFollowUp, prevStats.conversionRates.leadsToFollowUp)
    },
    {
      label: t('callCompletionRate'),
      value: `${animatedCallCompletion}%`,
      change: getChangeForStat(stats.conversionRates.callCompletionRate, prevStats.conversionRates.callCompletionRate)
    },
    {
      label: t('meetingSuccessRate'),
      value: `${animatedMeetingSuccess}%`,
      change: getChangeForStat(stats.conversionRates.meetingsToDeals, prevStats.conversionRates.meetingsToDeals)
    },
    {
      label: t('callsToMeetingsRate'),
      value: `${animatedCallsToMeetings}%`,
      change: getChangeForStat(stats.conversionRates.callsToMeetings, prevStats.conversionRates.callsToMeetings)
    },
    {
      label: t('activeLeadsRate'),
      value: `${animatedActiveLeadsRate}%`,
      change: getChangeForStat(
        Math.round((stats.activeLeads / Math.max(stats.totalProspects, 1)) * 100),
        Math.round((prevStats.activeLeads / Math.max(prevStats.totalProspects, 1)) * 100)
      )
    }
  ];

  // Prepare data for Recharts
  const conversionChartData = [
    { stage: t('leadsToFollowUp'), value: stats.conversionRates.leadsToFollowUp },
    { stage: t('callsToMeetings'), value: stats.conversionRates.callsToMeetings },
    { stage: t('meetingsToDeals'), value: stats.conversionRates.meetingsToDeals }
  ];

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
                <div className={`p-3 rounded-full ${
                  index === 0 ? 'bg-blue-100' : 
                  index === 1 ? 'bg-purple-100' : 
                  index === 2 ? 'bg-orange-100' : 
                  index === 3 ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <card.icon className={`h-6 w-6 ${
                    index === 0 ? 'text-blue-600' : 
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
                  <span className={`text-sm font-medium ${
                    changeType === 'increase' ? 'text-green-600' : 
                    changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {card.change > 0 && '+'}{card.change}%
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
                      <span className={`text-xs font-medium ${
                        changeType === 'increase' ? 'text-green-600' : 
                        changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.change > 0 && '+'}{metric.change}%
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
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {activity.user.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-gray-500 text-center py-4">{t('noRecentActivities')}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;