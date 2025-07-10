import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  developer: string;
  zone: string;
  type: string;
  paymentPlan: {
    downPayment: number;
    installments: number;
    delivery: number;
    schedule: string;
  };
}

const ProjectsTab: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, zones, developers, properties } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    developerId: '',
    zoneId: '',
    type: '',
    paymentPlans: [
      {
        downPayment: 0,
        installments: 0,
        delivery: 0,
        schedule: ''
      }
    ],
    propertyIds: [] as string[],
    createdBy: user?.name || 'System'
  });
  const [editProject, setEditProject] = useState({
    name: '',
    developerId: '',
    zoneId: '',
    type: '',
    paymentPlans: [
      {
        downPayment: 0,
        installments: 0,
        delivery: 0,
        schedule: ''
      }
    ],
    propertyIds: [] as string[],
    createdBy: user?.name || 'System'
  });

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (developers.find(d => d.id === project.developerId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (zones.find(z => z.id === project.zoneId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPlan = (isEdit = false) => {
    if (isEdit) {
      setEditProject(prev => ({
        ...prev,
        paymentPlans: [
          ...prev.paymentPlans,
          { downPayment: 0, installments: 0, delivery: 0, schedule: '' }
        ]
      }));
    } else {
      setNewProject(prev => ({
        ...prev,
        paymentPlans: [
          ...prev.paymentPlans,
          { downPayment: 0, installments: 0, delivery: 0, schedule: '' }
        ]
      }));
    }
  };
  const handleRemovePlan = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditProject(prev => ({
        ...prev,
        paymentPlans: prev.paymentPlans.filter((_, i) => i !== index)
      }));
    } else {
      setNewProject(prev => ({
        ...prev,
        paymentPlans: prev.paymentPlans.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    const developerName = developers.find(d => d.id === newProject.developerId)?.name || '';
    const zoneName = zones.find(z => z.id === newProject.zoneId)?.name || '';
    addProject({
      ...newProject,
      developer: developerName,
      zone: zoneName,
      createdBy: user?.name || 'System'
    });
    setShowAddForm(false);
    setNewProject({
      name: '',
      developerId: '',
      zoneId: '',
      type: '',
      paymentPlans: [
        { downPayment: 0, installments: 0, delivery: 0, schedule: '' }
      ],
      propertyIds: [],
      createdBy: user?.name || 'System'
    });
  };

  const openEditForm = (project: any) => {
    setEditId(project.id);
    setEditProject({
      name: project.name,
      developerId: developers.find(d => d.name === project.developer)?.id || '',
      zoneId: zones.find(z => z.name === project.zone)?.id || '',
      type: project.type,
      paymentPlans: project.paymentPlans || [
        { downPayment: 0, installments: 0, delivery: 0, schedule: '' }
      ],
      propertyIds: project.propertyIds || [],
      createdBy: project.createdBy || user?.name || 'System'
    });
    setShowEditForm(true);
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      const developerName = developers.find(d => d.id === editProject.developerId)?.name || '';
      const zoneName = zones.find(z => z.id === editProject.zoneId)?.name || '';
      updateProject(editId, {
        ...editProject,
        developer: developerName,
        zone: zoneName,
        createdBy: user?.name || 'System'
      });
      setShowEditForm(false);
      setEditId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  return (
    <div>
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={() => setShowAddForm(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Add Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditForm(project)}>
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(project.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Developer: </span>
                <span className="text-sm text-gray-900">{developers.find(d => d.id === project.developerId)?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Zone: </span>
                <span className="text-sm text-gray-900">{zones.find(z => z.id === project.zoneId)?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Type: </span>
                <span className="text-sm text-gray-900">{project.type}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Plans</h4>
              {project.paymentPlans && project.paymentPlans.length > 0 ? (
                project.paymentPlans.map((plan, idx) => (
                  <div key={idx} className="mb-2 p-2 rounded bg-gray-50 border border-gray-100">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{plan.downPayment}%</div>
                        <div className="text-gray-600">Down Payment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{plan.installments}%</div>
                        <div className="text-gray-600">Installments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{plan.delivery}%</div>
                        <div className="text-gray-600">Delivery</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {plan.schedule}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400">No payment plans available.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Project</h3>
            <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                <select value={newProject.developerId} onChange={e => setNewProject({ ...newProject, developerId: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required>
                  <option value="">Select Developer</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <select value={newProject.zoneId} onChange={e => setNewProject({ ...newProject, zoneId: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required>
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input type="text" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Properties</label>
                <select multiple value={newProject.propertyIds} onChange={e => setNewProject({ ...newProject, propertyIds: Array.from(e.target.selectedOptions, option => option.value) })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 h-32">
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>{property.title}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple properties.</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Plans</label>
                {newProject.paymentPlans.map((plan, idx) => (
                  <div key={idx} className="border rounded-lg p-4 mb-4 relative bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Down Payment (%)</label>
                        <input type="number" value={plan.downPayment} onChange={e => {
                          const val = Number(e.target.value);
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, downPayment: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Installments (%)</label>
                        <input type="number" value={plan.installments} onChange={e => {
                          const val = Number(e.target.value);
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installments: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Delivery (%)</label>
                        <input type="number" value={plan.delivery} onChange={e => {
                          const val = Number(e.target.value);
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, delivery: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule</label>
                        <input type="text" value={plan.schedule} onChange={e => {
                          const val = e.target.value;
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, schedule: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                    </div>
                    {newProject.paymentPlans.length > 1 && (
                      <button type="button" onClick={() => handleRemovePlan(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs">Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => handleAddPlan()} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs">+ Add Plan</button>
              </div>
              <div className="col-span-2 flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors">Add Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Project</h3>
            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={editProject.name} onChange={e => setEditProject({ ...editProject, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                <select value={editProject.developerId} onChange={e => setEditProject({ ...editProject, developerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select Developer</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <select value={editProject.zoneId} onChange={e => setEditProject({ ...editProject, zoneId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input type="text" value={editProject.type} onChange={e => setEditProject({ ...editProject, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Plans</label>
                {editProject.paymentPlans.map((plan, idx) => (
                  <div key={idx} className="border rounded-lg p-4 mb-4 relative bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Down Payment (%)</label>
                        <input type="number" value={plan.downPayment} onChange={e => {
                          const val = Number(e.target.value);
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, downPayment: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Installments (%)</label>
                        <input type="number" value={plan.installments} onChange={e => {
                          const val = Number(e.target.value);
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installments: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Delivery (%)</label>
                        <input type="number" value={plan.delivery} onChange={e => {
                          const val = Number(e.target.value);
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, delivery: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule</label>
                        <input type="text" value={plan.schedule} onChange={e => {
                          const val = e.target.value;
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, schedule: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                    </div>
                    {editProject.paymentPlans.length > 1 && (
                      <button type="button" onClick={() => handleRemovePlan(idx, true)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs">Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => handleAddPlan(true)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs">+ Add Plan</button>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;