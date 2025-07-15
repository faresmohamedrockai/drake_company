import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Eye, Calendar as CalendarIcon, Edit, Trash2, X } from 'lucide-react';
import { Filter } from 'lucide-react';
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';
import EditLeadModal from './EditLeadModal';

import { Lead } from '../../types';

const LeadsList: React.FC = () => {
  const { leads, deleteLead } = useData();
  const { user } = useAuth();
  const { projects, users } = useData(); // Add users from DataContext
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

  // User color mapping
  const userColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
  ];

  const getUserColor = (userName: string) => {
    const userIndex = users.findIndex(user => user.name === userName);
    return userIndex >= 0 ? userColors[userIndex % userColors.length] : 'bg-gray-500';
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
      return lead.nameAr || lead.nameEn || lead.name;
    } else {
      return lead.nameEn || lead.nameAr || lead.name;
    }
  };

  // Helper function to get searchable name (both languages)
  const getSearchableName = (lead: Lead) => {
    const names = [lead.name, lead.nameEn, lead.nameAr].filter(Boolean);
    return names.join(' ').toLowerCase();
  };

  // Column filters
  const [filters, setFilters] = useState({
    name: '',
    phone: '',
    budget: '',
    inventoryInterest: '',
    source: '',
    status: '',
    assignedTo: '',
    lastCallDate: '',
    lastVisitDate: '',
  });

  // Filter leads based on user role
  const getFilteredLeads = () => {
    let userLeads = leads;

    // Role-based filtering
    if (user?.role === 'sales_rep') {
      // Sales Reps can only see their own leads
      userLeads = leads.filter(lead => lead.assignedTo === user.name);
    } else if (user?.role === 'team_leader') {
      // Team leaders see their own leads and their sales reps' leads
      const salesReps = users.filter(u => u.role === 'sales_rep' && u.teamId === user.name).map(u => u.name);
      userLeads = leads.filter(lead => lead.assignedTo === user.name || salesReps.includes(lead.assignedTo));
    } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
      // Sales Admin and Admin can see all leads
      userLeads = leads;
    }

    // Search filtering - now includes both English and Arabic names
    let filtered = userLeads.filter(lead => {
      const searchableName = getSearchableName(lead);
      return searchableName.includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.inventoryInterest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.source.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Column filters
    filtered = filtered.filter(lead => {
      const displayName = getDisplayName(lead);
      return (filters.name === '' || displayName.toLowerCase().includes(filters.name.toLowerCase())) &&
        (filters.phone === '' || lead.phone.includes(filters.phone)) &&
        (filters.budget === '' || lead.budget === filters.budget) &&
        (filters.inventoryInterest === '' || lead.inventoryInterest === filters.inventoryInterest) &&
        (filters.source === '' || lead.source === filters.source) &&
        (filters.status === '' || lead.status === filters.status) &&
        (filters.assignedTo === '' || lead.assignedTo === filters.assignedTo) &&
        (filters.lastCallDate === '' || lead.lastCallDate.includes(filters.lastCallDate)) &&
        (filters.lastVisitDate === '' || lead.lastVisitDate.includes(filters.lastVisitDate));
    });
    return filtered;
  };

  // KPI calculations (moved here)
  const filteredLeads = getFilteredLeads();
  const allLeadsCount = filteredLeads.length;
  // Duplicate: same phone or email (excluding empty values)
  const duplicateLeadsCount = filteredLeads.filter((lead, idx, arr) =>
    arr.findIndex(l => (l.phone && l.phone === lead.phone) || (l.email && l.email === lead.email)) !== idx
  ).length;
  const freshLeadsCount = filteredLeads.filter(lead => lead.status === 'fresh_lead').length;
  const coldCallsCount = filteredLeads.filter(lead => lead.source === 'Cold Call').length;

  // Performance tracking for reports
  const userPerformance = React.useMemo(() => {
    const userLeads = leads.filter(lead => lead.assignedTo === user?.name);
    const totalCalls = userLeads.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0);
    const completedCalls = userLeads.reduce((sum, lead) =>
      sum + (lead.calls?.filter((call: any) =>
        ['Interested', 'Meeting Scheduled', 'Follow Up Required'].includes(call.outcome)
      ).length || 0), 0);

    const totalVisits = userLeads.reduce((sum, lead) => sum + (lead.visits?.length || 0), 0);
    const completedVisits = userLeads.reduce((sum, lead) =>
      sum + (lead.visits?.filter((visit: any) => visit.status === 'Completed').length || 0), 0);

    return {
      totalLeads: userLeads.length,
      totalCalls,
      completedCalls,
      callCompletionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0,
      totalVisits,
      completedVisits,
      visitCompletionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0
    };
  }, [leads, user?.name]);

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
  const duplicateLeadsChange = getChange(duplicateLeadsCount, prevLeadsStats.duplicateLeadsCount);
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
      case 'fresh_lead': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled_visit': return 'bg-purple-100 text-purple-800';
      case 'open_deal': return 'bg-green-100 text-green-800';
      case 'cancellation': return 'bg-red-100 text-red-800';
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
      deleteLead(deletingLead.id);
      setShowDeleteConfirm(false);
      setDeletingLead(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">{t('allLeads')}</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{allLeadsCount}</span>
          <span className={`text-sm font-medium ${allLeadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{allLeadsChange >= 0 ? '↑' : '↓'}{Math.abs(allLeadsChange)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">{t('duplicateLeads')}</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{duplicateLeadsCount}</span>
          <span className={`text-sm font-medium ${duplicateLeadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{duplicateLeadsChange >= 0 ? '↑' : '↓'}{Math.abs(duplicateLeadsChange)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">{t('freshLeads')}</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{freshLeadsCount}</span>
          <span className={`text-sm font-medium ${freshLeadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{freshLeadsChange >= 0 ? '↑' : '↓'}{Math.abs(freshLeadsChange)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">{t('coldCalls')}</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{coldCallsCount}</span>
          <span className={`text-sm font-medium ${coldCallsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{coldCallsChange >= 0 ? '↑' : '↓'}{Math.abs(coldCallsChange)}%</span>
        </div>
      </div>

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
                className="flex items-center justify-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 w-full sm:w-auto"
                title={t('filterLeads')}
              >
                <Filter className="h-5 w-5 mr-1" />
                <span className="hidden xs:inline">{t('filterLeads')}</span>
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
                value={filters.phone}
                onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
                placeholder={t('phone')}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
              <select
                value={filters.budget}
                onChange={e => setFilters(f => ({ ...f, budget: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allBudgets')}</option>
                <option value="EGP100,000-300,000">EGP 100,000-300,000</option>
                <option value="EGP300,000-500,000">EGP 300,000-500,000</option>
                <option value="EGP500,000-1,000,000">EGP 500,000-1,000,000</option>
                <option value="EGP1,000,000-2,000,000">EGP 1,000,000-2,000,000</option>
                <option value="EGP2,000,000+">EGP 2,000,000+</option>
              </select>
              <select
                value={filters.inventoryInterest}
                onChange={e => setFilters(f => ({ ...f, inventoryInterest: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allInterests')}</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
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
                <option value="Walk-in">{t('walkIn')}</option>
                <option value="Advertisement">{t('advertisement')}</option>
              </select>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="fresh_lead">{t('freshLead')}</option>
                <option value="follow_up">{t('followUp')}</option>
                <option value="scheduled_visit">{t('scheduledVisit')}</option>
                <option value="open_deal">{t('openDeal')}</option>
                <option value="cancellation">{t('cancellation')}</option>
              </select>
              <select
                value={filters.assignedTo}
                onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">{t('allUsers')}</option>
                {users.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />{t('lastCallDate')}</label>
                <input
                  type="date"
                  value={filters.lastCallDate}
                  onChange={e => setFilters(f => ({ ...f, lastCallDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />{t('lastVisitDate')}</label>
                <input
                  type="date"
                  value={filters.lastVisitDate}
                  onChange={e => setFilters(f => ({ ...f, lastVisitDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
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
              {filteredLeads.map((lead) => (
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
                    <span className="text-sm text-gray-900 truncate block" title={lead.phone}>
                      {lead.phone}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className="text-sm text-gray-900 truncate block" title={lead.budget}>
                      {lead.budget}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className="text-sm text-gray-900 truncate block" title={lead.inventoryInterest}>
                      {lead.inventoryInterest}
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
                    {lead.assignedTo ? (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-semibold flex-shrink-0 ${getUserColor(lead.assignedTo)}`}>
                          {getUserInitials(lead.assignedTo)}
                        </span>
                        <span className="text-sm text-gray-900 truncate block" title={lead.assignedTo}>
                          {lead.assignedTo}
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
              ))}
              {filteredLeads.length === 0 && (
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