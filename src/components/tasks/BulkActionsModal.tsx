import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, User, CheckCircle, Clock, AlertCircle, XCircle, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import { getUsers } from '../../queries/queries';
import { useAuth } from '../../contexts/AuthContext';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: string[];
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: Task['status']) => void;
}

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedTasks, 
  onBulkDelete, 
  onBulkStatusUpdate 
}) => {
  const { t } = useTranslation('tasks');
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<Task['priority']>('medium');
  const [selectedType, setSelectedType] = useState<Task['type']>('general');

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: !!user && (user.role === 'admin' || user.role === 'sales_admin')
  });

  if (!isOpen) return null;

  const handleAction = () => {
    switch (selectedAction) {
      case 'delete':
        onBulkDelete();
        break;
      case 'status':
        // This will be handled by the parent component
        break;
      default:
        break;
    }
    onClose();
  };

  const handleStatusUpdate = (status: Task['status']) => {
    onBulkStatusUpdate(status);
    onClose();
  };

  const actions = [
    {
      id: 'status',
      title: t('bulkActions.title'),
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'delete',
      title: t('bulkActions.deleteSelected'),
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  const statusOptions = [
    { value: 'pending', label: t('statuses.pending'), icon: Clock, color: 'text-gray-600' },
    { value: 'in_progress', label: t('statuses.in_progress'), icon: Clock, color: 'text-blue-600' },
    { value: 'completed', label: t('statuses.completed'), icon: CheckCircle, color: 'text-green-600' },
    { value: 'cancelled', label: t('statuses.cancelled'), icon: XCircle, color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('bulkActions.title')}</h2>
            <p className="text-sm text-gray-500">
              {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Action</h3>
            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedAction === action.id
                      ? `${action.bgColor} ${action.borderColor} border-2`
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                    <span className="font-medium text-gray-900">{action.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status Update Options */}
          {selectedAction === 'status' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status To</h3>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusUpdate(status.value as Task['status'])}
                    className="p-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <status.icon className={`w-4 h-4 ${status.color}`} />
                      <span className="text-sm font-medium text-gray-900">{status.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {selectedAction === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-medium text-red-800">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-red-700">
                Are you sure you want to delete {selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'}? 
                This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {selectedAction === 'delete' && (
            <button
              onClick={handleAction}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete {selectedTasks.length} {selectedTasks.length === 1 ? 'Task' : 'Tasks'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActionsModal; 