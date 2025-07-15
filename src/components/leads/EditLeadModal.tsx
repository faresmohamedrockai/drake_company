import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ isOpen, onClose, lead }) => {
  const { updateLead, leads, projects, users } = useData();
  const { user } = useAuth();
  const { t, i18n } = useTranslation('leads');
  const [formData, setFormData] = useState({
    nameEn: '',
    nameAr: '',
    phone: '',
    email: '',
    budget: '',
    inventoryInterest: '',
    source: '',
    status: 'fresh_lead' as LeadStatus,
    assignedTo: ''
  });
  const [error, setError] = useState('');

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({
        nameEn: lead.nameEn || '',
        nameAr: lead.nameAr || '',
        phone: lead.phone || '',
        email: lead.email || '',
        budget: lead.budget || '',
        inventoryInterest: lead.inventoryInterest || '',
        source: lead.source || '',
        status: lead.status || 'fresh_lead',
        assignedTo: lead.assignedTo || ''
      });
      setError('');
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!lead) return;

    // Check for duplicate phone number (excluding current lead)
    const existingLead = leads.find(l => l.phone === formData.phone && l.id !== lead.id);
    if (existingLead) {
      setError(t('duplicatePhoneError'));
      return;
    }

    // Create combined name based on current language
    const combinedName = i18n.language === 'ar' 
      ? (formData.nameAr || formData.nameEn)
      : (formData.nameEn || formData.nameAr);

    updateLead(lead.id, {
      name: combinedName,
      nameEn: formData.nameEn,
      nameAr: formData.nameAr,
      phone: formData.phone,
      email: formData.email,
      budget: formData.budget,
      inventoryInterest: formData.inventoryInterest,
      source: formData.source,
      status: formData.status as LeadStatus,
      assignedTo: formData.assignedTo
    });

    onClose();
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
            <select
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              required
            >
              <option value="">{t('selectBudgetRange')}</option>
              <option value="EGP 800,000 - 1,200,000">EGP 800,000 - 1,200,000</option>
              <option value="EGP 1,200,000 - 1,800,000">EGP 1,200,000 - 1,800,000</option>
              <option value="EGP 1,500,000 - 2,500,000">EGP 1,500,000 - 2,500,000</option>
              <option value="EGP 1,800,000 - 2,500,000">EGP 1,800,000 - 2,500,000</option>
              <option value="EGP 2,000,000 - 3,000,000">EGP 2,000,000 - 3,000,000</option>
              <option value="EGP 2,500,000 - 3,500,000">EGP 2,500,000 - 3,500,000</option>
              <option value="EGP 3,000,000 - 4,500,000">EGP 3,000,000 - 4,500,000</option>
              <option value="EGP 3,500,000 - 5,000,000">EGP 3,500,000 - 5,000,000</option>
              <option value="EGP 4,000,000 - 6,000,000">EGP 4,000,000 - 6,000,000</option>
              <option value="EGP 5,500,000 - 8,000,000">EGP 5,500,000 - 8,000,000</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventoryInterestRequired')}</label>
            <select
              value={formData.inventoryInterest}
              onChange={(e) => setFormData({ ...formData, inventoryInterest: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              required
            >
              <option value="">{t('selectPropertyType')}</option>
              {projects.map(project => (
                <option key={project.id} value={project.name}>{project.name}</option>
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
              <option value="fresh_lead">{t('freshLead')}</option>
              <option value="follow_up">{t('followUp')}</option>
              <option value="scheduled_visit">{t('scheduledVisit')}</option>
              <option value="open_deal">{t('openDeal')}</option>
              <option value="cancellation">{t('cancellation')}</option>
            </select>
          </div>

          <div className="col-span-2 flex gap-3 mt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('updateLead')}
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