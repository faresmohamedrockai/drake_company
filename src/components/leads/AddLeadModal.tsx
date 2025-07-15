import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X, User, Phone, Mail, DollarSign, Building, Globe, Target } from 'lucide-react';
import { LeadStatus } from '../../types';
import { getCookie } from '../../lib/cookieHelper';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { users } = useData();
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const { t, i18n } = useTranslation('leads');
  const BaseUrl = import.meta.env.VITE_API_URL;
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    phone: '',
    email: '',
    budget: '',
    inventoryInterest: '',
    source: '',
    status: LeadStatus.FRESH_LEAD as LeadStatus,
    assignedTo: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = getCookie('access_token');
        const res = await fetch(`${BaseUrl}/inventory`, {
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          }
        });
        const data = await res.json();
        setInventory(data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
  }, [BaseUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Create combined name based on current language
    const combinedName = i18n.language === 'ar'
      ? (formData.nameAr || formData.nameEn)
      : (formData.nameEn || formData.nameAr);

    const leadPayload = {
      name: combinedName,
      nameEn: formData.nameEn,
      nameAr: formData.nameAr,
      contact: formData.phone,
      budget: formData.budget,
      ...(formData.inventoryInterest ? { inventoryInterestId: formData.inventoryInterest } : {}),
      leadSource: formData.status,
      status: formData.status
    };

    try {
      const accessToken = getCookie('access_token');

      const res = await fetch(`${BaseUrl}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(leadPayload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Something went wrong");
        return;
      }

      // Reset form and close modal
      setFormData({
        nameEn: '',
        nameAr: '',
        phone: '',
        email: '',
        budget: '',
        inventoryInterest: '',
        source: '',
        status: LeadStatus.FRESH_LEAD,
        assignedTo: ''
      });
      onClose();
    } catch (err: any) {
      setError("Network error: " + err.message);
    } finally {
      setIsSubmitting(false);
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
                <label className="block text-sm font-medium text-gray-700">{t('nameEnRequired')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    placeholder="Enter name in English"
                    required
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
                <label className="block text-sm font-medium text-gray-700">{t('phoneRequired')}</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    required
                  />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                    required
                  >
                    <option value="">{t('selectUser')}</option>
                    {(() => {
                      let assignableUsers = users;

                      if (user?.role === 'sales_rep') {
                        assignableUsers = users.filter(u => u.name === user.name);
                      } else if (user?.role === 'team_leader') {
                        assignableUsers = users.filter(u =>
                          u.name === user.name ||
                          (u.role === 'sales_rep' && u.teamId === user.teamId)
                        );
                      } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
                        assignableUsers = users.filter(u => u.role !== 'admin' || user?.role === 'admin');
                      }

                      return assignableUsers.map(user => (
                        <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                      ));
                    })()}
                  </select>
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('budgetRequired')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200"
                    placeholder="Enter budget (EGP)"
                    required
                    min={0}
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{t('inventoryInterestRequired')}</label>
                <div className="relative">
                  <select
                    value={formData.inventoryInterest}
                    onChange={e => setFormData({ ...formData, inventoryInterest: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-all duration-200 appearance-none"
                    required
                  >
                    <option value="">{t('selectPropertyType')}</option>
                    {inventory.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
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
                    <option value="Social Media">{t('socialMedia')}</option>
                    <option value="Website">{t('website')}</option>
                    <option value="Referral">{t('referral')}</option>
                    <option value="Cold Call">{t('coldCall')}</option>
                    <option value="Walk-in">{t('walkIn')}</option>
                    <option value="Advertisement">{t('advertisement')}</option>
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
                  <option value={LeadStatus.CANCELLATION}>{t('cancellation')}</option>
                </select>
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
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
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg font-semibold transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
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