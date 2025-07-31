import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, User } from 'lucide-react';
import { TaskFilters } from '../../types';
import { getUsers } from '../../queries/queries';
import { useAuth } from '../../contexts/AuthContext';

interface TaskFiltersPanelProps {
  filters: TaskFilters;
  onFilterChange: (filters: Partial<TaskFilters>) => void;
  onClearFilters: () => void;
}

const TaskFiltersPanel: React.FC<TaskFiltersPanelProps> = ({ filters, onFilterChange, onClearFilters }) => {
  const { t } = useTranslation('tasks');
  const { user } = useAuth();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: !!user && (user.role === 'admin' || user.role === 'sales_admin')
  });

  const handleFilterChange = (field: keyof TaskFilters, value: any) => {
    onFilterChange({ [field]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== '' && 
    (typeof value !== 'number' || value > 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{t('filters.title')}</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t('filters.clearFilters')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.status')}
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">{t('statuses.pending')}</option>
            <option value="in_progress">{t('statuses.in_progress')}</option>
            <option value="completed">{t('statuses.completed')}</option>
            <option value="cancelled">{t('statuses.cancelled')}</option>
            <option value="overdue">{t('statuses.overdue')}</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.priority')}
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="low">{t('priorities.low')}</option>
            <option value="medium">{t('priorities.medium')}</option>
            <option value="high">{t('priorities.high')}</option>
            <option value="urgent">{t('priorities.urgent')}</option>
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.type')}
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="follow_up">{t('types.follow_up')}</option>
            <option value="meeting_preparation">{t('types.meeting_preparation')}</option>
            <option value="contract_review">{t('types.contract_review')}</option>
            <option value="payment_reminder">{t('types.payment_reminder')}</option>
            <option value="visit_scheduling">{t('types.visit_scheduling')}</option>
            <option value="lead_nurturing">{t('types.lead_nurturing')}</option>
            <option value="general">{t('types.general')}</option>
          </select>
        </div>

        {/* Assigned To Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.assignedTo')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filters.assignedToId || ''}
              onChange={(e) => handleFilterChange('assignedToId', e.target.value || undefined)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.dueDateFrom')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filters.dueDateFrom || ''}
              onChange={(e) => handleFilterChange('dueDateFrom', e.target.value || undefined)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('filters.dueDateTo')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filters.dueDateTo || ''}
              onChange={(e) => handleFilterChange('dueDateTo', e.target.value || undefined)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onFilterChange({ dueDateFrom: today, dueDateTo: today });
          }}
          className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
        >
          {t('filters.dueToday')}
        </button>
        <button
          onClick={() => {
            const today = new Date();
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + 7);
            onFilterChange({ 
              dueDateFrom: today.toISOString().split('T')[0], 
              dueDateTo: endOfWeek.toISOString().split('T')[0] 
            });
          }}
          className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
        >
          {t('filters.dueThisWeek')}
        </button>
        <button
          onClick={() => onFilterChange({ status: 'overdue' })}
          className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
        >
          {t('filters.overdue')}
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Status: {t(`statuses.${filters.status}`)}
              <button
                onClick={() => handleFilterChange('status', undefined)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Priority: {t(`priorities.${filters.priority}`)}
              <button
                onClick={() => handleFilterChange('priority', undefined)}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              Type: {t(`types.${filters.type}`)}
              <button
                onClick={() => handleFilterChange('type', undefined)}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.assignedToId && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
              Assigned: {users.find(u => u.id === filters.assignedToId)?.name}
              <button
                onClick={() => handleFilterChange('assignedToId', undefined)}
                className="ml-1 text-orange-600 hover:text-orange-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(filters.dueDateFrom || filters.dueDateTo) && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Date: {filters.dueDateFrom} - {filters.dueDateTo}
              <button
                onClick={() => {
                  handleFilterChange('dueDateFrom', undefined);
                  handleFilterChange('dueDateTo', undefined);
                }}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFiltersPanel; 