import React from 'react';
import { X } from 'lucide-react';
import { Lead, LeadStatus, Property, User } from '../../types';

interface Filters {
  name: string;
  contact: string;
  budget: string;
  inventoryInterestId: string;
  source: string;
  status: string;
  assignedTo: string;
  lastVisitDate: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  leads: Lead[];
  properties: Property[];
  users: User[];
  t: (key: string) => string;
}

export const FilterModal: React.FC<FilterModalProps> = React.memo(({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
  leads,
  properties,
  users,
  t
}) => {
  if (!isOpen) return null;

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6 w-full h-full max-w-lg sm:h-auto sm:w-full relative animate-fadeIn flex flex-col justify-between mx-0 sm:mx-auto">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl sm:text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-4 mt-2 sm:mt-0">{t('advancedFilters')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
          <input
            type="text"
            value={filters.name}
            onChange={e => handleFilterChange('name', e.target.value)}
            placeholder={t('name')}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('name')}
          />
          <input
            type="text"
            value={filters.contact}
            onChange={e => handleFilterChange('contact', e.target.value)}
            placeholder={t('contact')}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('contact')}
          />
          <select
            value={filters.budget}
            onChange={e => handleFilterChange('budget', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('budget')}
          >
            <option value="">{t('allBudgets')}</option>
            {leads?.map((lead: Lead) => (
              <option key={lead.id} value={lead.budget}>{lead.budget}</option>
            ))}
          </select>
          <select
            value={filters.inventoryInterestId}
            onChange={e => handleFilterChange('inventoryInterestId', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('interest')}
          >
            <option value="">{t('allInterests')}</option>
            {properties?.map((property: Property) => (
              <option key={property.id} value={property.id}>{property.titleEn}</option>
            ))}
          </select>
          <select
            value={filters.source}
            onChange={e => handleFilterChange('source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('source')}
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
            onChange={e => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('status')}
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
            onChange={e => handleFilterChange('assignedTo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            aria-label={t('assignedTo')}
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
            onClick={onClearFilters}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors w-full sm:w-auto"
            aria-label={t('clearFilters')}
          >
            {t('clearFilters')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            aria-label={t('applyFilters')}
          >
            {t('applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
});

FilterModal.displayName = 'FilterModal'; 