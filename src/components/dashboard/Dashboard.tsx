import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getStatistics, getPreviousStats, getChangeForStat, activities } = useData();
  
  const stats = getStatistics();
  const prevStats = getPreviousStats() || stats; // fallback to current if none

  const kpiCards = [
    {
      title: 'Total Prospects',
      value: stats.totalProspects.toString(),
      change: getChangeForStat(stats.totalProspects, prevStats.totalProspects),
      icon: Users,
      description: 'All prospects in the system'
    },
    {
      title: 'Active Leads',
      value: stats.activeLeads.toString(),
      change: getChangeForStat(stats.activeLeads, prevStats.activeLeads),
      icon: TrendingUp,
      description: 'Fresh, Follow Up, Scheduled Visit'
    },
    {
      title: "Today's Meetings",
      value: stats.todayMeetings.toString(),
      change: getChangeForStat(stats.todayMeetings, prevStats.todayMeetings),
      icon: Calendar,
      description: 'Click to view all meetings',
      info: true
    }
  ];

  const conversionRates = [
    { stage: 'Leads to Follow Up', rate: stats.conversionRates.leadsToFollowUp, color: 'bg-blue-500' },
    { stage: 'Calls to Meetings', rate: stats.conversionRates.callsToMeetings, color: 'bg-gray-400' },
    { stage: 'Meetings to Deals', rate: stats.conversionRates.meetingsToDeals, color: 'bg-gray-300' }
  ];

  const conversionMetrics = [
    {
      label: 'Lead Follow-up Rate',
      value: `${stats.conversionRates.leadsToFollowUp}%`,
      change: getChangeForStat(stats.conversionRates.leadsToFollowUp, prevStats.conversionRates.leadsToFollowUp)
    },
    {
      label: 'Call Completion Rate',
      value: `${stats.conversionRates.callCompletionRate}%`,
      change: getChangeForStat(stats.conversionRates.callCompletionRate, prevStats.conversionRates.callCompletionRate)
    },
    {
      label: 'Meeting Success Rate',
      value: `${stats.conversionRates.meetingsToDeals}%`,
      change: getChangeForStat(stats.conversionRates.meetingsToDeals, prevStats.conversionRates.meetingsToDeals)
    },
    {
      label: 'Calls to Meetings Rate',
      value: `${stats.conversionRates.callsToMeetings}%`,
      change: getChangeForStat(stats.conversionRates.callsToMeetings, prevStats.conversionRates.callsToMeetings)
    },
    {
      label: 'Active Leads Rate',
      value: `${Math.round((stats.activeLeads / Math.max(stats.totalProspects, 1)) * 100)}%`,
      change: getChangeForStat(
        Math.round((stats.activeLeads / Math.max(stats.totalProspects, 1)) * 100),
        Math.round((prevStats.activeLeads / Math.max(prevStats.totalProspects, 1)) * 100)
      )
    }
  ];

  // Prepare data for Recharts
  const conversionChartData = [
    { stage: 'Leads to Follow Up', value: stats.conversionRates.leadsToFollowUp },
    { stage: 'Calls to Meetings', value: stats.conversionRates.callsToMeetings },
    { stage: 'Meetings to Deals', value: stats.conversionRates.meetingsToDeals }
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
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">Here's what's happening with your real estate business today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  index === 2 ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <card.icon className={`h-6 w-6 ${
                    index === 0 ? 'text-blue-600' : 
                    index === 1 ? 'text-purple-600' : 
                    index === 2 ? 'text-orange-600' : 'text-green-600'
                  }`} />
                </div>
                {card.info ? (
                  <a
                    href="#"
                    className="text-xs text-blue-600 underline hover:text-blue-800"
                    onClick={e => {
                      e.preventDefault();
                      if (typeof window !== "undefined") {
                        const sidebarBtn = document.querySelector('[data-view="meetings"]');
                        if (sidebarBtn) (sidebarBtn as HTMLElement).click();
                      }
                    }}
                  >
                    Go to Meetings Management
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
            Conversion Rates
          </h3>
          <p className="text-sm text-gray-600 mb-6">Visualize your sales funnel efficiency</p>
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
            Conversion Metrics
          </h3>
          <p className="text-sm text-gray-600 mb-6">Monitor your key sales performance indicators</p>
          
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
          Recent Activity Feed
        </h3>
        <p className="text-sm text-gray-600 mb-6">Latest actions and updates in your system</p>
        
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
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;