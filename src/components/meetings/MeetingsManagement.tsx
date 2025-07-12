import React, { useState } from 'react';
import { Search, Plus, Edit, Clock, User, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

interface Meeting {
  id: string;
  title: string;
  client: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  assignedTo: string;
  locationType?: string;
  location?: string;
}

const MeetingsManagement: React.FC = () => {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, users } = useData();
  const { user } = useAuth();
  const { t } = useTranslation('meetings');
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    client: '',
    date: '',
    time: '',
    duration: '',
    type: '',
    status: 'Scheduled',
    assignedTo: '',
    notes: '',
    createdBy: user?.name || 'System',
    locationType: 'Online',
    location: '',
  });

  // Helper function to translate meeting types
  const translateMeetingType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'Proposal': t('meetingTypes.proposal'),
      'Site Visit': t('meetingTypes.siteVisit'),
      'Negotiation': t('meetingTypes.negotiation'),
    };
    return typeMap[type] || type;
  };

  // Helper function to translate meeting statuses
  const translateMeetingStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Scheduled': t('statuses.scheduled'),
      'Completed': t('statuses.completed'),
      'Cancelled': t('statuses.cancelled'),
    };
    return statusMap[status] || status;
  };

  // Helper function to translate location types
  const translateLocationType = (locationType: string) => {
    const locationMap: { [key: string]: string } = {
      'Online': t('locationTypes.online'),
      'Offline': t('locationTypes.offline'),
    };
    return locationMap[locationType] || locationType;
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      title: '',
      client: '',
      date: '',
      time: '',
      duration: '',
      type: '',
      status: 'Scheduled',
      assignedTo: '',
      notes: '',
      createdBy: user?.name || 'System',
      locationType: 'Online',
      location: '',
    });
    setShowForm(true);
  };

  const openEditForm = (meeting: any) => {
    setEditId(meeting.id);
    setForm({ ...meeting, createdBy: meeting.createdBy || user?.name || 'System' });
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editId) {
      updateMeeting(editId, { ...form, status: form.status as 'Scheduled' | 'Completed' | 'Cancelled', createdBy: user.name });
    } else {
      addMeeting({ ...form, status: form.status as 'Scheduled' | 'Completed' | 'Cancelled', createdBy: user.name });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('deleteConfirm'))) {
      deleteMeeting(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Proposal': return 'bg-purple-100 text-purple-800';
      case 'Site Visit': return 'bg-orange-100 text-orange-800';
      case 'Negotiation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Role-based meeting filtering
  const getFilteredMeetings = () => {
    let userMeetings = meetings;
    
    // Role-based filtering
    if (user?.role === 'Sales Rep') {
      // Sales Reps can only see their own meetings
      userMeetings = meetings.filter(meeting => meeting.assignedTo === user.name);
    } else if (user?.role === 'Team Leader') {
      // Team leaders can see their team's meetings and unassigned meetings
      userMeetings = meetings.filter(meeting => 
        meeting.assignedTo === user.name || 
        (user.teamId && meeting.assignedTo.includes(user.teamId)) ||
        meeting.assignedTo === '' // Unassigned meetings
      );
    } else if (user?.role === 'Sales Admin' || user?.role === 'Admin') {
      // Sales Admin and Admin can see all meetings
      userMeetings = meetings;
    }
    
    // Search filtering
    return userMeetings.filter(meeting =>
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredMeetings = getFilteredMeetings();

  // Performance tracking for reports
  const userMeetingPerformance = React.useMemo(() => {
    const userMeetings = meetings.filter(meeting => meeting.assignedTo === user?.name);
    const totalMeetings = userMeetings.length;
    const completedMeetings = userMeetings.filter(meeting => meeting.status === 'Completed').length;
    const cancelledMeetings = userMeetings.filter(meeting => meeting.status === 'Cancelled').length;
    const scheduledMeetings = userMeetings.filter(meeting => meeting.status === 'Scheduled').length;

    return {
      totalMeetings,
      completedMeetings,
      cancelledMeetings,
      scheduledMeetings,
      completionRate: totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0,
      cancellationRate: totalMeetings > 0 ? Math.round((cancelledMeetings / totalMeetings) * 100) : 0
    };
  }, [meetings, user?.name]);

  // Save meeting performance data to localStorage for reports
  React.useEffect(() => {
    if (user?.name) {
      const meetingPerformanceKey = `user_meeting_performance_${user.name}`;
      localStorage.setItem(meetingPerformanceKey, JSON.stringify({
        ...userMeetingPerformance,
        lastUpdated: new Date().toISOString(),
        userId: user.id,
        userName: user.name,
        userRole: user.role
      }));
    }
  }, [userMeetingPerformance, user]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchMeetings')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
            <Plus className="h-5 w-5 mr-2" />
            {t('scheduleMeeting')}
          </button>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.meeting')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.client')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.dateTime')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.duration')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.location')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeetings.map((meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{meeting.title}</div>
                        <div className="text-sm text-gray-500">{t('with')} {meeting.client}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meeting.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{meeting.date}</div>
                    <div className="text-sm text-gray-500">{meeting.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-1" />
                      {meeting.duration}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(meeting.type)}`}>
                      {translateMeetingType(meeting.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                      {translateMeetingStatus(meeting.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(meeting as any).locationType === 'Offline' ? (meeting as any).location : translateLocationType((meeting as any).locationType || 'Online')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800 mr-3" onClick={() => openEditForm(meeting)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(meeting.id)}>
                    <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Meeting Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 sm:mx-8 relative flex flex-col max-h-[90vh]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-2xl font-bold text-gray-900">{editId ? t('modal.editMeeting') : t('modal.scheduleMeeting')}</h3>
              <button
                type="button"
                aria-label={t('modal.close')}
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">{t('modal.close')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Scrollable Form Content */}
            <form
              onSubmit={handleFormSubmit}
              className="overflow-y-auto px-6 py-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{ maxHeight: 'calc(90vh - 72px)' }}
            >
              <div className="md:col-span-2 mb-2">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">{t('meetingDetails')}</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.title')}</label>
                <input type="text" name="title" value={form.title} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.client')}</label>
                <input type="text" name="client" value={form.client} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.date')}</label>
                <input type="date" name="date" value={form.date} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.time')}</label>
                <input type="time" name="time" value={form.time} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.duration')}</label>
                <input type="text" name="duration" value={form.duration} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.type')}</label>
                <select name="type" value={form.type} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">{t('form.selectType')}</option>
                  <option value="Proposal">{t('meetingTypes.proposal')}</option>
                  <option value="Site Visit">{t('meetingTypes.siteVisit')}</option>
                  <option value="Negotiation">{t('meetingTypes.negotiation')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.status')}</label>
                <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="Scheduled">{t('statuses.scheduled')}</option>
                  <option value="Completed">{t('statuses.completed')}</option>
                  <option value="Cancelled">{t('statuses.cancelled')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.locationType')}</label>
                <select
                  name="locationType"
                  value={form.locationType}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Online">{t('locationTypes.online')}</option>
                  <option value="Offline">{t('locationTypes.offline')}</option>
                </select>
              </div>
              {form.locationType === 'Offline' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.location')}</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={form.locationType === 'Offline'}
                  />
                </div>
              )}
              <div className="md:col-span-2 mt-2">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">{t('form.assignment')}</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.assignedTo')}</label>
                <select name="assignedTo" value={form.assignedTo} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">{t('form.selectUser')}</option>
                  {(() => {
                    // Role-based user filtering for assignment
                    let assignableUsers = users;
                    
                    if (user?.role === 'Sales Rep') {
                      // Sales Reps can only assign to themselves
                      assignableUsers = users.filter(u => u.name === user.name);
                    } else if (user?.role === 'Team Leader') {
                      // Team Leaders can assign to their team members and themselves
                      assignableUsers = users.filter(u => 
                        u.name === user.name || 
                        (u.role === 'Sales Rep' && u.teamId === user.teamId)
                      );
                    } else if (user?.role === 'Sales Admin' || user?.role === 'Admin') {
                      // Sales Admin and Admin can assign to anyone
                      assignableUsers = users.filter(u => u.role !== 'Admin' || user?.role === 'Admin');
                    }
                    
                    return assignableUsers.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ));
                  })()}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.notes')}</label>
                <textarea name="notes" value={form.notes} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('actions.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? t('actions.update') : t('actions.schedule')} {t('meetingDetails').toLowerCase()}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsManagement;