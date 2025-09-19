import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import LeadModal from './LeadModal';
import AddLeadModal from './AddLeadModal';
import EditLeadModal from './EditLeadModal';
import ImportLeadsModal from './ImportLeadsModal';
import UserFilterSelect from './UserFilterSelect';
import { LeadsTable } from './LeadsTable';
import { StatusCards } from './StatusCards';
import { CallOutcomeCards } from './CallOutcomeCards';
import FilterPanel from './FilterPanel';
import { BulkActionsBar } from './BulkActionsBar';
import { SearchAndActions } from './SearchAndActions';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Lead, LeadStatus, Property, User } from '../../types';
import type { Project } from '../inventory/ProjectsTab';
import { deleteLead, getLeads, getProperties, getUsers, bulkUpdateLeads, createLead, getProjects } from '../../queries/queries';
import { useLeadsFilters } from '../../hooks/useLeadsFilters';
import { useLeadsSelection } from '../../hooks/useLeadsSelection';
import TransferLeadModal from './TransferLead';
import { AdviceModal } from './AdviceModal';
import axiosInterceptor from "../../../axiosInterceptor/axiosInterceptor";

const LeadsList: React.FC = React.memo(() => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation('leads');
  const location = useLocation();
  const queryClient = useQueryClient();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [ShowtransferModal, setShowTransferModall] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [transferModalLead, setTransferModalLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [toastId, setToastId] = useState<Id | null>(null);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceData, setAdviceData] = useState<any | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    searchTerm, setSearchTerm, filters, setFilters, activeFiltersCount,
    clearAllFilters, selectedManager, setSelectedManager, selectedSalesRep,
    setSelectedSalesRep, activeStatusCard, setActiveStatusCard,
    activeCallOutcomeCard, setActiveCallOutcomeCard, activeVisitStatusCard,
    setActiveVisitStatusCard, showAllCards, setShowAllCards
  } = useLeadsFilters(location);

  const {
    selectedLeads, isSelectAllChecked, showBulkActions, bulkAssignToUserId,
    setBulkAssignToUserId, handleSelectLead: handleSelectLeadBase,
    handleSelectAll: handleSelectAllBase, clearSelection
  } = useLeadsSelection();

  const { data, isLoading: isLoadingLeads, isFetching, error: leadsError } = useQuery({
    queryKey: ['leads', user?.id, currentPage, rowsPerPage],
    queryFn: () => getLeads(currentPage, rowsPerPage),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: 1000,
  });
console.log("All Leads From Back",data);
const TotalLeads = data?.pagination?.total
  const leads = data?.leads || [];
  const paginationInfo = data?.pagination;
  const myLeadsCount = data?.myLeads;

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'], staleTime: 1000 * 60 * 5, queryFn: getProperties, retry: 3
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'], staleTime: 1000 * 60 * 5, queryFn: getProjects, retry: 3
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    staleTime: 1000 * 60 * 5,
    queryFn: getUsers,
    enabled: user?.role === 'admin' || user?.role === 'sales_admin' || user?.role === 'team_leader',
    retry: 3
  });

  const { mutateAsync: deleteLeadMutation, isPending: isDeletingLead } = useMutation({
    mutationFn: (leadId: string) => deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.update(toastId as Id, { render: t('leadDeleted'), type: 'success', isLoading: false, autoClose: 3000 });
    },
    onError: (error: any) => {
      toast.update(toastId as Id, { render: error.response?.data?.message || t('errorDeletingLead'), type: 'error', isLoading: false, autoClose: 3000 });
    }
  });

  const { mutateAsync: bulkUpdateLeadsMutation, isPending: isBulkUpdating } = useMutation({
    mutationFn: ({ leadIds, updateData }: { leadIds: string[], updateData: Partial<Lead> }) => bulkUpdateLeads(leadIds, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(t('leadsUpdated') || 'Leads updated successfully');
      clearSelection();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('errorUpdatingLeads'));
    }
  });

  const { mutateAsync: createLeadMutation } = useMutation({
    mutationFn: (lead: Partial<Lead>) => createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error creating lead');
    }
  });

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
  }, [location.search, setActiveStatusCard, setActiveCallOutcomeCard, setActiveVisitStatusCard]);

  useEffect(() => {
    if (isDeletingLead) {
      setToastId(toast.loading("Loading..."));
    }
  }, [isDeletingLead]);

  useEffect(() => {
    clearSelection();
  }, [searchTerm, activeStatusCard, activeCallOutcomeCard, activeVisitStatusCard, selectedManager, selectedSalesRep, clearSelection]);

  const handleExcelImport = async (file: File) => {
    setIsImporting(true);
    setImportProgress(0);
    setShowImportModal(true);

    try {
      const data = await readExcelFile(file);
      const leadsToImport = processExcelData(data);
      if (!leadsToImport || leadsToImport.length === 0) {
        toast.info('No new valid leads to import from the file.');
        setIsImporting(false);
        setImportProgress(0);
        setShowImportModal(false);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      for (let i = 0; i < leadsToImport.length; i++) {
        try {
          await createLeadMutation(leadsToImport[i]);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Error importing lead:', error, 'Lead data:', leadsToImport[i]);
        }
        const progress = Math.round(((i + 1) / leadsToImport.length) * 100);
        setImportProgress(progress);
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} leads${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} leads. Check the console for details.`);
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

  const processExcelData = (data: any[]): Partial<Lead>[] => {
    const processedData = data.map(row => {
      const phoneNumber = row['Phone Number'] || row['phone'] || row['Phone'] || row['رقم الهاتف'] || row['هاتف'] || row['تليفون'] || row['phone_number'] || row['phoneNumber'] || row['PHONE'] || row['PhoneNumber'] || row['Phone_Number'] || row['phone number'];
      if (!phoneNumber || phoneNumber.toString().trim() === '') return null;
      
      const otherPhonesRaw = row['Other Phones'] || row['otherPhones'] || row['other_phones'] || row['أرقام أخرى'] || row['هواتف أخرى'] || row['otherPohones'];
      const notes = row['Notes'] || row['notes'] || row['ملاحظات'] || row['Description'] || row['description'] || row['الوصف'];
      const arabicName = row['Arabic Name'] || row['nameAr'] || row['الاسم العربي'] || '';
      const englishName = row['English Name'] || row['nameEn'] || row['الاسم الإنجليزي'] || '';
      const email = row['Email'] || row['email'] || row['البريد الإلكتروني'] || '';
      const budget = row['Budget'] || row['budget'] || row['الميزانية'] || 0;
      const source = row['Source'] || row['source'] || row['المصدر'] || 'Data Sheet';
      
      const cleanPhone = (phone: any) => String(phone || '').replace(/[\s\-\(\)]/g, '');
      const primaryCleanPhone = cleanPhone(phoneNumber);
      const otherCleanPhones = String(otherPhonesRaw || '').split(/[,;\n]/).map(phone => cleanPhone(phone.trim())).filter(phone => phone && phone.length >= 10);
      const allContacts = [...new Set([primaryCleanPhone, ...otherCleanPhones])].filter(Boolean);
      const parsedBudget = typeof budget === 'string' ? parseFloat(budget.replace(/[^\d.]/g, '')) || 0 : Number(budget) || 0;

      return {
        nameAr: String(arabicName).trim(),
        nameEn: String(englishName).trim(),
        contact: primaryCleanPhone,
        contacts: allContacts,
        email: String(email).trim(),
        source: String(source).trim(),
        status: LeadStatus.FOLLOW_UP,
        budget: parsedBudget,
        description: String(notes || '').trim(),
        assignedToId: user?.id || '',
        ownerId: user?.id || '',
        createdBy: user?.name || 'System',
        createdAt: new Date().toISOString(),
      };
    }).filter(lead => lead && lead.contact && lead.contact.length >= 10);

    if (!processedData) return [];

    const existingPhones = new Set(leads.map(lead => lead.contact));
    leads.forEach(lead => {
        if (lead.contacts) {
            lead.contacts.forEach(c => existingPhones.add(c));
        }
    });

    const newLeads = processedData.filter(lead => {
        return !lead!.contacts.some(c => existingPhones.has(c));
    });

    if (processedData.length > newLeads.length) {
      const duplicateCount = processedData.length - newLeads.length;
      toast.warning(`${duplicateCount} leads were skipped because their phone numbers already exist.`);
    }

    return newLeads as Partial<Lead>[];
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let workbook;
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            const text = e.target?.result as string;
            workbook = XLSX.read(text, { type: 'string' });
          } else {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            workbook = XLSX.read(data, { type: 'array' });
          }
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) return reject(new Error('No sheets found in the workbook.'));
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          if (jsonData.length < 1) return resolve([]);
          const nonEmptyRows = jsonData.filter(row => (row as any[]).some(cell => cell !== null && cell !== ''));
          if (nonEmptyRows.length < 2) return resolve([]);
          const headers = nonEmptyRows[0] as string[];
          const rows = nonEmptyRows.slice(1) as any[][];
          const result = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              const key = header ? String(header).trim() : `column_${index}`;
              obj[key] = row[index];
            });
            return obj;
          });
          resolve(result);
        } catch (error) {
          console.error("Error parsing the file:", error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading the file:", error);
        reject(new Error('Failed to read the file.'));
      };
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleGenerateAdvice = async () => {
    setIsAdviceLoading(true);
    setAdviceError(null);
    setAdviceData(null);
    try {
      const response = await axiosInterceptor.get(`/ai/tip-userLead`);
      if (response.data) {
        setAdviceData(response.data);
      } else {
        throw new Error(t('emptyResponse'));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('unknownError');
      setAdviceError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAdviceLoading(false);
    }
  };

  const filteredLeadsManager = useMemo(() => {
    let filtered = leads;
    if (selectedManager && selectedSalesRep) {
      filtered = filtered.filter(lead => lead.owner?.id === selectedSalesRep.id);
    } else if (selectedSalesRep) {
      filtered = filtered.filter(lead => lead.owner?.id === selectedSalesRep.id);
    } else if (selectedManager) {
      const teamMembers = users.filter(u => u.role === "sales_rep" && u.teamLeaderId === selectedManager.id).map(u => u.id);
      filtered = filtered.filter(lead => lead.owner?.id === selectedManager.id || teamMembers.includes(lead.owner?.id!));
    }
    return filtered;
  }, [leads, selectedManager, selectedSalesRep, users]);

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (selectedManager && selectedSalesRep) {
      filtered = filtered.filter(lead => lead.owner?.id === selectedSalesRep.id);
    } else if (selectedSalesRep) {
      filtered = filtered.filter(lead => lead.owner?.id === selectedSalesRep.id);
    } else if (selectedManager) {
      const teamMembers = users.filter(u => u.role === "sales_rep" && u.teamLeaderId === selectedManager.id).map(u => u.id);
      filtered = filtered.filter(lead => lead.owner?.id === selectedManager.id || teamMembers.includes(lead.owner?.id!));
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(lead => {
        const nameEn = lead.nameEn?.toLowerCase() || '';
        const nameAr = lead.nameAr?.toLowerCase() || '';
        const contact = lead.contact?.trim() || '';
        const familyName = lead.familyName?.toLowerCase() || '';
        const source = lead.source.toLowerCase();
        return nameEn.includes(searchLower) || nameAr.includes(searchLower) || contact.includes(searchLower) || familyName.includes(searchLower) || source.includes(searchLower);
      });
    }

    filtered = filtered.filter(lead => {
      const parseInputDate = (value: string | undefined | null): Date | null => {
        if (!value) return null;
        const parts = String(value).split('-');
        if (parts.length !== 3) return null;
        const [y, m, d] = parts.map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d, 0, 0, 0, 0);
      };
      const toDayStamp = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const parseLeadDate = (raw: any): Date | null => {
        if (!raw) return null;
        if (raw instanceof Date) return raw as Date;
        if (typeof raw === 'number') {
          const d = new Date(raw);
          return isNaN(d.getTime()) ? null : d;
        }
        const str = String(raw).trim();
        let d = new Date(str);
        if (!isNaN(d.getTime())) return d;
        const dateOnly = str.split(' ')[0];
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateOnly)) {
          const [dd, mm, yyyy] = dateOnly.split('/').map(Number);
          d = new Date(yyyy, mm - 1, dd);
          return isNaN(d.getTime()) ? null : d;
        }
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateOnly)) {
          const [dd, mm, yyyy] = dateOnly.split('-').map(Number);
          d = new Date(yyyy, mm - 1, dd);
          return isNaN(d.getTime()) ? null : d;
        }
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateOnly)) {
          const [yyyy, mm, dd] = dateOnly.split('/').map(Number);
          d = new Date(yyyy, mm - 1, dd);
          return isNaN(d.getTime()) ? null : d;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
          const [yyyy, mm, dd] = dateOnly.split('-').map(Number);
          d = new Date(yyyy, mm - 1, dd);
          return isNaN(d.getTime()) ? null : d;
        }
        return null;
      };
      const displayName = i18n.language === 'ar' ? (lead.nameAr || lead.nameEn || '') : (lead.nameEn || lead.nameAr || '');
      if (filters.name && !displayName.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.gender && lead.gender?.toLowerCase() !== filters.gender.toLowerCase()) return false;
      if (filters.contact && !lead.contact?.toLowerCase().includes(filters.contact.toLowerCase())) return false;
      if (filters.budget && lead.budget.toString() !== filters.budget) return false;
      if (filters.inventoryInterestId && lead.inventoryInterestId !== filters.inventoryInterestId) return false;
      if (filters.projectInterestId && lead.projectInterestId !== filters.projectInterestId) return false;
      if (filters.otherProject && lead.otherProject !== filters.otherProject) return false;
      if (filters.source && lead.source.toLowerCase() !== filters.source.toLowerCase()) return false;
      if (filters.status && lead.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.assignedTo && lead.owner?.id !== filters.assignedTo) return false;

      const startStr = (filters as any).createdAtStart?.trim?.() || filters.createdAtStart || '';
      const endStr = (filters as any).createdAtEnd?.trim?.() || filters.createdAtEnd || '';
      if (startStr || endStr) {
        const rawCreatedAt: any = (lead as any).createdAt || (lead as any).created_at || (lead as any).createdDate || (lead as any).firstConection;
        const leadDateObj = parseLeadDate(rawCreatedAt);
        if (!leadDateObj) return false;
        const leadStamp = toDayStamp(leadDateObj);
        let startDate = parseInputDate(startStr);
        let endDate = parseInputDate(endStr);
        if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
          [startDate, endDate] = [endDate, startDate];
        }
        if (startDate && leadStamp < toDayStamp(startDate)) return false;
        if (endDate && leadStamp > toDayStamp(endDate)) return false;
      }
      return true;
    });

    if (activeStatusCard) {
      if (activeStatusCard === 'my_leads') {
        filtered = filtered.filter(lead => lead.owner?.id === user?.id);
      } else if (activeStatusCard === 'not_interested_now') {
        filtered = filtered.filter(lead => lead.status === LeadStatus.NOT_INTERSTED_NOW);
      } else if (activeStatusCard === 'scheduled_visit') {
        filtered = filtered.filter(lead => lead.status === LeadStatus.SCHEDULED_VISIT);
      } else if (activeStatusCard === 'duplicate') {
        filtered = filtered.filter((lead, idx, arr) => arr.findIndex(l => (l.contact && l.contact === lead.contact) || (l.email && l.email === lead.email)) !== idx);
      } else if (activeStatusCard === 'cold_call') {
        filtered = filtered.filter(lead => lead.source === 'Cold Call');
      } else if (activeStatusCard !== 'all') {
        filtered = filtered.filter(lead => lead.status === activeStatusCard);
      }
    } else if (activeCallOutcomeCard) {
      filtered = filtered.filter(lead => (lead.calls || []).some(call => call.outcome === activeCallOutcomeCard));
    } else if (activeVisitStatusCard) {
      filtered = filtered.filter(lead => (lead.visits || []).some(visit => visit.status === activeVisitStatusCard));
    }

    return filtered;
  }, [leads, users, selectedSalesRep, selectedManager, searchTerm, filters, activeStatusCard, activeCallOutcomeCard, activeVisitStatusCard, user?.id, i18n.language]);

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  }, []);

  const handleEditLead = useCallback((lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  }, []);

  const handeltTransferLead = useCallback((lead: Lead) => {
    setTransferModalLead(lead);
    setShowTransferModall(true)
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
          updateData: { toAgentId: bulkAssignToUserId, transferType: "With History", notes: "Get From Bulk Assign To" }
        });
        getLeads(currentPage, rowsPerPage);
      } catch (error) {
        console.error('Error bulk assigning leads:', error);
      }
    }
  }, [bulkAssignToUserId, selectedLeads, bulkUpdateLeadsMutation, currentPage, rowsPerPage]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.success(t('dataRefreshed'));
  }, [queryClient, t]);

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  if (leadsError) {
    return (
      <div className="p-6 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('errorLoadingLeads')}</h2>
          <p className="text-gray-600 mb-4">{t('errorLoadingLeadsMessage')}</p>
          <button onClick={handleRefresh} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="h-4 w-4 inline mr-2" /> {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 sm:p-4 md:p-6 bg-transparent min-h-screen ${i18n.language === 'ar' ? 'font-arabic' : ''}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="relative overflow-hidden mb-4 sm:mb-6 md:mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 text-white">
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-10 h-48 w-48 bg-white/10 rounded-full blur-2xl" />
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t('title')}</h1>
              <p className="text-sm sm:text-base text-white/85">{t('description')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors" title={t('refreshData')}>
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {user && (
        <div className="mb-4 sm:mb-6">
          <UserFilterSelect currentUser={user as any} users={users} selectedManager={selectedManager} setSelectedManager={setSelectedManager} selectedSalesRep={selectedSalesRep} setSelectedSalesRep={setSelectedSalesRep} />
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <CallOutcomeCards leads={leads} activeCard={activeCallOutcomeCard} onCardClick={(key) => { setActiveCallOutcomeCard(prev => prev === key ? '' : key); setActiveStatusCard(''); setActiveVisitStatusCard(''); }} t={t} />
      </div>

      <div className="mb-4 sm:mb-6">
        <StatusCards leads={filteredLeadsManager} myLeadsCount={myLeadsCount} TotalLeads={TotalLeads} user={user as any} activeCard={activeStatusCard} onCardClick={(key) => { setActiveStatusCard(prev => prev === key ? '' : key); setActiveCallOutcomeCard(''); setActiveVisitStatusCard(''); }} showAllCards={showAllCards} onToggleShowAll={setShowAllCards} t={t} />
      </div>

      <div className="mb-4 sm:mb-6">
        <SearchAndActions searchTerm={searchTerm} onSearchChange={setSearchTerm} activeFiltersCount={activeFiltersCount} onFilterClick={() => setShowFilters(prev => !prev)} onAddClick={() => setShowAddModal(true)} onImportClick={() => setShowImportModal(true)} onAdviceClick={() => { setAdviceData(null); setAdviceError(null); setShowAdviceModal(true); }} t={t} />
      </div>

      {showFilters && (
        <div className="mb-4 sm:mb-6">
          <FilterPanel filters={filters} onFiltersChange={setFilters} onClearFilters={clearAllFilters} leads={leads} properties={properties} projects={projects} users={users} t={t} />
        </div>
      )}

      {showBulkActions && (
        <div className="mb-4 sm:mb-6">
          <BulkActionsBar selectedCount={selectedLeads.size} bulkAssignToUserId={bulkAssignToUserId} onBulkAssignChange={setBulkAssignToUserId} onBulkAssign={handleBulkAssign} onClearSelection={clearSelection} isUpdating={isBulkUpdating} users={users} user={user as any} t={t} />
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-xl shadow-lg overflow-hidden">
        <LeadsTable
          leads={filteredLeads}
          isLoading={isLoadingLeads}
          isFetching={isFetching}
          properties={properties}
          users={users}
          selectedLeads={selectedLeads}
          isSelectAllChecked={isSelectAllChecked}
          onSelectLead={(leadId) => handleSelectLeadBase(leadId, filteredLeads.length)}
          onSelectAll={() => handleSelectAllBase(filteredLeads.map(lead => lead.id!))}
          onLeadClick={handleLeadClick}
          onEditLead={handleEditLead}
          onTransferLead={handeltTransferLead}
          onDeleteLead={handleDeleteLead}
          t={t}
          i18n={i18n}
          searchTerm={searchTerm}
          currentPage={currentPage}
          totalPages={paginationInfo?.totalPages || 1}
          totalLeads={paginationInfo?.total || 0}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>

      <AddLeadModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditLeadModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingLead(null); }} lead={editingLead} />
      <TransferLeadModal isOpen={ShowtransferModal} onClose={() => { setShowTransferModall(false); setEditingLead(null); }} lead={transferModalLead} />
      <AdviceModal isOpen={showAdviceModal} onClose={() => setShowAdviceModal(false)} onGenerate={handleGenerateAdvice} isLoading={isAdviceLoading} advice={adviceData} error={adviceError} i18n={i18n} t={t} />
      {selectedLead && (<LeadModal lead={selectedLead} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />)}
      <DeleteConfirmationModal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeletingLead(null); }} onConfirm={confirmDelete} lead={deletingLead} t={t} i18n={i18n} />
      <ImportLeadsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleExcelImport} isImporting={isImporting} importProgress={importProgress} />
    </div>
  );
});

LeadsList.displayName = 'LeadsList';

export default LeadsList;