import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { LeadStatus } from '../../types';
import { getCookie } from '../../lib/cookieHelper';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { users } = useData(); // Remove projects since we're using inventory from API
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
    inventoryInterest: '', // will store project.id (UUID)
    source: '',
    status: LeadStatus.FRESH_LEAD as LeadStatus,
    assignedTo: ''
  });
  const [error, setError] = useState('');

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

    // Create combined name based on current language
    const combinedName = i18n.language === 'ar'
      ? (formData.nameAr || formData.nameEn)
      : (formData.nameEn || formData.nameAr);

    const leadPayload = {
      name: combinedName,
      nameEn: formData.nameEn,
      nameAr: formData.nameAr,
      contact: formData.phone,
      budget: formData.budget, // Convert to number for backend
      ...(formData.inventoryInterest ? { inventoryInterestId: formData.inventoryInterest } : {}),
      leadSource: formData.status, // Use status (enum values) not source
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
    }
  };




  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('addNewLead')}</h3>
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
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('nameEnRequired')}</label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              placeholder="Enter name in English"
              required
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('phoneRequired')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              required
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('assignedToRequired')}</label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              required
            >
              <option value="">{t('selectUser')}</option>
              {(() => {
                // Role-based user filtering for assignment
                let assignableUsers = users;

                if (user?.role === 'sales_rep') {
                  // Sales Reps can only assign to themselves
                  assignableUsers = users.filter(u => u.name === user.name);
                } else if (user?.role === 'team_leader') {
                  // Team Leaders can assign to their team members and themselves
                  assignableUsers = users.filter(u =>
                    u.name === user.name ||
                    (u.role === 'sales_rep' && u.teamId === user.teamId)
                  );
                } else if (user?.role === 'sales_admin' || user?.role === 'admin') {
                  // Sales Admin and Admin can assign to anyone
                  assignableUsers = users.filter(u => u.role !== 'admin' || user?.role === 'admin');
                }

                return assignableUsers.map(user => (
                  <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                ));
              })()}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('budgetRequired')}</label>
            <input
              type="text"
              value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              placeholder="Enter budget (EGP)"
              required
              min={0}
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventoryInterestRequired')}</label>
            <select
              value={formData.inventoryInterest}
              onChange={e => setFormData({ ...formData, inventoryInterest: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              required
            >

              <option value="">{t('selectPropertyType')}</option>
              {inventory.map((item: any) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('leadSourceRequired')}</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
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
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('statusField')}</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as LeadStatus })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            >
              <option value={LeadStatus.FRESH_LEAD}>{t('freshLead')}</option>
              <option value={LeadStatus.FOLLOW_UP}>{t('followUp')}</option>
              <option value={LeadStatus.SCHEDULED_VISIT}>{t('scheduledVisit')}</option>
              <option value={LeadStatus.OPEN_DEAL}>{t('openDeal')}</option>
              <option value={LeadStatus.CANCELLATION}>{t('cancellation')}</option>
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors text-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors text-sm"
            >
              {t('addLeadButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;