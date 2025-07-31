import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  BarChart3,
  TrendingDown,
  Target
} from 'lucide-react';
import { TaskStatistics as TaskStatisticsType } from '../../types';

interface TaskStatisticsProps {
  statistics: TaskStatisticsType;
}

const TaskStatistics: React.FC<TaskStatisticsProps> = ({ statistics }) => {
  const { t } = useTranslation('tasks');

  const cards = [
    {
      title: t('statistics.totalTasks'),
      value: statistics.totalTasks,
      icon: BarChart3,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      trend: 'neutral'
    },
    {
      title: t('statistics.pendingTasks'),
      value: statistics.pendingTasks,
      icon: Clock,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      trend: statistics.pendingTasks > 0 ? 'up' : 'neutral'
    },
    {
      title: t('statistics.inProgressTasks'),
      value: statistics.inProgressTasks,
      icon: Clock,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      trend: statistics.inProgressTasks > 0 ? 'up' : 'neutral'
    },
    {
      title: t('statistics.completedTasks'),
      value: statistics.completedTasks,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      trend: 'up'
    },
    {
      title: t('statistics.overdueTasks'),
      value: statistics.overdueTasks,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      trend: statistics.overdueTasks > 0 ? 'down' : 'neutral'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getCompletionStatus = () => {
    if (statistics.completionRate >= 80) return { status: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (statistics.completionRate >= 60) return { status: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (statistics.completionRate >= 40) return { status: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { status: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const completionStatus = getCompletionStatus();

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.trend !== 'neutral' && (
                  <div className="flex items-center mt-1">
                    {getTrendIcon(card.trend)}
                    <span className={`text-xs ml-1 ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trend === 'up' ? 'Active' : 'Attention needed'}
                    </span>
                  </div>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Completion Rate */}
      <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('statistics.completionRate')}</h3>
            <p className="text-sm text-gray-500">Overall task completion performance</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-green-600">
              {statistics.completionRate.toFixed(1)}%
            </span>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${completionStatus.bgColor} ${completionStatus.color} ml-2`}>
              <Target className="w-3 h-3 mr-1" />
              {completionStatus.status}
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${statistics.completionRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Priority and Type Distribution */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Priority</h3>
          <div className="space-y-3">
            {statistics.tasksByPriority.map((item, index) => {
              const percentage = statistics.totalTasks > 0 
                ? (item._count.id / statistics.totalTasks) * 100 
                : 0;
              
              const getPriorityColor = (priority: string) => {
                switch (priority) {
                  case 'urgent': return 'bg-red-500';
                  case 'high': return 'bg-orange-500';
                  case 'medium': return 'bg-yellow-500';
                  case 'low': return 'bg-green-500';
                  default: return 'bg-gray-500';
                }
              };

              const getPriorityIcon = (priority: string) => {
                switch (priority) {
                  case 'urgent': return <AlertCircle className="w-4 h-4 text-red-600" />;
                  case 'high': return <AlertCircle className="w-4 h-4 text-orange-600" />;
                  case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
                  case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
                  default: return <Clock className="w-4 h-4 text-gray-600" />;
                }
              };

              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPriorityIcon(item.priority)}
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {t(`priorities.${item.priority}`)}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${getPriorityColor(item.priority)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{item._count.id}</span>
                    <div className="text-xs text-gray-500">({percentage.toFixed(1)}%)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Type</h3>
          <div className="space-y-3">
            {statistics.tasksByType.map((item, index) => {
              const percentage = statistics.totalTasks > 0 
                ? (item._count.id / statistics.totalTasks) * 100 
                : 0;

              const getTypeIcon = (type: string) => {
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
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getTypeIcon(item.type)}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {t(`types.${item.type}`)}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{item._count.id}</span>
                    <div className="text-xs text-gray-500">({percentage.toFixed(1)}%)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStatistics; 