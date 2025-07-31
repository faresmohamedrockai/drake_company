import React, { useMemo } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Lead, LeadStatus, Property, User } from '../../types';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  properties: Property[];
  users: User[];
  selectedLeads: Set<string>;
  isSelectAllChecked: boolean;
  onSelectLead: (leadId: string) => void;
  onSelectAll: () => void;
  onLeadClick: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  t: (key: string) => string;
  i18n: any;
  searchTerm: string;
}

// User color mapping
const USER_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
  'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
];

export const LeadsTable: React.FC<LeadsTableProps> = React.memo(({
  leads,
  isLoading,
  properties,
  users,
  selectedLeads,
  isSelectAllChecked,
  onSelectLead,
  onSelectAll,
  onLeadClick,
  onEditLead,
  onDeleteLead,
  t,
  i18n,
  searchTerm
}) => {
  const getUserColor = useMemo(() => (userName: string) => {
    const userIndex = users?.findIndex(user => user.name === userName);
    return userIndex !== undefined && userIndex >= 0 ? USER_COLORS[userIndex % USER_COLORS.length] : 'bg-gray-500';
  }, [users]);

  const getUserInitials = useMemo(() => (userName: string) => {
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getDisplayName = useMemo(() => (lead: Lead) => {
    if (i18n.language === 'ar') {
      return lead.nameAr || lead.nameEn || '';
    } else {
      return lead.nameEn || lead.nameAr || '';
    }
  }, [i18n.language]);

  const getStatusColor = useMemo(() => (status: string) => {
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
  }, []);

  const handleSelectLead = (leadId: string) => {
    onSelectLead(leadId);
  };

  const handleSelectAll = () => {
    onSelectAll();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left w-8">
                <input
                  type="checkbox"
                  checked={isSelectAllChecked}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-label={t('selectAll') || 'Select all leads'}
                />
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                {t('name')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                {t('phone')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                {t('budget')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                {t('interest')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                {t('source')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                {t('status')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                {t('assignedTo')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                {t('lastCall')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                {t('lastVisit')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mr-2"></div>
                    Loading leads...
                  </div>
                </td>
              </tr>
            ) : (
              leads?.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id!)}
                      onChange={() => handleSelectLead(lead.id!)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Select ${getDisplayName(lead)}`}
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <button
                      onClick={() => onLeadClick(lead)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:scale-105 transition-transform text-sm truncate block w-full text-left"
                      title={getDisplayName(lead)}
                      aria-label={`View details for ${getDisplayName(lead)}`}
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
                    <span className="text-sm text-gray-900 truncate block" title={lead.budget.toString()}>
                      {lead.budget}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className="text-sm text-gray-900 truncate block" title={lead.inventoryInterestId}>
                      {properties?.find(property => property.id === lead.inventoryInterestId)?.titleEn}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className="text-sm text-gray-900 truncate block" title={lead.source}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)} truncate max-w-full`} 
                      title={lead.status}
                    >
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
                    <span className="text-sm text-gray-900 truncate block" title={lead.calls?.[lead.calls.length - 1]?.date}>
                      {lead.calls?.[lead.calls.length - 1]?.date}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className="text-sm text-gray-900 truncate block" title={lead.lastVisitDate}>
                      {lead.visits?.[lead.visits.length - 1]?.date}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onLeadClick(lead)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title={t('viewDetails')}
                        aria-label={`View details for ${getDisplayName(lead)}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditLead(lead)}
                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                        title={t('editLead')}
                        aria-label={`Edit ${getDisplayName(lead)}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title={t('deleteLead')}
                        aria-label={`Delete ${getDisplayName(lead)}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {leads?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? t('noLeadsFound') : t('noLeadsAvailable')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

LeadsTable.displayName = 'LeadsTable'; 