import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Building2,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target
} from 'lucide-react';
import { Task, TaskFilters, CreateTaskDto } from '../../types';
import { 
  getTasks, 
  getMyTasks, 
  getTaskStatistics, 
  createTask, 
  updateTask, 
  deleteTask, 
  updateTaskStatus 
} from '../../queries/queries';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import TaskModal from './TaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import TaskFiltersPanel from './TaskFiltersPanel';
import TaskStatistics from './TaskStatistics';
import BulkActionsModal from './BulkActionsModal';

const TasksManagement: React.FC = () => {
  const { t } = useTranslation('tasks');
  const { user } = useAuth();
  const { isRTL, rtlPosition } = useLanguage();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
  const [bulkActionsModalOpen, setBulkActionsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Queries
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks', filters, viewMode],
    queryFn: () => viewMode === 'my' ? getMyTasks(filters) : getTasks(filters),
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const { data: statistics, isLoading: statisticsLoading, error: statisticsError } = useQuery({
    queryKey: ['taskStatistics'],
    queryFn: getTaskStatistics,
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Debug logging
  React.useEffect(() => {
    console.log('Tasks data:', tasks);
    console.log('Statistics data:', statistics);
    console.log('User:', user);
    console.log('Tasks loading:', tasksLoading);
    console.log('Statistics loading:', statisticsLoading);
  }, [tasks, statistics, user, tasksLoading, statisticsLoading]);

  // Helper function to get the due date from task
  const getTaskDueDate = (task: Task) => {
    // Check if dueDate exists and is valid
    if (task.dueDate) {
      try {
        // Handle case where dueDate might be an empty object {}
        if (typeof task.dueDate === 'object' && Object.keys(task.dueDate).length === 0) {
          console.log('dueDate is empty object, skipping');
        } else {
          const dueDate = new Date(task.dueDate);
          if (!isNaN(dueDate.getTime())) {
            return dueDate;
          }
        }
      } catch (error) {
        console.error('Error parsing dueDate:', task.dueDate, error);
      }
    }
    
    // Fallback to createdAt if dueDate is not available or invalid
    if (task.createdAt) {
      try {
        // Handle case where createdAt might be an empty object {}
        if (typeof task.createdAt === 'object' && Object.keys(task.createdAt).length === 0) {
          console.log('createdAt is empty object, skipping');
        } else {
          const createdDate = new Date(task.createdAt);
          if (!isNaN(createdDate.getTime())) {
            return createdDate;
          }
        }
      } catch (error) {
        console.error('Error parsing createdAt:', task.createdAt, error);
      }
    }
    
    // Final fallback: use current date if no valid date is found
    // This ensures the analysis can still work even with invalid dates
    console.log('No valid date found for task, using current date as fallback');
    return new Date();
  };

  // Analysis and insights
  const taskAnalysis = React.useMemo(() => {
    console.log('Computing task analysis with tasks:', tasks);
    
    if (!tasks || tasks.length === 0) {
      console.log('No tasks available for analysis');
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const analysis = {
      overdue: tasks.filter(task => {
        const dueDate = getTaskDueDate(task);
        return dueDate && dueDate < now && 
               task.status !== 'completed' && 
               task.status !== 'cancelled';
      }),
      dueToday: tasks.filter(task => {
        const dueDate = getTaskDueDate(task);
        return dueDate && dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }),
      dueThisWeek: tasks.filter(task => {
        const dueDate = getTaskDueDate(task);
        return dueDate && dueDate >= today && dueDate < endOfWeek;
      }),
      highPriority: tasks.filter(task => task.priority === 'high' || task.priority === 'urgent'),
      myTasks: tasks.filter(task => task.assignedToId === user?.id),
      completionRate: tasks.length > 0 ? 
        (tasks.filter(task => task.status === 'completed').length / tasks.length) * 100 : 0
    };

    console.log('Task analysis computed:', analysis);
    return analysis;
  }, [tasks, user?.id]);

  // Error handling
  const handleError = (error: any) => {
    console.error('Task operation error:', error);
    toast.error(error?.response?.data?.message || 'An error occurred. Please try again.');
  };

  // Mutations with better error handling
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStatistics'] });
      toast.success(t('notifications.taskCreated'));
      setTaskModalOpen(false);
    },
    onError: handleError
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaskDto> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStatistics'] });
      toast.success(t('notifications.taskUpdated'));
      setTaskModalOpen(false);
      setEditingTask(null);
    },
    onError: handleError
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStatistics'] });
      toast.success(t('notifications.taskDeleted'));
      setSelectedTasks([]);
    },
    onError: handleError
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStatistics'] });
      toast.success(t('notifications.statusUpdated'));
    },
    onError: handleError
  });

  // Handlers
  const handleCreateTask = (taskData: CreateTaskDto) => {
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTask = (taskData: Partial<CreateTaskDto>) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: taskData });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm(t('notifications.confirmDelete'))) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(t('notifications.confirmDeleteMultiple', { count: selectedTasks.length }))) {
      selectedTasks.forEach(taskId => deleteTaskMutation.mutate(taskId));
    }
  };

  const handleStatusUpdate = (taskId: string, status: Task['status']) => {
    updateStatusMutation.mutate({ id: taskId, status });
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assignedTo?.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'dueDate':
        // Check if dates are fallback dates (no original date was valid)
        const aHasValidDate = a.dueDate && !(typeof a.dueDate === 'object' && Object.keys(a.dueDate).length === 0) ||
                             a.createdAt && !(typeof a.createdAt === 'object' && Object.keys(a.createdAt).length === 0);
        const bHasValidDate = b.dueDate && !(typeof b.dueDate === 'object' && Object.keys(b.dueDate).length === 0) ||
                             b.createdAt && !(typeof b.createdAt === 'object' && Object.keys(b.createdAt).length === 0);
        
        if (!aHasValidDate && !bHasValidDate) return 0;
        if (!aHasValidDate) return 1;
        if (!bHasValidDate) return -1;
        
        aValue = getTaskDueDate(a);
        bValue = getTaskDueDate(b);
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      case 'status':
        const statusOrder = { pending: 1, in_progress: 2, completed: 3, cancelled: 4, overdue: 5 };
        aValue = statusOrder[a.status as keyof typeof statusOrder];
        bValue = statusOrder[b.status as keyof typeof statusOrder];
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setBulkActionsModalOpen(true)}
              disabled={selectedTasks.length === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('quickActions.bulkUpdate')} ({selectedTasks.length})
            </button>
            <button
              onClick={() => setTaskModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createTask')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Analysis & Insights */}
      {(taskAnalysis || tasks.length > 0) && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Analysis & Insights</h3>
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug Info:</strong> Tasks: {tasks.length}, Analysis: {taskAnalysis ? 'Available' : 'Not Available'}, 
                Loading: {tasksLoading ? 'Yes' : 'No'}, Error: {tasksError ? 'Yes' : 'No'}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Always show at least one insight card if there are tasks */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Active Tasks</p>
                  <p className="text-2xl font-bold text-blue-900">{tasks.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 mt-2">Tasks in the system</p>
            </div>

            {/* Show pending tasks count */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Pending Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.filter(task => task.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-sm text-gray-700 mt-2">Awaiting action</p>
            </div>

            {/* Show in progress tasks count */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">In Progress</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {tasks.filter(task => task.status === 'in_progress').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-blue-700 mt-2">Currently being worked on</p>
            </div>

            {/* Show completed tasks count */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Completed</p>
                  <p className="text-2xl font-bold text-green-900">
                    {tasks.filter(task => task.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-green-700 mt-2">Successfully finished</p>
            </div>

            {taskAnalysis && (
              <>
                {taskAnalysis.overdue.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-800">Overdue Tasks</p>
                        <p className="text-2xl font-bold text-red-900">{taskAnalysis.overdue.length}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-sm text-red-700 mt-2">Tasks past their due date</p>
                  </div>
                )}
                
                {taskAnalysis.dueToday.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-800">Due Today</p>
                        <p className="text-2xl font-bold text-orange-900">{taskAnalysis.dueToday.length}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-sm text-orange-700 mt-2">Tasks due today</p>
                  </div>
                )}
                
                {taskAnalysis.highPriority.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-800">High Priority</p>
                        <p className="text-2xl font-bold text-purple-900">{taskAnalysis.highPriority.length}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-sm text-purple-700 mt-2">High & urgent priority tasks</p>
                  </div>
                )}
                
                {taskAnalysis.myTasks.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-800">My Tasks</p>
                        <p className="text-2xl font-bold text-indigo-900">{taskAnalysis.myTasks.length}</p>
                      </div>
                      <User className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="text-sm text-indigo-700 mt-2">Tasks assigned to you</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTaskModalOpen(true)}
                className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                Create New Task
              </button>
              
              <button
                onClick={() => handleFilterChange({ status: 'pending' })}
                className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                View Pending ({tasks.filter(task => task.status === 'pending').length})
              </button>
              
              <button
                onClick={() => handleFilterChange({ status: 'in_progress' })}
                className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                View In Progress ({tasks.filter(task => task.status === 'in_progress').length})
              </button>
              
              <button
                onClick={() => handleFilterChange({ status: 'completed' })}
                className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
              >
                View Completed ({tasks.filter(task => task.status === 'completed').length})
              </button>
              
              {taskAnalysis && (
                <>
                  {taskAnalysis.overdue.length > 0 && (
                    <button
                      onClick={() => handleFilterChange({ status: 'overdue' })}
                      className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                    >
                      View Overdue ({taskAnalysis.overdue.length})
                    </button>
                  )}
                  {taskAnalysis.dueToday.length > 0 && (
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        handleFilterChange({ dueDateFrom: today, dueDateTo: today });
                      }}
                      className="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200"
                    >
                      View Due Today ({taskAnalysis.dueToday.length})
                    </button>
                  )}
                  {taskAnalysis.highPriority.length > 0 && (
                    <button
                      onClick={() => handleFilterChange({ priority: 'high' })}
                      className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200"
                    >
                      View High Priority ({taskAnalysis.highPriority.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('filters.search')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Filter className="w-4 h-4" />
                <span>{t('filters.title')}</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm font-medium rounded-lg ${
                  viewMode === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('filters.title')}
              </button>
              <button
                onClick={() => setViewMode('my')}
                className={`px-3 py-1 text-sm font-medium rounded-lg ${
                  viewMode === 'my' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('filters.myTasks')}
              </button>
            </div>
          </div>

          {showFilters && (
            <TaskFiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={() => setFilters({ page: 1, limit: 10 })}
            />
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.title')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t('table.dueDate')}</span>
                    {sortBy === 'dueDate' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('priority')}
                >
                  {t('table.priority')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  {t('table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.assignedTo')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.relatedTo')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasksLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-4"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                  </tr>
                ))
              ) : tasksError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                      <p className="text-red-600 font-medium">Failed to load tasks</p>
                      <p className="text-gray-500 text-sm">Please check your connection and try again</p>
                      <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium text-lg">No tasks found</p>
                        <p className="text-gray-500 text-sm">
                          {searchTerm || Object.values(filters).some(v => v && v !== '') 
                            ? 'Try adjusting your search or filters' 
                            : 'Get started by creating your first task'
                          }
                        </p>
                      </div>
                      {!searchTerm && !Object.values(filters).some(v => v && v !== '') && (
                        <button
                          onClick={() => setTaskModalOpen(true)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Your First Task</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => handleTaskSelect(task.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTaskTypeIcon(task.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const dueDate = getTaskDueDate(task);
                          // Check if this is a fallback date (no original date was valid)
                          const isFallback = !task.dueDate || 
                            (typeof task.dueDate === 'object' && Object.keys(task.dueDate).length === 0) ||
                            !task.createdAt || 
                            (typeof task.createdAt === 'object' && Object.keys(task.createdAt).length === 0);
                          
                          if (isFallback) {
                            return <span className="text-orange-600">No Date Set</span>;
                          }
                          return dueDate.toLocaleDateString();
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const dueDate = getTaskDueDate(task);
                          // Check if this is a fallback date
                          const isFallback = !task.dueDate || 
                            (typeof task.dueDate === 'object' && Object.keys(task.dueDate).length === 0) ||
                            !task.createdAt || 
                            (typeof task.createdAt === 'object' && Object.keys(task.createdAt).length === 0);
                          
                          if (isFallback) {
                            return '';
                          }
                          return dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                        {t(`priorities.${task.priority}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                        {t(`statuses.${task.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{task.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {task.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {task.lead && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            <Users className="w-3 h-3 mr-1" />
                            Lead
                          </span>
                        )}
                        {task.project && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            <Building2 className="w-3 h-3 mr-1" />
                            Project
                          </span>
                        )}
                        {task.inventory && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            <FileText className="w-3 h-3 mr-1" />
                            Property
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setViewingTask(task);
                            setTaskDetailsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setTaskModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
      />

      <TaskDetailsModal
        isOpen={taskDetailsModalOpen}
        onClose={() => {
          setTaskDetailsModalOpen(false);
          setViewingTask(null);
        }}
        task={viewingTask}
        onStatusUpdate={handleStatusUpdate}
      />

      <BulkActionsModal
        isOpen={bulkActionsModalOpen}
        onClose={() => setBulkActionsModalOpen(false)}
        selectedTasks={selectedTasks}
        onBulkDelete={handleBulkDelete}
        onBulkStatusUpdate={(status) => {
          selectedTasks.forEach(taskId => handleStatusUpdate(taskId, status));
          setBulkActionsModalOpen(false);
        }}
      />
    </div>
  );
};

export default TasksManagement; 