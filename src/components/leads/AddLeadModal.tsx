import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, User, Phone, Mail, DollarSign, Building, Globe, Target, Calendar } from 'lucide-react';
import { Interest, Lead, LeadStatus, Property, Tier } from '../../types';
import { User as UserType } from '../../contexts/AuthContext';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { validatePhoneNumber, getPhoneErrorMessage } from '../../utils/phoneValidation';
import { validateEmail, getEmailErrorMessage } from '../../utils/emailValidation';
import { useLanguage } from '../../contexts/LanguageContext';
import { Project } from '../inventory/ProjectsTab';
interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  // const { users, properties, addLead } = useData();
  const queryClient = useQueryClient();





  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ['users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getUsers(),
  });





  const getUsers = async () => {
    const response = await axiosInterceptor.get('/auth/users');
    return response.data as UserType[];
  }
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProperties()
  });
  const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    return response.data.properties as Property[];
  }




  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });

  const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.data as Project[];
  };









  const addLead = async (lead: Lead) => {
    const response = await axiosInterceptor.post('/leads/create', lead);
    return response.data.data.lead;
  }
  const { mutateAsync: addLeadMutation, isPending: isAddingLead } = useMutation({
    mutationFn: (lead: Lead) => addLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead added successfully");
      setFormData({
        nameEn: '',
        nameAr: '',
        gender: '',
        description: '',
        contact: '',
        familyName: '',
        otherProject: '',
        contacts: [''],
        cil: true,
        email: '',
        interest: Interest.HOT,
        tier: Tier.BRONZE,
        firstConection: '',
        budget: 0,
        inventoryInterestId: '',
        projectInterestId: '',
        source: '',
        status: LeadStatus.FRESH_LEAD,
        assignedTo: user?.role === 'sales_rep' ? user.id : ''
      });
      onClose();
    },
    onError: (error: any) => {

      toast.error(error.response.data.message || "Error adding lead");
      setError("Error adding lead: " + error.message);
      setFormData({
        nameEn: '',
        nameAr: '',
        gender: '',
        description: '',
        contact: '',
        familyName: '',
        otherProject: '',
        contacts: [''],
        cil: true,
        email: '',
        interest: Interest.HOT,
        tier: Tier.BRONZE,
        firstConection: '',
        budget: 0,
        inventoryInterestId: '',
        projectInterestId: '',
        source: '',
        status: LeadStatus.FRESH_LEAD,
        assignedTo: user?.role === 'sales_rep' ? user.id : ''
      });
      onClose();
    }
  });

  const { user } = useAuth();
  const { t, i18n } = useTranslation('leads');
  const tier = useTranslation('Tier');
  const interest = useTranslation('Interest');
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    gender: '',
    description: '',
    contact: '',
    familyName: '',
    otherProject: '',
    contacts: [''],
    cil: true,
    email: '',
    interest: Interest.HOT as Interest,
    tier: Tier.BRONZE as Tier,
    firstConection: '',
    budget: 0,
    inventoryInterestId: '',
    projectInterestId: '',
    source: '',
    status: LeadStatus.FRESH_LEAD as LeadStatus,
    assignedTo: user?.role === 'sales_rep' ? user.id : ''
  });

  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [budgetError, setBudgetError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPhoneError('');
    setEmailError('');
    setBudgetError('');

    // Name validation - Arabic name is required
    if (!formData.nameAr || formData.nameAr.trim() === '') {
      setError(language === 'ar' ? 'الاسم العربي مطلوب' : 'Arabic name is required');
      return;
    }

    // Phone validation for array of contacts
    // Check if at least one phone number is provided
    // if (!formData.contacts || formData.contacts.length === 0 || !formData.contacts[0] || formData.contacts[0].trim() === '') {
    //   setPhoneError(language === 'ar' ? 'رقم الهاتف الأول مطلوب' : 'First phone number is required');
    //   return;
    // }
    if (!formData.contact || formData.contact.length === 0 || formData.contact.trim() === '') {
      setPhoneError(language === 'ar' ? 'رقم الهاتف الأول مطلوب' : 'First phone number is required');
      return;
    }






    // Validate all provided phone numbers
    const validContacts = formData.contacts.filter(contact => contact.trim() !== '');
    if (!validContacts.every((num) => validatePhoneNumber(num))) {
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

    // Ensure sales rep is assigned to themselves
    if ((user?.role as string) === 'sales_rep' && !formData.assignedTo && user?.id) {
      setFormData(prev => ({ ...prev, assignedTo: user.id }));
    }

    // Check for required assignedTo field
    if (!formData.assignedTo || formData.assignedTo.trim() === '') {
      setError(language === 'ar' ? 'يجب تحديد المستخدم المُكلف' : 'Assigned user is required');
      return;
    }








    try {
      // Create combined name based on current language
      const combinedName = i18n.language === 'ar'
        ? (formData.nameAr || formData.nameEn)
        : (formData.nameEn || formData.nameAr);

      // Get the first phone number as the primary contact
      // const primaryContact = formData.contacts && formData.contacts.length > 0 ? formData.contacts[0] : '';
      const primaryContact = formData.contact && formData.contact.trim()
      // Filter out empty phone numbers from contacts array
      const validContacts = formData.contacts ? formData.contacts.filter(contact => contact.trim() !== '') : [];
      const leadDataRaw = {
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        gender: formData.gender,
        description: formData.description,
        otherProject: formData.otherProject,
        cil: formData.cil,
        contact: primaryContact,
        contacts: validContacts,
        familyName: formData.familyName,
        firstConection: formData.firstConection,
        email: formData.email,
        interest: Interest[formData.interest?.toUpperCase() as keyof typeof Interest],
        tier: Tier[formData.tier?.toUpperCase() as keyof typeof Tier],
        budget: Number(budgetValue),
        inventoryInterestId: formData.inventoryInterestId,
        projectInterestId: formData.projectInterestId,
        source: formData.source,
        status: formData.status as LeadStatus,
        lastCallDate: '------',
        lastVisitDate: '------',
        assignedToId: formData.assignedTo || user?.id!,
        ownerId: formData.assignedTo || user?.id!,
        createdBy: user?.name || 'Unknown',
        createdAt: new Date().toISOString(),
      };

      // فلترة القيم الفاضية
      const leadData = Object.fromEntries(
        Object.entries(leadDataRaw).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      );

      console.log(leadData);
      addLeadMutation(leadData);


      // Reset form and close modal

    } catch (err: any) {
      // toast.error(err.response.data.message);
      setError("Error adding lead: " + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto transition-all duration-300 transform scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('addNewLead')}</h3>
              <p className="text-gray-500 text-sm mt-1">Add a new lead to your CRM system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group"
          >
            <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-xl">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('nameEn')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    placeholder="Enter name in English (optional)"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('nameArRequired')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    placeholder="أدخل الاسم بالعربية"
                    required
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>


              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('nameFamily')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    placeholder="أدخل الاسم العائلة"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t("gender")}</label>
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




              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('phoneRequired')}
                </label>

                {/* رقم الهاتف الرئيسي */}
                <div className="relative flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={formData.contact || ""}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white text-sm transition-all duration-200 
        ${phoneError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`}
                      required
                      placeholder={language === 'ar' ? 'أدخل رقم الهاتف الرئيسي' : 'Enter primary phone number'}
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                    {/* Primary contact indicator */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {language === 'ar' ? 'رئيسي' : 'Primary'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* الأرقام الإضافية */}
                {(formData.contacts || []).map((phone, index) => (
                  <div key={index} className="relative flex items-center gap-2 mt-2">
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const updatedContacts = [...(formData.contacts || [])] as string[];
                          updatedContacts[index] = e.target.value;
                          setFormData({ ...formData, contacts: updatedContacts });
                        }}
                        className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 bg-white text-sm transition-all duration-200 border-gray-200 focus:ring-blue-500"
                        placeholder={language === 'ar' ? 'أدخل رقم هاتف إضافي' : 'Enter additional phone number'}
                      />
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>

                    {/* زر الحذف */}
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 text-sm p-2 rounded-full hover:bg-red-50 transition-colors"
                      onClick={() => {
                        const updatedContacts = formData.contacts.filter((_, i) => i !== index);
                        setFormData({ ...formData, contacts: updatedContacts });
                      }}
                      title={language === 'ar' ? 'حذف رقم الهاتف' : 'Remove phone number'}
                    >
                      ✕
                    </button>
                  </div>
                ))}


                {/* Add phone button */}
                <button
                  type="button"
                  className="mt-2 text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1 transition-colors"
                  onClick={() => setFormData({ ...formData, contacts: [...(formData.contacts || []), ''] })}
                >
                  <span>+</span>
                  <span>{language === 'ar' ? 'إضافة رقم هاتف إضافي' : 'Add Additional Phone'}</span>
                </button>

                {phoneError && <p className="text-red-600 text-sm mt-1">{phoneError}</p>}
              </div>


              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmailError(''); // Clear error when user types
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-sm transition-all duration-200 ${emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                      }`}
                    placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('firstConnection')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.firstConection}
                    onChange={(e) => {
                      setFormData({ ...formData, firstConection: e.target.value });
                      setEmailError('');
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-sm transition-all duration-200 ${emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                      }`}
                    placeholder={language === 'ar' ? 'أدخل أول تاريخ للتواصل' : 'Enter First Connection Date'}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>


              <div className="space-y-2 col-span-full w-full">
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



            </div>
          </div>

          {/* Business Information Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Building className="h-5 w-5 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-900">Business Information</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('assignedToRequired')}</label>
                <div className="relative">
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none ${(user?.role as string) === 'sales_rep' ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    required
                    disabled={(user?.role as string) === 'sales_rep'}
                  >
                    <option value="">{t('selectUser')}</option>
                    {(() => {
                      if (!users) {
                        return <option value="" disabled>{isLoadingUsers ? 'Loading users...' : 'No users available'}</option>;
                      }

                      let assignableUsers = users;

                      if ((user?.role as string) === 'sales_rep') {
                        assignableUsers = users.filter(u => u.name === user?.name);
                      } else if (user?.role === 'team_leader') {
                        assignableUsers = users.filter(u =>
                          u.name === user.name ||
                          (u.role === 'sales_rep' && u.teamLeaderId === user.id) ||
                          (u.teamId === user.teamId && u.id !== user.id)
                        );
                      } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
                        assignableUsers = users.filter(u => u.role !== 'admin' || user?.role === 'admin');
                      }

                      return assignableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ));
                    })()}
                  </select>
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {(user?.role as string) === 'sales_rep' && (
                  <p className="text-sm text-gray-500 mt-1">
                    {language === 'ar' ? 'سيتم تعيين العميل لك تلقائياً' : 'Lead will be automatically assigned to you'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('budget')}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
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
                    className={`px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full ${budgetError ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                </div>
                {budgetError && (
                  <p className="text-red-600 text-sm mt-1">{budgetError}</p>
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


              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('leadSourceRequired')}</label>
                <div className="relative">
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                    required
                  >
                    <option value="">{t('selectSource')}</option>
                    <option value="facebook">{t('facebook')}</option>
                    <option value="instgram">{t('instagram')}</option>
                    <option value="social_media">{t('socialMedia')}</option>
                    <option value="website">{t('website')}</option>
                    <option value="referral">{t('referral')}</option>
                    <option value="cold_call">{t('coldCall')}</option>
                    <option value="walk_in">{t('walkIn')}</option>
                    <option value="advertisement">{t('advertisement')}</option>
                  </select>
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-5 w-5 text-purple-600" />
              <h4 className="text-lg font-semibold text-gray-900">Lead Status</h4>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('statusField')}</label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                >
                  <option value={LeadStatus.FRESH_LEAD}>{t('freshLead')}</option>
                  <option value={LeadStatus.FOLLOW_UP}>{t('followUp')}</option>
                  <option value={LeadStatus.SCHEDULED_VISIT}>{t('scheduledVisit')}</option>
                  <option value={LeadStatus.OPEN_DEAL}>{t('openDeal')}</option>
                  <option value={LeadStatus.VIP}>{t('VIP (Non Stop)')}</option>
                  <option value={LeadStatus.CLOSED_DEAL}>{t('closedDeal')}</option>
                  <option value={LeadStatus.CANCELLATION}>{t('cancellation')}</option>
                  <option value={LeadStatus.NO_ANSWER}>{t('noAnswer')}</option>
                  <option value={LeadStatus.NOT_INTERSTED_NOW}>{t('notInterestedNow')}</option>
                  <option value={LeadStatus.RESERVATION}>{t('reservation')}</option>
                </select>
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('TierName')}</label>
              <div className="relative">
                <select
                  value={formData.tier}
                  onChange={e => setFormData({ ...formData, tier: e.target.value as Tier })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                >
                  <option value={Tier.BRONZE}>{t('bronze')}</option>

                  <option value={Tier.SILVER}>{t('silver')}</option>
                  <option value={Tier.PLATINUM}>{t('platinum')}</option>
                  <option value={Tier.GOLD}>{t('gold')}</option>


                </select>
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('IntersName')}</label>
              <div className="relative">
                <select
                  value={formData.interest}
                  onChange={e => setFormData({ ...formData, interest: e.target.value as Interest })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                >
                  <option value={Interest.HOT}>{t('hot')}</option>

                  <option value={Interest.WARM}>{t('warm')}</option>
                  <option value={Interest.UNDER_DECISION}>{t('under_decision')}</option>
                  {/* <option value={Interest.GOLD}>{t('gold')}</option> */}


                </select>
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
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
                className={`relative w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors
      ${formData.cil ? "bg-white" : "bg-white"} border border-gray-300`}
              >
                <span
                  className={`w-4 h-4 rounded-full shadow-md transform transition-transform 
        ${formData.cil ? "translate-x-6 bg-blue-500" : "translate-x-0 bg-black"}`}
                />
              </div>

              <p className="text-xs text-gray-500">
                {formData.cil ? t("clear") : t("not_clear")}
              </p>
            </div>



          </div>








          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isAddingLead}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg font-semibold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isAddingLead ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <span>{t('addLeadButton')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;