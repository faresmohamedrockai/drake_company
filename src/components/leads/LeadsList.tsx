import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Eye, Calendar as CalendarIcon } from 'lucide-react';
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';

import { Lead } from '../../types';

const LeadsList: React.FC = () => {
  const { leads } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Column filters
  const [filters, setFilters] = useState({
    name: '',
    phone: '',
    budget: '',
    inventoryInterest: '',
    source: '',
    status: '',
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
      userLeads = leads.filter(lead => lead.assignedTo === user.name);
    } else if (user?.role === 'Team Leader') {
      // Team leaders can see their team's leads
      userLeads = leads.filter(lead => 
        lead.assignedTo === user.name || 
        (user.teamId && lead.assignedTo.includes(user.teamId))
      );
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-row gap-2 flex-1 overflow-x-auto pb-2">
          <div className="relative flex flex-col items-start max-w-xs">
            <label className="text-xs text-gray-500 mb-1 flex items-center"><Search className="h-4 w-4 mr-1" />Search Leads</label>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
            />
          </div>
          <input
            type="text"
            value={filters.name}
            onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
            placeholder="Name"
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
          />
          <input
            type="text"
            value={filters.phone}
            onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
            placeholder="Phone"
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
          />
          <select
            value={filters.budget}
            onChange={e => setFilters(f => ({ ...f, budget: e.target.value }))}
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
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
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
          >
            <option value="">All Interests</option>
            <option value="1B Apartment">1B Apartment</option>
            <option value="2B Apartment">2B Apartment</option>
            <option value="3B Apartment">3B Apartment</option>
            <option value="Villa">Villa</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Commercial">Commercial</option>
          </select>
          <select
            value={filters.source}
            onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
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
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
          >
            <option value="">All Statuses</option>
            <option value="Fresh Lead">Fresh Lead</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Scheduled Visit">Scheduled Visit</option>
            <option value="Open Deal">Open Deal</option>
            <option value="Cancellation">Cancellation</option>
          </select>
          <div className="flex flex-col items-start max-w-xs">
            <label className="text-xs text-gray-500 mb-1 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />Last Call Date</label>
            <input
              type="date"
              value={filters.lastCallDate}
              onChange={e => setFilters(f => ({ ...f, lastCallDate: e.target.value }))}
              className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
            />
          </div>
          <div className="flex flex-col items-start max-w-xs">
            <label className="text-xs text-gray-500 mb-1 flex items-center"><CalendarIcon className="h-4 w-4 mr-1" />Last Visit Date</label>
            <input
              type="date"
              value={filters.lastVisitDate}
              onChange={e => setFilters(f => ({ ...f, lastVisitDate: e.target.value }))}
              className="px-2 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs max-w-xs"
            />
          </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Lead
          </button>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory Interest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Call Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleLeadClick(lead)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:scale-105 transition-transform"
                    >
                      {lead.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.budget}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.inventoryInterest}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.source}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.lastCallDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.lastVisitDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleLeadClick(lead)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
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