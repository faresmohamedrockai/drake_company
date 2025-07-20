import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeads, getMeetings, getUsers } from '../../queries/queries';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Search,
  Filter,
  TrendingUp,
  Users,
  Phone,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { LeadStatus } from '../../types';

interface UserPerformance {
  id: string;
  name: string;
  role: string;
  teamId?: string;
  totalLeads: number;
  assignedLeads: number;
  completedCalls: number;
  totalCalls: number;
  completedVisits: number;
  totalVisits: number;
  completedMeetings: number;
  totalMeetings: number;
  closedDeals: number;
  conversionRate: number;
  callCompletionRate: number;
  visitCompletionRate: number;
  meetingCompletionRate: number;
  lastActivity: string;
}

interface PerformanceMetrics {
  totalUsers: number;
  totalLeads: number;
  totalCalls: number;
  totalVisits: number;
  totalMeetings: number;
  averageConversionRate: number;
  averageCallCompletionRate: number;
  averageVisitCompletionRate: number;
  averageMeetingCompletionRate: number;
}

const Reports: React.FC = () => {
  const { data: leads = [], isLoading: leadsLoading } = useQuery({ queryKey: ['leads'], queryFn: getLeads });
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({ queryKey: ['meetings'], queryFn: getMeetings });
  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const { user: currentUser } = useAuth();
  const { t } = useTranslation('reports');
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState<'dashboard' | 'detailed'>('dashboard');

  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'activity'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Check if user has access to reports
  const canAccessReports = currentUser?.role === 'admin' ||
    currentUser?.role === 'sales_admin' ||
    currentUser?.role === 'team_leader';

  // Get users based on hierarchy
  const getAccessibleUsers = () => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'sales_admin') {
      return users;
    } else if (currentUser?.role === 'team_leader') {
      return users.filter(u =>
        (u.role === 'sales_rep' && u.teamId === currentUser.teamId) ||
        (u.name === currentUser.name)
      );
    }
    return [];
  };

  // Calculate user performance
  const calculateUserPerformance = (user: any): UserPerformance => {
    const userLeads = leads.filter(lead => lead.owner?.id === user.id);
    const userMeetings = meetings.filter(meeting => meeting.assignedToId === user.id);

    const totalCalls = userLeads.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0);

    // Debug: Log all lead statuses for this user
    const allLeadStatuses = userLeads.map(lead => lead.status).filter(Boolean);
    if (allLeadStatuses.length > 0) {
      console.log(`Lead statuses for user ${user.name}:`, allLeadStatuses);
    }

    const completedCalls = userLeads.reduce((sum, lead) => {
      // If lead status is "not answered", don't count any calls as completed
      if (lead.status && lead.status.toLowerCase() === 'not answered') {
        return sum;
      }
      console.log(`Lead status for user ${user.name}:`, lead.status);
      // Otherwise, count all calls for this lead as completed
      return sum + (lead.calls?.length || 0);
    }, 0);
    console.log(`Completed calls for user ${user.name}:`, completedCalls);

    const totalVisits = userLeads.reduce((sum, lead) => sum + (lead.visits?.length || 0), 0);
    const completedVisits = userLeads.reduce((sum, lead) =>
      sum + (lead.visits?.filter((visit: any) => visit.status === 'Completed').length || 0), 0);

    const totalMeetings = userMeetings.length;
    const completedMeetings = userMeetings.filter(meeting => meeting.status === 'Completed').length;
    // Enhanced conversion rate calculation
    const closedDeals = userLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length;
    const openDeals = userLeads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length;
    const conversionRate = userLeads.length > 0 ?
      ((closedDeals + openDeals) / userLeads.length) * 100 : 0;

    const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

    // Debug: Log call completion summary
    if (totalCalls > 0) {
      console.log(`Call completion for ${user.name}: ${completedCalls}/${totalCalls} = ${callCompletionRate.toFixed(1)}%`);
    }

    const visitCompletionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;
    const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;

    // Get last activity date with enhanced logic
    const allActivities = [
      ...userLeads.map(lead => ({ date: lead.lastCallDate, type: 'call', leadName: lead.nameEn || lead.nameAr || '' })),
      ...userLeads.map(lead => ({ date: lead.lastVisitDate, type: 'visit', leadName: lead.nameEn || lead.nameAr || '' })),
      ...userMeetings.map(meeting => ({ date: meeting.date, type: 'meeting', leadName: meeting.client }))
    ].filter(activity => activity.date && activity.date !== '------');

    const lastActivity = allActivities.length > 0
      ? String(allActivities.sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())[0].date)
      : 'No activity';

    // Get performance from localStorage if available
    const performanceKey = `user_performance_${user.name}`;
    const meetingPerformanceKey = `user_meeting_performance_${user.name}`;
    const storedPerformance = localStorage.getItem(performanceKey);
    const storedMeetingPerformance = localStorage.getItem(meetingPerformanceKey);

    let enhancedCallCompletionRate = callCompletionRate;
    let enhancedVisitCompletionRate = visitCompletionRate;
    let enhancedMeetingCompletionRate = meetingCompletionRate;

    if (storedPerformance) {
      try {
        const parsed = JSON.parse(storedPerformance);
        enhancedCallCompletionRate = parsed.callCompletionRate || callCompletionRate;
        enhancedVisitCompletionRate = parsed.visitCompletionRate || visitCompletionRate;
      } catch (e) {
        console.warn('Failed to parse stored performance data');
      }
    }

    if (storedMeetingPerformance) {
      try {
        const parsed = JSON.parse(storedMeetingPerformance);
        enhancedMeetingCompletionRate = parsed.completionRate || meetingCompletionRate;
      } catch (e) {
        console.warn('Failed to parse stored meeting performance data');
      }
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      totalLeads: userLeads.length,
      assignedLeads: userLeads.length,
      completedCalls,
      totalCalls,
      completedVisits,
      totalVisits,
      completedMeetings,
      totalMeetings,
      closedDeals,
      conversionRate: Math.round(conversionRate * 10) / 10,
      callCompletionRate: Math.round(enhancedCallCompletionRate * 10) / 10,
      visitCompletionRate: Math.round(enhancedVisitCompletionRate * 10) / 10,
      meetingCompletionRate: Math.round(enhancedMeetingCompletionRate * 10) / 10,
      lastActivity: lastActivity || 'No activity'
    };
  };

  // Calculate overall metrics
  const calculateOverallMetrics = (): PerformanceMetrics => {
    const accessibleUsers = getAccessibleUsers();
    const performances = accessibleUsers.map(calculateUserPerformance);

    const totalUsers = accessibleUsers.length;
    const totalLeads = performances.reduce((sum, p) => sum + p.totalLeads, 0);
    const totalCalls = performances.reduce((sum, p) => sum + p.totalCalls, 0);
    const totalVisits = performances.reduce((sum, p) => sum + p.totalVisits, 0);
    const totalMeetings = performances.reduce((sum, p) => sum + p.totalMeetings, 0);

    const avgConversionRate = performances.length > 0 ?
      performances.reduce((sum, p) => sum + p.conversionRate, 0) / performances.length : 0;
    const avgCallCompletionRate = performances.length > 0 ?
      performances.reduce((sum, p) => sum + p.callCompletionRate, 0) / performances.length : 0;
    const avgVisitCompletionRate = performances.length > 0 ?
      performances.reduce((sum, p) => sum + p.visitCompletionRate, 0) / performances.length : 0;
    const avgMeetingCompletionRate = performances.length > 0 ?
      performances.reduce((sum, p) => sum + p.meetingCompletionRate, 0) / performances.length : 0;

    return {
      totalUsers,
      totalLeads,
      totalCalls,
      totalVisits,
      totalMeetings,
      averageConversionRate: Math.round(avgConversionRate * 10) / 10,
      averageCallCompletionRate: Math.round(avgCallCompletionRate * 10) / 10,
      averageVisitCompletionRate: Math.round(avgVisitCompletionRate * 10) / 10,
      averageMeetingCompletionRate: Math.round(avgMeetingCompletionRate * 10) / 10
    };
  };

  // Filter data by date range
  const filterDataByDateRange = (data: any[]) => {
    if (!selectedDateRange.startDate || !selectedDateRange.endDate) {
      return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.date || item.lastActivity);
      return itemDate >= selectedDateRange.startDate! && itemDate <= selectedDateRange.endDate!;
    });
  };

  // Get filtered and sorted performances
  const getFilteredPerformances = () => {
    let performances = getAccessibleUsers().map(calculateUserPerformance);

    // Filter by search term
    if (searchTerm) {
      performances = performances.filter(p =>
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.role && p.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by selected user
    if (selectedUser) {
      performances = performances.filter(p => p.id === selectedUser);
    }

    // Filter by date range
    if (selectedDateRange.startDate && selectedDateRange.endDate) {
      const startDate = selectedDateRange.startDate;
      const endDate = selectedDateRange.endDate;

      console.log('Filtering performances by date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPerformances: performances.length
      });

      performances = performances.filter(p => {
        // Check if user has any activity within the date range
        const lastActivity = p.lastActivity;

        // If lastActivity is valid and within range, include the user
        if (lastActivity && typeof lastActivity === 'string' && lastActivity !== 'No activity') {
          const lastActivityDate = new Date(lastActivity);
          if (!isNaN(lastActivityDate.getTime()) &&
            lastActivityDate >= startDate &&
            lastActivityDate <= endDate) {
            console.log(`User ${p.name} included due to lastActivity:`, lastActivity);
            return true;
          }
        }

        // Also check if user has any leads or meetings within the date range
        const userLeads = leads.filter(lead => lead.owner?.id === p.id);
        const userMeetings = meetings.filter(meeting => meeting.assignedToId === p.id);

        // Check leads created or updated within date range
        const hasLeadsInRange = userLeads.some(lead => {
          const leadDate = new Date(lead.createdAt || lead.lastCallDate || lead.lastVisitDate || '');
          return !isNaN(leadDate.getTime()) &&
            leadDate >= startDate &&
            leadDate <= endDate;
        });

        // Check meetings within date range
        const hasMeetingsInRange = userMeetings.some(meeting => {
          const meetingDate = new Date(meeting.date || '');
          return !isNaN(meetingDate.getTime()) &&
            meetingDate >= startDate &&
            meetingDate <= endDate;
        });

        if (hasLeadsInRange || hasMeetingsInRange) {
          console.log(`User ${p.name} included due to leads/meetings in range`);
        }

        return hasLeadsInRange || hasMeetingsInRange;
      });

      console.log('Filtered performances count:', performances.length);
    }

    // Sort
    performances.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'performance':
          aValue = a.conversionRate;
          bValue = b.conversionRate;
          break;
        case 'activity':
          aValue = new Date(a.lastActivity).getTime();
          bValue = new Date(b.lastActivity).getTime();
          break;
        default:
          aValue = a.conversionRate;
          bValue = b.conversionRate;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return performances;
  };

  // Get date range based on selected timeframe
  const getDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    switch (selectedTimeframe) {
      case 'today':
        return {
          startDate: startOfDay,
          endDate: endOfDay
        };
      case 'week':
        // Get the start of the current week (Sunday)
        const startOfWeek = new Date(startOfDay);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

        // Get the end of the current week (Saturday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return {
          startDate: startOfWeek,
          endDate: endOfWeek
        };
      case 'month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          startDate: startOfMonth,
          endDate: endOfMonth
        };
      case 'custom':
        return {
          startDate: customDateRange.startDate ? new Date(customDateRange.startDate) : null,
          endDate: customDateRange.endDate ? new Date(customDateRange.endDate + 'T23:59:59.999') : null
        };
      default:
        return { startDate: null, endDate: null };
    }
  };

  // Helper function to translate user roles
  const translateUserRole = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'sales_rep': t('roles.salesRep'),
      'team_leader': t('roles.teamLeader'),
      'sales_admin': t('roles.salesAdmin'),
      'admin': t('roles.admin'),
    };
    return roleMap[role] || role;
  };



  const selectedDateRange = getDateRange();

  // Debug logging for date ranges
  if (selectedDateRange.startDate && selectedDateRange.endDate) {
    console.log('Date Range:', {
      timeframe: selectedTimeframe,
      startDate: selectedDateRange.startDate.toISOString(),
      endDate: selectedDateRange.endDate.toISOString(),
      startDateLocal: selectedDateRange.startDate.toLocaleDateString(),
      endDateLocal: selectedDateRange.endDate.toLocaleDateString()
    });
  }

  const performances = getFilteredPerformances();
  const metrics = calculateOverallMetrics();

  // Chart data
  const performanceChartData = performances.map(p => ({
    name: p.name,
    conversionRate: p.conversionRate,
    callCompletionRate: p.callCompletionRate,
    visitCompletionRate: p.visitCompletionRate,
    meetingCompletionRate: p.meetingCompletionRate
  }));

  const roleDistributionData = [
    { name: 'Sales Rep', value: performances.filter(p => p.role === 'sales_rep').length },
    { name: 'Team Leader', value: performances.filter(p => p.role === 'team_leader').length },
    { name: 'Sales Admin', value: performances.filter(p => p.role === 'sales_admin').length },
    { name: 'Admin', value: performances.filter(p => p.role === 'admin').length }
  ].filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];



  if (!canAccessReports) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('accessDenied')}</h2>
          <p className="text-gray-600">{t('noPermission')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('description')}</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search and User Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('controls.searchUsers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{t('controls.allUsers')}</option>
              {getAccessibleUsers().map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

          </div>

          {/* View Mode Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${viewMode === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              <span className="hidden xs:inline">{t('controls.dashboard')}</span>
              <span className="xs:hidden">{t('controls.dash')}</span>
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${viewMode === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              <span className="hidden xs:inline">{t('controls.detailed')}</span>
              <span className="xs:hidden">{t('controls.list')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}


      {/* Activity Feed */}
      {showActivityFeed && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            {t('activityFeed.recentActivityFeed')}
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(() => {
              const allActivities = [
                ...leads.map(lead => ({
                  type: 'lead',
                  action: t('activityFeed.leadUpdated'),
                  user: users.find(u => u.id === lead.assignedToId)?.name || '',
                  details: `${lead.nameEn || lead.nameAr || ''} - ${lead.status}`,
                  date: String(lead.lastCallDate || lead.createdAt || ''),
                  priority: lead.status === LeadStatus.CLOSED_DEAL ? 'high' : 'medium'
                })),
                ...meetings.map(meeting => ({
                  type: 'meeting',
                  action: t('activityFeed.meeting'),
                  user: users.find(u => u.id === meeting.assignedToId)?.name || '',
                  details: `${meeting.title} with ${meeting.client} - ${meeting.status}`,
                  date: String(meeting.date || ''),
                  priority: meeting.status === 'Completed' ? 'high' : 'medium'
                }))
              ].filter(activity => activity.date && activity.date !== '------')
                .sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())
                .slice(0, 10);

              return allActivities.map((activity, index) => (
                <div key={index} className={`flex items-center p-3 rounded-lg border-l-4 ${activity.priority === 'high' ? 'border-l-green-500 bg-green-50' :
                  activity.priority === 'medium' ? 'border-l-blue-500 bg-blue-50' :
                    'border-l-gray-500 bg-gray-50'
                  }`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${activity.type === 'lead' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                    <div className="text-xs text-gray-600">{activity.details}</div>
                    <div className="text-xs text-gray-500">{t('activityFeed.by')} {activity.user} • {activity.date}</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {viewMode === 'dashboard' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.totalUsers')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.totalLeads')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
                  <p className="text-xs text-gray-500">{t('metrics.assigned')}</p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.avgConversion')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.averageConversionRate}%</p>
                  <p className="text-xs text-gray-500">{t('metrics.rate')}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.callCompletion')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.averageCallCompletionRate}%</p>
                  <p className="text-xs text-gray-500">{t('metrics.rate')}</p>
                </div>
                <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col gap-4">
              {/* Date Range Display */}
              {selectedDateRange.startDate && selectedDateRange.endDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">
                    {selectedDateRange.startDate.toLocaleDateString()} - {selectedDateRange.endDate.toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Filters and Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="today">{t('timeframes.today')}</option>
                    <option value="week">{t('timeframes.thisWeek')}</option>
                    <option value="month">{t('timeframes.thisMonth')}</option>
                    <option value="custom">{t('timeframes.customRange')}</option>
                  </select>

                  {/* Custom Date Range Picker */}
                  {selectedTimeframe === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1">
                      <input
                        type="date"
                        value={customDateRange.startDate}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="text-sm border-none focus:outline-none focus:ring-0 w-full sm:w-auto"
                        placeholder="Start Date"
                      />
                      <span className="text-gray-400 text-sm hidden sm:inline">{t('timeframes.to')}</span>
                      <input
                        type="date"
                        value={customDateRange.endDate}
                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="text-sm border-none focus:outline-none focus:ring-0 w-full sm:w-auto"
                        placeholder="End Date"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowActivityFeed(!showActivityFeed)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${showActivityFeed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    <Activity className="h-4 w-4 inline mr-1" />
                    <span className="hidden xs:inline">{t('filters.activityFeed')}</span>
                    <span className="xs:hidden">{t('filters.feed')}</span>
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="performance">{t('filters.sortByPerformance')}</option>
                    <option value="name">{t('filters.sortByName')}</option>
                    <option value="activity">{t('filters.sortByActivity')}</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
            {/* Performance Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('charts.performanceMetrics')}</h3>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion Rate (%)" />
                  <Bar dataKey="callCompletionRate" fill="#82ca9d" name="Call Completion (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role Distribution */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('charts.roleDistribution')}</h3>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <RechartsPieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('charts.performanceTrends')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{metrics.averageConversionRate}%</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('charts.avgConversionRate')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageConversionRate > 50 ? t('performance.excellent') :
                    metrics.averageConversionRate > 30 ? t('performance.good') :
                      metrics.averageConversionRate > 15 ? t('performance.fair') : t('performance.needsImprovement')}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{metrics.averageCallCompletionRate}%</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('charts.avgCallCompletion')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageCallCompletionRate > 80 ? t('performance.outstanding') :
                    metrics.averageCallCompletionRate > 60 ? t('performance.good') :
                      metrics.averageCallCompletionRate > 40 ? t('performance.fair') : t('performance.needsWork')}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{metrics.averageMeetingCompletionRate}%</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('charts.avgMeetingCompletion')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageMeetingCompletionRate > 90 ? t('performance.perfect') :
                    metrics.averageMeetingCompletionRate > 70 ? t('performance.good') :
                      metrics.averageMeetingCompletionRate > 50 ? t('performance.fair') : t('performance.needsAttention')}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Detailed View */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.user')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.leads')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.calls')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.visits')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.meetings')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.deals')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.conversion')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.lastActivity')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performances.map((performance) => (
                  <tr key={performance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {performance.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{performance.name}</div>
                          <div className="text-sm text-gray-500">{translateUserRole(performance.role)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performance.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        performance.role === 'Sales Admin' ? 'bg-purple-100 text-purple-800' :
                          performance.role === 'Team Leader' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        {performance.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {performance.totalLeads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{performance.completedCalls}/{performance.totalCalls}</div>
                      <div className="text-xs text-gray-500">{performance.callCompletionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{performance.completedVisits}/{performance.totalVisits}</div>
                      <div className="text-xs text-gray-500">{performance.visitCompletionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{performance.completedMeetings}/{performance.totalMeetings}</div>
                      <div className="text-xs text-gray-500">{performance.meetingCompletionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{performance.closedDeals}</div>
                      <div className="text-xs text-gray-500">Closed</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{performance.conversionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {performance.lastActivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {performances.map((performance) => (
                <div key={performance.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* User Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {performance.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{performance.name}</div>
                        <div className="text-xs text-gray-500">{translateUserRole(performance.role)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performance.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        performance.role === 'Sales Admin' ? 'bg-purple-100 text-purple-800' :
                          performance.role === 'Team Leader' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        {translateUserRole(performance.role)}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500">Leads</div>
                      <div className="text-sm font-medium text-gray-900">{performance.totalLeads}</div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500">Calls</div>
                      <div className="text-sm font-medium text-gray-900">{performance.completedCalls}/{performance.totalCalls}</div>
                      <div className="text-xs text-gray-500">{performance.callCompletionRate}%</div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500">Visits</div>
                      <div className="text-sm font-medium text-gray-900">{performance.completedVisits}/{performance.totalVisits}</div>
                      <div className="text-xs text-gray-500">{performance.visitCompletionRate}%</div>
                    </div>
                    <div className="bg-white rounded p-3">
                      <div className="text-xs text-gray-500">Meetings</div>
                      <div className="text-sm font-medium text-gray-900">{performance.completedMeetings}/{performance.totalMeetings}</div>
                      <div className="text-xs text-gray-500">{performance.meetingCompletionRate}%</div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500">Closed Deals</div>
                      <div className="text-sm font-medium text-green-600">{performance.closedDeals}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Conversion Rate</div>
                      <div className="text-sm font-medium text-gray-900">{performance.conversionRate}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Last Activity</div>
                      <div className="text-xs text-gray-600">{performance.lastActivity}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 