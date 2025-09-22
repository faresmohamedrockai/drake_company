import React, { useState } from 'react';
import { Lead, Property, User } from '../../types';
import { Project } from '../inventory/ProjectsTab';
import { LeadStatus } from '../../types';

interface Filters {
  name: string;
  contact: string;
  budget: string;
  gender: string;
  inventoryInterestId: string;
  projectInterestId: string;
  otherProject: string;
  source: string;
  status: string;
  assignedTo: string;
  lastVisitDate: string;
  createdAtStart?: string;
  createdAtEnd?: string;
  isUntouched: boolean;
}

interface FilterPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  leads: Lead[];
  properties: Property[];
  projects: Project[];
  users: User[];
  t: (key: string) => string;
}

const FilterPanel: React.FC<FilterPanelProps> = React.memo(({
  filters,
  onFiltersChange,
  onClearFilters,
  leads,
  properties,
  projects,
  users,
  t
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleOtherProjectChange = (value: string) => {
    handleFilterChange('otherProject', value);
    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }
    const filtered = [...new Set(leads?.map((lead: any) => lead.otherProject).filter(Boolean))]
      .filter((op: string) => op.toLowerCase().includes(value.toLowerCase()));
    setSuggestions(filtered);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{t('advancedFilters')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

       
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

        <div className="relative">
          <input
            type="text"
            value={filters.otherProject}
            onChange={e => handleOtherProjectChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            placeholder={t('All Other Projects')}
          />
          {suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-[38px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-36 overflow-y-auto text-sm">
              {suggestions.map((op, idx) => (
                <li
                  key={idx}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100 truncate"
                  onClick={() => {
                    handleFilterChange('otherProject', op);
                    setSuggestions([]);
                  }}
                >
                  {op}
                </li>
              ))}
            </ul>
          )}
        </div>

        <select
          value={filters.budget}
          onChange={e => handleFilterChange('budget', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
          aria-label={t('budget')}
        >
          <option value="">{t('allBudgets')}</option>
          {[...new Set(leads?.map((lead: Lead) => lead.budget))].map((budget, idx) => (
            <option key={idx} value={String(budget)}>
              {budget}
            </option>
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
          value={filters.gender || ''}
          onChange={e => handleFilterChange('gender', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
          aria-label="Gender"
        >
          <option value="">{t('All')}</option>
          <option value="male">{t('male')}</option>
          <option value="female">{t('female')}</option>
        </select>

        <select
          value={filters.projectInterestId}
          onChange={e => handleFilterChange('projectInterestId', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
          aria-label={t('interest')}
        >
          <option value="">{t('All Projects')}</option>
          {projects?.map((project: Project) => (
            <option key={project.id} value={project.id}>{project.nameAr}</option>
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
          <option value={LeadStatus.VIP}>{t('VIP (Non Stop)')}</option>
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

        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {t('createdDateRange') || 'Created Date'}
            </label>
            {(filters.createdAtStart || filters.createdAtEnd) && (
              <button
                type="button"
                onClick={() => { handleFilterChange('createdAtStart', ''); handleFilterChange('createdAtEnd', ''); }}
                className="text-xs text-blue-600 hover:underline"
              >
                {t('clearDates') || 'Clear'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('createdAtFrom') || 'From'}</label>
              <input
                type="date"
                value={filters.createdAtStart || ''}
                onChange={e => handleFilterChange('createdAtStart', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                aria-label={t('createdAtFrom')}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t('createdAtTo') || 'To'}</label>
              <input
                type="date"
                value={filters.createdAtEnd || ''}
                onChange={e => handleFilterChange('createdAtEnd', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
                aria-label={t('createdAtTo')}
              />
            </div>
          </div>

          
        </div>
         <div className="sm:col-span-2">
          <label htmlFor="isUntouchedCheckbox" className="flex items-center cursor-pointer w-fit">
            <div className="relative">
              <input
                id="isUntouchedCheckbox"
                type="checkbox"
                className="sr-only"
                checked={filters.isUntouched}
                onChange={e => handleFilterChange('isUntouched', e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${filters.isUntouched ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filters.isUntouched ? 'transform translate-x-full' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700 select-none">
              {t('showUntouchedOnly') || 'عرض العملاء الذين لم يتم لمسهم فقط'}
            </div>
          </label>
        </div>

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
          onClick={() => { /* no-op */ }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          aria-label={t('applyFilters')}
        >
          {t('applyFilters')}
        </button>
      </div>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;