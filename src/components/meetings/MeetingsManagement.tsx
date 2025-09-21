import React, { useEffect, useState } from 'react';
import {
  Search, Plus, Edit, Clock, Calendar as CalendarIcon, Trash2, Filter, X, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Meeting, User as UserType, Lead } from '../../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { Id, toast } from 'react-toastify';
import { getMeetings, getUsers, getLeads } from '../../queries/queries';
import { CalendarPlus } from 'lucide-react';
import { Apple } from 'lucide-react';
import { CalendarDays } from 'lucide-react';




const MeetingsManagement: React.FC = () => {
  const [toastId, setToastId] = useState<Id | null>(null);

  const { data: meetings } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getMeetings(),
  });
  const queryClient = useQueryClient();






  // const { meetings, addMeeting, updateMeeting, deleteMeeting, users } = useData();
  const { data: users } = useQuery<UserType[]>({
    queryKey: ['users'],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getUsers(),
  });



  const { data: leads, } = useQuery<Lead[]>({
    queryKey: ["leads"],
    staleTime: 1000 * 60 * 5, // 5 دقائق
    queryFn: () => getLeads(),
  });


  
  const { mutateAsync: addMeeting, isPending: isAddingMeeting } = useMutation({
    mutationFn: (meeting: Meeting) => axiosInterceptor.post('/meetings', meeting),
    onSuccess: () => {
      toast.success(t('meetingAdded'));
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['notificationData'] });
      setShowForm(false);
      setForm({
        title: '',
        client: '',
        date: '',
        time: '',
        // meetingDone: false,
        duration: '',
        type: '',
        status: 'Scheduled',
        assignedToId: '',
        notes: '',
        createdBy: user?.name || 'System',
        location: '',
        leadId: '',
        locationType: 'Online',
      });
    },
    onError: (error: any) => {
      toast.error(error.response.data.message[0] || "Error adding meeting");
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    }
  });



  const { mutateAsync: updateMeeting, isPending: isUpdatingMeeting } = useMutation({
    mutationFn: (meeting: Meeting) => axiosInterceptor.patch(`/meetings/${meeting.id}`, meeting),
    onSuccess: () => {
      toast.success(t('meetingUpdated'));
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['notificationData'] });
      setShowForm(false);
      setEditId(null);
      setForm({
        title: '',
        client: '',
        // meetingDone: false,
        date: '',
        time: '',
        duration: '',
        type: '',
        status: 'Scheduled',
        assignedToId: '',
        notes: '',
        createdBy: user?.name || 'System',
        location: '',
        leadId: '',
        locationType: 'Online',
      });
    },
    onError: (error: any) => {
      toast.error(error.response.data.message[0] || "Error updating meeting");
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    }
  });




  const { mutateAsync: deleteMeeting, isPending: isDeletingMeeting } = useMutation({
    mutationFn: (id: string) => axiosInterceptor.delete(`/meetings/${id}`),
    onSuccess: () => {
      toast.dismiss(toastId || '');
      toast.success("Meeting deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    }
  });





  const { user } = useAuth();
  const { t } = useTranslation('meetings');
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Meeting>(
    {
      title: '',
      client: '',
      date: '',
      // meetingDone: false,
      time: '',
      duration: '',
      type: '',
      status: 'Scheduled',
      assignedToId: '',
      notes: '',
      createdBy: user?.name || 'System',
      locationType: 'Online',
      location: '',
      leadId: '',
    }
  );
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    locationType: '',
    assignedToId: '',
    dateFrom: '',
    dateTo: '',
    meetingDone: ''
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

  useEffect(() => {
    if (isDeletingMeeting) {
      setToastId(toast.loading("Deleting meeting..."));
    }
  }, [isDeletingMeeting]);

  // Helper to format date/time for Google Calendar (UTC, YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date: string, time: string, duration: string) => {
    // Validate inputs
    if (!date || !time || !duration) {
      console.error('Invalid date/time/duration provided:', { date, time, duration });
      // Return current date/time as fallback
      const now = new Date();
      const start = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(now.getTime() + 60 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return { start, end };
    }

    try {
      // Parse date and time
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = time.split(':').map(Number);

      // Validate parsed values
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        throw new Error('Invalid date or time format');
      }

      const start = new Date(Date.UTC(year, month - 1, day, hour, minute));

      // Parse duration (assume format like '1h', '30m', '1h 30m')
      let durMins = 0;
      const hMatch = duration.match(/(\d+)h/);
      const mMatch = duration.match(/(\d+)m/);
      if (hMatch) durMins += parseInt(hMatch[1], 10) * 60;
      if (mMatch) durMins += parseInt(mMatch[1], 10);
      if (durMins === 0) durMins = 60; // default 1h

      const end = new Date(start.getTime() + durMins * 60000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
      return { start: fmt(start), end: fmt(end) };
    } catch (error) {
      console.error('Error formatting date:', error, { date, time, duration });
      // Return current date/time as fallback
      const now = new Date();
      const start = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(now.getTime() + 60 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      return { start, end };
    }
  };

  // Helper to generate Google Calendar link
  const getGoogleCalendarUrl = (meeting: Meeting) => {
    const { start, end } = formatGoogleDate(meeting.date, meeting.time, meeting.duration);
    const details = [
      `Client: ${meeting.client}`,
      `Type: ${meeting.type}`,
      `Status: ${meeting.status}`,
      meeting.location ? `Location: ${meeting.location}` : '',
      meeting.notes ? `Notes: ${meeting.notes}` : '',
      '',
      '⏰ Reminders set for:',
      '• 1 day before the meeting',
      '• 1 hour before the meeting',
      '• At meeting start time'
    ].filter(Boolean).join('\n');

    // Google Calendar supports reminder parameters via URL
    // Multiple reminders: 1440 minutes (1 day), 60 minutes (1 hour), 0 minutes (at time)
    const reminders = '&rem=1440&rem=60&rem=0';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=${start}%2F${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(meeting.location || '')}&trp=false${reminders}`;
  };

  // Helper to generate .ics file content for Apple Calendar
  const getICSContent = (meeting: Meeting) => {
    const { start, end } = formatGoogleDate(meeting.date, meeting.time, meeting.duration);
    // Convert to iCal format (YYYYMMDDTHHmmssZ)
    const uid = `${meeting.id}@propai-crm`;
    const description = [
      `Client: ${meeting.client}`,
      `Type: ${meeting.type}`,
      `Status: ${meeting.status}`,
      meeting.location ? `Location: ${meeting.location}` : '',
      meeting.notes ? `Notes: ${meeting.notes}` : '',
    ].filter(Boolean).join('\\n');

    // Multiple reminders: 1 day before, 1 hour before, and at appointment time
    const alarms = [
      // 1 day before
      'BEGIN:VALARM\\nTRIGGER:-P1D\\nACTION:DISPLAY\\nDESCRIPTION:Meeting tomorrow: ' + meeting.title + '\\nEND:VALARM',
      // 1 hour before
      'BEGIN:VALARM\\nTRIGGER:-PT1H\\nACTION:DISPLAY\\nDESCRIPTION:Meeting in 1 hour: ' + meeting.title + '\\nEND:VALARM',
      // At appointment time
      'BEGIN:VALARM\\nTRIGGER:PT0M\\nACTION:DISPLAY\\nDESCRIPTION:Meeting starting now: ' + meeting.title + '\\nEND:VALARM'
    ].join('\\n');

    return `BEGIN:VCALENDAR\\nVERSION:2.0\\nPRODID:-//Propai CRM//EN\\nBEGIN:VEVENT\\nUID:${uid}\\nDTSTAMP:${start}\\nDTSTART:${start}\\nDTEND:${end}\\nSUMMARY:${meeting.title}\\nDESCRIPTION:${description}\\nLOCATION:${meeting.location || ''}\\n${alarms}\\nEND:VEVENT\\nEND:VCALENDAR`;
  };

  // Download .ics file
  const downloadICS = (meeting: Meeting) => {
    const icsContent = getICSContent(meeting);
    const blob = new Blob([icsContent.replace(/\\n/g, '\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Row click handler (ignore clicks on action buttons)
  const handleRowClick = (e: React.MouseEvent, meeting: Meeting) => {
    // Prevent if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setSelectedMeeting(meeting);
    setCalendarModalOpen(true);
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      title: '',
      client: '',
//  meetingDone: false,
      date: '',
      time: '',
      duration: '',
      type: '',
      status: 'Scheduled',
      assignedToId: '',
      notes: '',
      createdBy: user?.name || 'System',
      locationType: 'Online',
      location: '',
      leadId: '',
    });
    setShowForm(true);
  };

  const openEditForm = (meeting: any) => {
    setEditId(meeting.id);
    setForm({ ...meeting, createdBy: meeting.createdBy || user?.name || 'System', leadId: meeting.leadId || '' });
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // If meeting type is changed to "Site Visit", automatically set location type to "Offline"
    if (name === 'type' && value === 'Site Visit') {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        locationType: 'Offline'
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    console.log(form);

    if (editId) {
      updateMeeting({
        ...form, status: form.status as 'Scheduled' | 'Completed' | 'Cancelled', createdBy: user.name, id: editId,
      });
    } else {

      addMeeting({ ...form, status: form.status as 'Scheduled' | 'Completed' | 'Cancelled', createdBy: user.name });
    }
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

  // Filter handlers
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      type: '',
      locationType: '',
      assignedToId: '',
      dateFrom: '',
      dateTo: '',
      meetingDone: ''
    });
    setSearchTerm('');
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length + (searchTerm ? 1 : 0);
  };

  // Role-based meeting filtering
  const getFilteredMeetings = () => {
    let userMeetings = meetings;

    // // Role-based filtering
    // if (user?.role === 'sales_rep') {
    //   // Sales Reps can only see their own meetings
    //   userMeetings = meetings?.filter((meeting: Meeting) => meeting.assignedToId === user.id);
    // } else if (user?.role === 'team_leader') {
    //   // Team leaders see their own meetings and their sales reps' meetings
    //   const salesReps = users?.filter((u: UserType) => u.role === 'sales_rep' && u.teamId === user.name).map((u: UserType) => u.name);
    //   userMeetings = meetings?.filter((meeting: Meeting) => meeting.assignedToId === user.id || salesReps?.includes(meeting.assignedToId));
    // } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
    //   // Sales Admin and Admin can see all meetings
    //   userMeetings = meetings;
    // }

    // Search filtering
    let filtered = userMeetings?.filter((meeting: Meeting) =>
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.notes && meeting.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(meeting => meeting.status === filters.status);
    }

    if (filters.type) {
      filtered = filtered.filter(meeting => meeting.type === filters.type);
    }

    if (filters.locationType) {
      filtered = filtered.filter(meeting => (meeting as any).locationType === filters.locationType);
    }

    if (filters.assignedToId) {
      filtered = filtered.filter(meeting => meeting.assignedToId === filters.assignedToId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(meeting => meeting.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(meeting => meeting.date <= filters.dateTo);
    }

    if (filters.meetingDone) {
      const isDone = filters.meetingDone === 'true';
      filtered = filtered.filter(meeting => (meeting as any).meetingDone === isDone);
    }

    return filtered;
  };

  useEffect(() => {
    if (meetings) {
      setFilteredMeetings(getFilteredMeetings() || []);
    }
  }, [meetings, searchTerm, filters]);

  // Performance tracking for reports
  const userMeetingPerformance = React.useMemo(() => {
    const userMeetings = meetings?.filter((meeting: Meeting) => meeting.assignedToId === user?.id);
    const totalMeetings = userMeetings?.length;
    const completedMeetings = userMeetings?.filter((meeting: Meeting) => meeting.status === 'Completed').length;
    const cancelledMeetings = userMeetings?.filter((meeting: Meeting) => meeting.status === 'Cancelled').length;
    const scheduledMeetings = userMeetings?.filter((meeting: Meeting) => meeting.status === 'Scheduled').length;

    return {
      totalMeetings,
      completedMeetings,
      cancelledMeetings,
      scheduledMeetings,
      completionRate: totalMeetings && totalMeetings > 0 ? Math.round((completedMeetings || 0 / totalMeetings) * 100) : 0,
      cancellationRate: totalMeetings && totalMeetings > 0 ? Math.round((cancelledMeetings || 0 / totalMeetings) * 100) : 0
    };
  }, [meetings, user?.name]);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400`} />
              <input
                type="text"
                placeholder={t('searchMeetings')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${language === 'ar' ? 'text-right' : ''}`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                  ${showFilters 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                  ${language === 'ar' ? 'flex-row-reverse' : ''}
                `}
              >
                <Filter className="h-5 w-5" />
                <span className="font-medium">
                  {t('filters', { defaultValue: 'Filters' })}
                  {getActiveFiltersCount() > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </span>
              </button>

              {/* Reset Filters Button */}
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={resetFilters}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 
                    text-gray-600 hover:bg-gray-50 transition-colors
                    ${language === 'ar' ? 'flex-row-reverse' : ''}
                  `}
                  title={t('resetFilters', { defaultValue: 'Reset all filters' })}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">{t('reset', { defaultValue: 'Reset' })}</span>
                </button>
              )}

              {/* Add Meeting Button */}
              {(user?.role === 'admin' || user?.role === 'sales_admin') && (
                <button 
                  className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`} 
                  onClick={openAddForm}
                >
                  <Plus className={`h-5 w-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {t('scheduleMeeting')}
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t pt-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('tableHeaders.status', { defaultValue: 'Status' })}
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">{t('allStatuses', { defaultValue: 'All Statuses' })}</option>
                    <option value="Scheduled">{t('statuses.scheduled')}</option>
                    <option value="Completed">{t('statuses.completed')}</option>
                    <option value="Cancelled">{t('statuses.cancelled')}</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('tableHeaders.type', { defaultValue: 'Type' })}
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">{t('allTypes', { defaultValue: 'All Types' })}</option>
                    <option value="Proposal">{t('meetingTypes.proposal')}</option>
                    <option value="Site Visit">{t('meetingTypes.siteVisit')}</option>
                    <option value="Negotiation">{t('meetingTypes.negotiation')}</option>
                  </select>
                </div>

                {/* Location Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.locationType', { defaultValue: 'Location Type' })}
                  </label>
                  <select
                    value={filters.locationType}
                    onChange={(e) => handleFilterChange('locationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">{t('allLocationTypes', { defaultValue: 'All Location Types' })}</option>
                    <option value="Online">{t('locationTypes.online')}</option>
                    <option value="Offline">{t('locationTypes.offline')}</option>
                  </select>
                </div>

                {/* Assigned To Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.assignedTo', { defaultValue: 'Assigned To' })}
                  </label>
                  <select
                    value={filters.assignedToId}
                    onChange={(e) => handleFilterChange('assignedToId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">{t('allUsers', { defaultValue: 'All Users' })}</option>
                    {users?.map((user: UserType) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dateFrom', { defaultValue: 'Date From' })}
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Date To Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('dateTo', { defaultValue: 'Date To' })}
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Meeting Done Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('meetingDone', { defaultValue: 'Meeting Status' })}
                  </label>
                  <select
                    value={filters.meetingDone}
                    onChange={(e) => handleFilterChange('meetingDone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">{t('allMeetingStatuses', { defaultValue: 'All Meeting Statuses' })}</option>
                    <option value="true">{t('meetingDone', { defaultValue: 'Meeting Done' })}</option>
                    <option value="false">{t('meetingNotDone', { defaultValue: 'Meeting Not Done' })}</option>
                  </select>
                </div>
              </div>

              {/* Filter Results Summary */}
              {getActiveFiltersCount() > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className="text-sm text-gray-600">
                      {t('showingResults', { 
                        defaultValue: 'Showing {{count}} of {{total}} meetings',
                        count: filteredMeetings.length,
                        total: meetings?.length || 0
                      })}
                    </div>
                    <div className={`flex flex-wrap gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      {/* Active Filter Tags */}
                      {searchTerm && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {t('search', { defaultValue: 'Search' })}: "{searchTerm}"
                          <button
                            onClick={() => setSearchTerm('')}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      
                      {filters.status && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {t('status', { defaultValue: 'Status' })}: {translateMeetingStatus(filters.status)}
                          <button
                            onClick={() => handleFilterChange('status', '')}
                            className="hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {filters.type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {t('type', { defaultValue: 'Type' })}: {translateMeetingType(filters.type)}
                          <button
                            onClick={() => handleFilterChange('type', '')}
                            className="hover:bg-purple-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      

                      {filters.locationType && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {t('location', { defaultValue: 'Location' })}: {translateLocationType(filters.locationType)}
                          <button
                            onClick={() => handleFilterChange('locationType', '')}
                            className="hover:bg-orange-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {filters.assignedToId && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                          {t('assignedTo', { defaultValue: 'Assigned To' })}: {users?.find(u => u.id === filters.assignedToId)?.name}
                          <button
                            onClick={() => handleFilterChange('assignedToId', '')}
                            className="hover:bg-indigo-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {(filters.dateFrom || filters.dateTo) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {t('dateRange', { defaultValue: 'Date Range' })}: 
                          {filters.dateFrom || '...'} - {filters.dateTo || '...'}
                          <button
                            onClick={() => {
                              handleFilterChange('dateFrom', '');
                              handleFilterChange('dateTo', '');
                            }}
                            className="hover:bg-yellow-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}

                      {filters.meetingDone && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                          {filters.meetingDone === 'true' ? t('meetingDone', { defaultValue: 'Meeting Done' }) : t('meetingNotDone', { defaultValue: 'Meeting Not Done' })}
                          <button
                            onClick={() => handleFilterChange('meetingDone', '')}
                            className="hover:bg-pink-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('meetingDone', { defaultValue: 'Meeting Done' })}</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeetings?.map((meeting: Meeting) => (
                <tr key={meeting.id} className="hover:bg-gray-50 cursor-pointer" onClick={(e) => handleRowClick(e, meeting)}>
                  <td className="px-6 py-4">
                    <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center ${language === 'ar' ? 'ml-3' : 'mr-3'}`}>
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className={language === 'ar' ? 'text-right' : ''}>
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
                    <div className={`flex items-center text-sm text-gray-900 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Clock className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
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
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (meeting as any).meetingDone 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {(meeting as any).meetingDone 
                        ? (language === 'ar' ? 'تم' : 'Done')
                        : (language === 'ar' ? 'لم يتم' : 'Not Done')
                      }
                    </span>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditForm(meeting)}>
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(meeting.id || '')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredMeetings?.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {getActiveFiltersCount() > 0 
                ? t('noMeetingsMatchFilters', { defaultValue: 'No meetings match your filters' })
                : t('noMeetingsFound', { defaultValue: 'No meetings found' })
              }
            </h3>
            <p className="text-gray-500">
              {getActiveFiltersCount() > 0 
                ? t('tryAdjustingFilters', { defaultValue: 'Try adjusting your filters or search term' })
                : t('createFirstMeeting', { defaultValue: 'Create your first meeting to get started' })
              }
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Meeting Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 sm:mx-8 relative flex flex-col max-h-[90vh] ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sticky Header */}
            <div className={`sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-between px-6 py-4 border-b ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.client')}
                </label>
                <select
                  name="leadId"
                  value={form.leadId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر Lead</option>
                  { leads?.length > 0 && leads?.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.nameEn || lead.nameAr || lead.contact}
                    </option>
                  ))}
                </select>
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

              {/* <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  name="meetingDone"
                  checked={form.meetingDone || false} // القيمة من state الفورم
                  onChange={e => setForm({ ...form, meetingDone: e.target.checked })} // تحديث القيمة
                  className="w-6 h-6 rounded border-gray-300 focus:ring-2 roudned-2xl cursor-pointer"
                />
                <label className="text-sm font-medium text-gray-700">
                  {language === 'ar' ? form.meetingDone?'تم الاجتماع' :'لم يتم الاجتماع' : form.meetingDone?'Meeting Done' :'Meeting Not Done'      }
                </label>
              </div> */}



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.locationType')}</label>
                <select
                  name="locationType"
                  value={form.locationType}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${form.type === 'Site Visit' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                  disabled={form.type === 'Site Visit'}
                >
                  <option value="Online">{t('locationTypes.online')}</option>
                  <option value="Offline">{t('locationTypes.offline')}</option>
                </select>
                {form.type === 'Site Visit' && (
                  <p className="text-xs text-gray-500 mt-1">{t('siteVisitLocationNote', { defaultValue: 'Site visits are automatically set to offline location' })}</p>
                )}
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
                <select name="assignedToId" value={form.assignedToId} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">{t('form.selectUser')}</option>
                  {(() => {
                    // Role-based user filtering for assignment
                    let assignableUsers = users;

                    if (user?.role === 'sales_rep') {
                      // Sales Reps can only assign to themselves
                      assignableUsers = users?.filter((u: UserType) => u.id === user.id);
                    } else if (user?.role === 'team_leader') {
                      // Team Leaders can assign to their team members and themselves
                      assignableUsers = users?.filter((u: UserType) =>
                        u.id === user.id ||
                        (u.role === 'sales_rep' && u.teamLeaderId === user.id) ||
                        (u.teamId === user.teamId && u.id !== user.id)
                      );
                    } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
                      // Sales Admin and Admin can assign to anyone
                      assignableUsers = users?.filter((u: UserType) => u.role !== 'admin' || user?.role === 'admin');
                    }

                    return assignableUsers?.map((u: UserType) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ));
                  })()}
                </select>
              </div>




              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.notes')}</label>
                <textarea name="notes" value={form.notes} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className={`md:col-span-2 flex mt-4 gap-3 ${language === 'ar' ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('actions.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{
                  editId ? isUpdatingMeeting ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('actions.update') : isAddingMeeting ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('actions.schedule') + ' ' + t('meetingDetails').toLowerCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {calendarModalOpen && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`
              bg-white rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col
              ${language === 'ar' ? 'font-arabic' : ''}
              transform transition-all duration-300 ease-out
            `}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              aria-label={t('modal.close')}
              onClick={() => setCalendarModalOpen(false)}
              className={`
                absolute top-4 z-10 text-gray-400 hover:text-gray-700 
                p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 
                bg-white shadow-sm hover:bg-gray-50 transition-colors
                ${language === 'ar' ? 'left-4' : 'right-4'}
              `}
            >
              <span className="sr-only">{t('modal.close')}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Modal Content */}
            <div className="px-8 pt-12 pb-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <CalendarPlus className="h-12 w-12 text-blue-600 mx-auto" />
                </div>
                <h3
                  id="calendar-modal-title"
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {t('addToCalendar', { defaultValue: 'Add to Calendar' })}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {t('addToCalendarDesc', { defaultValue: 'Add this meeting to your calendar with automatic reminders: 1 day before, 1 hour before, and at the meeting time.' })}
                </p>
              </div>

              {/* Calendar Buttons */}
              <div className="space-y-4 mb-6">
                {/* Show warning if meeting data is incomplete */}
                {(!selectedMeeting.date || !selectedMeeting.time || !selectedMeeting.duration) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 text-yellow-600">⚠️</div>
                      <span className="text-sm text-yellow-800 font-medium">
                        {t('incompleteMeetingData', { defaultValue: 'This meeting is missing date, time, or duration information. Calendar integration will use current time as fallback.' })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Google Calendar Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedMeeting.date || !selectedMeeting.time || !selectedMeeting.duration) {
                      toast.warning(t('usingFallbackData', { defaultValue: 'Using current time as fallback for missing meeting data' }));
                    }
                    window.open(getGoogleCalendarUrl(selectedMeeting), '_blank');
                    toast.success(t('calendarLinkOpened', { defaultValue: 'Google Calendar opened in new tab' }));
                  }}
                  className="
                    w-full flex items-center justify-center gap-4
                    bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                    text-white px-6 py-5 rounded-xl font-semibold text-lg
                    transition-all duration-300 ease-in-out
                    transform hover:scale-[1.02] active:scale-[0.98]
                    focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-offset-2
                    shadow-lg hover:shadow-xl
                    border border-blue-500/20
                  "
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg">
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google Calendar"
                      className="h-6 w-6 flex-shrink-0"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold">
                      {t('addToGoogleCalendar', { defaultValue: 'Add to Google Calendar' })}
                    </span>
                    <span className="text-blue-100 text-sm font-normal">
                      {t('withReminders', { defaultValue: 'With 3 automatic reminders' })}
                    </span>
                  </div>
                </button>

                {/* Apple Calendar Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedMeeting.date || !selectedMeeting.time || !selectedMeeting.duration) {
                      toast.warning(t('usingFallbackData', { defaultValue: 'Using current time as fallback for missing meeting data' }));
                    }
                    downloadICS(selectedMeeting);
                    toast.success(t('calendarFileDownloaded', { defaultValue: 'Calendar file downloaded successfully' }));
                  }}
                  className="
                    w-full flex items-center justify-center gap-4
                    bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black 
                    text-white px-6 py-5 rounded-xl font-semibold text-lg
                    transition-all duration-300 ease-in-out
                    transform hover:scale-[1.02] active:scale-[0.98]
                    focus:outline-none focus:ring-3 focus:ring-gray-700 focus:ring-offset-2
                    shadow-lg hover:shadow-xl
                    border border-gray-600/20
                  "
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg">
                    <Apple className="h-6 w-6 flex-shrink-0 text-white" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold">
                      {t('addToAppleCalendar', { defaultValue: 'Add to Apple Calendar' })}
                    </span>
                    <span className="text-gray-300 text-sm font-normal">
                      {t('downloadIcsFile', { defaultValue: 'Downloads .ics file with reminders' })}
                    </span>
                  </div>
                </button>

                {/* Outlook/Other Calendar Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedMeeting.date || !selectedMeeting.time || !selectedMeeting.duration) {
                      toast.warning(t('usingFallbackData', { defaultValue: 'Using current time as fallback for missing meeting data' }));
                    }
                    downloadICS(selectedMeeting);
                    toast.info(t('universalCalendarFile', { defaultValue: 'Universal calendar file downloaded - works with Outlook, Thunderbird, and other calendar apps' }));
                  }}
                  className="
                    w-full flex items-center justify-center gap-4
                    bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 
                    text-white px-6 py-5 rounded-xl font-semibold text-lg
                    transition-all duration-300 ease-in-out
                    transform hover:scale-[1.02] active:scale-[0.98]
                    focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2
                    shadow-lg hover:shadow-xl
                    border border-purple-500/20
                  "
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-lg">
                    <CalendarIcon className="h-6 w-6 flex-shrink-0 text-white" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold">
                      {t('addToOtherCalendar', { defaultValue: 'Add to Other Calendar' })}
                    </span>
                    <span className="text-purple-100 text-sm font-normal">
                      {t('outlookThunderbirdEtc', { defaultValue: 'Outlook, Thunderbird, etc.' })}
                    </span>
                  </div>
                </button>
              </div>

              {/* iOS Instructions */}
              {isIOS && (
                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 text-center leading-relaxed">
                    💡 {t('iosCalendarInstruction', { defaultValue: 'After downloading, tap the file, then tap the share icon and choose "Add to Calendar".' })}
                  </p>
                </div>
              )}

              {/* Privacy Notice & Features */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-2">
                  <CalendarDays className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-center font-medium">
                    {t('calendarPrivacy', { defaultValue: 'Your calendar data is not stored or shared.' })}
                  </span>
                </div>
                <div className="text-center text-xs text-gray-500">
                  ✅ {t('reminderFeatures', { defaultValue: '3 automatic reminders • Cross-platform compatibility • Secure local processing' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsManagement;