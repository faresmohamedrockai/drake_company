import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
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
    firstConection: '',
    familyName: '',
    contact: '',
    contacts: [],
    email: '',
    interest: Interest.HOT,
    tier: Tier.BRONZE,
    budget: 0,
    inventoryInterestId: '',
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
      const ownerIdValue = lead.assignedToId || lead.ownerId || lead.owner?.id || '';

      setFormData({
        nameEn: lead.nameEn || '',
        nameAr: lead.nameAr || '',
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
        source: lead.source || 'website',
        status: lead.status || 'fresh_lead',
        assignedToId: ownerIdValue
      });
      setError('');
    }
  }, [lead]);

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

    // Check for required fields
    if (!formData.assignedToId || formData.assignedToId.trim() === '') {
      setError(language === 'ar' ? 'يجب تحديد المستخدم المُكلف' : 'Assigned user is required');
      return;
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
      contact: formData.contact,
      contacts: formData.contacts || [],
      email: formData.email,
      firstConection: formData.firstConection
        ? (() => {
            try {
              const date = new Date(formData.firstConection);
              return isNaN(date.getTime()) ? undefined : date;
            } catch (error) {
              return undefined;
            }
          })()
        : undefined,
      // 👇 التحويل الصحيح
      interest: Interest[formData.interest.toUpperCase() as keyof typeof Interest],
      tier: Tier[formData.tier.toUpperCase() as keyof typeof Tier],
      familyName: formData.familyName,
      budget: Number(budgetValue),
      inventoryInterestId: formData.inventoryInterestId,
      source: formData.source,
      status: formData.status as LeadStatus,
      assignedToId: formData.assignedToId,
      ownerId: formData.assignedToId,
    };

    updateLead(leadData);


  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('editLead')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}






        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

          {
            user?.role === "sales_rep" ? (<>
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('nameFamily')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    placeholder="أدخل الاسم العائلة"
                    required
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


            </>) : (
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">{t('nameFamily')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.familyName}
                      onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm transition-all duration-200"
                      placeholder="أدخل الاسم العائلة"
                      required
                    />
                    {/* <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
                  </div>
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
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const updatedContacts = [...(formData.contacts || [''])];
                          updatedContacts[index] = e.target.value;
                          setFormData({ ...formData, contacts: updatedContacts });
                          setPhoneError('');
                        }}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm ${phoneError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        placeholder={language === 'ar' ? 'أدخل رقم هاتف إضافي' : 'Enter additional phone number'}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updatedContacts = formData.contacts?.filter((_, i) => i !== index);
                          setFormData({ ...formData, contacts: updatedContacts });
                        }}
                        className="text-red-500 text-lg"
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

                  {phoneError && <p className="text-red-600 text-sm mt-1">{phoneError}</p>}
                </div>


                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmailError(''); // Clear error when user types
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm ${emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                  />
                  {emailError && (
                    <p className="text-red-600 text-sm mt-1">{emailError}</p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('assignedToRequired')}</label>
                  <select
                    value={formData.assignedToId || ''}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm ${(user?.role as string) === 'sales_rep' ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
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
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget')}</label>
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
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 bg-gray-50 text-sm ${budgetError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder={language === 'ar' ? 'أدخل الميزانية (اختياري)' : 'Enter budget (optional)'}
                    min="0"
                  />
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

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sourceRequired')}</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
                    required
                  >
                    <option value="">{t('selectSource')}</option>
                    <option value="Facebook">{t('facebook')}</option>
                    <option value="Instagram">{t('instagram')}</option>
                    <option value="Website">{t('website')}</option>
                    <option value="Referral">{t('referral')}</option>
                    <option value="Cold Call">{t('coldCall')}</option>
                    <option value="Walk-in">{t('walkIn')}</option>
                    <option value="Advertisement">{t('advertisement')}</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('statusRequired')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
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


                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('firstConnection')}
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.firstConection ? new Date(formData.firstConection).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        try {
                          const dateValue = e.target.value;
                          if (dateValue) {
                            const date = new Date(dateValue);
                            if (!isNaN(date.getTime())) {
                              setFormData({
                                ...formData,
                                firstConection: date.toISOString().split('T')[0],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                firstConection: '',
                              });
                            }
                          } else {
                            setFormData({
                              ...formData,
                              firstConection: '',
                            });
                          }
                        } catch (error) {
                          setFormData({
                            ...formData,
                            firstConection: '',
                          });
                        }
                        setEmailError("");
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 text-sm transition-all duration-200 ${emailError
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                        }`}
                    />
                    {/* Icon لو محتاج */}
                    {/* <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
                  </div>
                </div>


              </>
            )
          }



























          <div className="col-span-2 flex gap-3 mt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={isPending}
            >
              {isPending ? <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div>
              </div> : t('updateLead')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2.5 sm:py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal; 