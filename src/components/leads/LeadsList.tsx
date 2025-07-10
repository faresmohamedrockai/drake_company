import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Plus, Eye } from 'lucide-react';
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

      {/* Search and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Lead
          </button>
        </div>
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
              <tr>
                {/* Filters row */}
                <th className="px-6 py-2">
                  <input
                    type="text"
                    value={filters.name}
                    onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
                    placeholder="Filter"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    value={filters.phone}
                    onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Filter"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </th>
                <th className="px-6 py-2">
                  <select
                    value={filters.budget}
                    onChange={e => setFilters(f => ({ ...f, budget: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    <option value="">All</option>
                    <option value="EGP100,000-300,000">EGP 100,000-300,000</option>
                    <option value="EGP300,000-500,000">EGP 300 ,000-500,000</option>
                    <option value="EGP500,000-1,000,000">EGP 500,000-1,000,000</option>
                    <option value="EGP1,000,000-2,000,000">EGP 1,000,000-2,000,000</option>
                    <option value="EGP2,000,000+">EGP 2,000,000+</option>
                  </select>
                </th>
                <th className="px-6 py-2">
                  <select
                    value={filters.inventoryInterest}
                    onChange={e => setFilters(f => ({ ...f, inventoryInterest: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    <option value="">All</option>
                    <option value="1B Apartment">1B Apartment</option>
                    <option value="2B Apartment">2B Apartment</option>
                    <option value="3B Apartment">3B Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Townhouse">Townhouse</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </th>
                <th className="px-6 py-2">
                  <select
                    value={filters.source}
                    onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    <option value="">All</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Advertisement">Advertisement</option>
                  </select>
                </th>
                <th className="px-6 py-2">
                  <select
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    <option value="">All</option>
                    <option value="Fresh Lead">Fresh Lead</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Scheduled Visit">Scheduled Visit</option>
                    <option value="Open Deal">Open Deal</option>
                    <option value="Cancellation">Cancellation</option>
                  </select>
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    value={filters.lastCallDate}
                    onChange={e => setFilters(f => ({ ...f, lastCallDate: e.target.value }))}
                    placeholder="Filter"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    value={filters.lastVisitDate}
                    onChange={e => setFilters(f => ({ ...f, lastVisitDate: e.target.value }))}
                    placeholder="Filter"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                  />
                </th>
                <th></th>
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