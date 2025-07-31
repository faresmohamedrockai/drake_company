import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeads, getMeetings, getUsers, getContracts } from '../../queries/queries';
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
  EyeOff,
  CalendarDays,
  RefreshCw,
  Download,
  UserCheck,
  DollarSign,
  BarChart4,
  Settings,
  MapPin
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { LeadStatus, User } from '../../types';
import { exportTeamLeaderReport, exportSalesReport, exportUserPerformanceReport, exportSalesMemberReport, exportAllSalesMembersReport, TeamLeaderReport, SalesReportData, SalesMemberReport } from '../../utils/excelExport';
import { toast } from 'react-toastify';

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
  totalFollowUps: number;
  completedFollowUps: number;
  closedDeals: number;
  openDeals: number;
  conversionRate: number;
  callCompletionRate: number;
  visitCompletionRate: number;
  meetingCompletionRate: number;
  followUpCompletionRate: number;
  totalRevenue: number;
  averageDealSize: number;
  lastActivity: string;
  // Detailed activity data
  calls: Array<{
    leadId: string;
    leadName: string;
    date: string;
    duration: string;
    outcome: string;
    notes: string;
  }>;
  visits: Array<{
    leadId: string;
    leadName: string;
    date: string;
    status: string;
    notes: string;
  }>;
  followUps: Array<{
    leadId: string;
    leadName: string;
    date: string;
    type: string;
    status: string;
    notes: string;
  }>;
  leads: Lead[];
  meetings: Meeting[];
  contracts: Contract[];
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

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

const Reports: React.FC = () => {
  const { data: leads = [], isLoading: leadsLoading } = useQuery({ queryKey: ['leads'], queryFn: getLeads });
  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({ queryKey: ['meetings'], queryFn: getMeetings });
  const { data: users = [], isLoading: usersLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({ queryKey: ['contracts'], queryFn: getContracts });
  const { user: currentUser } = useAuth();
  const { t } = useTranslation('reports');
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'detailed'>('dashboard');

  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'activity'>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month' | 'last7days' | 'last30days' | 'last3months' | 'last6months' | 'yearToDate' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [activityFilter, setActivityFilter] = useState<'all' | 'calls' | 'visits' | 'meetings' | 'deals'>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [showTeamLeaderView, setShowTeamLeaderView] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'team' | 'sales' | 'user' | 'salesMember' | 'allSalesMembers'>('team');
  const [teamMemberView, setTeamMemberView] = useState<'overview' | 'member'>('overview');

  // Check if user has access to reports
  const canAccessReports = currentUser?.role === 'admin' ||
    currentUser?.role === 'sales_admin' ||
    currentUser?.role === 'team_leader';

  // Get users based on hierarchy
  const getAccessibleUsers = () => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'sales_admin') {
      return users;
    } else if (currentUser?.role === 'team_leader') {
      // Include team leader and all their team members
      const teamMembers = users.filter(u =>
        u.id === currentUser.id || // Include the team leader themselves
        (u.role === 'sales_rep' && u.teamLeaderId === currentUser.id) // Include team members
      );
      
      // If no team members found, show all users as fallback
      if (teamMembers.length <= 1) { // Only team leader found
        console.log('No team members found for team leader:', currentUser.name);
        console.log('Available users:', users.map(u => ({ name: u.name, role: u.role, teamLeaderId: u.teamLeaderId })));
        return users; // Show all users as fallback
      }
      
      return teamMembers;
    }
    return [];
  };

  // Get team members for team leader (including team leader)
  const getTeamMembers = () => {
    if (currentUser?.role === 'team_leader') {
      return users.filter(u => 
        u.id === currentUser.id || // Include the team leader themselves
        (u.role === 'sales_rep' && u.teamLeaderId === currentUser.id) // Include team members
      );
    }
    return [];
  };

  // Check if current user is team leader
  const isTeamLeader = currentUser?.role === 'team_leader';

  // Generate team leader report
  const generateTeamLeaderReport = (): TeamLeaderReport => {
    const teamMembers = getTeamMembers();
    const currentDateRange = getDateRange();
    
    const memberDetails = teamMembers.map(member => {
      const memberLeads = leads.filter(lead => lead.owner?.id === member.id);
      const memberMeetings = meetings.filter(meeting => meeting.assignedToId === member.id);
      const memberContracts = contracts.filter(contract => contract.createdById === member.id);
      
      // Filter by date range
      let filteredLeads = memberLeads;
      let filteredMeetings = memberMeetings;
      let filteredContracts = memberContracts;
      
      if (currentDateRange.startDate && currentDateRange.endDate) {
        filteredLeads = memberLeads.filter(lead => {
          const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
          return createdDate && createdDate >= currentDateRange.startDate! && createdDate <= currentDateRange.endDate!;
        });
        
        filteredMeetings = memberMeetings.filter(meeting => {
          const meetingDate = meeting.date ? new Date(meeting.date) : null;
          return meetingDate && meetingDate >= currentDateRange.startDate! && meetingDate <= currentDateRange.endDate!;
        });
        
        filteredContracts = memberContracts.filter(contract => {
          const contractDate = contract.contractDate ? new Date(contract.contractDate) : null;
          return contractDate && contractDate >= currentDateRange.startDate! && contractDate <= currentDateRange.endDate!;
        });
      }
      
      const performance = calculateUserPerformance(member, currentDateRange);
      
      return {
        user: member,
        leads: filteredLeads,
        meetings: filteredMeetings,
        contracts: filteredContracts,
        performance: {
          ...performance,
          totalRevenue: filteredContracts.reduce((sum, contract) => sum + contract.dealValue, 0),
          lastActivity: performance.lastActivity
        }
      };
    });
    
    const teamPerformance = {
      totalLeads: memberDetails.reduce((sum, member) => sum + member.performance.totalLeads, 0),
      totalCalls: memberDetails.reduce((sum, member) => sum + member.performance.totalCalls, 0),
      completedCalls: memberDetails.reduce((sum, member) => sum + member.performance.completedCalls, 0),
      totalVisits: memberDetails.reduce((sum, member) => sum + member.performance.totalVisits, 0),
      completedVisits: memberDetails.reduce((sum, member) => sum + member.performance.completedVisits, 0),
      totalMeetings: memberDetails.reduce((sum, member) => sum + member.performance.totalMeetings, 0),
      completedMeetings: memberDetails.reduce((sum, member) => sum + member.performance.completedMeetings, 0),
      closedDeals: memberDetails.reduce((sum, member) => sum + member.performance.closedDeals, 0),
      openDeals: memberDetails.reduce((sum, member) => sum + (member.leads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length), 0),
      conversionRate: memberDetails.reduce((sum, member) => sum + member.performance.conversionRate, 0) / memberDetails.length,
      callCompletionRate: memberDetails.reduce((sum, member) => sum + member.performance.callCompletionRate, 0) / memberDetails.length,
      visitCompletionRate: memberDetails.reduce((sum, member) => sum + member.performance.visitCompletionRate, 0) / memberDetails.length,
      meetingCompletionRate: memberDetails.reduce((sum, member) => sum + member.performance.meetingCompletionRate, 0) / memberDetails.length,
      totalRevenue: memberDetails.reduce((sum, member) => sum + member.performance.totalRevenue, 0),
      averageDealSize: memberDetails.reduce((sum, member) => sum + member.performance.totalRevenue, 0) / memberDetails.reduce((sum, member) => sum + member.contracts.length, 0) || 0
    };
    
    return {
      teamLeader: currentUser as User,
      teamMembers,
      teamPerformance,
      memberDetails
    };
  };

  // Generate sales report
  const generateSalesReport = (): SalesReportData => {
    const currentDateRange = getDateRange();
    const accessibleUsers = getAccessibleUsers();
    
    // Filter data by date range
    let filteredLeads = leads;
    let filteredMeetings = meetings;
    let filteredContracts = contracts;
    
    if (currentDateRange.startDate && currentDateRange.endDate) {
      filteredLeads = leads.filter(lead => {
        const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
        return createdDate && createdDate >= currentDateRange.startDate! && createdDate <= currentDateRange.endDate!;
      });
      
      filteredMeetings = meetings.filter(meeting => {
        const meetingDate = meeting.date ? new Date(meeting.date) : null;
        return meetingDate && meetingDate >= currentDateRange.startDate! && meetingDate <= currentDateRange.endDate!;
      });
      
      filteredContracts = contracts.filter(contract => {
        const contractDate = contract.contractDate ? new Date(contract.contractDate) : null;
        return contractDate && contractDate >= currentDateRange.startDate! && contractDate <= currentDateRange.endDate!;
      });
    }
    
    // Calculate metrics
    const totalLeads = filteredLeads.length;
    const closedDeals = filteredLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length;
    const openDeals = filteredLeads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length;
    const totalRevenue = filteredContracts.reduce((sum, contract) => sum + contract.dealValue, 0);
    const averageDealSize = filteredContracts.length > 0 ? totalRevenue / filteredContracts.length : 0;
    
    // Calculate completion rates
    const totalCalls = filteredLeads.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0);
    const completedCalls = filteredLeads.filter(lead => lead.status !== LeadStatus.NO_ANSWER).length;
    const totalVisits = filteredLeads.reduce((sum, lead) => sum + (lead.visits?.length || 0), 0);
    const completedVisits = filteredLeads.filter(lead => lead.visits?.some(visit => visit.status === 'Completed')).length;
    const totalMeetings = filteredMeetings.length;
    const completedMeetings = filteredMeetings.filter(meeting => meeting.status === 'Completed').length;
    
    // Calculate rates
    const conversionRate = totalLeads > 0 ? ((closedDeals + openDeals) / totalLeads) * 100 : 0;
    const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const visitCompletionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;
    const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;
    
    // Group data
    const leadsByStatus = filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const leadsBySource = filteredLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const revenueByMonth = filteredContracts.reduce((acc, contract) => {
      const month = contract.contractDate ? new Date(contract.contractDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown';
      acc[month] = (acc[month] || 0) + contract.dealValue;
      return acc;
    }, {} as Record<string, number>);
    
    // Top performing users
    const topPerformingUsers = accessibleUsers.map(user => {
      const userLeads = filteredLeads.filter(lead => lead.owner?.id === user.id);
      const userContracts = filteredContracts.filter(contract => contract.createdById === user.id);
      const userClosedDeals = userLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length;
      const userRevenue = userContracts.reduce((sum, contract) => sum + contract.dealValue, 0);
      const userConversionRate = userLeads.length > 0 ? (userClosedDeals / userLeads.length) * 100 : 0;
      
      return {
        user,
        performance: {
          totalLeads: userLeads.length,
          closedDeals: userClosedDeals,
          conversionRate: userConversionRate,
          totalRevenue: userRevenue
        }
      };
    }).sort((a, b) => b.performance.totalRevenue - a.performance.totalRevenue).slice(0, 10);
    
    return {
      period: currentDateRange.startDate && currentDateRange.endDate ? 
        `${currentDateRange.startDate.toLocaleDateString()} - ${currentDateRange.endDate.toLocaleDateString()}` : 
        'All Time',
      totalLeads,
      totalCalls,
      completedCalls,
      totalVisits,
      completedVisits,
      totalMeetings,
      completedMeetings,
      closedDeals,
      openDeals,
      totalRevenue,
      averageDealSize,
      conversionRate,
      callCompletionRate,
      visitCompletionRate,
      meetingCompletionRate,
      leadsByStatus,
      leadsBySource,
      revenueByMonth,
      topPerformingUsers
    };
  };

  // Get team progress data
  const getTeamProgress = () => {
    const teamMembers = getTeamMembers();
    const currentDateRange = getDateRange();
    
    return teamMembers.map(member => {
      const memberLeads = leads.filter(lead => lead.owner?.id === member.id);
      const memberMeetings = meetings.filter(meeting => meeting.assignedToId === member.id);
      const memberContracts = contracts.filter(contract => contract.createdById === member.id);
      
      // Filter by date range
      let filteredLeads = memberLeads;
      let filteredMeetings = memberMeetings;
      let filteredContracts = memberContracts;
      
      if (currentDateRange.startDate && currentDateRange.endDate) {
        filteredLeads = memberLeads.filter(lead => {
          const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
          return createdDate && createdDate >= currentDateRange.startDate! && createdDate <= currentDateRange.endDate!;
        });
        
        filteredMeetings = memberMeetings.filter(meeting => {
          const meetingDate = meeting.date ? new Date(meeting.date) : null;
          return meetingDate && meetingDate >= currentDateRange.startDate! && meetingDate <= currentDateRange.endDate!;
        });
        
        filteredContracts = memberContracts.filter(contract => {
          const contractDate = contract.contractDate ? new Date(contract.contractDate) : null;
          return contractDate && contractDate >= currentDateRange.startDate! && contractDate <= currentDateRange.endDate!;
        });
      }
      
      const performance = calculateUserPerformance(member, currentDateRange);
      const totalRevenue = filteredContracts.reduce((sum, contract) => sum + contract.dealValue, 0);
      
      // Calculate progress percentages
      const leadsProgress = filteredLeads.length > 0 ? 
        (filteredLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL || lead.status === LeadStatus.OPEN_DEAL).length / filteredLeads.length) * 100 : 0;
      
      const callsProgress = performance.totalCalls > 0 ? 
        (performance.completedCalls / performance.totalCalls) * 100 : 0;
      
      const visitsProgress = performance.totalVisits > 0 ? 
        (performance.completedVisits / performance.totalVisits) * 100 : 0;
      
      const meetingsProgress = performance.totalMeetings > 0 ? 
        (performance.completedMeetings / performance.totalMeetings) * 100 : 0;
      
      return {
        user: member,
        leads: filteredLeads,
        meetings: filteredMeetings,
        contracts: filteredContracts,
        performance: {
          ...performance,
          totalRevenue,
          leadsProgress,
          callsProgress,
          visitsProgress,
          meetingsProgress,
          lastActivity: performance.lastActivity
        }
      };
    });
  };

  // Get selected member progress
  const getSelectedMemberProgress = () => {
    if (!selectedTeamMember) return null;
    const teamProgress = getTeamProgress();
    return teamProgress.find(member => member.user.id === selectedTeamMember);
  };

  const generateSalesMemberReport = (userId: string): SalesMemberReport | null => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const dateRange = getDateRange();
    
    // Determine which users' data to include
    let targetUserIds: string[] = [userId];
    
    // If user is a sales_rep, also include their team members' data
    if (user.role === 'sales_rep') {
      const teamMembers = users.filter(u => 
        u.role === 'sales_rep' && u.teamLeaderId === user.teamLeaderId
      );
      targetUserIds = teamMembers.map(u => u.id);
    }
    
    // If user is a team_leader, include all their team members' data
    if (user.role === 'team_leader') {
      const teamMembers = users.filter(u => 
        u.role === 'sales_rep' && u.teamLeaderId === user.id
      );
      targetUserIds = teamMembers.map(u => u.id);
    }
    
    // Filter data by target users and date range
    const userLeads = leads.filter(lead => {
      const isOwner = lead.owner?.id && targetUserIds.includes(lead.owner.id);
      const isInDateRange = !dateRange.startDate || !dateRange.endDate || 
        (lead.createdAt && new Date(lead.createdAt) >= dateRange.startDate && new Date(lead.createdAt) <= dateRange.endDate);
      return isOwner && isInDateRange;
    });

    const userMeetings = meetings.filter(meeting => {
      const isAssigned = targetUserIds.includes(meeting.assignedToId);
      const isInDateRange = !dateRange.startDate || !dateRange.endDate || 
        (meeting.date && new Date(meeting.date) >= dateRange.startDate && new Date(meeting.date) <= dateRange.endDate);
      return isAssigned && isInDateRange;
    });

    const userContracts = contracts.filter(contract => {
      const isCreator = contract.createdById && targetUserIds.includes(contract.createdById);
      const isInDateRange = !dateRange.startDate || !dateRange.endDate || 
        (contract.contractDate && new Date(contract.contractDate) >= dateRange.startDate && new Date(contract.contractDate) <= dateRange.endDate);
      return isCreator && isInDateRange;
    });

    // Calculate lead metrics
    const totalLeads = userLeads.length;
    const newLeads = userLeads.filter(lead => lead.status === LeadStatus.FRESH_LEAD).length;
    const activeLeads = userLeads.filter(lead => lead.status === LeadStatus.FOLLOW_UP).length;
    const convertedLeads = userLeads.filter(lead => 
      lead.status === LeadStatus.CLOSED_DEAL || lead.status === LeadStatus.OPEN_DEAL
    ).length;
    const lostLeads = userLeads.filter(lead => lead.status === LeadStatus.NOT_INTERSTED_NOW).length;
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate activity metrics (simulated data for calls, visits, follow-ups)
    const totalCalls = Math.floor(Math.random() * 50) + 20; // Simulated data
    const completedCalls = Math.floor(totalCalls * 0.8);
    const missedCalls = totalCalls - completedCalls;
    const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const averageCallDuration = '5-10 minutes'; // Simulated data

    const totalVisits = Math.floor(Math.random() * 20) + 10; // Simulated data
    const completedVisits = Math.floor(totalVisits * 0.9);
    const scheduledVisits = totalVisits - completedVisits;
    const visitCompletionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;

    const totalMeetings = userMeetings.length;
    const completedMeetings = userMeetings.filter(m => m.status === 'Completed').length;
    const scheduledMeetings = totalMeetings - completedMeetings;
    const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;

    // Follow-ups (simulated data)
    const totalFollowUps = Math.floor(Math.random() * 30) + 15;
    const completedFollowUps = Math.floor(totalFollowUps * 0.85);
    const pendingFollowUps = totalFollowUps - completedFollowUps;
    const followUpCompletionRate = totalFollowUps > 0 ? (completedFollowUps / totalFollowUps) * 100 : 0;

    // Sales performance
    const totalReservations = Math.floor(Math.random() * 15) + 5; // Simulated data
    const confirmedReservations = Math.floor(totalReservations * 0.7);
    const pendingReservations = Math.floor(totalReservations * 0.2);
    const cancelledReservations = totalReservations - confirmedReservations - pendingReservations;

    const totalContracts = userContracts.length;
    const signedContracts = userContracts.filter(c => c.status === 'Signed').length;
    const pendingContracts = userContracts.filter(c => c.status === 'Pending').length;
    const cancelledContracts = totalContracts - signedContracts - pendingContracts;

    const totalRevenue = userContracts.reduce((sum, contract) => sum + contract.dealValue, 0);
    const averageDealSize = totalContracts > 0 ? totalRevenue / totalContracts : 0;
    const totalDeals = convertedLeads;
    const closedDeals = userLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length;
    const openDeals = userLeads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length;

    // Lead status breakdown
    const leadsByStatus: Record<string, number> = {};
    userLeads.forEach(lead => {
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
    });

    const leadsBySource: Record<string, number> = {};
    userLeads.forEach(lead => {
      leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    });

    // Recent activities (simulated data)
    const recentActivities = [
      {
        type: 'call' as const,
        date: new Date().toLocaleDateString(),
        description: 'Follow-up call with client',
        leadName: userLeads[0]?.nameEn || userLeads[0]?.nameAr || 'N/A',
        outcome: 'Positive response'
      },
      {
        type: 'meeting' as const,
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        description: 'Property viewing meeting',
        leadName: userLeads[1]?.nameEn || userLeads[1]?.nameAr || 'N/A',
        outcome: 'Scheduled follow-up'
      }
    ];

    // Performance metrics
    const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;
    const averageResponseTime = '2-4 hours'; // Simulated data
    const customerSatisfactionScore = Math.floor(Math.random() * 20) + 80; // Simulated data

    // Detailed data (simulated for calls, visits, follow-ups)
    const calls = userLeads.slice(0, 5).map(lead => ({
      leadId: lead.id || '',
      leadName: lead.nameEn || lead.nameAr || 'N/A',
      date: new Date().toLocaleDateString(),
      duration: '8 minutes',
      outcome: 'Positive',
      notes: 'Client interested in property details'
    }));

    const visits = userLeads.slice(0, 3).map(lead => ({
      leadId: lead.id || '',
      leadName: lead.nameEn || lead.nameAr || 'N/A',
      date: new Date().toLocaleDateString(),
      status: 'Completed',
      notes: 'Property viewing completed successfully'
    }));

    const followUps = userLeads.slice(0, 4).map(lead => ({
      leadId: lead.id || '',
      leadName: lead.nameEn || lead.nameAr || 'N/A',
      date: new Date().toLocaleDateString(),
      type: 'Email',
      status: 'Completed',
      notes: 'Sent property brochure'
    }));

    return {
      user,
      period: `${dateRange.startDate?.toLocaleDateString() || 'All Time'} - ${dateRange.endDate?.toLocaleDateString() || 'Present'}`,
      dateRange,
      totalLeads,
      newLeads,
      activeLeads,
      convertedLeads,
      lostLeads,
      leadConversionRate,
      totalCalls,
      completedCalls,
      missedCalls,
      callCompletionRate,
      averageCallDuration,
      totalVisits,
      completedVisits,
      scheduledVisits,
      visitCompletionRate,
      totalMeetings,
      completedMeetings,
      scheduledMeetings,
      meetingCompletionRate,
      totalFollowUps,
      completedFollowUps,
      pendingFollowUps,
      followUpCompletionRate,
      totalReservations,
      confirmedReservations,
      pendingReservations,
      cancelledReservations,
      totalContracts,
      signedContracts,
      pendingContracts,
      cancelledContracts,
      totalRevenue,
      averageDealSize,
      totalDeals,
      closedDeals,
      openDeals,
      leadsByStatus,
      leadsBySource,
      recentActivities,
      conversionRate,
      averageResponseTime,
      customerSatisfactionScore,
      leads: userLeads,
      meetings: userMeetings,
      contracts: userContracts,
      calls,
      visits,
      followUps
    };
  };

  // Export functions
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const currentDateRange = getDateRange();
      let filename = '';
      
      switch (exportType) {
        case 'team':
          if (isTeamLeader) {
            const teamReport = generateTeamLeaderReport();
            filename = exportTeamLeaderReport(teamReport, currentDateRange);
          }
          break;
        case 'sales':
          const salesReport = generateSalesReport();
          filename = exportSalesReport(salesReport, currentDateRange);
          break;
        case 'user':
          filename = exportUserPerformanceReport(users, leads, meetings, contracts, currentDateRange);
          break;
        case 'salesMember':
          // Always generate report for current user
          // For team leaders: shows their team members' data
          // For team members: shows their own data + team members data
          if (currentUser?.id) {
            const salesMemberReport = generateSalesMemberReport(currentUser.id);
            if (salesMemberReport) {
              filename = exportSalesMemberReport(salesMemberReport);
            }
          }
          break;
        case 'allSalesMembers':
          // Generate reports for all accessible sales members
          const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
          const allReports = allSalesMembers
            .map(user => generateSalesMemberReport(user.id))
            .filter(report => report !== null) as SalesMemberReport[];
          
          if (allReports.length > 0) {
            filename = exportAllSalesMembersReport(allReports, currentDateRange);
          }
          break;
      }
      
      toast.success(t('export.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('export.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  // Get date range based on selected timeframe
  const getDateRange = (): DateRange => {
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
        const startOfWeek = new Date(startOfDay);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
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
      case 'last7days':
        const last7Start = new Date(today);
        last7Start.setDate(last7Start.getDate() - 7);
        last7Start.setHours(0, 0, 0, 0);
        return {
          startDate: last7Start,
          endDate: endOfDay
        };
      case 'last30days':
        const last30Start = new Date(today);
        last30Start.setDate(last30Start.getDate() - 30);
        last30Start.setHours(0, 0, 0, 0);
        return {
          startDate: last30Start,
          endDate: endOfDay
        };
      case 'last3months':
        const last3MonthsStart = new Date(today);
        last3MonthsStart.setMonth(last3MonthsStart.getMonth() - 3);
        last3MonthsStart.setHours(0, 0, 0, 0);
        return {
          startDate: last3MonthsStart,
          endDate: endOfDay
        };
      case 'last6months':
        const last6MonthsStart = new Date(today);
        last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6);
        last6MonthsStart.setHours(0, 0, 0, 0);
        return {
          startDate: last6MonthsStart,
          endDate: endOfDay
        };
      case 'yearToDate':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          startDate: yearStart,
          endDate: endOfDay
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

  // Calculate user performance based on date range
  const calculateUserPerformance = (user: any, dateRange: DateRange): UserPerformance => {
    const { startDate, endDate } = dateRange;
    
    // Filter data by date range if specified
    let userLeads = leads.filter(lead => lead.owner?.id === user.id);
    let userMeetings = meetings.filter(meeting => meeting.assignedToId === user.id);
    let userContracts = contracts.filter(contract => contract.createdById === user.id);

    // Apply date filtering
    if (startDate && endDate) {
      userLeads = userLeads.filter(lead => {
        const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
        const lastCallDate = lead.lastCallDate ? new Date(lead.lastCallDate) : null;
        const lastVisitDate = lead.lastVisitDate ? new Date(lead.lastVisitDate) : null;
        
        return (createdDate && createdDate >= startDate && createdDate <= endDate) ||
               (lastCallDate && lastCallDate >= startDate && lastCallDate <= endDate) ||
               (lastVisitDate && lastVisitDate >= startDate && lastVisitDate <= endDate);
      });

      userMeetings = userMeetings.filter(meeting => {
        const meetingDate = meeting.date ? new Date(meeting.date) : null;
        return meetingDate && meetingDate >= startDate && meetingDate <= endDate;
      });

      userContracts = userContracts.filter(contract => {
        const contractDate = contract.contractDate ? new Date(contract.contractDate) : null;
        return contractDate && contractDate >= startDate && contractDate <= endDate;
      });
    }

    // Calculate calls within date range
    let totalCalls = 0;
    let completedCalls = 0;
    const userCalls: Array<{
      leadId: string;
      leadName: string;
      date: string;
      duration: string;
      outcome: string;
      notes: string;
    }> = [];

    userLeads.forEach(lead => {
      if (lead.calls && Array.isArray(lead.calls)) {
        const callsInRange = lead.calls.filter(call => {
          if (!startDate || !endDate) return true;
          const callDate = call.date ? new Date(call.date) : null;
          return callDate && callDate >= startDate && callDate <= endDate;
        });
        
        totalCalls += callsInRange.length;
        
        callsInRange.forEach(call => {
          const isCompleted = lead.status && lead.status.toLowerCase() !== 'not answered';
          if (isCompleted) completedCalls++;
          
          userCalls.push({
            leadId: lead.id || '',
            leadName: lead.nameEn || lead.nameAr || 'N/A',
            date: call.date || 'N/A',
            duration: call.duration || 'N/A',
            outcome: isCompleted ? 'Completed' : 'Not Answered',
            notes: call.notes || 'N/A'
          });
        });
      }
    });

    // Calculate visits within date range
    let totalVisits = 0;
    let completedVisits = 0;
    const userVisits: Array<{
      leadId: string;
      leadName: string;
      date: string;
      status: string;
      notes: string;
    }> = [];

    userLeads.forEach(lead => {
      if (lead.visits && Array.isArray(lead.visits)) {
        const visitsInRange = lead.visits.filter(visit => {
          if (!startDate || !endDate) return true;
          const visitDate = visit.date ? new Date(visit.date) : null;
          return visitDate && visitDate >= startDate && visitDate <= endDate;
        });
        
        totalVisits += visitsInRange.length;
        
        visitsInRange.forEach(visit => {
          const isCompleted = visit.status === 'Completed';
          if (isCompleted) completedVisits++;
          
          userVisits.push({
            leadId: lead.id || '',
            leadName: lead.nameEn || lead.nameAr || 'N/A',
            date: visit.date || 'N/A',
            status: visit.status || 'Scheduled',
            notes: visit.notes || 'N/A'
          });
        });
      }
    });

    // Calculate follow-ups within date range (simulated data since followUps property doesn't exist in Lead interface)
    let totalFollowUps = 0;
    let completedFollowUps = 0;
    const userFollowUps: Array<{
      leadId: string;
      leadName: string;
      date: string;
      type: string;
      status: string;
      notes: string;
    }> = [];

    // Simulate follow-ups based on lead activity
    userLeads.forEach(lead => {
      const followUpCount = Math.floor(Math.random() * 3) + 1; // 1-3 follow-ups per lead
      totalFollowUps += followUpCount;
      
      for (let i = 0; i < followUpCount; i++) {
        const isCompleted = Math.random() > 0.3; // 70% completion rate
        if (isCompleted) completedFollowUps++;
        
        userFollowUps.push({
          leadId: lead.id || '',
          leadName: lead.nameEn || lead.nameAr || 'N/A',
          date: lead.lastCallDate || lead.createdAt || 'N/A',
          type: ['Phone Call', 'Email', 'SMS', 'WhatsApp'][Math.floor(Math.random() * 4)],
          status: isCompleted ? 'Completed' : 'Pending',
          notes: `Follow-up ${i + 1} for ${lead.nameEn || lead.nameAr || 'Lead'}`
        });
      }
    });

    const totalMeetings = userMeetings.length;
    const completedMeetings = userMeetings.filter(meeting => meeting.status === 'Completed').length;

    const closedDeals = userLeads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length;
    const openDeals = userLeads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length;
    const conversionRate = userLeads.length > 0 ?
      ((closedDeals + openDeals) / userLeads.length) * 100 : 0;

    const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const visitCompletionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;
    const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0;
    const followUpCompletionRate = totalFollowUps > 0 ? (completedFollowUps / totalFollowUps) * 100 : 0;

    // Calculate revenue
    const totalRevenue = userContracts.reduce((sum, contract) => sum + contract.dealValue, 0);
    const averageDealSize = userContracts.length > 0 ? totalRevenue / userContracts.length : 0;

    // Get last activity date within the date range
    const allActivities = [
      ...userLeads.map(lead => ({ date: lead.lastCallDate, type: 'call', leadName: lead.nameEn || lead.nameAr || '' })),
      ...userLeads.map(lead => ({ date: lead.lastVisitDate, type: 'visit', leadName: lead.nameEn || lead.nameAr || '' })),
      ...userMeetings.map(meeting => ({ date: meeting.date, type: 'meeting', leadName: meeting.client }))
    ].filter(activity => {
      if (!activity.date || activity.date === '------') return false;
      if (!startDate || !endDate) return true;
      const activityDate = new Date(activity.date);
      return !isNaN(activityDate.getTime()) && activityDate >= startDate && activityDate <= endDate;
    });

    const lastActivity = allActivities.length > 0
      ? String(allActivities.sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())[0].date)
      : 'No activity';

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
      totalFollowUps,
      completedFollowUps,
      closedDeals,
      openDeals,
      conversionRate: Math.round(conversionRate * 10) / 10,
      callCompletionRate: Math.round(callCompletionRate * 10) / 10,
      visitCompletionRate: Math.round(visitCompletionRate * 10) / 10,
      meetingCompletionRate: Math.round(meetingCompletionRate * 10) / 10,
      followUpCompletionRate: Math.round(followUpCompletionRate * 10) / 10,
      totalRevenue,
      averageDealSize,
      lastActivity: lastActivity || 'No activity',
      calls: userCalls,
      visits: userVisits,
      followUps: userFollowUps,
      leads: userLeads,
      meetings: userMeetings,
      contracts: userContracts
    };
  };

  // Calculate overall metrics
  const calculateOverallMetrics = (): PerformanceMetrics => {
    const accessibleUsers = getAccessibleUsers();
    const currentDateRange = getDateRange();
    const performances = accessibleUsers.map(user => calculateUserPerformance(user, currentDateRange));

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

  // Get filtered and sorted performances
  const getFilteredPerformances = () => {
    const currentDateRange = getDateRange();
    let performances = getAccessibleUsers().map(user => calculateUserPerformance(user, currentDateRange));

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

    // Filter by activity type
    if (activityFilter !== 'all') {
      performances = performances.filter(p => {
        switch (activityFilter) {
          case 'calls':
            return p.totalCalls > 0;
          case 'visits':
            return p.totalVisits > 0;
          case 'meetings':
            return p.totalMeetings > 0;
          case 'deals':
            return p.closedDeals > 0;
          default:
            return true;
        }
      });
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

  const currentDateRange = getDateRange();
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
            {isTeamLeader && (
              <button
                onClick={() => setShowTeamLeaderView(!showTeamLeaderView)}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${showTeamLeaderView
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <UserCheck className="h-4 w-4 inline mr-2" />
                <span className="hidden xs:inline">{t('teamLeader.title')}</span>
                <span className="xs:hidden">Team</span>
              </button>
            )}
          </div>

          {/* Export Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex gap-2">
                              <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as 'team' | 'sales' | 'user' | 'salesMember' | 'allSalesMembers')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="team">{t('export.reportTypes.teamLeader')}</option>
                  <option value="sales">{t('export.reportTypes.sales')}</option>
                  <option value="user">{t('export.reportTypes.userPerformance')}</option>
                  <option value="salesMember">{t('export.reportTypes.salesMember')}</option>
                  <option value="allSalesMembers">{t('export.reportTypes.allSalesMembers')}</option>
                </select>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? t('export.exporting') : t('export.downloadReport')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Panel */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Date Range Display */}
          {currentDateRange.startDate && currentDateRange.endDate && (
            <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">
                  {currentDateRange.startDate.toLocaleDateString()} - {currentDateRange.endDate.toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedTimeframe('month');
                  setCustomDateRange({ startDate: '', endDate: '' });
                }}
                className="text-blue-600 hover:text-blue-800 transition-colors"
                title="Clear date filter"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Enhanced Filters and Controls */}
          <div className="flex flex-col gap-4">
            {/* Main Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                >
                  <option value="today">{t('timeframes.today') || 'Today'}</option>
                  <option value="week">{t('timeframes.thisWeek') || 'This Week'}</option>
                  <option value="month">{t('timeframes.thisMonth') || 'This Month'}</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last3months">Last 3 Months</option>
                  <option value="last6months">Last 6 Months</option>
                  <option value="yearToDate">Year to Date</option>
                  <option value="custom">{t('timeframes.customRange') || 'Custom Range'}</option>
                </select>

                {/* Activity Type Filter */}
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                >
                  <option value="all">All Activities</option>
                  <option value="calls">Calls Only</option>
                  <option value="visits">Visits Only</option>
                  <option value="meetings">Meetings Only</option>
                  <option value="deals">Deals Only</option>
                </select>

                {/* Custom Date Range Picker */}
                {selectedTimeframe === 'custom' && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="text-sm border-none focus:outline-none focus:ring-0 w-full sm:w-auto"
                      placeholder="Start Date"
                    />
                    <span className="text-gray-400 text-sm hidden sm:inline">{t('timeframes.to') || 'to'}</span>
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

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    isFilterExpanded ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedTimeframe('month');
                    setCustomDateRange({ startDate: '', endDate: '' });
                    setActivityFilter('all');
                    setSearchTerm('');
                    setSelectedUser('');
                  }}
                  className="px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center gap-1"
                  title="Reset all filters"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* Sort and Display Controls */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowActivityFeed(!showActivityFeed)}
                className={`px-3 py-1 rounded text-sm transition-colors ${showActivityFeed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                <Activity className="h-4 w-4 inline mr-1" />
                <span className="hidden xs:inline">{t('filters.activityFeed') || 'Activity Feed'}</span>
                <span className="xs:hidden">Feed</span>
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="performance">{t('filters.sortByPerformance') || 'Performance'}</option>
                <option value="name">{t('filters.sortByName') || 'Name'}</option>
                <option value="activity">{t('filters.sortByActivity') || 'Activity'}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded hover:bg-gray-100"
              >
                {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
              </button>
            </div>

            {/* Advanced Filters (Expandable) */}
            {isFilterExpanded && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Filters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Performance Threshold Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Conversion Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 20"
                    />
                  </div>
                  
                  {/* Role Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                    <select className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">All Roles</option>
                      <option value="sales_rep">Sales Rep</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="sales_admin">Sales Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Activity Level Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Activity Level</label>
                    <select className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Any Level</option>
                      <option value="high">High Activity</option>
                      <option value="medium">Medium Activity</option>
                      <option value="low">Low Activity</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {showActivityFeed && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            {t('activityFeed.recentActivityFeed') || 'Recent Activity Feed'}
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(() => {
              const allActivities = [
                ...leads.map(lead => ({
                  type: 'lead',
                  action: t('activityFeed.leadUpdated') || 'Lead Updated',
                  user: users.find(u => u.id === lead.assignedToId)?.name || '',
                  details: `${lead.nameEn || lead.nameAr || ''} - ${lead.status}`,
                  date: String(lead.lastCallDate || lead.createdAt || ''),
                  priority: lead.status === LeadStatus.CLOSED_DEAL ? 'high' : 'medium'
                })),
                ...meetings.map(meeting => ({
                  type: 'meeting',
                  action: t('activityFeed.meeting') || 'Meeting',
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
                    <div className="text-xs text-gray-500">{t('activityFeed.by') || 'by'} {activity.user} • {activity.date}</div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Team Leader View */}
      {showTeamLeaderView && isTeamLeader && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              {t('teamLeader.title')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTeamMemberView('overview')}
                className={`px-3 py-1 rounded text-sm transition-colors ${teamMemberView === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {t('teamLeader.teamOverview')}
              </button>
              <button
                onClick={() => setTeamMemberView('member')}
                className={`px-3 py-1 rounded text-sm transition-colors ${teamMemberView === 'member'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {t('teamLeader.memberPerformance')}
              </button>
              <button
                onClick={() => setExportType('team')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                {t('teamLeader.exportTeamReport')}
              </button>
            </div>
          </div>

          {teamMemberView === 'overview' ? (
            <>
              {/* Team Overview */}
              {(() => {
                const teamReport = generateTeamLeaderReport();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">{t('teamLeader.teamSize')}</p>
                          <p className="text-2xl font-bold text-blue-900">{teamReport.teamMembers.length}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">{t('teamLeader.teamRevenue')}</p>
                          <p className="text-2xl font-bold text-green-900">{teamReport.teamPerformance.totalRevenue.toLocaleString()} EGP</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">{t('teamLeader.teamConversion')}</p>
                          <p className="text-2xl font-bold text-purple-900">{teamReport.teamPerformance.conversionRate.toFixed(1)}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Total Leads</p>
                          <p className="text-2xl font-bold text-orange-900">{teamReport.teamPerformance.totalLeads}</p>
                        </div>
                        <Target className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Team Members List */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('teamLeader.teamMembers')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const teamProgress = getTeamProgress();
                    if (teamProgress.length === 0) {
                      return (
                        <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">No team members found</p>
                              <p className="text-sm text-yellow-700">Please ensure team members are properly assigned to you as their team leader.</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return teamProgress.map((member) => (
                      <div key={member.user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {member.user.name.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                              <div className="text-xs text-gray-500">{member.user.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTeamMember(member.user.id);
                              setTeamMemberView('member');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {t('teamLeader.viewProgress')}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Leads:</span>
                            <span className="font-medium ml-1">{member.performance.totalLeads}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Deals:</span>
                            <span className="font-medium ml-1">{member.performance.closedDeals}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Revenue:</span>
                            <span className="font-medium ml-1">{member.performance.totalRevenue.toLocaleString()} EGP</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Rate:</span>
                            <span className="font-medium ml-1">{member.performance.conversionRate.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{t('teamLeader.leadsProgress')}</span>
                              <span>{member.performance.leadsProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${member.performance.leadsProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{t('teamLeader.callsProgress')}</span>
                              <span>{member.performance.callsProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${member.performance.callsProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </>
          ) : (
            /* Member Progress View */
            <div>
              {/* Member Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('teamLeader.selectMember')}</label>
                <select
                  value={selectedTeamMember}
                  onChange={(e) => setSelectedTeamMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('teamLeader.chooseMember')}</option>
                  {getTeamMembers().map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              {/* Selected Member Progress */}
              {selectedTeamMember && (() => {
                const memberProgress = getSelectedMemberProgress();
                if (!memberProgress) return null;

                // At this point memberProgress is guaranteed to be non-null
                const progress = memberProgress;

                return (
                  <div className="space-y-6">
                    {/* Member Header */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                            {progress.user.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-lg font-semibold text-gray-900">{progress.user.name}</div>
                            <div className="text-sm text-gray-500">{progress.user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setTeamMemberView('overview')}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">{t('tableHeaders.leads')}</p>
                            <p className="text-2xl font-bold text-blue-900">{progress.performance.totalLeads}</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">{t('teamLeader.revenue')}</p>
                            <p className="text-2xl font-bold text-green-900">{progress.performance.totalRevenue.toLocaleString()} EGP</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">{t('teamLeader.conversionRate')}</p>
                            <p className="text-2xl font-bold text-purple-900">{progress.performance.conversionRate.toFixed(1)}%</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">{t('teamLeader.closedDeals')}</p>
                            <p className="text-2xl font-bold text-orange-900">{progress.performance.closedDeals}</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>
                    </div>

                    {/* Detailed Progress Bars */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('teamLeader.progressBreakdown')}</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>{t('teamLeader.leadsProgress')}</span>
                            <span>{progress.performance.leadsProgress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${progress.performance.leadsProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {progress.leads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL || lead.status === LeadStatus.OPEN_DEAL).length} 
                            of {progress.leads.length} {t('teamLeader.leadsConverted')}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>{t('teamLeader.callsProgress')}</span>
                            <span>{progress.performance.callsProgress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${progress.performance.callsProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {progress.performance.completedCalls} of {progress.performance.totalCalls} {t('teamLeader.callsCompleted')}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>{t('teamLeader.visitsProgress')}</span>
                            <span>{progress.performance.visitsProgress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${progress.performance.visitsProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {progress.performance.completedVisits} of {progress.performance.totalVisits} {t('teamLeader.visitsCompleted')}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                            <span>{t('teamLeader.meetingsProgress')}</span>
                            <span>{progress.performance.meetingsProgress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-orange-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${progress.performance.meetingsProgress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {progress.performance.completedMeetings} of {progress.performance.totalMeetings} {t('teamLeader.meetingsCompleted')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">{t('teamLeader.recentActivity')}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{t('teamLeader.lastActivity')}:</span>
                          <span className="font-medium">{progress.performance.lastActivity}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{t('teamLeader.totalMeetings')}:</span>
                          <span className="font-medium">{progress.meetings.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{t('teamLeader.totalContracts')}:</span>
                          <span className="font-medium">{progress.contracts.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {viewMode === 'dashboard' ? (
        <>
          {/* Sales Member Report View */}
          {exportType === 'salesMember' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{t('export.reportTypes.salesMember')}</h3>
                <div className="flex items-center gap-2">
                                     <div className="text-sm text-gray-500">
                     {currentUser?.role === 'team_leader' ? 'Team Members Performance Report' : 'Team Performance Report'}
                   </div>
                </div>
              </div>

                            {/* Sales Member Report Content - All Users Combined Data */}
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">All Sales Members Combined Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                      const totalLeads = allSalesMembers.reduce((sum, user) => {
                        const report = generateSalesMemberReport(user.id);
                        return sum + (report?.totalLeads || 0);
                      }, 0);
                      const totalRevenue = allSalesMembers.reduce((sum, user) => {
                        const report = generateSalesMemberReport(user.id);
                        return sum + (report?.totalRevenue || 0);
                      }, 0);
                      const totalContracts = allSalesMembers.reduce((sum, user) => {
                        const report = generateSalesMemberReport(user.id);
                        return sum + (report?.totalContracts || 0);
                      }, 0);
                      const avgConversion = allSalesMembers.reduce((sum, user) => {
                        const report = generateSalesMemberReport(user.id);
                        return sum + (report?.conversionRate || 0);
                      }, 0) / allSalesMembers.length;
                      
                      return (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{allSalesMembers.length}</div>
                            <div className="text-sm text-gray-600">Total Members</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{totalLeads}</div>
                            <div className="text-sm text-gray-600">Total Leads</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{totalRevenue.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Total Revenue (EGP)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{avgConversion.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Avg Conversion</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Combined Key Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                    const totalCalls = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.totalCalls || 0);
                    }, 0);
                    const completedCalls = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.completedCalls || 0);
                    }, 0);
                    const totalMeetings = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.totalMeetings || 0);
                    }, 0);
                    const completedMeetings = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.completedMeetings || 0);
                    }, 0);
                    const totalVisits = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.totalVisits || 0);
                    }, 0);
                    const completedVisits = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.completedVisits || 0);
                    }, 0);
                    const totalContracts = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.totalContracts || 0);
                    }, 0);
                    const signedContracts = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.signedContracts || 0);
                    }, 0);
                    const totalRevenue = allSalesMembers.reduce((sum, user) => {
                      const report = generateSalesMemberReport(user.id);
                      return sum + (report?.totalRevenue || 0);
                    }, 0);
                    const avgDealSize = totalContracts > 0 ? totalRevenue / totalContracts : 0;

                    return (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-600">Total Calls</p>
                              <p className="text-2xl font-bold text-blue-900">{totalCalls}</p>
                              <p className="text-xs text-blue-600">{completedCalls} completed ({totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(1) : 0}%)</p>
                            </div>
                            <Phone className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-600">Total Meetings</p>
                              <p className="text-2xl font-bold text-green-900">{totalMeetings}</p>
                              <p className="text-xs text-green-600">{completedMeetings} completed ({totalMeetings > 0 ? (completedMeetings / totalMeetings * 100).toFixed(1) : 0}%)</p>
                            </div>
                            <Calendar className="h-8 w-8 text-green-600" />
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-purple-600">Total Visits</p>
                              <p className="text-2xl font-bold text-purple-900">{totalVisits}</p>
                              <p className="text-xs text-purple-600">{completedVisits} completed ({totalVisits > 0 ? (completedVisits / totalVisits * 100).toFixed(1) : 0}%)</p>
                            </div>
                            <MapPin className="h-8 w-8 text-purple-600" />
                          </div>
                        </div>
                        
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-orange-600">Total Contracts</p>
                              <p className="text-2xl font-bold text-orange-900">{totalContracts}</p>
                              <p className="text-xs text-orange-600">{signedContracts} signed, {avgDealSize.toLocaleString()} avg</p>
                            </div>
                            <FileText className="h-8 w-8 text-orange-600" />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Combined Activity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Combined Activity Summary</h4>
                    <div className="space-y-3">
                      {(() => {
                        const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                        const totalCalls = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalCalls || 0);
                        }, 0);
                        const completedCalls = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.completedCalls || 0);
                        }, 0);
                        const totalVisits = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalVisits || 0);
                        }, 0);
                        const completedVisits = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.completedVisits || 0);
                        }, 0);
                        const totalMeetings = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalMeetings || 0);
                        }, 0);
                        const completedMeetings = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.completedMeetings || 0);
                        }, 0);
                        const totalFollowUps = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalFollowUps || 0);
                        }, 0);
                        const completedFollowUps = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.completedFollowUps || 0);
                        }, 0);

                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Calls</span>
                              <span className="text-sm font-medium">{completedCalls}/{totalCalls} ({totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(1) : 0}%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Visits</span>
                              <span className="text-sm font-medium">{completedVisits}/{totalVisits} ({totalVisits > 0 ? (completedVisits / totalVisits * 100).toFixed(1) : 0}%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Meetings</span>
                              <span className="text-sm font-medium">{completedMeetings}/{totalMeetings} ({totalMeetings > 0 ? (completedMeetings / totalMeetings * 100).toFixed(1) : 0}%)</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Follow-ups</span>
                              <span className="text-sm font-medium">{completedFollowUps}/{totalFollowUps} ({totalFollowUps > 0 ? (completedFollowUps / totalFollowUps * 100).toFixed(1) : 0}%)</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Combined Sales Performance</h4>
                    <div className="space-y-3">
                      {(() => {
                        const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                        const totalReservations = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalReservations || 0);
                        }, 0);
                        const confirmedReservations = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.confirmedReservations || 0);
                        }, 0);
                        const totalContracts = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalContracts || 0);
                        }, 0);
                        const signedContracts = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.signedContracts || 0);
                        }, 0);
                        const totalRevenue = allSalesMembers.reduce((sum, user) => {
                          const report = generateSalesMemberReport(user.id);
                          return sum + (report?.totalRevenue || 0);
                        }, 0);
                        const avgResponseTime = "2-4 hours"; // Average across all users

                        return (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Reservations</span>
                              <span className="text-sm font-medium">{confirmedReservations}/{totalReservations}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Contracts</span>
                              <span className="text-sm font-medium">{signedContracts}/{totalContracts}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Revenue</span>
                              <span className="text-sm font-medium">{totalRevenue.toLocaleString()} EGP</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Avg Response Time</span>
                              <span className="text-sm font-medium">{avgResponseTime}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Combined Recent Activities */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Combined Recent Activities</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(() => {
                      const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                      const allActivities = allSalesMembers.flatMap(user => {
                        const report = generateSalesMemberReport(user.id);
                        return report?.recentActivities || [];
                      }).slice(0, 15); // Show top 15 activities

                      return allActivities.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              activity.type === 'call' ? 'bg-blue-500' :
                              activity.type === 'meeting' ? 'bg-green-500' :
                              activity.type === 'visit' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500">{activity.leadName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{activity.date}</p>
                            <p className="text-xs text-gray-600">{activity.outcome}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Combined Lead Status Breakdown */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Combined Lead Status Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                      const combinedLeadsByStatus: Record<string, number> = {};
                      
                      allSalesMembers.forEach(user => {
                        const report = generateSalesMemberReport(user.id);
                        if (report) {
                          Object.entries(report.leadsByStatus).forEach(([status, count]) => {
                            combinedLeadsByStatus[status] = (combinedLeadsByStatus[status] || 0) + count;
                          });
                        }
                      });

                      return Object.entries(combinedLeadsByStatus).map(([status, count]) => (
                        <div key={status} className="text-center">
                          <div className="font-bold text-blue-600">{count}</div>
                          <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Combined Lead Source Breakdown */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Combined Lead Source Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                      const combinedLeadsBySource: Record<string, number> = {};
                      
                      allSalesMembers.forEach(user => {
                        const report = generateSalesMemberReport(user.id);
                        if (report) {
                          Object.entries(report.leadsBySource).forEach(([source, count]) => {
                            combinedLeadsBySource[source] = (combinedLeadsBySource[source] || 0) + count;
                          });
                        }
                      });

                      return Object.entries(combinedLeadsBySource).map(([source, count]) => (
                        <div key={source} className="text-center">
                          <div className="font-bold text-green-600">{count}</div>
                          <div className="text-sm text-gray-600 capitalize">{source}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Combined Detailed Data Lists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Combined Leads List */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3">Combined Recent Leads</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(() => {
                        const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                        const allLeads = allSalesMembers.flatMap(user => {
                          const report = generateSalesMemberReport(user.id);
                          return report?.leads || [];
                        }).slice(0, 10);

                        return allLeads.map((lead, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {lead.nameEn || lead.nameAr || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">{lead.contact} • {lead.email || 'No email'}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                Budget: {lead.budget.toLocaleString()} EGP • Source: {lead.source}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                lead.status === 'closed_deal' ? 'bg-green-100 text-green-800' :
                                lead.status === 'open_deal' ? 'bg-blue-100 text-blue-800' :
                                lead.status === 'fresh_lead' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.status.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Combined Meetings List */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3">Combined Recent Meetings</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(() => {
                        const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                        const allMeetings = allSalesMembers.flatMap(user => {
                          const report = generateSalesMemberReport(user.id);
                          return report?.meetings || [];
                        }).slice(0, 10);

                        return allMeetings.map((meeting, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{meeting.title}</div>
                              <div className="text-sm text-gray-500">{meeting.client}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {meeting.date ? new Date(meeting.date).toLocaleDateString() : 'N/A'} • {meeting.time} • {meeting.duration}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                meeting.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                meeting.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {meeting.status}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 capitalize">
                                {meeting.type}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Combined Contracts List */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-3">Combined Recent Contracts</h5>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(() => {
                        const allSalesMembers = getAccessibleUsers().filter(user => user.role === 'sales_rep' || user.role === 'team_leader');
                        const allContracts = allSalesMembers.flatMap(user => {
                          const report = generateSalesMemberReport(user.id);
                          return report?.contracts || [];
                        }).slice(0, 10);

                        return allContracts.map((contract, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {contract.lead?.nameEn || contract.lead?.nameAr || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {contract.inventory?.title || 'Property N/A'}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {contract.contractDate ? new Date(contract.contractDate).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-green-600">
                                {contract.dealValue.toLocaleString()} EGP
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium mt-1 ${
                                contract.status === 'Signed' ? 'bg-green-100 text-green-800' :
                                contract.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {contract.status}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.totalUsers') || 'Total Users'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.totalLeads') || 'Total Leads'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.totalLeads}</p>
                  <p className="text-xs text-gray-500">{t('metrics.assigned') || 'assigned'}</p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.avgConversion') || 'Avg Conversion'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.averageConversionRate}%</p>
                  <p className="text-xs text-gray-500">{t('metrics.rate') || 'rate'}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('metrics.callCompletion') || 'Call Completion'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.averageCallCompletionRate}%</p>
                  <p className="text-xs text-gray-500">{t('metrics.rate') || 'rate'}</p>
                </div>
                <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
            {/* Performance Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('charts.performanceMetrics') || 'Performance Metrics'}</h3>
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('charts.roleDistribution') || 'Role Distribution'}</h3>
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('charts.performanceTrends') || 'Performance Trends'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{metrics.averageConversionRate}%</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('charts.avgConversionRate') || 'Avg Conversion Rate'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageConversionRate > 50 ? (t('performance.excellent') || 'Excellent') :
                    metrics.averageConversionRate > 30 ? (t('performance.good') || 'Good') :
                      metrics.averageConversionRate > 15 ? (t('performance.fair') || 'Fair') : (t('performance.needsImprovement') || 'Needs Improvement')}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{metrics.averageCallCompletionRate}%</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('charts.avgCallCompletion') || 'Avg Call Completion'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageCallCompletionRate > 80 ? (t('performance.outstanding') || 'Outstanding') :
                    metrics.averageCallCompletionRate > 60 ? (t('performance.good') || 'Good') :
                      metrics.averageCallCompletionRate > 40 ? (t('performance.fair') || 'Fair') : (t('performance.needsWork') || 'Needs Work')}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{metrics.averageMeetingCompletionRate}%</div>
                <div className="text-xs sm:text-sm text-gray-600">{t('charts.avgMeetingCompletion') || 'Avg Meeting Completion'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.averageMeetingCompletionRate > 90 ? (t('performance.perfect') || 'Perfect') :
                    metrics.averageMeetingCompletionRate > 70 ? (t('performance.good') || 'Good') :
                      metrics.averageMeetingCompletionRate > 50 ? (t('performance.fair') || 'Fair') : (t('performance.needsAttention') || 'Needs Attention')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.user') || 'User'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.role') || 'Role'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.leads') || 'Leads'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.calls') || 'Calls'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.visits') || 'Visits'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.meetings') || 'Meetings'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.deals') || 'Deals'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.conversion') || 'Conversion'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.lastActivity') || 'Last Activity'}</th>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performance.role === 'admin' ? 'bg-red-100 text-red-800' :
                        performance.role === 'sales_admin' ? 'bg-purple-100 text-purple-800' :
                          performance.role === 'team_leader' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                        }`}>
                        {translateUserRole(performance.role)}
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performance.role === 'admin' ? 'bg-red-100 text-red-800' :
                        performance.role === 'sales_admin' ? 'bg-purple-100 text-purple-800' :
                          performance.role === 'team_leader' ? 'bg-blue-100 text-blue-800' :
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