import React, { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Search, Plus, Eye, Calendar as CalendarIcon, Edit, Trash2, X, 
  Minus, Phone, Check, Star, MessageSquare, AlertTriangle, 
  ThumbsUp, ThumbsDown, Clock, HelpCircle, User as UserIcon,
  Filter, Download, RefreshCw, Settings
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';

// Components
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';
import EditLeadModal from './EditLeadModal';
import UserFilterSelect from './UserFilterSelect';
import { LeadsTable } from './LeadsTable';
import { StatusCards } from './StatusCards';
import { CallOutcomeCards } from './CallOutcomeCards';
import { VisitStatusCards } from './VisitStatusCards';
import { FilterModal } from './FilterModal';
import { BulkActionsBar } from './BulkActionsBar';
import { SearchAndActions } from './SearchAndActions';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// Types and utilities
import { Lead, LeadStatus, Property, User } from '../../types';
import { deleteLead, getLeads, getProperties, getUsers, bulkUpdateLeads } from '../../queries/queries';
import { useLeadsFilters } from '../../hooks/useLeadsFilters';
import { useLeadsSelection } from '../../hooks/useLeadsSelection';
import { useLeadsStats } from '../../hooks/useLeadsStats';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Constants
const USER_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
  'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
];

const LeadsList: React.FC = React.memo(() => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation('leads');
  const location = useLocation();
  const queryClient = useQueryClient();

  // State management
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [toastId, setToastId] = useState<Id | null>(null);

  // Custom hooks
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    activeFiltersCount,
    clearAllFilters,
    selectedManager,
    setSelectedManager,
    selectedSalesRep,
    setSelectedSalesRep,
    activeStatusCard,
    setActiveStatusCard,
    activeCallOutcomeCard,
    setActiveCallOutcomeCard,
    activeVisitStatusCard,
    setActiveVisitStatusCard,
    showAllCards,
    setShowAllCards
  } = useLeadsFilters(location);

  const {
    selectedLeads,
    setSelectedLeads,
    isSelectAllChecked,
    setIsSelectAllChecked,
    showBulkActions,
    setShowBulkActions,
    bulkAssignToUserId,
    setBulkAssignToUserId,
    handleSelectLead: handleSelectLeadBase,
    handleSelectAll: handleSelectAllBase,
    clearSelection
  } = useLeadsSelection();

  // API Queries
  const { data: leads = [], isLoading: isLoadingLeads, error: leadsError } = useQuery<Lead[]>({
    queryKey: ['leads'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: getLeads,
    retry: 3,
    retryDelay: 1000
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5,
    queryFn: getProperties,
    retry: 3
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    staleTime: 1000 * 60 * 5,
    queryFn: getUsers,
    enabled: user?.role === 'admin' || user?.role === 'sales_admin' || user?.role === 'team_leader',
    retry: 3
  });

  // Mutations
  const { mutateAsync: deleteLeadMutation, isPending: isDeletingLead } = useMutation({
    mutationFn: (leadId: string) => deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.update(toastId as Id, { 
        render: t('leadDeleted'), 
        type: 'success', 
        isLoading: false, 
        autoClose: 3000 
      });
    },
    onError: (error: any) => {
      toast.update(toastId as Id, { 
        render: error.response?.data?.message || t('errorDeletingLead'), 
        type: 'error', 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  });

  const { mutateAsync: bulkUpdateLeadsMutation, isPending: isBulkUpdating } = useMutation({
    mutationFn: ({ leadIds, updateData }: { leadIds: string[], updateData: Partial<Lead> }) => 
      bulkUpdateLeads(leadIds, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(t('leadsUpdated') || 'Leads updated successfully');
      clearSelection();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('errorUpdatingLeads'));
    }
  });

  // Computed values
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Apply user role filtering
    if (selectedSalesRep) {
      filtered = filtered.filter(lead => lead.owner?.id === selectedSalesRep.id);
    } else if (selectedManager) {
      const teamMembers = users
        .filter(u => u.role === 'sales_rep' && u.teamLeaderId === selectedManager.id)
        .map(u => u.id);
      filtered = filtered.filter(lead => 
        lead.owner?.id === selectedManager.id || 
        teamMembers.includes(lead.owner?.id!)
      );
    }

    // Apply search filtering
    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(lead => {
        const nameEn = lead.nameEn?.toLowerCase() || '';
        const nameAr = lead.nameAr?.toLowerCase() || '';
        const contact = lead.contact.toLowerCase();
        const source = lead.source.toLowerCase();
        
        return nameEn.includes(searchLower) ||
               nameAr.includes(searchLower) ||
               contact.includes(searchLower) ||
               source.includes(searchLower);
      });
    }

    // Apply column filters
    filtered = filtered.filter(lead => {
      const displayName = i18n.language === 'ar' ? 
        (lead.nameAr || lead.nameEn || '') : 
        (lead.nameEn || lead.nameAr || '');

      if (filters.name && !displayName.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.contact && !lead.contact.toLowerCase().includes(filters.contact.toLowerCase())) {
        return false;
      }
      if (filters.budget && lead.budget.toString() !== filters.budget) {
        return false;
      }
      if (filters.inventoryInterestId && lead.inventoryInterestId !== filters.inventoryInterestId) {
        return false;
      }
      if (filters.source && lead.source.toLowerCase() !== filters.source.toLowerCase()) {
        return false;
      }
      if (filters.status && lead.status.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      if (filters.assignedTo && 
          lead.assignedToId !== filters.assignedTo && 
          lead.owner?.id !== filters.assignedTo) {
        return false;
      }
      return true;
    });

    // Apply card filters
    if (activeStatusCard) {
      if (activeStatusCard === 'all') {
        // Show all leads - no additional filtering needed
      } else if (activeStatusCard === 'my_leads') {
        filtered = filtered.filter(lead => lead.owner?.id === user?.id);
      } else if (activeStatusCard === 'scheduled_visit') {
        filtered = filtered.filter(lead => lead.status === LeadStatus.SCHEDULED_VISIT);
      } else if (activeStatusCard === 'duplicate') {
        filtered = filtered.filter((lead, idx, arr) =>
          arr.findIndex(l => 
            (l.contact && l.contact === lead.contact) || 
            (l.email && l.email === lead.email)
          ) !== idx
        );
      } else if (activeStatusCard === 'cold_call') {
        filtered = filtered.filter(lead => lead.source === 'Cold Call');
      } else {
        filtered = filtered.filter(lead => lead.status === activeStatusCard);
      }
    } else if (activeCallOutcomeCard) {
      filtered = filtered.filter(lead => 
        (lead.calls || []).some(call => call.outcome === activeCallOutcomeCard)
      );
    } else if (activeVisitStatusCard) {
      filtered = filtered.filter(lead => 
        (lead.visits || []).some(visit => visit.status === activeVisitStatusCard)
      );
    }

    return filtered;
  }, [
    leads, users, selectedSalesRep, selectedManager, searchTerm, filters, 
    activeStatusCard, activeCallOutcomeCard, activeVisitStatusCard, user?.id, i18n.language
  ]);

  // Stats calculations
  const stats = useLeadsStats(leads, filteredLeads, user?.id);

  // Event handlers
  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  }, []);

  const handleEditLead = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  }, []);

  const handleDeleteLead = useCallback((lead: Lead) => {
    setDeletingLead(lead);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deletingLead) {
      try {
        await deleteLeadMutation(deletingLead.id as string);
        setShowDeleteConfirm(false);
        setDeletingLead(null);
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  }, [deletingLead, deleteLeadMutation]);

  const handleBulkAssign = useCallback(async () => {
    if (bulkAssignToUserId && selectedLeads.size > 0) {
      try {
        await bulkUpdateLeadsMutation({
          leadIds: Array.from(selectedLeads),
          updateData: { assignedToId: bulkAssignToUserId }
        });
      } catch (error) {
        console.error('Error bulk assigning leads:', error);
      }
    }
  }, [bulkAssignToUserId, selectedLeads, bulkUpdateLeadsMutation]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success(t('dataRefreshed'));
  }, [queryClient, t]);

  // Clear selection when filters change
  React.useEffect(() => {
    clearSelection();
  }, [searchTerm, activeStatusCard, activeCallOutcomeCard, activeVisitStatusCard, selectedManager, selectedSalesRep, clearSelection]);

  // Show loading toast for delete operation
  React.useEffect(() => {
    if (isDeletingLead) {
      setToastId(toast.loading(t('deletingLead')));
    }
  }, [isDeletingLead, t]);

  // Error handling
  if (leadsError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('errorLoadingLeads')}</h2>
          <p className="text-gray-600 mb-4">{t('errorLoadingLeadsMessage')}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 bg-gray-50 min-h-screen ${i18n.language === 'ar' ? 'font-arabic' : ''}`}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
            <p className="text-gray-600">{t('description')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('refreshData')}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('settings')}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Filter Select */}
      {user && (
        <UserFilterSelect
          currentUser={user as any}
          users={users}
          selectedManager={selectedManager}
          setSelectedManager={setSelectedManager}
          selectedSalesRep={selectedSalesRep}
          setSelectedSalesRep={setSelectedSalesRep}
        />
      )}

      {/* Call Outcomes Cards */}
      <CallOutcomeCards
        leads={leads}
        activeCard={activeCallOutcomeCard}
        onCardClick={(key) => {
          setActiveCallOutcomeCard(prev => prev === key ? '' : key);
          setActiveStatusCard('');
          setActiveVisitStatusCard('');
        }}
        t={t}
      />

      {/* Lead Status Cards */}
      <StatusCards
        leads={leads}
        user={user as any}
        activeCard={activeStatusCard}
        onCardClick={(key) => {
          setActiveStatusCard(prev => prev === key ? '' : key);
          setActiveCallOutcomeCard('');
          setActiveVisitStatusCard('');
        }}
        showAllCards={showAllCards}
        onToggleShowAll={setShowAllCards}
        t={t}
      />

      {/* Visit Status Cards */}
      <VisitStatusCards
        leads={leads}
        activeCard={activeVisitStatusCard}
        onCardClick={(key) => {
          setActiveVisitStatusCard(prev => prev === key ? '' : key);
          setActiveStatusCard('');
          setActiveCallOutcomeCard('');
        }}
        t={t}
      />

      {/* Search and Actions */}
      <SearchAndActions
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFiltersCount={activeFiltersCount}
        onFilterClick={() => setShowFilterModal(true)}
        onAddClick={() => setShowAddModal(true)}
        t={t}
      />

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <BulkActionsBar
          selectedCount={selectedLeads.size}
          bulkAssignToUserId={bulkAssignToUserId}
          onBulkAssignChange={setBulkAssignToUserId}
          onBulkAssign={handleBulkAssign}
          onClearSelection={clearSelection}
          isUpdating={isBulkUpdating}
          users={users}
          user={user as any}
          t={t}
        />
      )}

      {/* Leads Table */}
      <LeadsTable
        leads={filteredLeads}
        isLoading={isLoadingLeads}
        properties={properties}
        users={users}
        selectedLeads={selectedLeads}
        isSelectAllChecked={isSelectAllChecked}
        onSelectLead={(leadId) => handleSelectLeadBase(leadId, filteredLeads.length)}
        onSelectAll={() => handleSelectAllBase(filteredLeads.map(lead => lead.id!))}
        onLeadClick={handleLeadClick}
        onEditLead={handleEditLead}
        onDeleteLead={handleDeleteLead}
        t={t}
        i18n={i18n}
        searchTerm={searchTerm}
      />

      {/* Modals */}
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLead(null);
        }}
        lead={editingLead}
      />

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearAllFilters}
        leads={leads}
        properties={properties}
        users={users}
        t={t}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingLead(null);
        }}
        onConfirm={confirmDelete}
        lead={deletingLead}
        t={t}
        i18n={i18n}
      />
    </div>
  );
});

LeadsList.displayName = 'LeadsList';

export default LeadsList;