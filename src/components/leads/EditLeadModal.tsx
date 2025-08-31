import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, Building } from 'lucide-react';
import { Lead, LeadStatus, Property, User, Tier, Interest } from '../../types';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getLeads, getProperties, getUsers } from '../../queries/queries';
import { Project } from '../inventory/ProjectsTab';
import { validatePhoneNumber, getPhoneErrorMessage } from '../../utils/phoneValidation';
import { validateEmail, getEmailErrorMessage } from '../../utils/emailValidation';
import { useLanguage } from '../../contexts/LanguageContext';


interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ isOpen, onClose, lead }) => {
  const queryClient = useQueryClient();
  const { data: leads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: getLeads,
    staleTime: 1000 * 60 * 5,
  });
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: getProperties,
    staleTime: 1000 * 60 * 5,
  });



  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });

  const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.data as Project[];
  };

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 1000 * 60 * 5,
  });
  const { mutateAsync: updateLead, isPending } = useMutation({
    mutationFn: (lead: Lead) => axiosInterceptor.patch(`/leads/${lead.id}`, lead),
    onSuccess: () => {
      toast.success(t('leadUpdated'));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();

    },
    onError: (error: any) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.error(error.response.data.message[0] || "Error updating lead");
    }
  });
  const { user } = useAuth();
  const { t, i18n } = useTranslation('leads');
  const { language } = useLanguage();
  const [formData, setFormData] = useState<Lead>({
    nameEn: '',
    nameAr: '',
    gender: '',
    description: '',
    firstConection: '',
    otherProject: '',
    familyName: '',
    cil: false,
    contact: '',
    contacts: [],
    email: '',
    interest: Interest.HOT,
    tier: Tier.BRONZE,
    budget: 0,
    inventoryInterestId: '',
    projectInterestId: '',
    source: '',
    status: 'fresh_lead' as LeadStatus,
    assignedToId: ''
  });
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [budgetError, setBudgetError] = useState('');







  // console.log("User in Edit Modal", user);




  // Initialize form data when lead changes
  useEffect(() => {
    if (lead) {
      // Try to get the owner ID from different possible sources
      // const ownerIdValue = lead.assignedToId || lead.ownerId || lead.owner?.id || '';

      setFormData({
        nameEn: lead.nameEn || '',
        nameAr: lead.nameAr || '',
        gender: lead.gender || '',
        description: lead.description || '',
        otherProject: lead.otherProject || '',
        cil: lead.cil || false,
        contact: lead.contact || '',
        contacts: lead.contacts && lead.contacts.length > 0 ? lead.contacts : [],
        firstConection: (() => {
          try {
            if (lead.firstConection) {
              const date = new Date(lead.firstConection);
              return isNaN(date.getTime()) ? '' : lead.firstConection;
            }
            return '';
          } catch (error) {
            return '';
          }
        })(),
        familyName: lead.familyName || '',
        email: lead.email || '',
        interest: lead.interest || Interest.HOT,
        tier: lead.tier || Tier.BRONZE,
        budget: lead.budget || 0,
        inventoryInterestId: lead.inventoryInterestId || '',
        projectInterestId: lead.projectInterestId || '',
        source: lead.source || 'website',
        status: lead.status || 'fresh_lead',
       
      });
      setError('');
    }
  }, [lead]);
  // Utility function to remove empty values
  function removeEmpty(obj: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(obj).filter(([k, v]) => {
        if (k === "projectInterestId") return true; // 👈 سيبه حتى لو null
        return v !== undefined && v !== null && v !== '';
      })
    );
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhoneError('');
    setEmailError('');
    setBudgetError('');

    if (!lead) return;

    // Name validation - Arabic name is required
    if (!formData.nameAr || formData.nameAr.trim() === '') {
      setError(language === 'ar' ? 'الاسم العربي مطلوب' : 'Arabic name is required');
      return;
    }

    // Phone validation for primary contact and array of contacts
    if (!validatePhoneNumber(formData.contact)) {
      setPhoneError(getPhoneErrorMessage(language));
      return;
    }

    if (!formData.contacts?.every((num) => validatePhoneNumber(num))) {
      setPhoneError(getPhoneErrorMessage(language));
      return;
    }


    // Email validation (only if email is provided)
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError(getEmailErrorMessage(formData.email, language));
      return;
    }

    // Budget validation and conversion
    let budgetValue = 0;

    // Always convert budget to number for validation and submission
    if (formData.budget !== null && formData.budget !== undefined) {
      budgetValue = Number(formData.budget);
      if (isNaN(budgetValue) || budgetValue < 0) {
        setBudgetError(language === 'ar' ? 'الميزانية يجب أن تكون رقم صحيح وغير سالب' : 'Budget must be a valid non-negative number');
        return;
      }
    }

  

    // Check for duplicate phone number (excluding current lead)
    const existingLead = leads?.find(l => l.contact === formData.contact && l.id !== lead.id);
    if (existingLead) {
      setError(t('duplicatePhoneError'));
      return;
    }

    // Create combined name based on current language
    const combinedName = i18n.language === 'ar'
      ? (formData.nameAr || formData.nameEn)
      : (formData.nameEn || formData.nameAr);
    const leadData = {
      id: lead.id,
      nameEn: formData.nameEn,
      nameAr: formData.nameAr,
      gender: formData.gender,
      description: formData.description,
      otherProject: formData.otherProject,
      cil: formData.cil,
      contact: formData.contact,
      contacts: formData.contacts || [],
      email: formData.email,
      firstConection: formData.firstConection,

      interest: Interest[formData.interest.toUpperCase() as keyof typeof Interest],
      tier: Tier[formData.tier.toUpperCase() as keyof typeof Tier],
      familyName: formData.familyName,
      budget: Number(budgetValue),
      inventoryInterestId: formData.inventoryInterestId,

      // 👇 هنا الشرط
      projectInterestId: formData.projectInterestId || null,

      source: formData.source,
      status: formData.status as LeadStatus,
     
      // ownerId: formData.assignedToId,
    };



    const cleanedData = removeEmpty(leadData);

    console.log(cleanedData);

    updateLead(cleanedData as Lead);


  };




console.log(formData);

// 🟢 دالة لتحويل أي تاريخ (حتى لو جاي dd/MM/yyyy) لـ yyyy-MM-dd
function formatDateToInput(value?: string | Date | null) {
  if (!value) return "";

  // لو القيمة object (Date)
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  // لو القيمة نص و فيها "/"
  if (typeof value === "string" && value.includes("/")) {
    const [day, month, year] = value.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // لو القيمة ISO أو string عادية
  return new Date(value).toISOString().split("T")[0];
}




  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto transition-all duration-300 mx-2 sm:mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-t-lg sm:rounded-t-xl lg:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{t('editLead')}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-2"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {user?.role === "sales_rep" ? (
                <>
                  {/* Name English */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('nameEn')}</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm transition-colors"
                      placeholder="Enter name in English (optional)"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameArRequired')}</label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                      placeholder="أدخل الاسم بالعربية"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">{t('nameFamily')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.familyName}
                        onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                        placeholder="أدخل الاسم العائلة"
                      // required
                      />
                      {/* <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventoryInterest')} ({language === 'ar' ? 'اختياري' : 'optional'})</label>
                    <select
                      value={formData.inventoryInterestId}
                      onChange={(e) => setFormData({ ...formData, inventoryInterestId: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    >
                      <option value="">{t('selectPropertyType')}</option>
                      {properties?.map(property => (
                        <option key={property.id} value={property.id}>{property.title}</option>
                      ))}
                    </select>
                  </div>















                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">{t('projectInterest')}</label>
                    <div className="relative">
                      <select
                        value={formData.projectInterestId}
                        onChange={e => setFormData({ ...formData, projectInterestId: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                      >
                        <option value="">{t('selectProject')}</option>
                        {!projects ? (
                          <option value="" disabled>{isLoadingProjects ? t('loadingProjects') : t('noProjects')}</option>
                        ) : (
                          projects.map((project: Project) => (
                            <option key={project.id} value={project.id}>
                              {project.nameAr}
                            </option>
                          ))
                        )}
                      </select>
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  {/* حقل Other Project */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Other Project</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.otherProject || ''}
                        onChange={e => setFormData({ ...formData, otherProject: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                        placeholder="Enter other project"
                      />
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameEn')}</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                      placeholder="Enter name in English (optional)"
                    />
                  </div>

                  {/* Name Arabic */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('nameArRequired')}</label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm transition-colors"
                      placeholder="أدخل الاسم بالعربية"
                      required
                    />
                  </div>

                  {/* Family Name */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('nameFamily')}</label>
                    <input
                      type="text"
                      value={formData.familyName}
                      onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm transition-colors"
                      placeholder="أدخل الاسم العائلة"
                    // required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('phoneRequired')}
                    </label>


                    {/* Primary Contact */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="tel"
                        value={formData.contact}
                        onChange={(e) => {
                          setFormData({ ...formData, contact: e.target.value });
                          setPhoneError('');
                        }}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm ${phoneError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        required
                        placeholder={language === 'ar' ? 'أدخل رقم الهاتف الرئيسي' : 'Enter primary phone number'}
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {language === 'ar' ? 'رئيسي' : 'Primary'}
                      </span>
                    </div>

                    {/* Additional Contacts */}
                    {formData.contacts?.map((phone, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            const updatedContacts = [...(formData.contacts || [''])];
                            updatedContacts[index] = e.target.value;
                            setFormData({ ...formData, contacts: updatedContacts });
                            setPhoneError('');
                          }}
                          className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm transition-colors ${phoneError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                          placeholder={language === 'ar' ? 'أدخل رقم هاتف إضافي' : 'Enter additional phone number'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedContacts = formData.contacts?.filter((_, i) => i !== index);
                            setFormData({ ...formData, contacts: updatedContacts });
                          }}
                          className="text-red-500 hover:text-red-700 text-lg px-2 py-1 rounded transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const currentContacts = formData.contacts || [];
                        setFormData({
                          ...formData,
                          contacts: [...currentContacts, '']
                        });
                      }}
                      className="text-blue-500 text-sm"
                    >
                      + {language === 'ar' ? 'إضافة رقم إضافي' : 'Add additional phone'}
                    </button>

                    {phoneError && <p className="text-red-600 text-sm mt-2">{phoneError}</p>}
                  </div>

                  <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("gender")}</label>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                        >
                          <option value="">{t("selectGender")}</option>
                          <option value="male">{t("male")}</option>
                          <option value="female">{t("female")}</option>
                        </select>
                      </div>
                    </div>

                  {/* Email */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setEmailError('');
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm transition-colors ${emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                    />
                    {emailError && (
                      <p className="text-red-600 text-sm mt-2">{emailError}</p>
                    )}
                  </div>

                  {/* Assigned To
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('assignedToRequired')}</label>
                    <select
                      value={formData.assignedToId || ''}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm transition-colors ${(user?.role as string) === 'sales_rep' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      required
                      disabled={(user?.role as string) === 'sales_rep'}
                    >
                      <option value="">{t('selectUser')}</option>
                      {(() => {
                        // Role-based user filtering for assignment
                        let assignableUsers = users;

                        if ((user?.role as string) === 'sales_rep') {
                          // Sales Reps can only assign to themselves
                          assignableUsers = users?.filter(u => u.name === user?.name);
                        } else if (user?.role === 'team_leader') {
                          // Team Leaders can assign to their team members and themselves
                          assignableUsers = users?.filter(u =>
                            u.name === user.name ||
                            (u.role === 'sales_rep' && u.teamLeaderId === user.id) ||
                            (u.teamId === user.teamId && u.id !== user.id)
                          );
                        } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
                          // Sales Admin and Admin can assign to anyone
                          assignableUsers = users?.filter(u => u.role !== 'admin' || user?.role === 'admin' || user?.role === 'sales_admin');
                        }

                        return assignableUsers?.map(user => (
                          <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                        ));
                      })()}
                    </select>



                    {(user?.role as string) === 'sales_rep' && (
                      <p className="text-sm text-gray-500 mt-1">
                        {language === 'ar' ? 'لا يمكنك تغيير تعيين العميل' : 'You cannot change lead assignment'}
                      </p>
                    )}
                  </div> */}

                  {/* Budget */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('budget')}</label>
                    <input
                      type="number"
                      value={formData.budget || ''}
                      onChange={e => {
                        const value = e.target.value;

                        if (value === '') {
                          setFormData({ ...formData, budget: 0 });
                          setBudgetError('');
                        } else {
                          const numValue = Number(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setFormData({ ...formData, budget: numValue });
                            setBudgetError('');
                          } else if (numValue < 0) {
                            setBudgetError(language === 'ar' ? 'الميزانية يجب ألا تكون سالبة' : 'Budget must not be negative');
                          }
                        }
                      }}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm transition-colors ${budgetError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder={language === 'ar' ? 'أدخل الميزانية (اختياري)' : 'Enter budget (optional)'}
                      min="0"
                    />
                    {budgetError && (
                      <p className="text-red-600 text-sm mt-2">{budgetError}</p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventoryInterest')} ({language === 'ar' ? 'اختياري' : 'optional'})</label>
                    <select
                      value={formData.inventoryInterestId}
                      onChange={(e) => setFormData({ ...formData, inventoryInterestId: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    >
                      <option value="">{t('selectPropertyType')}</option>
                      {properties?.map(property => (
                        <option key={property.id} value={property.id}>{property.title}</option>
                      ))}
                    </select>
                  </div>



                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t('projectInterest')}</label>
                    <div className="relative">
                      <select
                        value={formData.projectInterestId}
                        onChange={e => setFormData({ ...formData, projectInterestId: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                      >
                        <option value="">{t('selectProject')}</option>
                        {!projects ? (
                          <option value="" disabled>{isLoadingProjects ? t('loadingProjects') : t('noProjects')}</option>
                        ) : (
                          projects.map((project: Project) => (
                            <option key={project.id} value={project.id}>
                              {project.nameAr}
                            </option>
                          ))
                        )}
                      </select>
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  {/* حقل Other Project */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Other Project</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.otherProject || ''}
                        onChange={e => setFormData({ ...formData, otherProject: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                        placeholder="Enter other project"
                      />
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>




                  {/* Source */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourceRequired')}</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm transition-colors"
                      required
                    >
                      <option value="">{t('selectSource')}</option>
                      <option value="facebook">{t('facebook')}</option>
                      <option value="instgram">{t('instagram')}</option>
                      <option value="website">{t('website')}</option>
                      <option value="referral">{t('referral')}</option>
                      <option value="cold_call">{t('coldCall')}</option>
                      <option value="walk_in-in">{t('walkIn')}</option>
                      <option value="advertisement">{t('advertisement')}</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('statusRequired')}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm transition-colors"
                      required
                    >
                      <option value={LeadStatus.FRESH_LEAD}>{t('freshLead')}</option>
                      <option value={LeadStatus.FOLLOW_UP}>{t('followUp')}</option>
                      <option value={LeadStatus.SCHEDULED_VISIT}>{t('scheduledVisit')}</option>
                      <option value={LeadStatus.OPEN_DEAL}>{t('openDeal')}</option>
                      <option value={LeadStatus.CLOSED_DEAL}>{t('closedDeal')}</option>
                      <option value={LeadStatus.VIP}>{t('VIP')}</option>
                      <option value={LeadStatus.NON_STOP}>{t('nonStop')}</option>
                      <option value={LeadStatus.CANCELLATION}>{t('cancellation')}</option>
                      <option value={LeadStatus.NO_ANSWER}>{t('noAnswer')}</option>
                      <option value={LeadStatus.NOT_INTERSTED_NOW}>{t('notInterestedNow')}</option>
                      <option value={LeadStatus.RESERVATION}>{t('reservation')}</option>
                    </select>
                  </div>





                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('IntersName')}</label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value as any })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                      required
                    >
                      <option value={Interest.HOT}>{t('hot')}</option>
                      <option value={Interest.WARM}>{t('warm')}</option>
                      <option value={LeadStatus.NON_STOP}>{t('under_decision')}</option>

                    </select>
                  </div>







                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('TierName')}</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                      required
                    >
                      <option value={Tier.BRONZE}>{t('bronze')}</option>
                      <option value={Tier.SILVER}>{t('silver')}</option>
                      <option value={Tier.PLATINUM}>{t('platinum')}</option>
                      <option value={Tier.GOLD}>{t('gold')}</option>

                    </select>
                  </div>

                  {/* First Connection Date */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('firstConnection')}
                    </label>
                   <input
  type="date"
  value={formData.firstConection ? formatDateToInput(formData.firstConection) : ""}
  onChange={(e) => {
    const dateValue = e.target.value; // yyyy-MM-dd
    setFormData({
      ...formData,
      firstConection: dateValue, // خزنه بنفس الـ format
    });
    setEmailError("");
  }}
/>

                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("CIL")}
                    </label>

                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          cil: !formData.cil, // قلب القيمة (true/false)
                        })
                      }
                      className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.cil ? "bg-white" : "bg-white"} border border-gray-300`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full shadow-md transform transition-transform ${formData.cil ? "translate-x-6 bg-blue-500" : "translate-x-0 bg-black"}`}
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      {formData.cil ? t("clear") : t("not_clear")}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2 col-span-1 lg:col-span-2 w-full">
                <label className="block text-sm font-medium text-gray-700">
                  {t('Lead Description')}
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 resize-none"
                  placeholder="Enter Description For Lead ......"
                  rows={6}
                />
              </div>





              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div>
                      <span>{t('updating')}</span>
                    </div>
                  ) : (
                    t('updateLead')
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm sm:text-base"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLeadModal; 