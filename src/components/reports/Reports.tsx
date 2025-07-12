import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  Download, 
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
import Papa from 'papaparse';

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
  isActive: boolean;
}

interface PerformanceMetrics {
  totalUsers: number;
  activeUsers: number;
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
  const { leads, meetings, users } = useData();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState<'dashboard' | 'detailed'>('dashboard');
  const [showInactive, setShowInactive] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'activity'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('week');

  // Check if user has access to reports
  const canAccessReports = currentUser?.role === 'Admin' || 
                          currentUser?.role === 'Sales Admin' || 
                          currentUser?.role === 'Team Leader';

  // Get users based on hierarchy
  const getAccessibleUsers = () => {
    if (currentUser?.role === 'Admin' || currentUser?.role === 'Sales Admin') {
      return users.filter(u => u.isActive || showInactive);
    } else if (currentUser?.role === 'Team Leader') {
      return users.filter(u => 
        (u.role === 'Sales Rep' && u.teamId === currentUser.teamId) ||
        (u.name === currentUser.name)
      ).filter(u => u.isActive || showInactive);
    }
    return [];
  };

  // Calculate user performance
  const calculateUserPerformance = (user: any): UserPerformance => {
    const userLeads = leads.filter(lead => lead.assignedTo === user.name);
    const userMeetings = meetings.filter(meeting => meeting.assignedTo === user.name);
    
    const totalCalls = userLeads.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0);
    const completedCalls = userLeads.reduce((sum, lead) => 
      sum + (lead.calls?.filter((call: any) => 
        ['Interested', 'Meeting Scheduled', 'Follow Up Required'].includes(call.outcome)
      ).length || 0), 0);
    
    const totalVisits = userLeads.reduce((sum, lead) => sum + (lead.visits?.length || 0), 0);
    const completedVisits = userLeads.reduce((sum, lead) => 
      sum + (lead.visits?.filter((visit: any) => visit.status === 'Completed').length || 0), 0);
    
    const totalMeetings = userMeetings.length;
    const completedMeetings = userMeetings.filter(meeting => meeting.status === 'Completed').length;
    
    // Enhanced conversion rate calculation
    const closedDeals = userLeads.filter(lead => lead.status === 'Closed Deal').length;
    const openDeals = userLeads.filter(lead => lead.status === 'Open Deal').length;
    const conversionRate = userLeads.length > 0 ? 
      ((closedDeals + openDeals) / userLeads.length) * 100 : 0;
    
    const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const visitCompletionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;
    const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;

    // Get last activity date with enhanced logic
    const allActivities = [
      ...userLeads.map(lead => ({ date: lead.lastCallDate, type: 'call', leadName: lead.name })),
      ...userLeads.map(lead => ({ date: lead.lastVisitDate, type: 'visit', leadName: lead.name })),
      ...userMeetings.map(meeting => ({ date: meeting.date, type: 'meeting', leadName: meeting.client }))
    ].filter(activity => activity.date && activity.date !== '------');
    
    const lastActivity = allActivities.length > 0 ? 
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : 'No activity';

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
      lastActivity,
      isActive: user.isActive
    };
  };

  // Calculate overall metrics
  const calculateOverallMetrics = (): PerformanceMetrics => {
    const accessibleUsers = getAccessibleUsers();
    const performances = accessibleUsers.map(calculateUserPerformance);
    
    const totalUsers = accessibleUsers.length;
    const activeUsers = accessibleUsers.filter(u => u.isActive).length;
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
      activeUsers,
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

  // Get filtered and sorted performances
  const getFilteredPerformances = () => {
    let performances = getAccessibleUsers().map(calculateUserPerformance);
    
    // Filter by search term
    if (searchTerm) {
      performances = performances.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by selected user
    if (selectedUser) {
      performances = performances.filter(p => p.id === selectedUser);
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
    { name: 'Sales Rep', value: performances.filter(p => p.role === 'Sales Rep').length },
    { name: 'Team Leader', value: performances.filter(p => p.role === 'Team Leader').length },
    { name: 'Sales Admin', value: performances.filter(p => p.role === 'Sales Admin').length },
    { name: 'Admin', value: performances.filter(p => p.role === 'Admin').length }
  ].filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any[], filename: string) => {
    // For Excel export, we'll use CSV format which Excel can open
    exportToCSV(data, filename);
  };

  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    const exportData = performances.map(p => ({
      Name: p.name,
      Role: p.role,
      'Total Leads': p.totalLeads,
      'Completed Calls': p.completedCalls,
      'Total Calls': p.totalCalls,
      'Call Completion Rate (%)': p.callCompletionRate,
      'Completed Visits': p.completedVisits,
      'Total Visits': p.totalVisits,
      'Visit Completion Rate (%)': p.visitCompletionRate,
      'Completed Meetings': p.completedMeetings,
      'Total Meetings': p.totalMeetings,
      'Meeting Completion Rate (%)': p.meetingCompletionRate,
      'Closed Deals': p.closedDeals,
      'Conversion Rate (%)': p.conversionRate,
      'Last Activity': p.lastActivity,
      'Status': p.isActive ? 'Active' : 'Inactive'
    }));

    switch (format) {
      case 'csv':
        exportToCSV(exportData, 'performance-report');
        break;
      case 'json':
        exportToJSON(exportData, 'performance-report');
        break;
      case 'excel':
        exportToExcel(exportData, 'performance-report');
        break;
    }
  };

  if (!canAccessReports) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Reports</h1>
        <p className="text-gray-600">Track team performance, conversion rates, and activity metrics</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {getAccessibleUsers().map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showInactive" className="text-sm text-gray-700">Show Inactive</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'detailed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Export Data:</span>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4 inline mr-1" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 inline mr-1" />
              JSON
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
            >
              <Download className="h-4 w-4 inline mr-1" />
              Excel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={() => setShowActivityFeed(!showActivityFeed)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showActivityFeed 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-1" />
              Activity Feed
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="performance">Sort by Performance</option>
              <option value="name">Sort by Name</option>
              <option value="activity">Sort by Activity</option>
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

      {/* Activity Feed */}
      {showActivityFeed && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity Feed
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(() => {
              const allActivities = [
                ...leads.map(lead => ({
                  type: 'lead',
                  action: 'Lead Updated',
                  user: lead.assignedTo,
                  details: `${lead.name} - ${lead.status}`,
                  date: lead.lastCallDate || lead.createdAt,
                  priority: lead.status === 'Closed Deal' ? 'high' : 'medium'
                })),
                ...meetings.map(meeting => ({
                  type: 'meeting',
                  action: 'Meeting',
                  user: meeting.assignedTo,
                  details: `${meeting.title} with ${meeting.client} - ${meeting.status}`,
                  date: meeting.date,
                  priority: meeting.status === 'Completed' ? 'high' : 'medium'
                }))
              ].filter(activity => activity.date && activity.date !== '------')
               .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
               .slice(0, 10);

              return allActivities.map((activity, index) => (
                <div key={index} className={`flex items-center p-3 rounded-lg border-l-4 ${
                  activity.priority === 'high' ? 'border-l-green-500 bg-green-50' :
                  activity.priority === 'medium' ? 'border-l-blue-500 bg-blue-50' :
                  'border-l-gray-500 bg-gray-50'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'lead' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                    <div className="text-xs text-gray-600">{activity.details}</div>
                    <div className="text-xs text-gray-500">by {activity.user} • {activity.date}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                  <p className="text-xs text-gray-500">{metrics.activeUsers} active</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
                  <p className="text-xs text-gray-500">Assigned</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Conversion</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageConversionRate}%</p>
                  <p className="text-xs text-gray-500">Rate</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Call Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageCallCompletionRate}%</p>
                  <p className="text-xs text-gray-500">Rate</p>
                </div>
                <Phone className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion Rate (%)" />
                  <Bar dataKey="callCompletionRate" fill="#82ca9d" name="Call Completion (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
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
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.averageConversionRate}%</div>
                <div className="text-sm text-gray-600">Avg Conversion Rate</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageConversionRate > 50 ? 'Excellent' : 
                   metrics.averageConversionRate > 30 ? 'Good' : 
                   metrics.averageConversionRate > 15 ? 'Fair' : 'Needs Improvement'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.averageCallCompletionRate}%</div>
                <div className="text-sm text-gray-600">Avg Call Completion</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageCallCompletionRate > 80 ? 'Outstanding' : 
                   metrics.averageCallCompletionRate > 60 ? 'Good' : 
                   metrics.averageCallCompletionRate > 40 ? 'Fair' : 'Needs Work'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.averageMeetingCompletionRate}%</div>
                <div className="text-sm text-gray-600">Avg Meeting Completion</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageMeetingCompletionRate > 90 ? 'Perfect' : 
                   metrics.averageMeetingCompletionRate > 70 ? 'Good' : 
                   metrics.averageMeetingCompletionRate > 50 ? 'Fair' : 'Needs Attention'}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Detailed View */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meetings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                          <div className="text-sm text-gray-500">{performance.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        performance.role === 'Admin' ? 'bg-red-100 text-red-800' :
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        performance.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {performance.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 