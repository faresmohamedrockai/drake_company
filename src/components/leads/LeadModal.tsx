import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, Phone, Calendar, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { Lead, CallLog, VisitLog, Property } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Project } from '../inventory/ProjectsTab';
import { Id, toast } from 'react-toastify';

interface LeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

function addSpacesToCamelCase(text: string) {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useTranslation('leads');
  const [activeTab, setActiveTab] = useState('details');
  const [newNote, setNewNote] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [callForm, setCallForm] = useState({
    date: new Date().toISOString().split('T')[0],
    outcome: '',
    duration: '',
    project: '',
    notes: ''
  });
  const [visitForm, setVisitForm] = useState<VisitLog>({
    inventoryId: '',
    id: '',
    leadId: '',
    createdBy: '',
    date: new Date().toISOString().split('T')[0],
    project: '',
    status: '',
    objections: '',
    notes: ''
  } as VisitLog);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentLead, setCurrentLead] = useState(lead);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState<string[]>(currentLead.notes || []);
  const queryClient = useQueryClient();
  const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    return response.data.properties as Property[];
  }
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProperties()
  });
  const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.data as Project[];
  }
  const getCalls = async () => {
    const response = await axiosInterceptor.get(`/calls/${currentLead.id}`);
    return response.data.data as CallLog[];
  }
  const getLeads = async () => {
    const response = await axiosInterceptor.get('/leads');
    return response.data.leads as Lead[];
  }
  const getVisits = async () => {
    const response = await axiosInterceptor.get(`/visits/${currentLead.id}`);
    return response.data.visits as VisitLog[];
  }
  const { data: leads, isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getLeads()
  });
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });
  const { mutate: updateLead, isPending: isUpdatingLead } = useMutation({
    mutationFn: (lead: Lead) => axiosInterceptor.patch(`/leads/${lead.id}`, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.dismiss(toastId!);
      toast.success("Lead updated successfully");
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast.dismiss(toastId!);
      toast.error(error.response.data.message || "Error updating lead");
    }
  });
  const { mutate: addCallLog, isPending: isCreatingCall } = useMutation({
    mutationFn: (call: CallLog) => axiosInterceptor.post(`/calls/create/${currentLead.id}`, call),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`calls-${currentLead.id}`] });
      setCallForm({
        date: new Date().toISOString().split('T')[0],
        outcome: '',
        duration: '',
        project: '',
        notes: ''
      });
      setShowCallForm(false);
      toast.success("Call log added successfully");
    },
    onError: (error: any) => {
      console.error('Error adding call log:', error);
      toast.error(error.response.data.message[0] || "Error adding call log");
    }
  });
  const { mutate: addVisitLog, isPending: isCreatingVisit } = useMutation({
    mutationFn: (visit: VisitLog) => axiosInterceptor.post(`/visits/create/${currentLead.id}`, visit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`visits-${currentLead.id}`] });
      setVisitForm({
        inventoryId: '',
        id: '',
        leadId: '',
        createdBy: '',
        date: new Date().toISOString().split('T')[0],
        project: '',
        status: '',
        objections: '',
        notes: ''
      });
      setShowVisitForm(false);
      toast.success("Visit log added successfully");
    },
    onError: (error: any) => {
      console.error('Error adding visit log:', error);
      toast.error(error.response.data.message[0] || "Error adding visit log");
    }
  });
  const { data: calls, isLoading: isLoadingCalls } = useQuery<CallLog[]>({
    queryKey: [`calls-${currentLead.id}`],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getCalls()
  });
  const { data: visits, isLoading: isLoadingVisits } = useQuery<VisitLog[]>({
    queryKey: [`visits-${currentLead.id}`],
    staleTime: 1000 * 60 * 5,
    queryFn: () => getVisits()
  });
  // Sync currentLead with prop lead and refreshKey
  React.useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);
  React.useEffect(() => {
    // On refresh, get the latest lead data by ID
    const latest = leads?.find(l => l.id === currentLead.id);
    if (latest) setCurrentLead(latest);
    setIsUpdating(false);
  }, [refreshKey]);

  const canEdit = user?.role === 'admin' || user?.role === 'sales_admin' ||
    user?.role === 'team_leader' ||
    (user?.role === 'sales_rep' && currentLead.assignedToId === user.id);

  const [isUpdate, setIsUpdate] = useState(false);
  // Dynamic stages based on status order (remove Cancellation)
  const statusStages = [
    { id: 'fresh', label: t('freshLead'), value: 'fresh_lead' },
    { id: 'follow', label: t('followUp'), value: 'follow_up' },
    { id: 'visit', label: t('scheduledVisit'), value: 'scheduled_visit' },
    { id: 'open', label: t('openDeal'), value: 'open_deal' },
    { id: 'closed', label: t('closedDeal'), value: 'closed_deal' },
    { id: 'cancellation', label: t('cancellation'), value: 'cancellation' },
    { id: 'not Answered', label: t('notAnswered'), value: 'no_answer' },
    { id: 'not Interested', label: t('notInterested'), value: 'not_intersted_now' },
  ];
  const [toastId, setToastId] = useState<Id | null>(null);
  const isCancelled = currentLead.status === 'cancellation';
  const currentStatusIndex = isCancelled ? -1 : statusStages.findIndex(s => s.value === currentLead.status);

  // Only show main stages in the progress bar
  const progressBarSpecialStatuses = ['no_answer', 'not_interested_now', 'reservation'];
  const isSpecialStatus = progressBarSpecialStatuses.includes(currentLead.status);

  const handleStatusUpdate = (newStatus: Lead['status']) => {
    if (canEdit) {
      setIsUpdate(true);
      updateLead({ ...currentLead, status: newStatus });
      setCurrentLead({ ...currentLead, status: newStatus }); // Update local state immediately
    }
  };
  useEffect(() => {
    if (isUpdate) {
      setToastId(toast.loading("Updating lead..."));
    }
  }, [isUpdate]);

  // useEffect(() => {
  //   setIsUpdate(true);
  // }, [currentLead.status]);

  const handleAddCall = (e: React.FormEvent) => {
    e.preventDefault();
    const newCall = {
      ...callForm,
      createdBy: user?.name || '',
      leadId: currentLead.id // add required leadId
    };
    addCallLog(newCall as unknown as CallLog);
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisit = {
      ...visitForm,
      createdBy: user?.name || '',
      leadId: currentLead.id! // add required leadId
    };
    addVisitLog(newVisit);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setIsUpdate(true);
      setNotes([
        ...notes,
        newNote
      ]);
      setNewNote('');
    }
  };

  useEffect(() => {
    if (isUpdate) {
      updateLead({ ...currentLead, notes: notes });
    }
  }, [notes]);

  // Add update button handler
  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => setRefreshKey(k => k + 1), 600); // Simulate loading
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-gray-900">{t('leadDetails')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Lead Details */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
              <p className="text-sm text-gray-900">{currentLead.contact}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget')}</label>
              <p className="text-sm text-gray-900">{currentLead.budget}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('interest')}</label>
              <p className="text-sm text-gray-900">{
                properties?.find(property => property.id === currentLead.inventoryInterestId)?.title
              }</p>
            </div>
          </div>

          {/* Animated Deal Progress Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center w-full">{t('dealProgress')}</label>

            <div className="relative w-full">
              <div className="flex items-center justify-start space-x-1 md:space-x-2 overflow-x-auto py-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="flex items-center min-w-max">
                  {statusStages.map((stage, index) => {
                    const isCompleted = !isCancelled && index < currentStatusIndex;
                    const isActive = !isCancelled && index === currentStatusIndex;
                    return (
                      <React.Fragment key={stage.id}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0.5 }}
                          animate={{ scale: isActive ? 1.1 : 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className={`flex flex-col items-center relative flex-shrink-0`}
                        >
                          <div
                            className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300
                              ${isCancelled ? 'bg-red-500 border-red-500 text-white' :
                                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                  isActive ? 'bg-blue-600 border-blue-600 text-white' :
                                    'bg-gray-200 border-gray-300 text-gray-600'}
                            `}
                          >
                            {index + 1}
                          </div>
                          <span className={`mt-1 md:mt-2 text-xs font-medium text-center w-16 md:w-20
                            ${isCancelled ? 'text-red-500' :
                              isCompleted ? 'text-green-600' :
                                isActive ? 'text-blue-600' :
                                  'text-gray-500'}
                          `}>{stage.label}</span>
                        </motion.div>
                        {index < statusStages.length - 1 && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 20 }}
                            transition={{ duration: 0.5, delay: 0.1 * index }}
                            className={`h-1 mx-1 rounded-full transition-colors duration-300 flex-shrink-0
                              ${isCancelled ? 'bg-red-500' :
                                index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'}
                            `}
                            style={{ minWidth: 16, maxWidth: 32 }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {isCancelled && (
              <div className="mt-1 text-xs text-red-600 font-semibold text-center">{t('dealCancelled')}</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCallForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              {t('logCall')}
            </button>
            <button
              onClick={() => setShowVisitForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('scheduleVisit')}
            </button>
            {canEdit && (
              <select
                value={currentLead.status}
                onChange={(e) => handleStatusUpdate(e.target.value as Lead['status'])}
                className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${currentLead.status === 'reservation'
                    ? 'text-blue-600'
                    : currentLead.status === 'not_interested_now'
                    ? 'text-gray-600'
                    : currentLead.status === 'no_answer'
                    ? 'text-orange-500'
                    : ''}`}
              >
                <option value="fresh_lead">{t('freshLead')}</option>
                <option value="follow_up">{t('followUp')}</option>
                <option value="scheduled_visit">{t('scheduledVisit')}</option>
                <option value="open_deal">{t('openDeal')}</option>
                <option value="closed_deal">{t('closedDeal')}</option>
                <option value="cancellation">{t('cancellation')}</option>

                <option value="no_answer">{"Not Answered"}</option>
                <option value="not_intersted_now">{"Not Interested Now"}</option>
              </select>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-8 border-b border-gray-200">
            {['details', 'calls', 'visits', 'notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 text-sm font-medium capitalize ${activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('contactInformation')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('name')}</label>
                    <p className="text-sm text-gray-900">{currentLead.nameEn}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                    <p className="text-sm text-gray-900">{currentLead.contact}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('source')}</label>
                    <p className="text-sm text-gray-900">{currentLead.source}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('leadDetailsSection')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
                    <p className="text-sm text-gray-900">{currentLead.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('budget')}</label>
                    <p className="text-sm text-gray-900">{currentLead.budget}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('interest')}</label>
                    <p className="text-sm text-gray-900">{
                      properties?.find(property => property.id === currentLead.inventoryInterestId)?.title
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('callHistory')}</h3>
                <button
                  onClick={() => setShowCallForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCall')}
                </button>
              </div>
              <div className="space-y-4">
                {
                  calls && calls.length > 0 ?
                    calls.map((call) => (
                      <div key={call.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{call.date}</span>
                          <span className="text-sm text-gray-600">{call.duration}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="text-sm text-gray-600">{t('outcome')}: </span>
                            <span className="text-sm text-gray-900">{call.outcome}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">{t('project')}: </span>
                            <span className="text-sm text-gray-900">{
                              projects?.find(project => project.id === call.projectId)?.nameEn
                            }</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{call.notes}</p>
                      </div>
                    )) : <p className="text-gray-500 text-center py-4">{t('noCallsLogged')}</p>}
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{t('visitHistory')}</h3>
                <button
                  onClick={() => setShowVisitForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addVisit')}
                </button>
              </div>
              <div className="space-y-4">
                {visits && visits.length > 0 &&
                  visits.map((visit) => (
                    <div key={visit.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{visit.date}</span>
                        <span className="text-sm text-green-600">{visit.status}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                          <span className="text-sm text-gray-600">{t('project')}: </span>
                          <span className="text-sm text-gray-900">{
                            projects?.find(project => project.id === visit.project)?.nameEn
                          }</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">{t('objections')}: </span>
                          <span className="text-sm text-gray-900">{visit.objections}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{visit.notes}</p>
                    </div>
                  ))}
                {visits?.length === 0 && (
                  <p className="text-gray-500 text-center py-4">{t('noVisitsLogged')}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('notes')}</h3>
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={t('addNotePlaceholder')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isUpdatingLead ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('addNote')}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {notes && notes.length > 0 &&
                  notes.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900 mb-2">{note}</p>
                    </div>
                  ))}
                {notes && notes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">{t('noNotesAdded')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Call Form Modal */}
        {showCallForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('logCall')}</h3>
              <form onSubmit={handleAddCall} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={callForm.date}
                    onChange={(e) => setCallForm({ ...callForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('outcome')}</label>
                  <select
                    value={callForm.outcome}
                    onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('selectOutcome')}</option>
                    <option value="Interested">{t('interested')}</option>
                    <option value="Not Interested">{t('notInterested')}</option>
                    <option value="Follow Up Required">{t('followUpRequired')}</option>
                    <option value="Meeting Scheduled">{t('meetingScheduled')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('duration')}</label>
                  <input
                    type="text"
                    value={callForm.duration}
                    onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                    placeholder={t('durationPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('project')}</label>
                  <select
                    value={callForm.project}
                    onChange={(e) => setCallForm({ ...callForm, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('selectProject')}</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>{project.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesField')}</label>
                  <textarea
                    value={callForm.notes}
                    onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCallForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isCreatingCall ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('logCallButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Visit Form Modal */}
        {showVisitForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('logVisit')}</h3>
              <form onSubmit={handleAddVisit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={visitForm.date}
                    onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('project')}</label>
                  <select
                    value={visitForm.project}
                    onChange={(e) => setVisitForm({ ...visitForm, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('selectProject')}</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.nameEn}>{project.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                  <select
                    value={visitForm.status}
                    onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t('selectStatus')}</option>
                    <option value="Completed">{t('completed')}</option>
                    <option value="Cancelled">{t('cancelled')}</option>
                    <option value="Scheduled">{t('scheduled')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('objections')}</label>
                  <input
                    type="text"
                    value={visitForm.objections}
                    onChange={(e) => setVisitForm({ ...visitForm, objections: e.target.value })}
                    placeholder={t('objectionsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('notesField')}</label>
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowVisitForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {isCreatingVisit ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('logVisitButton')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadModal;