import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, User, Building2, Users, FileText, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Task } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onStatusUpdate: (taskId: string, status: Task['status']) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task, onStatusUpdate }) => {
  const { t } = useTranslation('tasks');
  const { isRTL } = useLanguage();

  if (!isOpen || !task) return null;

  // Priority colors
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status colors
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'overdue': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Task type icons
  const getTaskTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'follow_up': return '📞';
      case 'meeting_preparation': return '📅';
      case 'contract_review': return '📋';
      case 'payment_reminder': return '💰';
      case 'visit_scheduling': return '🏠';
      case 'lead_nurturing': return '🌱';
      case 'general': return '📝';
      default: return '📝';
    }
  };

  const handleStatusUpdate = (status: Task['status']) => {
    onStatusUpdate(task.id, status);
  };

  // Helper function to safely get date from task field
  const getSafeDate = (dateField: any): Date | null => {
    if (!dateField) return null;
    
    // Handle empty object case
    if (typeof dateField === 'object' && Object.keys(dateField).length === 0) {
      return null;
    }
    
    // Handle null case
    if (dateField === null) {
      return null;
    }
    
    try {
      const date = new Date(dateField);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.error('Error parsing date:', dateField, error);
    }
    
    return null;
  };

  const dueDate = getSafeDate(task.dueDate);
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getTaskTypeIcon(task.type)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
              <p className="text-sm text-gray-500">{t('taskDetails')}</p>
            </div>
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
          {/* Status and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                {t(`statuses.${task.status}`)}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                {t(`priorities.${task.priority}`)}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-red-200 text-red-900 border border-red-300">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {t('statuses.overdue')}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {t(`types.${task.type}`)}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('form.description')}</h3>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{task.description}</p>
            </div>
          )}

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('form.dueDate')}
              </h3>
              <p className="text-gray-900">
                {dueDate ? (
                  <>
                    {dueDate.toLocaleDateString()} at{' '}
                    {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </>
                ) : (
                  'No due date set'
                )}
              </p>
            </div>
            {task.reminderTime && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {t('form.reminderTime')}
                </h3>
                <p className="text-gray-900">
                  {(() => {
                    const reminderDate = getSafeDate(task.reminderTime);
                    return reminderDate ? (
                      <>
                        {reminderDate.toLocaleDateString()} at{' '}
                        {reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : (
                      'Invalid reminder time'
                    );
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Assignment */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              {t('form.assignTo')}
            </h3>
            <p className="text-gray-900">
              {task.assignedTo?.name || 'Unassigned'}
            </p>
          </div>

          {/* Related Items */}
          {(task.lead || task.project || task.inventory) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('table.relatedTo')}</h3>
              <div className="flex flex-wrap gap-2">
                {task.lead && (
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    <Users className="w-4 h-4 mr-1" />
                    {task.lead.nameEn || task.lead.nameAr || 'Unnamed Lead'}
                  </span>
                )}
                {task.project && (
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                    <Building2 className="w-4 h-4 mr-1" />
                    {task.project.nameEn || task.project.nameAr || 'Unnamed Project'}
                  </span>
                )}
                {task.inventory && (
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                    <FileText className="w-4 h-4 mr-1" />
                    {task.inventory.titleEn || task.inventory.titleAr || task.inventory.title}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">{t('details.createdBy')}</h3>
              <p className="text-gray-900">{task.createdBy?.name || 'Unknown'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">{t('details.createdAt')}</h3>
              <p className="text-gray-900">
                {(() => {
                  const createdDate = getSafeDate(task.createdAt);
                  return createdDate ? (
                    <>
                      {createdDate.toLocaleDateString()} at{' '}
                      {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : (
                    'Unknown'
                  );
                })()}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">{t('details.updatedAt')}</h3>
              <p className="text-gray-900">
                {(() => {
                  const updatedDate = getSafeDate(task.updatedAt);
                  return updatedDate ? (
                    <>
                      {updatedDate.toLocaleDateString()} at{' '}
                      {updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : (
                    'Unknown'
                  );
                })()}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">{t('details.reminderSet')}</h3>
              <p className="text-gray-900">
                {task.reminder ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {/* Status Update Actions */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {task.status !== 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('pending')}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {t('statuses.pending')}
                </button>
              )}
              {task.status !== 'in_progress' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  {t('statuses.in_progress')}
                </button>
              )}
              {task.status !== 'completed' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t('statuses.completed')}
                </button>
              )}
              {task.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  {t('statuses.cancelled')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal; 