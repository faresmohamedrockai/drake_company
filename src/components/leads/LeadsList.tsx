import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Eye, Calendar as CalendarIcon, Edit, Trash2, X, ArrowUp, ArrowDown, Minus, Phone, Check, Star, TrendingUp, TrendingDown, MessageSquare, AlertTriangle, ThumbsUp, ThumbsDown, Clock, HelpCircle, User as UserIcon } from 'lucide-react';
import { Filter } from 'lucide-react';
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';
import EditLeadModal from './EditLeadModal';
import { useLocation } from 'react-router-dom';
import UserFilterSelect from './UserFilterSelect';

import { Lead, LeadStatus, Property } from '../../types';
import { useQuery } from '@tanstack/react-query';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { User } from '../../types'
import type { PaymentPlan, Project } from '../inventory/ProjectsTab';

// Icon and color mappings for status cards
const statusCardIcons: Record<string, JSX.Element> = {
  all: <UserIcon className="h-6 w-6 text-white" />, // All Leads
  duplicate: <AlertTriangle className="h-6 w-6 text-white" />, // Duplicate
  fresh_lead: <Star className="h-6 w-6 text-white" />, // Fresh
  cold_call: <Phone className="h-6 w-6 text-white" />, // Cold Call
  follow_up: <MessageSquare className="h-6 w-6 text-white" />, // Follow Up
  scheduled_visit: <CalendarIcon className="h-6 w-6 text-white" />, // Visit
  open_deal: <Check className="h-6 w-6 text-white" />, // Open Deal
  closed_deal: <Check className="h-6 w-6 text-white" />, // Closed Deal
  cancellation: <X className="h-6 w-6 text-white" />, // Cancellation
  no_answer: <HelpCircle className="h-6 w-6 text-white" />, // No Answer
  not_interested_now: <ThumbsDown className="h-6 w-6 text-white" />, // Not Interested
  reservation: <Clock className="h-6 w-6 text-white" />, // Reservation
};
const statusCardColors: Record<string, string> = {
  all: 'bg-blue-500',
  duplicate: 'bg-yellow-500',
  fresh_lead: 'bg-blue-400',
  cold_call: 'bg-indigo-500',
  follow_up: 'bg-green-500',
  scheduled_visit: 'bg-purple-500',
  open_deal: 'bg-green-600',
  closed_deal: 'bg-green-800',
  cancellation: 'bg-red-500',
  no_answer: 'bg-orange-500',
  not_interested_now: 'bg-gray-500',
  reservation: 'bg-pink-500',
};
// Icon and color mappings for call outcomes and visit statuses (fallback to generic if not mapped)
const outcomeIcons: Record<string, JSX.Element> = {
  Interested: <ThumbsUp className="h-6 w-6 text-white" />,
  'Not Interested': <ThumbsDown className="h-6 w-6 text-white" />,
  'Follow Up Required': <MessageSquare className="h-6 w-6 text-white" />,
  'Meeting Scheduled': <CalendarIcon className="h-6 w-6 text-white" />,
};
const outcomeColors: Record<string, string> = {
  Interested: 'bg-green-500',
  'Not Interested': 'bg-red-500',
  'Follow Up Required': 'bg-yellow-500',
  'Meeting Scheduled': 'bg-blue-500',
};
const visitIcons: Record<string, JSX.Element> = {
  Completed: <Check className="h-6 w-6 text-white" />,
  Cancelled: <X className="h-6 w-6 text-white" />,
  Rescheduled: <Clock className="h-6 w-6 text-white" />,
};
const visitColors: Record<string, string> = {
  Completed: 'bg-green-500',
  Cancelled: 'bg-red-500',
  Rescheduled: 'bg-yellow-500',
};

// Helper to add spaces to camelCase or PascalCase
function addSpacesToCamelCase(text: string) {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\b([A-Z])([A-Z]+)\b/g, '$1 $2');
}
// Helper to get translated label for cards, fallback to humanized label
function getCardLabel(key: string, t: (k: string) => string) {
  const translated = t(key);
  return translated !== key ? translated : addSpacesToCamelCase(key);
}
// In all card sections, use translation for card labels, fallback to spaced key
// Example for status cards:
// const label = t(card.key) !== card.key ? t(card.key) : addSpacesToCamelCase(card.key);
// ...
// (This is already implemented for all cards in the previous edit, but this comment clarifies the logic for maintainers.)

const LeadsList: React.FC = () => {
  const { user } = useAuth();
  // const { leads, deleteLead } = useData();
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getLeads()
  });

  const getUsers = async () => {
    const response = await axiosInterceptor.get('/auth/users');
    return response.data as User[];
  }

  const getLeads = async () => {
    const response = await axiosInterceptor.get('/leads');
    return response.data.leads as Lead[];
  }

  const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.data as Project[];
  }
  const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    return response.data.properties as Property[];
  }
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProperties()
  });
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: getUsers,
    enabled: user?.role === 'admin' || user?.role === 'sales_admin'
  });

  // const { projects, users } = useData(); // Add users from DataContext
  const { t, i18n } = useTranslation('leads');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [showAllCards, setShowAllCards] = useState(false);
  const [activeStatusCard, setActiveStatusCard] = useState<string>('');
  const [activeCallOutcomeCard, setActiveCallOutcomeCard] = useState<string>('');
  const [activeVisitStatusCard, setActiveVisitStatusCard] = useState<string>('');
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [selectedSalesRep, setSelectedSalesRep] = useState<User | null>(null);

  const location = useLocation();

  // On mount, check for filterType and filterValue in query params and set active card
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterType = params.get('filterType');
    const filterValue = params.get('filterValue');
    if (filterType && filterValue) {
      if (filterType === 'status') {
        setActiveStatusCard(filterValue);
        setActiveCallOutcomeCard('');
        setActiveVisitStatusCard('');
      } else if (filterType === 'callOutcome') {
        setActiveStatusCard('');
        setActiveCallOutcomeCard(filterValue);
        setActiveVisitStatusCard('');
      } else if (filterType === 'visitStatus') {
        setActiveStatusCard('');
        setActiveCallOutcomeCard('');
        setActiveVisitStatusCard(filterValue);
      }
    }
    // eslint-disable-next-line
  }, [location.search]);


  // User color mapping
  const userColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
  ];

  const getUserColor = (userName: string) => {
    const userIndex = users?.findIndex(user => user.name === userName);
    return userIndex !== undefined && userIndex >= 0 ? userColors[userIndex % userColors.length] : 'bg-gray-500';
  };

  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to get display name based on current language
  const getDisplayName = (lead: Lead) => {
    if (i18n.language === 'ar') {
      return lead.nameAr || lead.nameEn || '';
    } else {
      return lead.nameEn || lead.nameAr || '';
    }
  };

  // Helper function to get searchable name (both languages)
  const getSearchableName = (lead: Lead) => {
    const names = [lead.nameEn, lead.nameAr].filter(Boolean);
    return names.join(' ').toLowerCase();
  };

  // Column filters
  const [filters, setFilters] = useState({
    name: '',
    contact: '',
    budget: '',
    inventoryInterestId: '',
    source: '',
    status: '',
    assignedTo: '',
    lastVisitDate: '',
  });

  // Calculate active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Clear all filters function
  const clearAllFilters = () => {
    setFilters({
      name: '',
      contact: '',
      budget: '',
      inventoryInterestId: '',
      source: '',
      status: '',
      assignedTo: '',
      lastVisitDate: '',
    });
  };

  // Filter leads based on user role and selected manager/sales rep
  const getFilteredLeads = () => {
    let userLeads = leads;



    // Role-based filtering
    if (user?.role === 'sales_rep') {
      // Sales Reps can only see their own leads
      userLeads = leads?.filter(lead => lead.owner?.id === user.id);

    } else if (user?.role === 'team_leader') {
      // Team leaders see their own leads and their sales reps' leads
      const salesReps = users?.filter(u => u.role === 'sales_rep' && u.teamId === user.id).map(u => u.id);
      userLeads = leads?.filter(lead => lead.owner?.id === user.id || (salesReps?.includes(lead.assignedToId)));

    } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
      // Filter by manager if selected
      if (selectedManager) {
        const salesReps = users.filter(u => u.role === 'sales_rep' && u.teamId === selectedManager.id).map(u => u.id);
        userLeads = leads.filter(lead => lead.owner?.id === selectedManager.id || salesReps.includes(lead.assignedToId));

      }
      // Filter by sales rep if selected
      if (selectedSalesRep) {
        userLeads = userLeads.filter(lead => lead.owner?.id === selectedSalesRep.id);

      }
    }

    // Apply search term filtering
    let filtered = userLeads;
    if (searchTerm.trim()) {
      const trimmedSearchTerm = searchTerm.trim().toLowerCase();
      filtered = userLeads?.filter(lead => {
        const searchableName = getSearchableName(lead);
        return searchableName.includes(trimmedSearchTerm) ||
          lead.contact.includes(trimmedSearchTerm) ||
          lead.source.toLowerCase().includes(trimmedSearchTerm);
      });
    }

    // Apply column filters
    filtered = filtered?.filter(lead => {
      const displayName = getDisplayName(lead);

      // Name filter
      if (filters.name && !displayName.toLowerCase().includes(filters.name.trim().toLowerCase())) {
        return false;
      }

      // Contact filter
      if (filters.contact && !lead.contact.toLowerCase().includes(filters.contact.toLowerCase())) {
        return false;
      }

      // Budget filter
      if (filters.budget && lead.budget !== filters.budget) {
        return false;
      }

      // Inventory interest filter - find project by name and compare with project ID
      if (filters.inventoryInterestId) {
        const selectedProperty = properties?.find(property => property.id === filters.inventoryInterestId);
        if (!selectedProperty || lead.inventoryInterestId !== selectedProperty.id) {
          return false;
        }
      }

      // Source filter
      if (filters.source && lead.source !== filters.source) {
        return false;
      }

      // Status filter
      if (filters.status && lead.status !== filters.status) {
        return false;
      }

      // Assigned to filter
      if (filters.assignedTo) {
        // Check both assignedToId and owner.id for compatibility
        const isAssignedToUser = lead.assignedToId === filters.assignedTo ||
          lead.owner?.id === filters.assignedTo;



        if (!isAssignedToUser) {
          return false;
        }
      }
      return true;
    });


    // Card filter logic
    if (activeStatusCard) {
      if (activeStatusCard === 'duplicate') {
        filtered = filtered.filter((lead, idx, arr) =>
          arr.findIndex(l => (l.contact && l.contact === lead.contact) || (l.email && l.email === lead.email)) !== idx
        );
      } else if (activeStatusCard === 'cold_call') {
        filtered = filtered.filter(lead => lead.source === 'Cold Call');
      } else if ([
        'fresh_lead',
        'follow_up',
        'scheduled_visit',
        'open_deal',
        'closed_deal',
        'cancellation',
        'no_answer',
        'not_intersted_now',
        'reservation',
      ].includes(activeStatusCard)) {
        filtered = filtered.filter(lead => lead.status === activeStatusCard);
      }
    } else if (activeCallOutcomeCard) {
      filtered = filtered.filter(lead => (lead.calls || []).some(call => call.outcome === activeCallOutcomeCard));
    } else if (activeVisitStatusCard) {
      filtered = filtered.filter(lead => (lead.visits || []).some(visit => visit.status === activeVisitStatusCard));
    }

    return filtered;
  };
  useEffect(() => {
    if (leads) {

      // setFilteredLeads(getFilteredLeads() || []); // This line was removed as per edit hint
    }
  }, [leads, users, projects, searchTerm, filters, user?.role, user?.id, selectedManager, selectedSalesRep]);
  // KPI calculations (moved here)
  const filteredLeads = getFilteredLeads() || [];
  const allLeadsCount = filteredLeads.length;
  const duplicateLeadsCount = filteredLeads.filter((lead, idx, arr) =>
    arr.findIndex(l => (l.contact && l.contact === lead.contact) || (l.email && l.email === lead.email)) !== idx
  ).length;
  const freshLeadsCount = filteredLeads.filter(lead => lead.status === 'fresh_lead').length;
  const coldCallsCount = filteredLeads.filter(lead => lead.source === 'Cold Call').length;

  // Performance tracking for reports
  const userPerformance = React.useMemo(() => {
    const userLeads = leads?.filter(lead => lead.assignedToId === user?.id);
    const totalCalls = userLeads?.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0) || 0;
    const completedCalls = userLeads?.reduce((sum, lead) =>
      sum + (lead.calls?.filter((call: any) =>
        ['Interested', 'Meeting Scheduled', 'Follow Up Required'].includes(call.outcome)
      ).length || 0), 0);

    const totalVisits = userLeads?.reduce((sum, lead) => sum + (lead.visits?.length || 0), 0) || 0;
    const completedVisits = userLeads?.reduce((sum, lead) =>
      sum + (lead.visits?.filter((visit: any) => visit.status === 'Completed').length || 0), 0);

    return {
      totalLeads: userLeads?.length || 0,
      totalCalls,
      completedCalls,
      callCompletionRate: totalCalls > 0 ? Math.round((completedCalls || 0 / totalCalls) * 100) : 0,
      totalVisits,
      completedVisits: completedVisits || 0,
      visitCompletionRate: totalVisits > 0 ? Math.round((completedVisits || 0 / totalVisits) * 100) : 0
    };
  }, [leads, user?.id]);

  // Save performance data to localStorage for reports
  React.useEffect(() => {
    if (user?.name) {
      const performanceKey = `user_performance_${user.name}`;
      localStorage.setItem(performanceKey, JSON.stringify({
        ...userPerformance,
        lastUpdated: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        userRole: user.role
      }));
    }
  }, [userPerformance, user]);

  // Previous values for percentage (from localStorage)
  const prevLeadsStats = JSON.parse(localStorage.getItem('leads_kpi_stats') || '{}');
  function getChange(current: number, previous: number) {
    if (previous === undefined || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
  const allLeadsChange = getChange(allLeadsCount, prevLeadsStats.allLeadsCount);
  const duplicateLeadsChange = getChange(duplicateLeadsCount || 0, prevLeadsStats.duplicateLeadsCount);
  const freshLeadsChange = getChange(freshLeadsCount, prevLeadsStats.freshLeadsCount);
  const coldCallsChange = getChange(coldCallsCount, prevLeadsStats.coldCallsCount);

  // Save current values for next time
  React.useEffect(() => {
    localStorage.setItem('leads_kpi_stats', JSON.stringify({
      allLeadsCount,
      duplicateLeadsCount,
      freshLeadsCount,
      coldCallsCount
    }));
  }, [allLeadsCount, duplicateLeadsCount, freshLeadsCount, coldCallsCount]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case LeadStatus.FRESH_LEAD: return 'bg-blue-100 text-blue-800';
      case LeadStatus.FOLLOW_UP: return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.SCHEDULED_VISIT: return 'bg-purple-100 text-purple-800';
      case LeadStatus.OPEN_DEAL: return 'bg-green-100 text-green-800';
      case LeadStatus.CANCELLATION: return 'bg-red-100 text-red-800';
      case LeadStatus.NO_ANSWER: return 'bg-orange-100 text-orange-800';
      case LeadStatus.NOT_INTERSTED_NOW: return 'bg-gray-200 text-gray-800';
      case LeadStatus.RESERVATION: return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const handleDeleteLead = (lead: Lead) => {
    setDeletingLead(lead);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingLead) {
      // deleteLead(deletingLead.id);
      setShowDeleteConfirm(false);
      setDeletingLead(null);
    }
  };

  // Add card definitions for all valid LeadStatus values
  const dashboardCards = [
    { key: 'all', count: leads.length },
    { key: 'duplicate', count: leads.filter((lead, idx, arr) => arr.findIndex(l => (l.contact && l.contact === lead.contact) || (l.email && l.email === lead.email)) !== idx).length },
    { key: 'fresh_lead', count: leads.filter(lead => lead.status === LeadStatus.FRESH_LEAD).length },
    { key: 'cold_call', count: leads.filter(lead => lead.source === 'Cold Call').length },
    { key: 'follow_up', count: leads.filter(lead => lead.status === LeadStatus.FOLLOW_UP).length },
    { key: 'scheduled_visit', count: leads.filter(lead => lead.status === LeadStatus.SCHEDULED_VISIT).length },
    { key: 'open_deal', count: leads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length },
    { key: 'closed_deal', count: leads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length },
    { key: 'cancellation', count: leads.filter(lead => lead.status === LeadStatus.CANCELLATION).length },
    { key: 'no_answer', count: leads.filter(lead => lead.status === LeadStatus.NO_ANSWER).length },
    { key: 'not_intersted_now', count: leads.filter(lead => lead.status === LeadStatus.NOT_INTERSTED_NOW).length },
    { key: 'reservation', count: leads.filter(lead => lead.status === LeadStatus.RESERVATION).length },
  ];
  const compactCards = dashboardCards.slice(0, 4);
  const fullCards = dashboardCards;

  // Extract unique call outcomes and visit statuses
  const allCallOutcomes = Array.from(new Set(leads.flatMap(lead => (lead.calls || []).map(call => call.outcome)))).filter(Boolean);
  const allVisitStatuses = Array.from(new Set(leads.flatMap(lead => (lead.visits || []).map(visit => visit.status)))).filter(Boolean);

  // Count leads for each outcome/status (always from all leads)
  const callOutcomeCards = allCallOutcomes.map(outcome => ({
    key: outcome,
    count: leads.filter(lead => (lead.calls || []).some(call => call.outcome === outcome)).length,
  }));
  const visitStatusCards = allVisitStatuses.map(status => ({
    key: status,
    count: leads.filter(lead => (lead.visits || []).some(visit => visit.status === status)).length,
  }));

  // Percentage change logic for status cards
  const getStatusChange = (key: string) => {
    switch (key) {
      case 'all': return allLeadsChange;
      case 'duplicate': return duplicateLeadsChange;
      case 'fresh_lead': return freshLeadsChange;
      case 'cold_call': return coldCallsChange;
      default: return 0;
    }
  };

  // Restore card click handlers and active highlighting
  const handleStatusCardClick = (key: string) => {
    setActiveStatusCard(key === activeStatusCard ? '' : key);
    setActiveCallOutcomeCard('');
    setActiveVisitStatusCard('');
  };
  const handleCallOutcomeCardClick = (key: string) => {
    setActiveCallOutcomeCard(key === activeCallOutcomeCard ? '' : key);
    setActiveStatusCard('');
    setActiveVisitStatusCard('');
  };
  const handleVisitStatusCardClick = (key: string) => {
    setActiveVisitStatusCard(key === activeVisitStatusCard ? '' : key);
    setActiveStatusCard('');
    setActiveCallOutcomeCard('');
  };

  useEffect(() => {
    if (selectedSalesRep) {


    }
  }, [selectedSalesRep]);

  return (
    <div
      className={`p-6 bg-gray-50 min-h-screen ${i18n.language === 'ar' ? 'font-arabic' : ''}`}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>
      {/* User Filter Select for Manager/Sales Rep */}
      {user && (
        <UserFilterSelect
          currentUser={user as User}
          users={users}
          selectedManager={selectedManager}
          setSelectedManager={setSelectedManager as any}
          selectedSalesRep={selectedSalesRep as any}
          setSelectedSalesRep={setSelectedSalesRep as any}
        />
      )}
      {/* Lead Status Cards Section */}
      <div className="mb-2 mt-6">
        <h2 className="text-lg font-semibold mb-4">{t('leadStatusCards') !== 'leadStatusCards' ? t('leadStatusCards') : addSpacesToCamelCase('Lead Status')}</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6`}>
          {(showAllCards ? fullCards : compactCards).map(card => {
            const icon = statusCardIcons[card.key] || <UserIcon className="h-6 w-6 text-white" />;
            const iconBg = statusCardColors[card.key] || 'bg-gray-400';
            const change = getStatusChange(card.key);
            const isActive = activeStatusCard === card.key;
            return (
              <div
                key={card.key}
                onClick={() => handleStatusCardClick(card.key)}
                className={`bg-white rounded-xl shadow p-5 flex items-center border-2 transition-all hover:shadow-lg cursor-pointer ${isActive ? 'border-blue-400 bg-blue-50' : 'border-transparent'}`}
              >
                <div className={`flex items-center justify-center rounded-full h-12 w-12 ${iconBg} mr-4`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="text-gray-700 font-medium">{getCardLabel(card.key, t)}</div>
                  <div className="text-2xl font-bold">{card.count}</div>
                  <div className={`flex items-center text-sm mt-1 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : change < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : <Minus className="h-4 w-4 mr-1" />}
                    {Math.abs(change)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {fullCards.length > 4 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowAllCards(v => !v)}
              className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
            >
              {showAllCards ? (t('showLess') !== 'showLess' ? t('showLess') : 'Show Less') : (t('showMore') !== 'showMore' ? t('showMore') : 'Show More')}
            </button>
          </div>
        )}
        {fullCards.length === 0 && <div className="text-gray-500 text-center py-4">{t('noStatusCards') || 'No status cards to display.'}</div>}
      </div>
      {/* Call Outcomes Cards Section */}
      {callOutcomeCards.length > 0 && (
        <div className="mb-2 mt-6">
          <h2 className="text-lg font-semibold mb-4">{t('callOutcomesCards') !== 'callOutcomesCards' ? t('callOutcomesCards') : addSpacesToCamelCase('Call Outcomes')}</h2>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6`}>
            {callOutcomeCards.map(card => {
              const icon = outcomeIcons[card.key] || <Phone className="h-6 w-6 text-white" />;
              const iconBg = outcomeColors[card.key] || 'bg-blue-400';
              const isActive = activeCallOutcomeCard === card.key;
              return (
                <div
                  key={card.key}
                  onClick={() => handleCallOutcomeCardClick(card.key)}
                  className={`bg-white rounded-xl shadow p-5 flex items-center border-2 transition-all hover:shadow-lg cursor-pointer ${isActive ? 'border-green-400 bg-green-50' : 'border-transparent'}`}
                >
                  <div className={`flex items-center justify-center rounded-full h-12 w-12 ${iconBg} mr-4`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-700 font-medium">{getCardLabel(card.key, t)}</div>
                    <div className="text-2xl font-bold">{card.count}</div>
                    <div className="flex items-center text-sm mt-1 text-gray-400">
                      <Minus className="h-4 w-4 mr-1" />0%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {callOutcomeCards.length === 0 && <div className="text-gray-500 text-center py-4">{t('noCallOutcomeCards') || 'No call outcome cards to display.'}</div>}
        </div>
      )}
      {/* Visit Status Cards Section */}
      {visitStatusCards.length > 0 && (
        <div className="mb-2 mt-6">
          <h2 className="text-lg font-semibold mb-4">{t('visitStatusCards') !== 'visitStatusCards' ? t('visitStatusCards') : addSpacesToCamelCase('Visit Statuses')}</h2>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6`}>
            {visitStatusCards.map(card => {
              const icon = visitIcons[card.key] || <CalendarIcon className="h-6 w-6 text-white" />;
              const iconBg = visitColors[card.key] || 'bg-purple-400';
              const isActive = activeVisitStatusCard === card.key;
              return (
                <div
                  key={card.key}
                  onClick={() => handleVisitStatusCardClick(card.key)}
                  className={`bg-white rounded-xl shadow p-5 flex items-center border-2 transition-all hover:shadow-lg cursor-pointer ${isActive ? 'border-purple-400 bg-purple-50' : 'border-transparent'}`}
                >
                  <div className={`flex items-center justify-center rounded-full h-12 w-12 ${iconBg} mr-4`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-700 font-medium">{getCardLabel(card.key, t)}</div>
                    <div className="text-2xl font-bold">{card.count}</div>
                    <div className="flex items-center text-sm mt-1 text-gray-400">
                      <Minus className="h-4 w-4 mr-1" />0%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {visitStatusCards.length === 0 && <div className="text-gray-500 text-center py-4">{t('noVisitStatusCards') || 'No visit status cards to display.'}</div>}

        </div>
      )}

      {/* Search and Actions + Filters */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex flex-col flex-1 max-w-full">
              <label className="text-xs text-gray-500 mb-1 flex items-center"><Search className="h-4 w-4 mr-1" />{t('searchLeads')}</label>
              <input
                type="text"
                placeholder={t('searchLeads')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
            </div>
            <div className="flex flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-6">
              <button
                onClick={() => setShowFilterPopup(true)}
                className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors w-full sm:w-auto ${activeFiltersCount > 0
                  ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                title={t('filterLeads')}
              >
                <Filter className="h-5 w-5 mr-1" />
                <span className="hidden xs:inline">{t('filterLeads')}</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden xs:inline">{t('addNewLead')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Popup Modal */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6 w-full h-full max-w-lg sm:h-auto sm:w-full relative animate-fadeIn flex flex-col justify-between mx-0 sm:mx-auto">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl sm:text-xl"
              onClick={() => setShowFilterPopup(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 mt-2 sm:mt-0">{t('advancedFilters')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
              <input
                type="text"
                value={filters.name}
                onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                placeholder={t('name')}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
              <input
                type="text"
                value={filters.contact}
                onChange={e => setFilters(f => ({ ...f, contact: e.target.value }))}
                placeholder={t('contact')}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
              <select
                value={filters.budget}
                onChange={e => setFilters(f => ({ ...f, budget: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allBudgets')}</option>
                {leads?.map((lead: Lead) => (
                  <option key={lead.id} value={lead.budget}>{lead.budget}</option>
                ))}
              </select>
              <select
                value={filters.inventoryInterestId}
                onChange={e => setFilters(f => ({ ...f, inventoryInterestId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allInterests')}</option>
                {properties?.map((property: Property) => (
                  <option key={property.id} value={property.id}>{property.titleEn}</option>
                ))}
              </select>
              <select
                value={filters.source}
                onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allSources')}</option>
                <option value="Social Media">{t('socialMedia')}</option>
                <option value="Website">{t('website')}</option>
                <option value="Referral">{t('referral')}</option>
                <option value="Cold Call">{t('coldCall')}</option>
                <option value="walk_in">{t('walkIn')}</option>
                <option value="Advertisement">{t('advertisement')}</option>
              </select>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allStatuses')}</option>
                <option value={LeadStatus.FRESH_LEAD}>{t('freshLead')}</option>
                <option value={LeadStatus.FOLLOW_UP}>{t('followUp')}</option>
                <option value={LeadStatus.SCHEDULED_VISIT}>{t('scheduledVisit')}</option>
                <option value={LeadStatus.OPEN_DEAL}>{t('openDeal')}</option>
                <option value={LeadStatus.CLOSED_DEAL}>{t('closedDeal')}</option>
                <option value={LeadStatus.CANCELLATION}>{t('cancellation')}</option>
                <option value={LeadStatus.NO_ANSWER}>{t('noAnswer')}</option>
                <option value={LeadStatus.NOT_INTERSTED_NOW}>{t('notInterestedNow')}</option>
                <option value={LeadStatus.RESERVATION}>{t('reservation')}</option>
              </select>
              <select
                value={filters.assignedTo}
                onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allUsers')}</option>
                {users?.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between mt-6 gap-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors w-full sm:w-auto"
              >
                {t('clearFilters')}
              </button>
              <button
                onClick={() => setShowFilterPopup(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                {t('applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">{t('name')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">{t('phone')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">{t('budget')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">{t('interest')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('source')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">{t('status')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">{t('assignedTo')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('lastCall')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('lastVisit')}</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {
                isLoadingLeads ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mr-2"></div>
                        Loading leads...
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads?.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4">
                        <button
                          onClick={() => handleLeadClick(lead)}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:scale-105 transition-transform text-sm truncate block w-full text-left"
                          title={getDisplayName(lead)}
                        >
                          {getDisplayName(lead)}
                        </button>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block" title={lead.contact}>
                          {lead.contact}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block" title={lead.budget}>
                          {lead.budget}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block" title={lead.inventoryInterestId}>
                          {
                            properties?.find(property => property.id === lead.inventoryInterestId)?.titleEn
                          }
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block" title={lead.source}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)} truncate max-w-full`} title={lead.status}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        {lead.owner ? (
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-semibold flex-shrink-0 ${getUserColor(lead.owner.name)}`}>
                              {getUserInitials(lead.owner.name)}
                            </span>
                            <span className="text-sm text-gray-900 truncate block" title={lead.owner.name}>
                              {lead.owner?.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">{t('unassigned')}</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block" title={lead.lastCallDate}>
                          {lead.lastCallDate}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block" title={lead.lastVisitDate}>
                          {lead.lastVisitDate}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLeadClick(lead)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title={t('viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                            title={t('editLead')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title={t('deleteLead')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              {filteredLeads?.length === 0 && !isLoadingLeads && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? t('noLeadsFound') : t('noLeadsAvailable')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLead(null);
        }}
        lead={editingLead}
      />

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{t('confirmDelete')}</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingLead(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {t('deleteLeadConfirm', { name: getDisplayName(deletingLead) })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {t('delete')}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingLead(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsList;