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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-blue-700 font-medium">
          {selectedCount} {t('leadsSelected') || 'leads selected'}
        </span>
        <button
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
          aria-label={t('clearSelection') || 'Clear selection'}
        >
          {t('clearSelection') || 'Clear selection'}
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <select
          value={bulkAssignToUserId}
          onChange={(e) => onBulkAssignChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            bulkAssignToUserId && !isUpdating
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          aria-label={t('bulkAssign') || 'Assign Selected'}
        >
          {isUpdating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('assigning') || 'Assigning...'}
            </div>
          ) : (
            t('bulkAssign') || 'Assign Selected'
          )}
        </button>
      </div>
    </div>
  );
});

BulkActionsBar.displayName = 'BulkActionsBar'; 