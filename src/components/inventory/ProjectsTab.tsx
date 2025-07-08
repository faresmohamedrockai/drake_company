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
  const { projects, addProject, updateProject, deleteProject } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    developer: '',
    zone: '',
    type: '',
    paymentPlan: {
      downPayment: 0,
      installments: 0,
      delivery: 0,
      schedule: ''
    },
    createdBy: user?.name || 'System'
  });
  const [editProject, setEditProject] = useState({
    name: '',
    developer: '',
    zone: '',
    type: '',
    paymentPlan: {
      downPayment: 0,
      installments: 0,
      delivery: 0,
      schedule: ''
    },
    createdBy: user?.name || 'System'
  });

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.developer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    addProject({ ...newProject, createdBy: user?.name || 'System' });
    setShowAddForm(false);
    setNewProject({
      name: '',
      developer: '',
      zone: '',
      type: '',
      paymentPlan: {
        downPayment: 0,
        installments: 0,
        delivery: 0,
        schedule: ''
      },
      createdBy: user?.name || 'System'
    });
  };

  const openEditForm = (project: any) => {
    setEditId(project.id);
    setEditProject({
      name: project.name,
      developer: project.developer,
      zone: project.zone,
      type: project.type,
      paymentPlan: { ...project.paymentPlan },
      createdBy: project.createdBy || user?.name || 'System'
    });
    setShowEditForm(true);
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateProject(editId, { ...editProject, createdBy: user?.name || 'System' });
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
                <span className="text-sm text-gray-900">{project.developer}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Zone: </span>
                <span className="text-sm text-gray-900">{project.zone}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Type: </span>
                <span className="text-sm text-gray-900">{project.type}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Plan</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{project.paymentPlan.downPayment}%</div>
                  <div className="text-gray-600">Down Payment</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{project.paymentPlan.installments}%</div>
                  <div className="text-gray-600">Installments</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{project.paymentPlan.delivery}%</div>
                  <div className="text-gray-600">Delivery</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {project.paymentPlan.schedule}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Project Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Project</h3>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                <input type="text" value={newProject.developer} onChange={e => setNewProject({ ...newProject, developer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <input type="text" value={newProject.zone} onChange={e => setNewProject({ ...newProject, zone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input type="text" value={newProject.type} onChange={e => setNewProject({ ...newProject, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment (%)</label>
                <input type="number" value={newProject.paymentPlan.downPayment} onChange={e => setNewProject({ ...newProject, paymentPlan: { ...newProject.paymentPlan, downPayment: Number(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Installments (%)</label>
                <input type="number" value={newProject.paymentPlan.installments} onChange={e => setNewProject({ ...newProject, paymentPlan: { ...newProject.paymentPlan, installments: Number(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery (%)</label>
                <input type="number" value={newProject.paymentPlan.delivery} onChange={e => setNewProject({ ...newProject, paymentPlan: { ...newProject.paymentPlan, delivery: Number(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <input type="text" value={newProject.paymentPlan.schedule} onChange={e => setNewProject({ ...newProject, paymentPlan: { ...newProject.paymentPlan, schedule: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Project</h3>
            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={editProject.name} onChange={e => setEditProject({ ...editProject, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                <input type="text" value={editProject.developer} onChange={e => setEditProject({ ...editProject, developer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <input type="text" value={editProject.zone} onChange={e => setEditProject({ ...editProject, zone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input type="text" value={editProject.type} onChange={e => setEditProject({ ...editProject, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment (%)</label>
                <input type="number" value={editProject.paymentPlan.downPayment} onChange={e => setEditProject({ ...editProject, paymentPlan: { ...editProject.paymentPlan, downPayment: Number(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Installments (%)</label>
                <input type="number" value={editProject.paymentPlan.installments} onChange={e => setEditProject({ ...editProject, paymentPlan: { ...editProject.paymentPlan, installments: Number(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery (%)</label>
                <input type="number" value={editProject.paymentPlan.delivery} onChange={e => setEditProject({ ...editProject, paymentPlan: { ...editProject.paymentPlan, delivery: Number(e.target.value) } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <input type="text" value={editProject.paymentPlan.schedule} onChange={e => setEditProject({ ...editProject, paymentPlan: { ...editProject.paymentPlan, schedule: e.target.value } })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex justify-end space-x-3">
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