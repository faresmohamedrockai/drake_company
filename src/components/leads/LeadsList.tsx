import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { Filter } from 'lucide-react';
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';

import { Lead } from '../../types';

const LeadsList: React.FC = () => {
  const { leads } = useData();
  const { user } = useAuth();
  const { projects, users } = useData(); // Add users from DataContext
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);

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

  // KPI calculations
  const allLeadsCount = leads.length;
  // Duplicate: same phone or email (excluding empty values)
  const duplicateLeadsCount = leads.filter((lead, idx, arr) =>
    arr.findIndex(l => (l.phone && l.phone === lead.phone) || (l.email && l.email === lead.email)) !== idx
  ).length;
  const freshLeadsCount = leads.filter(lead => lead.status === 'Fresh Lead').length;
  const coldCallsCount = leads.filter(lead => lead.source === 'Cold Call').length;

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

  // Filter leads based on user role
  const getFilteredLeads = () => {
    let userLeads = leads;
    
    // Role-based filtering
    if (user?.role === 'Sales Rep') {
      // Sales Reps can only see their own leads
      userLeads = leads.filter(lead => lead.assignedTo === user.name);
    } else if (user?.role === 'Team Leader') {
      // Team leaders can see their team's leads and assign leads to team members
      userLeads = leads.filter(lead => 
        lead.assignedTo === user.name || 
        (user.teamId && lead.assignedTo.includes(user.teamId)) ||
        lead.assignedTo === '' // Unassigned leads
      );
    } else if (user?.role === 'Sales Admin' || user?.role === 'Admin') {
      // Sales Admin and Admin can see all leads
      userLeads = leads;
    }
    
    // Search filtering
    let filtered = userLeads.filter(lead =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.inventoryInterest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.source.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Column filters
    filtered = filtered.filter(lead =>
      (filters.name === '' || lead.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.phone === '' || lead.phone.includes(filters.phone)) &&
      (filters.budget === '' || lead.budget === filters.budget) &&
      (filters.inventoryInterest === '' || lead.inventoryInterest === filters.inventoryInterest) &&
      (filters.source === '' || lead.source === filters.source) &&
      (filters.status === '' || lead.status === filters.status) &&
      (filters.assignedTo === '' || lead.assignedTo === filters.assignedTo) &&
      (filters.lastCallDate === '' || lead.lastCallDate.includes(filters.lastCallDate)) &&
      (filters.lastVisitDate === '' || lead.lastVisitDate.includes(filters.lastVisitDate))
    );
    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fresh Lead': return 'bg-blue-100 text-blue-800';
      case 'Follow Up': return 'bg-yellow-100 text-yellow-800';
      case 'Scheduled Visit': return 'bg-purple-100 text-purple-800';
      case 'Open Deal': return 'bg-green-100 text-green-800';
      case 'Cancellation': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = getFilteredLeads();

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leads Management</h1>
        <p className="text-gray-600">Manage and track your prospects and leads</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">All Leads</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{allLeadsCount}</span>
          <span className={`text-sm font-medium ${allLeadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{allLeadsChange >= 0 ? '↑' : '↓'}{Math.abs(allLeadsChange)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">Duplicate Leads</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{duplicateLeadsCount}</span>
          <span className={`text-sm font-medium ${duplicateLeadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{duplicateLeadsChange >= 0 ? '↑' : '↓'}{Math.abs(duplicateLeadsChange)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">Fresh Leads</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{freshLeadsCount}</span>
          <span className={`text-sm font-medium ${freshLeadsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{freshLeadsChange >= 0 ? '↑' : '↓'}{Math.abs(freshLeadsChange)}%</span>
        </div>
        <div className="bg-white rounded-lg shadow p-5 flex flex-col items-start">
          <span className="text-gray-700 text-base font-medium mb-2">Cold Calls</span>
          <span className="text-3xl font-bold text-gray-900 mb-1">{coldCallsCount}</span>
          <span className={`text-sm font-medium ${coldCallsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{coldCallsChange >= 0 ? '↑' : '↓'}{Math.abs(coldCallsChange)}%</span>
        </div>
      </div>

      {/* Search and Actions + Filters */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex flex-col flex-1 max-w-full">
              <label className="text-xs text-gray-500 mb-1 flex items-center"><Search className="h-4 w-4 mr-1" />Search Leads</label>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
            </div>
            <div className="flex flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-6">
              <button
                onClick={() => setShowFilterPopup(true)}
                className="flex items-center justify-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 w-full sm:w-auto"
                title="Show filters"
              >
                <Filter className="h-5 w-5 mr-1" />
                <span className="hidden xs:inline">Filters</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden xs:inline">Add Lead</span>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4 mt-2 sm:mt-0">Advanced Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
              <input
                type="text"
                value={filters.name}
                onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                placeholder="Name"
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
              <input
                type="text"
                value={filters.phone}
                onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
                placeholder="Phone"
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              />
              <select
                value={filters.budget}
                onChange={e => setFilters(f => ({ ...f, budget: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">All Budgets</option>
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
                <option value="">All Interests</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
              <select
                value={filters.source}
                onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">All Sources</option>
                <option value="Social Media">Social Media</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Advertisement">Advertisement</option>
              </select>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">All Statuses</option>
                <option value="Fresh Lead">Fresh Lead</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Scheduled Visit">Scheduled Visit</option>
                <option value="Open Deal">Open Deal</option>
                <option value="Cancellation">Cancellation</option>
              </select>
              <select
                value={filters.assignedTo}
                onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />Last Call Date</label>
                <input
                  type="date"
                  value={filters.lastCallDate}
                  onChange={e => setFilters(f => ({ ...f, lastCallDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />Last Visit Date</label>
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
                Apply Filters
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Phone</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Budget</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Interest</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Source</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Assigned To</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Last Call</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Last Visit</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4">
                    <button
                      onClick={() => handleLeadClick(lead)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:scale-105 transition-transform text-sm truncate block w-full text-left"
                      title={lead.name}
                    >
                      {lead.name}
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
                      <span className="text-sm text-gray-400">Unassigned</span>
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
                    <button
                      onClick={() => handleLeadClick(lead)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No leads found matching your search.' : 'No leads available. Add your first lead to get started.'}
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

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default LeadsList;