import { useState, useCallback } from 'react';

export const useLeadsSelection = () => {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAssignToUserId, setBulkAssignToUserId] = useState('');

  const handleSelectLead = useCallback((leadId: string, filteredLeadsLength: number) => {
    const newSelectedLeads = new Set(selectedLeads);
    if (newSelectedLeads.has(leadId)) {
      newSelectedLeads.delete(leadId);
    } else {
      newSelectedLeads.add(leadId);
    }
    setSelectedLeads(newSelectedLeads);
    setShowBulkActions(newSelectedLeads.size > 0);
    setIsSelectAllChecked(newSelectedLeads.size === filteredLeadsLength && filteredLeadsLength > 0);
  }, [selectedLeads]);

  const handleSelectAll = useCallback((filteredLeads: string[]) => {
    if (isSelectAllChecked) {
      setSelectedLeads(new Set());
      setShowBulkActions(false);
      setIsSelectAllChecked(false);
    } else {
      const allLeadIds = new Set(filteredLeads);
      setSelectedLeads(allLeadIds);
      setShowBulkActions(true);
      setIsSelectAllChecked(true);
    }
  }, [isSelectAllChecked]);

  const clearSelection = useCallback(() => {
    setSelectedLeads(new Set());
    setShowBulkActions(false);
    setIsSelectAllChecked(false);
    setBulkAssignToUserId('');
  }, []);

  return {
    selectedLeads,
    setSelectedLeads,
    isSelectAllChecked,
    setIsSelectAllChecked,
    showBulkActions,
    setShowBulkActions,
    bulkAssignToUserId,
    setBulkAssignToUserId,
    handleSelectLead,
    handleSelectAll,
    clearSelection
  };
}; 