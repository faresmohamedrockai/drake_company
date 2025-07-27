import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';

interface SearchAndActionsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFiltersCount: number;
  onFilterClick: () => void;
  onAddClick: () => void;
  t: (key: string) => string;
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = React.memo(({
  searchTerm,
  onSearchChange,
  activeFiltersCount,
  onFilterClick,
  onAddClick,
  t
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex flex-col flex-1 max-w-full">
            <label className="text-xs text-gray-500 mb-1 flex items-center">
              <Search className="h-4 w-4 mr-1" />
              {t('searchLeads')}
            </label>
            <input
              type="text"
              placeholder={t('searchLeads')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
              aria-label={t('searchLeads')}
            />
          </div>
          <div className="flex flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-6">
            <button
              onClick={onFilterClick}
              className={`flex items-center justify-center px-3 py-2 border rounded-lg transition-colors w-full sm:w-auto ${
                activeFiltersCount > 0
                  ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              title={t('filterLeads')}
              aria-label={t('filterLeads')}
            >
              <Filter className="h-5 w-5 mr-1" />
              <span className="hidden xs:inline">{t('filterLeads')}</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={onAddClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center w-full sm:w-auto"
              aria-label={t('addNewLead')}
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="hidden xs:inline">{t('addNewLead')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

SearchAndActions.displayName = 'SearchAndActions'; 