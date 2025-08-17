import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { Developer, Lead, Property, Zone } from '../../types';
import { Id, toast } from 'react-toastify';
import { getDevelopers, getProjects, getProperties, getZones } from '../../queries/queries';

export interface PaymentPlan {
  downpayment: number;
  installment: number;
  delivery: number;
  schedule: string;
  yearsToPay: number;
  installmentPeriod: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  installmentMonthsCount: number;
  firstInstallmentDate: string;
  deliveryDate: string;
}
export interface Project {
  id?: string;
  nameEn: string;
  otherProject?:string;
  nameAr: string;
  developer: string;
  developerId: string;
  zone: string;
  zoneId: string;
  type: string;
  paymentPlans: PaymentPlan[];
  leads?: Lead[];
  propertyIds: string[];
  // Add images property
  images?: string[];
  // Add developer object for nested data
  developerObj?: Developer;
}

// Utility: Generate payment schedule for a property price and payment plan
/**
 * Generate payment schedule for a property
 * @param {number} totalPrice - The total price of the property (EGP)
 * @param {object} plan - The payment plan object from the project
 * @returns {Array<{no: number, dueDate: string, amount: number, label?: string}>}
 */
export function generatePaymentSchedule(totalPrice: number, plan: PaymentPlan): Array<{ no: number, dueDate: string, amount: number, label?: string }> {
  if (!plan || !totalPrice) return [];
  const downPaymentAmount = Math.round((plan.downpayment / 100) * totalPrice);
  const deliveryAmount = Math.round((plan.delivery / 100) * totalPrice);
  let periods = 0;
  let intervalMonths = 1;
  if (plan.installmentPeriod === 'monthly') {
    periods = plan.yearsToPay * 12;
    intervalMonths = 1;
  } else if (plan.installmentPeriod === 'quarterly') {
    periods = plan.yearsToPay * 4;
    intervalMonths = 3;
  } else if (plan.installmentPeriod === 'yearly') {
    periods = plan.yearsToPay;
    intervalMonths = 12;
  } else if (plan.installmentPeriod === 'custom') {
    periods = Math.floor((plan.yearsToPay * 12) / plan.installmentMonthsCount);
    intervalMonths = plan.installmentMonthsCount;
  }
  if (!periods || !plan.firstInstallmentDate) return [];

  // Calculate installment amount based on new equation
  const installmentTotal = totalPrice - downPaymentAmount - deliveryAmount;
  const installmentAmount = Math.round(installmentTotal / periods);

  // Down Payment row
  const schedule: Array<{ no: number, dueDate: string, amount: number, label?: string }> = [
    { no: 0, dueDate: plan.firstInstallmentDate, amount: downPaymentAmount, label: `Down Payment (${plan.downpayment}%)` }
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

// Utility to format date to mm-dd-yyyy
function formatDateMMDDYYYY(dateStr?: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

const ProjectsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProperties()
  });
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });

  const { data: developers } = useQuery<Developer[]>({
    queryKey: ['developers'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getDevelopers()
  });

  const { data: zones } = useQuery<Zone[]>({
    queryKey: ['zones'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getZones()
  });

  const addProject = async (project: any) => {
    const response = await axiosInterceptor.post('/projects/create', project);
    return response.data.project as Project;
  }
  const updateProject = async (project: any) => {
    const response = await axiosInterceptor.patch(`/projects/${project.id}`, project);
    return response.data.project as Project;
  }
  const { mutateAsync: updateProjectMutation, isPending: isUpdating } = useMutation({
    mutationFn: (project: any) => updateProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.update(loadingToastId, { render: t('projectUpdated'), type: 'success', isLoading: false, autoClose: 3000 });
      setShowEditForm(false);
      setEditId(null);
    },
    onError: (error: any) => {
      toast.update(loadingToastId, { render: error.response.data.message[0], type: 'error', isLoading: false, autoClose: 3000 });
      setShowEditForm(false);
      setEditId(null);
    }
  });
  const deleteProject = async (id: string) => {
    const response = await axiosInterceptor.delete(`/projects/${id}`);
    return response.data.project as Project;
  }

  const { mutateAsync: deleteProjectMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.update(loadingToastId, { render: t('projectDeleted'), type: 'success', isLoading: false, autoClose: 3000 });
    },
    onError: (error: any) => {
      toast.update(loadingToastId, { render: error.response.data.message[0], type: 'error', isLoading: false, autoClose: 3000 });
    }
  });


  const { mutateAsync: addProjectMutation, isPending: isAdding } = useMutation({
    mutationFn: (project: any) => addProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.update(loadingToastId, { render: t('projectAdded'), type: 'success', isLoading: false, autoClose: 3000 });
      setShowAddForm(false);
      setNewProject({
        nameEn: '',
        nameAr: '',
        developerId: '',
        zoneId: '',
        type: '',
        paymentPlans: [
          { downpayment: 0, installment: 0, delivery: 0, schedule: '', yearsToPay: 1, installmentPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
        ],
        propertyIds: [],
        images: [],
        developer: '',
        zone: ''
      });
      setAddStep(0);
    },
    onError: (error: any) => {
      toast.update(loadingToastId, { render: error.response.data.message[0], type: 'error', isLoading: false, autoClose: 3000 });
      setShowAddForm(false);
      setAddStep(0);
    }
  });
  useEffect(() => {
    if (isDeleting || isAdding || isUpdating) {
      setLoadingToastId(toast.loading('Loading...'));
    }
  }, [isDeleting, isAdding, isUpdating]);
  const [loadingToastId, setLoadingToastId] = useState<Id>(0);
  const { user } = useAuth();
  const { language } = useLanguage(); // Add language context
  const { t } = useTranslation('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState<Project>({
    nameEn: '',
    nameAr: '',
    developerId: '',
    zoneId: '',
    type: '',
    paymentPlans: [],
    propertyIds: [],
    images: [],
    developer: '',
    zone: ''
  });
  const [editProject, setEditProject] = useState<Project>({
    nameEn: '',
    nameAr: '',
    developerId: '',
    zoneId: '',
    type: '',
    paymentPlans: [
      {
        downpayment: 0,
        installment: 0,
        delivery: 0,
        schedule: '',
        yearsToPay: 1,
        installmentPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom',
        installmentMonthsCount: 1,
        firstInstallmentDate: '',
        deliveryDate: ''
      }
    ],
    propertyIds: [] as string[],
    images: [] as string[],
    developer: '',
    zone: ''
  });
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [addStep, setAddStep] = useState(0); // Stepper for add form
  const addSteps = [
    t('stepBasicInfo'),
    t('stepPaymentPlans'),
    t('stepReview')
  ];

  // Helper function to get language-appropriate project name
  const getProjectName = (project: any) => {
    if (!project) return '';
    if (language === 'ar' && project.nameAr) {
      return project.nameAr;
    }
    return project.nameEn || project.name;
  };

  useEffect(() => {
    if (projects) {
      setFilteredProjects(projects?.filter((project: Project | any) =>
        getProjectName(project).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (developers?.find(d => d.id === project.developerId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zones?.find(z => z.id === project.zoneId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      ) as unknown as Project[]);
    }
  }, [projects, searchTerm, developers, zones]);



  const handleAddPlan = (isEdit = false) => {
    if (isEdit) {
      setEditProject(prev => ({
        ...prev,
        paymentPlans: [
          ...prev.paymentPlans,
          { downpayment: 0, installment: 0, delivery: 0, schedule: '', yearsToPay: 1, installmentPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
        ]
      }));
    } else {
      setNewProject(prev => ({
        ...prev,
        paymentPlans: [
          ...prev.paymentPlans,
          { downpayment: 0, installment: 0, delivery: 0, schedule: '', yearsToPay: 1, installmentPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
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
    addProjectMutation(newProject);
  };

  const openEditForm = (project: any) => {
    setEditId(project.id);
    setEditProject({
      id: project.id,
      nameEn: project.nameEn || '',
      nameAr: project.nameAr || '',
      developerId: project.developerId || '',
      zoneId: project.zoneId || '',
      type: project.type,
      paymentPlans: project.paymentPlans || [
        { downpayment: 0, installment: 0, delivery: 0, schedule: '', yearsToPay: 1, installmentPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
      ],
      propertyIds: project.propertyIds || [],
      images: project.images || [],
      developer: project.developer || '',
      zone: project.zone || ''
    });
    setShowEditForm(true);
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      const developerName = developers?.find(d => d.id === editProject.developerId)?.name || '';
      const zoneName = zones?.find(z => z.id === editProject.zoneId)?.name || '';
      // // Calculate installments for each plan
      // const paymentPlans = editProject.paymentPlans.map(plan => ({
      //   ...plan,
      //   installment: 100 - (plan.downpayment || 0) - (plan.delivery || 0)
      // }));
      updateProjectMutation({
        id: editId,
        ...editProject,
        developer: developerName,
        zone: zoneName,
        createdBy: user?.name || 'System'
      });

    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDeleteProject'))) {
      deleteProjectMutation(id);
    }
  };

  // Add image upload handler for multiple images
  const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArr = Array.from(files);
      const readers = fileArr.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then(images => {
        if (isEdit) {
          setEditProject(prev => ({ ...prev, images: [...(prev.images || []), ...images] }));
        } else {
          setNewProject(prev => ({ ...prev, images: [...(prev.images || []), ...images] }));
        }
      });
    }
  };

  const handleCancelAddProject = () => {
    setShowAddForm(false);
    setNewProject({
      nameEn: '',
      nameAr: '',
      developerId: '',
      zoneId: '',
      type: '',
      paymentPlans: [
        { downpayment: 0, installment: 0, delivery: 0, schedule: '', yearsToPay: 1, installmentPeriod: 'monthly' as 'monthly' | 'quarterly' | 'yearly' | 'custom', installmentMonthsCount: 1, firstInstallmentDate: '', deliveryDate: '' }
      ],
      propertyIds: [],
      images: [],
      developer: '',
      zone: ''
    });
    setAddStep(0);
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'المشاريع' : 'Projects'}
        </h2>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchProjects')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {
          (user?.role === 'admin' || user?.role === 'sales_admin') && (

            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={() => setShowAddForm(true)}>
              <Plus className="h-5 w-5 mr-2" />
              {t('addProject')}
            </button>
          )
        }
      </div>

      {/* Projects Grid */}
      {
        isProjectsLoading ? <div className="flex justify-center items-center h-full"><div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" role="status"></div></div> :
          filteredProjects.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{getProjectName(project)}</h3>
                  <div className="flex space-x-2">
                    {
                      (user?.role === 'admin' || user?.role === 'sales_admin') && (
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditForm(project)}>
                          <Edit className="h-4 w-4" />
                        </button>
                      )
                    }
                    {
                      (user?.role === 'admin' || user?.role === 'sales_admin') && (
                        <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(project.id || '')}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )
                    }
                  </div>
                </div>
                {Array.isArray((project as any).images) && (project as any).images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
                    {((project as any).images as string[]).map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Project ${project.nameEn} image ${idx + 1}`}
                        className="h-24 w-32 object-cover rounded-lg border shadow-sm flex-shrink-0"
                        style={{ minWidth: '8rem' }}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('developer')}: </span>
                    <span className="text-sm text-gray-900">
                      {(() => {
                        const developer = developers?.find(d => d.id === project.developerId);
                        if (!developer) return 'N/A';
                        return language === 'ar' && developer.nameAr ? developer.nameAr : (developer.nameEn || developer.name);
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">{t('zone')}: </span>
                    <span className="text-sm text-gray-900">
                      {(() => {
                        const zone = zones?.find(z => z.id === project.zoneId);
                        if (!zone) return 'N/A';
                        return language === 'ar' && zone.nameAr ? zone.nameAr : (zone.nameEn || zone.name);
                      })()}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('paymentPlans')}</h4>
                  {project.paymentPlans && project.paymentPlans.length > 0 ? (
                    project.paymentPlans.map((plan, idx) => {
                      // For demo, use a sample price (e.g., 1,000,000 EGP)
                      return (
                        <div key={idx} className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm">
                          <div className="flex flex-wrap gap-3 mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs"><svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>{t('downPayment')}: {plan.downpayment}%</span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-xs"><svg className="w-4 h-4 mr-1 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>{t('installments')}: {plan.installment}%</span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold text-xs"><svg className="w-4 h-4 mr-1 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" /></svg>{t('delivery')}: {plan.delivery}%</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
                            <div><span className="font-semibold">{t('yearsToPay')}:</span> {(plan as any).yearsToPay ?? '-'}</div>
                            <div><span className="font-semibold">{t('installmentPeriod')}:</span> {(plan as any).installmentPeriod ?? '-'}{(plan as any).installmentPeriod === 'custom' && ` (${(plan as any).installmentMonthsCount ?? '-'} months)`}</div>
                            <div><span className="font-semibold">{t('firstInstallmentDate')}:</span> {formatDateMMDDYYYY((plan as any).firstInstallmentDate)}</div>
                            <div><span className="font-semibold">{t('deliveryDate')}:</span> {formatDateMMDDYYYY((plan as any).deliveryDate)}</div>
                            {(plan as any).schedule && (
                              <div className="col-span-2"><span className="font-semibold">{t('scheduleDescription')}:</span> {(plan as any).schedule}</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-400">{t('noPaymentPlansAvailable')}</div>
                  )}
                </div>
              </div>
            ))}
          </div> : <div className="text-center text-gray-500">No projects found</div>}

      {/* Add Project Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-4xl mx-2 sm:mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('addProject')}</h3>
            {/* Stepper */}
            <div className="flex items-center justify-center mb-6">
              {addSteps.map((label, idx) => (
                <div key={label} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setAddStep(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${addStep === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    aria-current={addStep === idx ? 'step' : undefined}
                  >
                    {idx + 1}
                  </button>
                  {idx < addSteps.length - 1 && <div className="w-8 h-1 bg-gray-300 mx-1 rounded" />}
                </div>
              ))}
            </div>
            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-1 sm:px-2">
              <form onSubmit={handleAddProject} className="space-y-6">
                {/* Step 1: Basic Info */}
                {addStep === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectNameEn')}</label>
                      <input type="text" value={newProject.nameEn} onChange={e => setNewProject({ ...newProject, nameEn: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectNameAr')}</label>
                      <input type="text" value={newProject.nameAr} onChange={e => setNewProject({ ...newProject, nameAr: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectImages')}</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={e => handleProjectImageUpload(e, false)}
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
                      />
                      {newProject.images && newProject.images.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {newProject.images.map((img, idx) => (
                            <div key={idx} className="relative group">
                              <img src={img} alt={t('preview')} className="h-24 w-32 object-cover rounded border" />
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                                title={t('removeImage')}
                                onClick={() => setNewProject(prev => ({
                                  ...prev,
                                  images: prev.images?.filter((_, i) => i !== idx) || []
                                }))}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('developer')}</label>
                      <select value={newProject.developerId} onChange={e => setNewProject({ ...newProject, developerId: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required>
                        <option value="">{t('selectDeveloper')}</option>
                        {developers?.map(dev => (
                          <option key={dev.id} value={dev.id}>
                            {language === 'ar' && dev.nameAr ? dev.nameAr : (dev.nameEn || dev.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('zone')}</label>
                      <select value={newProject.zoneId} onChange={e => setNewProject({ ...newProject, zoneId: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required>
                        <option value="">{t('selectZone')}</option>
                        {zones?.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            {language === 'ar' && zone.nameAr ? zone.nameAr : (zone.nameEn || zone.name)}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                )}
                {/* Step 2: Properties */}
                {/* Removed the Select Properties step */}
                {/* Step 3: Payment Plans */}
                {addStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentPlans')}</label>
                    {newProject.paymentPlans.map((plan, idx) => (
                      <div key={idx} className="border rounded-lg p-4 mb-4 relative bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('downPayment')} (%)</label>
                            <input type="number" value={plan.downpayment} onChange={e => {
                              const val = Number(e.target.value);
                              setNewProject(prev => ({
                                ...prev,
                                paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, downpayment: val } : p)
                              }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('delivery')} (%)</label>
                            <input type="number" value={plan.delivery} onChange={e => {
                              const val = Number(e.target.value);
                              setNewProject(prev => ({
                                ...prev,
                                paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, delivery: val } : p)
                              }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('scheduleDescription')}</label>
                            <input type="text" value={plan.schedule} onChange={e => {
                              const val = e.target.value;
                              setNewProject(prev => ({
                                ...prev,
                                paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, schedule: val } : p)
                              }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('yearsToPay')}</label>
                            <input type="number" value={plan.yearsToPay} onChange={e => {
                              const val = Number(e.target.value);
                              setNewProject(prev => ({
                                ...prev,
                                paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, yearsToPay: val } : p)
                              }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('installmentPeriod')}</label>
                            <select value={plan.installmentPeriod} onChange={e => {
                              const val = e.target.value;
                              setNewProject(prev => ({
                                ...prev,
                                paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installmentPeriod: val as 'monthly' | 'quarterly' | 'yearly' | 'custom' } : p)
                              }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="monthly">{t('installmentPeriodOptions.monthly')}</option>
                              <option value="quarterly">{t('installmentPeriodOptions.quarterly')}</option>
                              <option value="yearly">{t('installmentPeriodOptions.yearly')}</option>
                              <option value="custom">{t('installmentPeriodOptions.custom')}</option>
                            </select>
                          </div>
                          {plan.installmentPeriod === 'custom' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">{t('installmentEveryMonths')}</label>
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
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('firstInstallmentDate')}</label>
                            <input type="date" value={plan.firstInstallmentDate} onChange={e => {
                              const val = e.target.value;
                              setNewProject(prev => ({
                                ...prev,
                                paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, firstInstallmentDate: val } : p)
                              }));
                            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('deliveryDate')}</label>
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
                          <button type="button" onClick={() => handleRemovePlan(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs">{t('removePlan')}</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => handleAddPlan()} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs">{t('addPlan')}</button>
                  </div>
                )}
                {/* Step 4: Review */}
                {addStep === 2 && (
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">{t('projectName')}:</span> {newProject.nameEn + (newProject.nameAr ? ' / ' + newProject.nameAr : '')}</div>
                    <div><span className="font-semibold">{t('developer')}:</span> {(() => {
                      const developer = developers?.find(d => d.id === newProject.developerId);
                      if (!developer) return '';
                      return language === 'ar' && developer.nameAr ? developer.nameAr : (developer.nameEn || developer.name);
                    })()}</div>
                    <div><span className="font-semibold">{t('zone')}:</span> {(() => {
                      const zone = zones?.find(z => z.id === newProject.zoneId);
                      if (!zone) return '';
                      return language === 'ar' && zone.nameAr ? zone.nameAr : (zone.nameEn || zone.name);
                    })()}</div>
                    <div><span className="font-semibold">{t('paymentPlans')}:</span> {newProject.paymentPlans.length}</div>
                    {newProject.paymentPlans.map((plan, idx) => (
                      <div key={idx} className="border rounded-lg p-2 mb-2 bg-gray-50">
                        <div><span className="font-semibold">{t('downPayment')}:</span> {plan.downpayment}%</div>
                        <div><span className="font-semibold">{t('delivery')}:</span> {plan.delivery}%</div>
                        <div><span className="font-semibold">{t('yearsToPay')}:</span> {plan.yearsToPay}</div>
                        <div><span className="font-semibold">{t('installmentPeriod')}:</span> {plan.installmentPeriod}{plan.installmentPeriod === 'custom' && ` (${plan.installmentMonthsCount} months)`}</div>
                        <div><span className="font-semibold">{t('firstInstallmentDate')}:</span> {formatDateMMDDYYYY(plan.firstInstallmentDate)}</div>
                        <div><span className="font-semibold">{t('deliveryDate')}:</span> {formatDateMMDDYYYY(plan.deliveryDate)}</div>
                        {plan.schedule && <div><span className="font-semibold">{t('scheduleDescription')}:</span> {plan.schedule}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Stepper Navigation */}
                <div className="flex justify-between items-center pt-4 gap-2 flex-col sm:flex-row">
                  <button type="button" onClick={() => handleCancelAddProject()} className="px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors w-full sm:w-auto mb-2 sm:mb-0">{t('cancel')}</button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {addStep > 0 && (
                      <button type="button" onClick={() => setAddStep(s => s - 1)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 w-full sm:w-auto">{t('back')}</button>
                    )}
                    {addStep < addSteps.length - 1 && (
                      <button type="button" onClick={() => setAddStep(s => s + 1)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto">{t('next')}</button>
                    )}
                    {addStep === addSteps.length - 1 && (
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors w-full sm:w-auto">{
                        isAdding ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('addProject')
                      }</button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('editProject')}</h3>
            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-1 sm:px-2">
              <form onSubmit={handleEditProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectNameEn')}</label>
                    <input type="text" value={editProject.nameEn} onChange={e => setEditProject({ ...editProject, nameEn: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectNameAr')}</label>
                    <input type="text" value={editProject.nameAr} onChange={e => setEditProject({ ...editProject, nameAr: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('projectImages')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleProjectImageUpload(e, true)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
                  />
                  {editProject.images && editProject.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editProject.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={t('preview')} className="h-24 w-32 object-cover rounded border" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                            title={t('removeImage')}
                            onClick={() => setEditProject(prev => ({
                              ...prev,
                              images: prev.images?.filter((_, i) => i !== idx) || []
                            }))}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('developer')}</label>
                  <select value={editProject.developerId} onChange={e => setEditProject({ ...editProject, developerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">{t('selectDeveloper')}</option>
                    {developers?.map(dev => (
                      <option key={dev.id} value={dev.id}>
                        {language === 'ar' && dev.nameAr ? dev.nameAr : (dev.nameEn || dev.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('zone')}</label>
                  <select value={editProject.zoneId} onChange={e => setEditProject({ ...editProject, zoneId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="">{t('selectZone')}</option>
                    {zones?.map(zone => (
                      <option key={zone.id} value={zone.id}>
                        {language === 'ar' && zone.nameAr ? zone.nameAr : (zone.nameEn || zone.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentPlans')}</label>
                  {editProject.paymentPlans.map((plan, idx) => (
                    <div key={idx} className="border rounded-lg p-4 mb-4 relative bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('downPayment')} (%)</label>
                          <input type="number" value={plan.downpayment} onChange={e => {
                            const val = Number(e.target.value);
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, downpayment: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('delivery')} (%)</label>
                          <input type="number" value={plan.delivery} onChange={e => {
                            const val = Number(e.target.value);
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, delivery: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('scheduleDescription')}</label>
                          <input type="text" value={plan.schedule} onChange={e => {
                            const val = e.target.value;
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, schedule: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('yearsToPay')}</label>
                          <input type="number" value={plan.yearsToPay} onChange={e => {
                            const val = Number(e.target.value);
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, yearsToPay: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('installmentPeriod')}</label>
                          <select value={plan.installmentPeriod} onChange={e => {
                            const val = e.target.value;
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, installmentPeriod: val as 'monthly' | 'quarterly' | 'yearly' | 'custom' } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="monthly">{t('installmentPeriodOptions.monthly')}</option>
                            <option value="quarterly">{t('installmentPeriodOptions.quarterly')}</option>
                            <option value="yearly">{t('installmentPeriodOptions.yearly')}</option>
                            <option value="custom">{t('installmentPeriodOptions.custom')}</option>
                          </select>
                        </div>
                        {plan.installmentPeriod === 'custom' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('installmentEveryMonths')}</label>
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
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('firstInstallmentDate')}</label>
                          <input type="date" value={plan.firstInstallmentDate ? plan.firstInstallmentDate.slice(0, 10) : ''} onChange={e => {
                            const val = e.target.value;
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, firstInstallmentDate: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">{t('deliveryDate')}</label>
                          <input type="date" value={plan.deliveryDate ? plan.deliveryDate.slice(0, 10) : ''} onChange={e => {
                            const val = e.target.value;
                            setEditProject(prev => ({
                              ...prev,
                              paymentPlans: prev.paymentPlans.map((p, i) => i === idx ? { ...p, deliveryDate: val } : p)
                            }));
                          }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                      </div>
                      {editProject.paymentPlans.length > 1 && (
                        <button type="button" onClick={() => handleRemovePlan(idx, true)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs">{t('removePlan')}</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddPlan(true)} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs">{t('addPlan')}</button>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('cancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isUpdating ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('updateProject')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsTab;