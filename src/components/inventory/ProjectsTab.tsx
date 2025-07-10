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

// Utility: Generate payment schedule for a property price and payment plan
/**
 * Generate payment schedule for a property
 * @param {number} totalPrice - The total price of the property (EGP)
 * @param {object} plan - The payment plan object from the project
 * @returns {Array<{no: number, dueDate: string, amount: number, label?: string}>}
 */
export function generatePaymentSchedule(totalPrice: number, plan: any): Array<{no: number, dueDate: string, amount: number, label?: string}> {
  if (!plan || !totalPrice) return [];
  const downPaymentAmount = (plan.downPayment / 100) * totalPrice;
  const deliveryAmount = (plan.delivery / 100) * totalPrice;
  let periods = 0;
  let intervalMonths = 1;
  if (plan.installmentPeriod === 'monthly') {
    periods = plan.payYears * 12;
    intervalMonths = 1;
  } else if (plan.installmentPeriod === 'quarterly') {
    periods = plan.payYears * 4;
    intervalMonths = 3;
  } else if (plan.installmentPeriod === 'yearly') {
    periods = plan.payYears;
    intervalMonths = 12;
  } else if (plan.installmentPeriod === 'custom') {
    periods = Math.floor((plan.payYears * 12) / plan.installmentMonthsCount);
    intervalMonths = plan.installmentMonthsCount;
  }
  if (!periods || !plan.firstInstallmentDate) return [];

  // Calculate installment amount based on new equation
  const installmentTotal = totalPrice - downPaymentAmount - deliveryAmount;
  const installmentAmount = Math.round(installmentTotal / periods);

  // Down Payment row
  const schedule: Array<{no: number, dueDate: string, amount: number, label?: string}> = [
    { no: 0, dueDate: plan.firstInstallmentDate, amount: downPaymentAmount, label: `Down Payment (${plan.downPayment}%)` }
  ];

  // Generate Installments (start 1 month after down payment)
  let currentDate = new Date(plan.firstInstallmentDate);
  currentDate.setMonth(currentDate.getMonth() + intervalMonths); // Start after down payment
  for (let i = 1; i <= periods; i++) {
    schedule.push({
      no: i,
      dueDate: currentDate.toISOString().slice(0, 10),
      amount: installmentAmount,
      label: `Installment ${i}`
    });
    currentDate.setMonth(currentDate.getMonth() + intervalMonths);
  }

  // Delivery row
  let deliveryRow = null;
  if (plan.deliveryDate && plan.delivery) {
    deliveryRow = {
      no: schedule.length,
      dueDate: plan.deliveryDate,
      amount: deliveryAmount,
      label: `Delivery (${plan.delivery}%)`
    };
  }

  // Merge delivery with installment if dates match
  if (deliveryRow) {
    const idx = schedule.findIndex(row => row.dueDate === deliveryRow!.dueDate);
    if (idx !== -1) {
      // Merge amounts and labels
      schedule[idx] = {
        ...schedule[idx],
        amount: schedule[idx].amount + deliveryRow.amount,
        label: `${schedule[idx].label} + Delivery (${plan.delivery}%)`
      };
    } else {
      schedule.push(deliveryRow);
    }
  }

  // Sort by dueDate
  schedule.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return schedule;
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
        schedule: '',
        payYears: 1,
        installmentPeriod: 'monthly',
        installmentMonthsCount: 1,
        firstInstallmentDate: '',
        deliveryDate: ''
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
        schedule: '',
        payYears: 1,
        installmentPeriod: 'monthly',
        installmentMonthsCount: 1,
        firstInstallmentDate: '',
        deliveryDate: ''
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
          { downPayment: 0, installments: 0, delivery: 0, schedule: '', payYears: 1, installmentPeriod: 'monthly', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
        ]
      }));
    } else {
      setNewProject(prev => ({
        ...prev,
        paymentPlans: [
          ...prev.paymentPlans,
          { downPayment: 0, installments: 0, delivery: 0, schedule: '', payYears: 1, installmentPeriod: 'monthly', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
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
    // Calculate installments for each plan
    const paymentPlans = newProject.paymentPlans.map(plan => ({
      ...plan,
      installments: 100 - (plan.downPayment || 0) - (plan.delivery || 0)
    }));
    addProject({
      ...newProject,
      paymentPlans,
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
        { downPayment: 0, installments: 0, delivery: 0, schedule: '', payYears: 1, installmentPeriod: 'monthly', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
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
        { downPayment: 0, installments: 0, delivery: 0, schedule: '', payYears: 1, installmentPeriod: 'monthly', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
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
      // Calculate installments for each plan
      const paymentPlans = editProject.paymentPlans.map(plan => ({
        ...plan,
        installments: 100 - (plan.downPayment || 0) - (plan.delivery || 0)
      }));
      updateProject(editId, {
        ...editProject,
        paymentPlans,
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
                project.paymentPlans.map((plan, idx) => {
                  // For demo, use a sample price (e.g., 1,000,000 EGP)
                  const samplePrice = 1000000;
                  const schedule = generatePaymentSchedule(samplePrice, plan);
                  return (
                    <div key={idx} className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm">
                      <div className="flex flex-wrap gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs"><svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>Down Payment: {plan.downPayment}%</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-xs"><svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>Installments: {100 - (plan.downPayment || 0) - (plan.delivery || 0)}%</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold text-xs"><svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" /></svg>Delivery: {plan.delivery}%</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
                        <div><span className="font-semibold">Years to Pay:</span> {(plan as any).payYears ?? '-'}</div>
                        <div><span className="font-semibold">Installment Period:</span> {(plan as any).installmentPeriod ?? '-'}{(plan as any).installmentPeriod === 'custom' && ` (${(plan as any).installmentMonthsCount ?? '-'} months)`}</div>
                        <div><span className="font-semibold">First Installment Date:</span> {(plan as any).firstInstallmentDate ?? '-'}</div>
                        <div><span className="font-semibold">Delivery Date:</span> {(plan as any).deliveryDate ?? '-'}</div>
                        {(plan as any).schedule && (
                          <div className="col-span-2"><span className="font-semibold">Schedule Description:</span> {(plan as any).schedule}</div>
                        )}
                      </div>
                    </div>
                  );
                })
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
                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Description</label>
                        <input type="text" value={plan.schedule} onChange={e => {
                          const val = e.target.value;
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, schedule: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Years to Pay</label>
                        <input type="number" value={plan.payYears} onChange={e => {
                          const val = Number(e.target.value);
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, payYears: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Installment Period</label>
                        <select value={plan.installmentPeriod} onChange={e => {
                          const val = e.target.value;
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installmentPeriod: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {plan.installmentPeriod === 'custom' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Installment Every (Months)</label>
                          <input type="number" value={plan.installmentMonthsCount} onChange={e => {
                            const val = Number(e.target.value);
                            setNewProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installmentMonthsCount: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Installment Date</label>
                        <input type="date" value={plan.firstInstallmentDate} onChange={e => {
                          const val = e.target.value;
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, firstInstallmentDate: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date</label>
                        <input type="date" value={plan.deliveryDate} onChange={e => {
                          const val = e.target.value;
                          setNewProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, deliveryDate: val } : p)
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
                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Description</label>
                        <input type="text" value={plan.schedule} onChange={e => {
                          const val = e.target.value;
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, schedule: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Years to Pay</label>
                        <input type="number" value={plan.payYears} onChange={e => {
                          const val = Number(e.target.value);
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, payYears: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Installment Period</label>
                        <select value={plan.installmentPeriod} onChange={e => {
                          const val = e.target.value;
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installmentPeriod: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      {plan.installmentPeriod === 'custom' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Installment Every (Months)</label>
                          <input type="number" value={plan.installmentMonthsCount} onChange={e => {
                            const val = Number(e.target.value);
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installmentMonthsCount: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Installment Date</label>
                        <input type="date" value={plan.firstInstallmentDate} onChange={e => {
                          const val = e.target.value;
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, firstInstallmentDate: val } : p)
                          }));
                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date</label>
                        <input type="date" value={plan.deliveryDate} onChange={e => {
                          const val = e.target.value;
                          setEditProject(prev => ({
                            ...prev,
                            paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, deliveryDate: val } : p)
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