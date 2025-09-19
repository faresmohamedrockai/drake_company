import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { X, Calendar, Clock, User, Building2, Users, FileText, Loader2 } from 'lucide-react';
import { Task, CreateTaskDto } from '../../types';
import { getUsers, getLeads, getProjects, getProperties, getAllLeads } from '../../queries/queries';
import { useAuth } from '../../contexts/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskDto) => void;
  task?: Task | null;
  isSubmitting: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSubmit, task, isSubmitting }) => {
  const { t } = useTranslation('tasks');
  const { user } = useAuth();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    dueDate: string;
    time: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
    type: 'follow_up' | 'meeting_preparation' | 'contract_review' | 'payment_reminder' | 'visit_scheduling' | 'lead_nurturing' | 'general';
    reminder: boolean;
    reminderTime: string;
    assignedToId: string;
    leadId: string;
    projectId: string;
    inventoryId: string;
  }>({
    title: '',
    description: '',
    dueDate: '',
    time: '',
    priority: 'medium',
    status: 'pending',
    type: 'general',
    reminder: true,
    reminderTime: '',
    assignedToId: '',
    leadId: '',
    projectId: '',
    inventoryId: ''
  });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: !!user && (user.role === 'admin' || user.role === 'sales_admin') });
  const { data: leads = [] } = useQuery({ queryKey: ['Allleads'], queryFn: getAllLeads, enabled: !!user });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects, enabled: !!user });
  const { data: properties = [] } = useQuery({ queryKey: ['properties'], queryFn: getProperties, enabled: !!user });

  React.useEffect(() => {
    if (task) {
      const getValidDateString = (dateField: any): string => {
        if (!dateField || typeof dateField === 'object' && Object.keys(dateField).length === 0 || dateField === null) return '';
        try {
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
        } catch (error) { console.error('Error parsing date:', dateField, error); }
        return '';
      };
      const getValidDateTimeString = (dateField: any): string => {
        if (!dateField || typeof dateField === 'object' && Object.keys(dateField).length === 0 || dateField === null) return '';
        try {
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) return date.toISOString().slice(0, 16);
        } catch (error) { console.error('Error parsing reminder time:', dateField, error); }
        return '';
      };
      setFormData({
        title: task.title,
        description: task.description || '',
        time: task.time || '',
        dueDate: getValidDateString(task.dueDate),
        priority: task.priority,
        status: task.status,
        type: task.type,
        reminder: task.reminder,
        reminderTime: getValidDateTimeString(task.reminderTime),
        assignedToId: task.assignedToId || '',
        leadId: task.leadId || '',
        projectId: task.projectId || '',
        inventoryId: task.inventoryId || ''
      });
    } else {
      setFormData({
        title: '', description: '', time: '', dueDate: '', priority: 'medium', status: 'pending', type: 'general', reminder: true, reminderTime: '', assignedToId: '', leadId: '', projectId: '', inventoryId: ''
      });
    }
  }, [task, isOpen]);

  const handleInputChange = (field: keyof CreateTaskDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.title.trim()) { alert('Title is required'); return; }
    if (!formData.dueDate) { alert('Due date is required'); return; }
    if (!formData.type) { alert('Task type is required'); return; }

    const dueDateTime = new Date(`${formData.dueDate}T${formData.time || '00:00'}`);

    const submitData: any = {
      ...formData,
      dueDate: dueDateTime,
      reminderTime: formData.reminder && formData.reminderTime ? new Date(formData.reminderTime) : null,
      assignedToId: formData.assignedToId || null,
      createdById: user?.id || null,
      leadId: formData.leadId || null,
      projectId: formData.projectId || null,
      inventoryId: formData.inventoryId || null
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? t('editTask') : t('createTask')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.title')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('form.titlePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.dueDate')} *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.dueTime')}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">{t('priorities.low')}</option>
                <option value="medium">{t('priorities.medium')}</option>
                <option value="high">{t('priorities.high')}</option>
                <option value="urgent">{t('priorities.urgent')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.type')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as 'follow_up' | 'meeting_preparation' | 'contract_review' | 'payment_reminder' | 'visit_scheduling' | 'lead_nurturing' | 'general')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="follow_up">{t('types.follow_up')}</option>
                <option value="meeting_preparation">{t('types.meeting_preparation')}</option>
                <option value="contract_review">{t('types.contract_review')}</option>
                <option value="payment_reminder">{t('types.payment_reminder')}</option>
                <option value="visit_scheduling">{t('types.visit_scheduling')}</option>
                <option value="lead_nurturing">{t('types.lead_nurturing')}</option>
                <option value="general">{t('types.general')}</option>
              </select>
            </div>
          </div>

          {task && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.status')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">{t('statuses.pending')}</option>
                <option value="in_progress">{t('statuses.in_progress')}</option>
                <option value="completed">{t('statuses.completed')}</option>
                <option value="cancelled">{t('statuses.cancelled')}</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.assignTo')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.assignedToId}
                onChange={(e) => handleInputChange('assignedToId', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('form.assignToPlaceholder')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.relatedLead')}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.leadId}
                  onChange={(e) => handleInputChange('leadId', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('form.relatedLeadPlaceholder')}</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.nameEn || lead.nameAr || 'Unnamed Lead'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.relatedProject')}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('form.relatedProjectPlaceholder')}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.nameEn || project.nameAr || 'Unnamed Project'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.relatedInventory')}
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={formData.inventoryId}
                  onChange={(e) => handleInputChange('inventoryId', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('form.relatedInventoryPlaceholder')}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.titleEn || property.titleAr || property.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminder"
                checked={formData.reminder}
                onChange={(e) => handleInputChange('reminder', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="reminder" className="ml-2 text-sm font-medium text-gray-700">
                {t('form.reminder')}
              </label>
            </div>
            
            {formData.reminder && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.reminderTime')}
                </label>
                <input
                  type="datetime-local"
                  value={formData.reminderTime}
                  onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                task ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;