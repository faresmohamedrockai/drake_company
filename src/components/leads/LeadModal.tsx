import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Phone, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Lead, CallLog, VisitLog, Note } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw } from 'lucide-react';

interface LeadModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

const LeadModal: React.FC<LeadModalProps> = ({ lead, isOpen, onClose }) => {
  const { updateLead, addCallLog, addVisitLog, addNote, projects, leads } = useData();
  const { user } = useAuth();
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
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    project: '',
    status: '',
    objections: '',
    notes: ''
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentLead, setCurrentLead] = useState(lead);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync currentLead with prop lead and refreshKey
  React.useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);
  React.useEffect(() => {
    // On refresh, get the latest lead data by ID
    const latest = leads.find(l => l.id === currentLead.id);
    if (latest) setCurrentLead(latest);
    setIsUpdating(false);
  }, [refreshKey]);

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Admin' || 
                  user?.role === 'Team Leader' || 
                  (user?.role === 'Sales Rep' && currentLead.assignedTo === user.name);

  // Dynamic stages based on status order (remove Cancellation)
  const statusStages = [
    { id: 'fresh', label: 'Fresh Lead', value: 'Fresh Lead' },
    { id: 'follow', label: 'Follow Up', value: 'Follow Up' },
    { id: 'visit', label: 'Scheduled Visit', value: 'Scheduled Visit' },
    { id: 'open', label: 'Open Deal', value: 'Open Deal' },
    { id: 'closed', label: 'Closed Deal', value: 'Closed Deal' }
  ];
  const isCancelled = currentLead.status === 'Cancellation';
  const currentStatusIndex = isCancelled ? -1 : statusStages.findIndex(s => s.value === currentLead.status);

  const handleStatusUpdate = (newStatus: Lead['status']) => {
    if (canEdit) {
      updateLead(currentLead.id, { status: newStatus });
      setCurrentLead({ ...currentLead, status: newStatus }); // Update local state immediately
    }
  };

  // After add actions, refresh currentLead from leads array
  const refreshCurrentLead = () => {
    const latest = leads.find(l => l.id === currentLead.id);
    if (latest) setCurrentLead(latest);
  };

  const handleAddCall = (e: React.FormEvent) => {
    e.preventDefault();
    const newCall = {
      ...callForm,
      createdBy: user?.name || '',
      id: Date.now().toString(), // generate a temporary id
      leadId: currentLead.id // add required leadId
    };
    addCallLog(currentLead.id, newCall);
    setCurrentLead({
      ...currentLead,
      calls: [...currentLead.calls, newCall]
    });
    setCallForm({
      date: new Date().toISOString().split('T')[0],
      outcome: '',
      duration: '',
      project: '',
      notes: ''
    });
    setShowCallForm(false);
    // setTimeout(refreshCurrentLead, 100); // No longer needed for instant update
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVisit = {
      ...visitForm,
      createdBy: user?.name || '',
      id: Date.now().toString(), // generate a temporary id
      leadId: currentLead.id // add required leadId
    };
    addVisitLog(currentLead.id, newVisit);
    setCurrentLead({
      ...currentLead,
      visits: [...currentLead.visits, newVisit]
    });
    setVisitForm({
      date: new Date().toISOString().split('T')[0],
      project: '',
      status: '',
      objections: '',
      notes: ''
    });
    setShowVisitForm(false);
    // setTimeout(refreshCurrentLead, 100); // No longer needed for instant update
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(currentLead.id, {
        content: newNote,
        createdAt: new Date().toISOString(),
        createdBy: user?.name || ''
      });
      setNewNote('');
      setTimeout(refreshCurrentLead, 100);
    }
  };

  // Add update button handler
  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => setRefreshKey(k => k + 1), 600); // Simulate loading
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">{currentLead.name}</h2>
            <button
              onClick={handleRefresh}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow font-semibold flex items-center space-x-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              style={{ minWidth: 120 }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <RotateCw className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <RotateCw className="h-5 w-5 mr-2" />
              )}
              <span>{isUpdating ? 'Updating...' : 'Update'}</span>
            </button>
          </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <p className="text-sm text-gray-900">{currentLead.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <p className="text-sm text-gray-900">{currentLead.budget}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Interest</label>
              <p className="text-sm text-gray-900">{currentLead.inventoryInterest}</p>
            </div>
          </div>

          {/* Animated Deal Progress Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center w-full">Deal Progress</label>
            <div className="flex items-center justify-center space-x-0 md:space-x-3 overflow-x-auto py-2 w-full">
              {statusStages.map((stage, index) => {
                const isCompleted = !isCancelled && index < currentStatusIndex;
                const isActive = !isCancelled && index === currentStatusIndex;
                return (
                  <React.Fragment key={stage.id}>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: isActive ? 1.1 : 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`flex flex-col items-center relative`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300
                          ${isCancelled ? 'bg-red-500 border-red-500 text-white' :
                            isCompleted ? 'bg-green-500 border-green-500 text-white' :
                            isActive ? 'bg-blue-600 border-blue-600 text-white' :
                            'bg-gray-200 border-gray-300 text-gray-600'}
                        `}
                      >
                        {index + 1}
                      </div>
                      <span className={`mt-2 text-xs font-medium text-center w-20
                        ${isCancelled ? 'text-red-500' :
                          isCompleted ? 'text-green-600' :
                          isActive ? 'text-blue-600' :
                          'text-gray-500'}
                      `}>{stage.label}</span>
                    </motion.div>
                    {index < statusStages.length - 1 && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 40 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        className={`h-1 mx-1 md:mx-2 rounded-full transition-colors duration-300
                          ${isCancelled ? 'bg-red-500' :
                            index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'}
                        `}
                        style={{ minWidth: 24, maxWidth: 40 }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {isCancelled && (
              <div className="mt-1 text-xs text-red-600 font-semibold text-center">Deal Cancelled</div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowCallForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              Log Call
            </button>
            <button 
              onClick={() => setShowVisitForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Visit
            </button>
            {canEdit && (
              <select
                value={currentLead.status}
                onChange={(e) => handleStatusUpdate(e.target.value as Lead['status'])}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Fresh Lead">Fresh Lead</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Scheduled Visit">Scheduled Visit</option>
                <option value="Open Deal">Open Deal</option>
                <option value="Closed Deal">Closed Deal</option>
                <option value="Cancellation">Cancellation</option>
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
                className={`py-4 px-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{currentLead.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{currentLead.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <p className="text-sm text-gray-900">{currentLead.source}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-sm text-gray-900">{currentLead.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Budget</label>
                    <p className="text-sm text-gray-900">{currentLead.budget}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Inventory Interest</label>
                    <p className="text-sm text-gray-900">{currentLead.inventoryInterest}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Call History</h3>
                <button 
                  onClick={() => setShowCallForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Call
                </button>
              </div>
              <div className="space-y-4">
                {currentLead.calls.map((call) => (
                  <div key={call.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{call.date}</span>
                      <span className="text-sm text-gray-600">{call.duration}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <span className="text-sm text-gray-600">Outcome: </span>
                        <span className="text-sm text-gray-900">{call.outcome}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Project: </span>
                        <span className="text-sm text-gray-900">{call.project}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{call.notes}</p>
                  </div>
                ))}
                {currentLead.calls.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No calls logged yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'visits' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Visit History</h3>
                <button 
                  onClick={() => setShowVisitForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Visit
                </button>
              </div>
              <div className="space-y-4">
                {currentLead.visits.map((visit) => (
                  <div key={visit.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{visit.date}</span>
                      <span className="text-sm text-green-600">{visit.status}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <span className="text-sm text-gray-600">Project: </span>
                        <span className="text-sm text-gray-900">{visit.project}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Objections: </span>
                        <span className="text-sm text-gray-900">{visit.objections}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{visit.notes}</p>
                  </div>
                ))}
                {currentLead.visits.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No visits logged yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="mb-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  <button 
                    onClick={handleAddNote}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {currentLead.notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 mb-2">{note.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>By {note.createdBy}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {currentLead.notes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No notes added yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Call Form Modal */}
        {showCallForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Call</h3>
              <form onSubmit={handleAddCall} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={callForm.date}
                    onChange={(e) => setCallForm({ ...callForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={callForm.outcome}
                    onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Outcome</option>
                    <option value="Interested">Interested</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Follow Up Required">Follow Up Required</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={callForm.duration}
                    onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                    placeholder="e.g., 15 minutes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={callForm.project}
                    onChange={(e) => setCallForm({ ...callForm, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={callForm.notes}
                    onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCallForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Log Call
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Visit</h3>
              <form onSubmit={handleAddVisit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={visitForm.date}
                    onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={visitForm.project}
                    onChange={(e) => setVisitForm({ ...visitForm, project: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={visitForm.status}
                    onChange={(e) => setVisitForm({ ...visitForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objections</label>
                  <input
                    type="text"
                    value={visitForm.objections}
                    onChange={(e) => setVisitForm({ ...visitForm, objections: e.target.value })}
                    placeholder="e.g., Price too high"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowVisitForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Log Visit
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