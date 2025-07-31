import React from 'react';
import { User } from '../../types';

interface BulkActionsBarProps {
  selectedCount: number;
  bulkAssignToUserId: string;
  onBulkAssignChange: (value: string) => void;
  onBulkAssign: () => void;
  onClearSelection: () => void;
  isUpdating: boolean;
  users: User[];
  user: User | null;
  t: (key: string) => string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = React.memo(({
  selectedCount,
  bulkAssignToUserId,
  onBulkAssignChange,
  onBulkAssign,
  onClearSelection,
  isUpdating,
  users,
  user,
  t
}) => {
  const getAssignableUsers = () => {
    if (!user || !users) return [];

    if (user.role === 'sales_rep') {
      // Sales Reps can only assign to themselves
      return users.filter(u => u.name === user.name);
    } else if (user.role === 'team_leader') {
      // Team Leaders can assign to their team members and themselves
      return users.filter(u =>
        u.name === user.name ||
        (u.role === 'sales_rep' && u.teamLeaderId === user.id) ||
        (u.teamId === user.teamId && u.id !== user.id)
      );
    } else if (user.role === 'sales_admin' || user.role === 'admin') {
      // Sales Admin and Admin can assign to anyone
      return users.filter(u => u.role !== 'admin' || user.role === 'admin' || user.role === 'sales_admin');
    }

    return [];
  };

  const assignableUsers = getAssignableUsers();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="text-blue-700 font-medium text-sm sm:text-base">
            {selectedCount} {t('leadsSelected') || 'leads selected'}
          </span>
          <button
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm underline"
            aria-label={t('clearSelection') || 'Clear selection'}
          >
            {t('clearSelection') || 'Clear selection'}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <select
            value={bulkAssignToUserId}
            onChange={(e) => onBulkAssignChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full sm:w-auto"
            aria-label={t('selectUser') || 'Select user to assign'}
          >
            <option value="">{t('selectUser') || 'Select user to assign'}</option>
            {assignableUsers.map(assignUser => (
              <option key={assignUser.id} value={assignUser.id}>
                {assignUser.name} ({assignUser.role})
              </option>
            ))}
          </select>
          <button
            onClick={onBulkAssign}
            disabled={!bulkAssignToUserId || isUpdating}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm w-full sm:w-auto ${
              bulkAssignToUserId && !isUpdating
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label={t('bulkAssign') || 'Assign Selected'}
          >
            {isUpdating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                <span className="text-xs sm:text-sm">{t('assigning') || 'Assigning...'}</span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm">{t('bulkAssign') || 'Assign Selected'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

BulkActionsBar.displayName = 'BulkActionsBar'; 