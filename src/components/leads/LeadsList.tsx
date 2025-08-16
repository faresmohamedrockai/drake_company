import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Search, Plus, Eye, Calendar as CalendarIcon, Edit, Trash2, X,
  Minus, Phone, Check, Star, MessageSquare, AlertTriangle,
  ThumbsUp, ThumbsDown, Clock, HelpCircle, User as UserIcon,
  Filter, Download, RefreshCw, Settings, Upload, Info
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';
import * as XLSX from 'xlsx';

// Components
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';
import EditLeadModal from './EditLeadModal';
import ImportLeadsModal from './ImportLeadsModal';
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
import type { PaymentPlan, Project } from '../inventory/ProjectsTab';
import { deleteLead, getLeads, getProperties, getUsers, bulkUpdateLeads, createLead } from '../../queries/queries';
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

  // Import functionality state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);

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

  const { data: properties = [] } = useQuery<Property[]>({
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

  const { mutateAsync: createLeadMutation, isPending: isCreatingLead } = useMutation({
    mutationFn: (lead: Partial<Lead>) => createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error creating lead');
    }
  });

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

  useEffect(() => {
    if (isDeletingLead) {
      setToastId(toast.loading("Loading..."));
    }
  }, [isDeletingLead]);

  // Clear selection when filters change
  useEffect(() => {
    clearSelection();
  }, [searchTerm, activeStatusCard, activeCallOutcomeCard, activeVisitStatusCard, selectedManager, selectedSalesRep, clearSelection]);

  // Excel import functionality
  const handleExcelImport = async (file: File) => {
    setIsImporting(true);
    setImportProgress(0);
    setShowImportModal(true);

    try {
      const data = await readExcelFile(file);
      const leads = processExcelData(data);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < leads.length; i++) {
        try {
          await createLeadMutation(leads[i]);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Error importing lead:', error);
        }

        // Update progress
        const progress = Math.round(((i + 1) / leads.length) * 100);
        setImportProgress(progress);
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} leads${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} leads`);
      }

    } catch (error) {
      toast.error('Error processing Excel file');
      console.error('Excel import error:', error);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setShowImportModal(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Remove header row and convert to objects
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          const result = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processExcelData = (data: any[]): Partial<Lead>[] => {
    const processedData = data
      .filter(row => {
        // Check for phone number in various possible column names
        const phoneNumber = row['Phone Number'] || row['phone'] || row['Phone'] ||
          row['رقم الهاتف'] || row['هاتف'] || row['تليفون'] ||
          row['phone_number'] || row['phoneNumber'] || row['PHONE'] ||
          row['PhoneNumber'] || row['Phone_Number'] ||
          row['PhoneNumber'] || row['Phone_Number'] || row['PHONE_NUMBER'] ||
          row['phone number'] || row['phoneNumber'] || row['PHONE'] ||
          row['Phone'] || row['phone'] || row['تليفون'] || row['هاتف'] ||
          row['رقم الهاتف'] || row['رقم الهاتف'] || row['رقم الهاتف'];
        return phoneNumber && phoneNumber.toString().trim() !== '';
      })
      .map(row => {
        // Get phone number from various possible column names
        const phoneNumber = row['Phone Number'] || row['phone'] || row['Phone'] ||
          row['رقم الهاتف'] || row['هاتف'] || row['تليفون'] ||
          row['phone_number'] || row['phoneNumber'] || row['PHONE'] ||
          row['PhoneNumber'] || row['Phone_Number'] ||
          row['PhoneNumber'] || row['Phone_Number'] || row['PHONE_NUMBER'] ||
          row['phone number'] || row['phoneNumber'] || row['PHONE'] ||
          row['Phone'] || row['phone'] || row['تليفون'] || row['هاتف'] ||
          row['رقم الهاتف'] || row['رقم الهاتف'] || row['رقم الهاتف'] || '';

        // Get Arabic name from various possible column names
        const arabicName = row['Arabic Name'] || row['nameAr'] || row['Name (Arabic)'] ||
          row['الاسم العربي'] || row['اسم عربي'] || row['الاسم'] ||
          row['arabic_name'] || row['arabicName'] || row['ARABIC_NAME'] ||
          row['ArabicName'] || row['Arabic_Name'] ||
          row['Arabic Name'] || row['Name (Arabic)'] || row['الاسم العربي'] ||
          row['اسم عربي'] || row['الاسم'] || row['arabic_name'] ||
          row['arabicName'] || row['ARABIC_NAME'] || row['ArabicName'] ||
          row['Arabic_Name'] || '';

        // Get English name from various possible column names
        const englishName = row['English Name'] || row['nameEn'] || row['Name (English)'] ||
          row['الاسم الإنجليزي'] || row['اسم إنجليزي'] || row['الاسم الانجليزي'] ||
          row['english_name'] || row['englishName'] || row['ENGLISH_NAME'] ||
          row['EnglishName'] || row['English_Name'] ||
          row['English Name'] || row['Name (English)'] || row['الاسم الإنجليزي'] ||
          row['اسم إنجليزي'] || row['الاسم الانجليزي'] || row['english_name'] ||
          row['englishName'] || row['ENGLISH_NAME'] || row['EnglishName'] ||
          row['English_Name'] || '';

        // Get email from various possible column names
        const email = row['Email'] || row['email'] || row['البريد الإلكتروني'] ||
          row['email_address'] || row['emailAddress'] || row['EMAIL'] ||
          row['EmailAddress'] || row['Email_Address'] || '';

        // Get budget from various possible column names
        const budget = row['Budget'] || row['budget'] || row['الميزانية'] ||
          row['budget_amount'] || row['budgetAmount'] || row['BUDGET'] ||
          row['BudgetAmount'] || row['Budget_Amount'] || 0;

        // Get source from various possible column names
        const source = row['Source'] || row['source'] || row['المصدر'] ||
          row['lead_source'] || row['leadSource'] || row['SOURCE'] ||
          row['LeadSource'] || row['Lead_Source'] || 'Data Sheet';

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = phoneNumber.toString().replace(/[\s\-\(\)]/g, '');

        // Parse budget as number
        const parsedBudget = typeof budget === 'string' ? parseFloat(budget.replace(/[^\d.]/g, '')) || 0 : Number(budget) || 0;

        return {
          nameAr: arabicName.toString().trim(),
          nameEn: englishName.toString().trim(),
          contact: cleanPhone,
          contacts: [cleanPhone],
          email: email.toString().trim(),
          source: source.toString().trim(),
          status: LeadStatus.FOLLOW_UP, // Default status as requested
          budget: parsedBudget,
          assignedToId: user?.id || '',
          ownerId: user?.id || '',
          createdBy: user?.name || 'System',
          createdAt: new Date().toISOString(),
        };
      })
      .filter(lead => lead.contact && lead.contact.length >= 10); // Filter out invalid phone numbers

    // Remove duplicates based on phone number
    const uniqueLeads = processedData.filter((lead, index, self) =>
      index === self.findIndex(l => l.contact === lead.contact) ||
      index === self.findIndex(l => l.contacts?.includes(lead.contact))
    );

    // Check for existing leads in database
    const existingPhones = new Set(leads.map(lead => lead.contact));
    const newLeads = uniqueLeads.filter(lead => !existingPhones.has(lead.contact));

    if (uniqueLeads.length !== newLeads.length) {
      const duplicateCount = uniqueLeads.length - newLeads.length;
      toast.warning(`${duplicateCount} leads with duplicate phone numbers were skipped`);
    }

    return newLeads;
  };


  // User color mapping
  const userColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
  ];

  // const getUserColor = (userName: string) => {
  //   const userIndex = users?.findIndex(user => user.name === userName);
  //   return userIndex !== undefined && userIndex >= 0 ? userColors[userIndex % userColors.length] : 'bg-gray-500';
  // };

  // const getUserInitials = (userName: string) => {
  //   return userName
  //     .split(' ')
  //     .map(name => name.charAt(0))
  //     .join('')
  //     .toUpperCase()
  //     .slice(0, 2);
  // };

  // // Helper function to get display name based on current language
  // const getDisplayName = (lead: Lead) => {
  //   if (i18n.language === 'ar') {
  //     return lead.nameAr || lead.nameEn || '';
  //   } else {
  //     return lead.nameEn || lead.nameAr || '';
  //   }
  // };

  // Helper function to get searchable name (both languages)
  const getSearchableName = (lead: Lead) => {
    const names = [lead.nameEn, lead.nameAr].filter(Boolean);
    return names.join(' ').toLowerCase();
  };

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
        const contact = lead.contact?.toLowerCase() || '';
        const familyName = lead.familyName?.toLowerCase() || '';
        const source = lead.source.toLowerCase();

        return nameEn.includes(searchLower) ||
          nameAr.includes(searchLower) ||
          contact.includes(searchLower) ||
          familyName.includes(searchLower) ||
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
      // if (filters.contact && !lead.contact.toLowerCase().includes(filters.contact.toLowerCase())) {
      //   return false;
      // }
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

  // // Stats calculations
  // const stats = useLeadsStats(leads, filteredLeads, user?.id);

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
      className={`p-3 sm:p-4 md:p-6 bg-gray-50 min-h-screen ${i18n.language === 'ar' ? 'font-arabic' : ''}`}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{t('title')}</h1>
            <p className="text-sm sm:text-base text-gray-600">{t('description')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title={t('refreshData')}
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Filter Select */}
      {user && (
        <div className="mb-4 sm:mb-6">
          <UserFilterSelect
            currentUser={user as any}
            users={users}
            selectedManager={selectedManager}
            setSelectedManager={setSelectedManager}
            selectedSalesRep={selectedSalesRep}
            setSelectedSalesRep={setSelectedSalesRep}
          />
        </div>
      )}

      {/* Call Outcomes Cards */}
      <div className="mb-4 sm:mb-6">
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
      </div>

      {/* Lead Status Cards */}
      <div className="mb-4 sm:mb-6">
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
      </div>

      {/* Search and Actions */}
      <div className="mb-4 sm:mb-6">
        <SearchAndActions
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFiltersCount={activeFiltersCount}
          onFilterClick={() => setShowFilterModal(true)}
          onAddClick={() => setShowAddModal(true)}
          onImportClick={() => setShowImportModal(true)}
          t={t}
        />
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="mb-4 sm:mb-6">
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
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
      </div>

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

      <ImportLeadsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleExcelImport}
        isImporting={isImporting}
        importProgress={importProgress}
      />
    </div>
  );
});

LeadsList.displayName = 'LeadsList';

export default LeadsList;