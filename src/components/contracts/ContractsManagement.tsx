import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, FileText, DollarSign, Calendar, User, Trash2, Shield } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { Contract, Lead, Property } from '../../types';
import { addContract, getContracts, getLeads, getProperties, updateContract } from '../../queries/queries';
import { deleteContract } from '../../queries/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';


const ContractsManagement: React.FC = () => {
  // const { contracts, addContract, updateContract, deleteContract, leads, properties } = useData();
  const [toastId, setToastId] = useState<Id | null>(null);
  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    staleTime: 1000 * 60 * 5,
    queryFn: getContracts,
  });
  const { data: leads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    staleTime: 1000 * 60 * 5,
    queryFn: getLeads,
  });
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5,
    queryFn: getProperties,
  });
  const queryClient = useQueryClient();
  const { mutate: deleteContractMutation, isPending: isDeletingContract } = useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.dismiss(toastId || '');
      setToastId(null);
      toast.success("Contract deleted successfully");
    },
    onError: (error: any) => {
      toast.dismiss(toastId || '');
      setToastId(null);
      toast.error(error.response.data.message[0]);
    },
  });
  const { mutate: updateContractMutation, isPending: isUpdatingContract } = useMutation({
    mutationFn: (contract: Contract) => updateContract(contract.id || '', contract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.dismiss(toastId || '');
      setToastId(null);
      toast.success("Contract updated successfully");
      setShowForm(false);
      setForm({
        leadId: '',
        inventoryId: '',
        dealValue: 0,
        contractDate: '',
        status: 'Pending',
        notes: '',
        createdById: '',
      });
    },
    onError: (error: any) => {
      toast.dismiss(toastId || '');
      setToastId(null);
      toast.error(error.response.data.message[0]);
    },
  });
  const { mutate: addContractMutation, isPending: isAddingContract } = useMutation({
    mutationFn: (contract: Contract) => addContract(contract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.dismiss(toastId || '');
      setToastId(null);
      toast.success("Contract added successfully");
      setShowForm(false);
      setForm({
        leadId: '',
        inventoryId: '',
        dealValue: 0,
        contractDate: '',
        status: 'Pending',
        notes: '',
        createdById: '',
      });
    },
    onError: (error: any) => {
      toast.dismiss(toastId || '');
      setToastId(null);
      toast.error(error.response.data.message[0]);
    },
  });

  useEffect(() => {
    if (isAddingContract) {
      setToastId(toast.loading(`Adding contract...`));
    }
    if (isUpdatingContract) {
      setToastId(toast.loading(`Updating contract...`));
    }
    if (isDeletingContract) {
      setToastId(toast.loading(`Deleting contract...`));
    }
  }, [isAddingContract, isUpdatingContract, isDeletingContract]);

  const { user } = useAuth();
  const { t, i18n } = useTranslation('contracts');
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Contract>({
    leadId: '',
    inventoryId: '',
    dealValue: 0,
    contractDate: '',
    status: 'Pending',
    notes: '',
    createdById: '',
  });
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);







  // Helper function to translate contract statuses
  const translateContractStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Pending': t('statuses.pending'),
      'Signed': t('statuses.signed'),
      'Cancelled': t('statuses.cancelled'),
    };
    return statusMap[status] || status;
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      leadId: '',
      inventoryId: '',
      dealValue: 0,
      contractDate: '',
      status: 'Pending',
      createdById: user?.id || '',
      notes: '',
    });
    setShowForm(true);
  };

  const openEditForm = (contract: any) => {
    setEditId(contract.id);
    setForm({ ...contract, createdById: contract.createdById || user?.id || '' });
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value, dealValue: name === 'dealValue' ? Number(value) : prev.dealValue }));
    if (name === 'leadId') {
      setForm((prev) => ({ ...prev, leadId: value }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (editId) {
      updateContractMutation({ ...form, status: form.status as 'Pending' | 'Signed' | 'Cancelled' });
    } else {
      addContractMutation({ ...form, status: form.status as 'Pending' | 'Signed' | 'Cancelled' });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('deleteConfirm'))) {
      deleteContractMutation(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Signed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    console.log("contracts", contracts);
    if (contracts) {
      setFilteredContracts(contracts);
    }
    if (contracts && searchTerm) {
      setFilteredContracts(contracts.filter(contract =>
        contract.lead?.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.inventory?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.id?.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  }, [contracts, searchTerm]);


  // Role-based access control
  const canAccessContracts = user?.role === 'admin' || user?.role === 'sales_admin';

  if (!canAccessContracts) {
    const isArabic = i18n.language === 'ar';
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
        dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="bg-white rounded-2xl shadow-2xl px-8 py-12 max-w-md w-full flex flex-col items-center border border-blue-100">
          <Shield className="h-16 w-16 text-blue-400 mb-6" />
          <h2 className={`text-2xl font-bold text-gray-900 mb-2 text-center ${isArabic ? 'font-arabic' : ''}`}>
            {t('accessDenied', isArabic ? 'تم رفض الوصول' : 'Access Denied')}
          </h2>
          <p className={`text-gray-500 mb-6 text-center ${isArabic ? 'font-arabic leading-relaxed' : ''}`}>
            {t('noPermissionToManageContracts', isArabic
              ? 'ليس لديك إذن لعرض أو إدارة العقود. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.'
              : 'You do not have permission to view or manage contracts. Please contact your administrator if you believe this is a mistake.'
            )}
          </p>
          <div className="w-full border-t border-gray-200 pt-6 mt-6 text-center">
            <span className="text-sm text-gray-400">Propai CRM &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('description')}</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchContracts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
            <Plus className="h-5 w-5 mr-2" />
            {t('addNewContract')}
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.contractId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.leadName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.propertyProject')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.dealValue')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.contractDate')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.createdBy')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts?.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{contract.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{contract.lead?.nameEn}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{contract.inventory?.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{contract.dealValue}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{contract.contractDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                      {translateContractStatus(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.createdBy?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800 mr-3" onClick={() => openEditForm(contract)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(contract.id || '')}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Contract Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editId ? t('modal.editContract') : t('modal.addNewContract')}</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.lead')}</label>
                <select name="leadId" value={form.leadId} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">{t('form.selectLead')}</option>
                  {leads?.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.nameEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.propertyProject')}</label>
                <select name="inventoryId" value={form.inventory?.id} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">{t('form.selectProperty')}</option>
                  {properties?.map(property => (
                    <option key={property.id} value={property.id}>{property.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.dealValue')}</label>
                <input type="number" name="dealValue" value={form.dealValue} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.contractDate')}</label>
                <input type="date" name="contractDate" value={form.contractDate} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.status')}</label>
                <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="Pending">{t('statuses.pending')}</option>
                  <option value="Signed">{t('statuses.signed')}</option>
                  <option value="Cancelled">{t('statuses.cancelled')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.notes')}</label>
                <textarea name="notes" value={form.notes} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('actions.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editId ? isUpdatingContract ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('actions.update') : isAddingContract ? <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : t('actions.add')}  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {filteredContracts?.map((contract) => (
          <div key={contract.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{contract.id}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                {translateContractStatus(contract.status)}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm font-medium text-gray-700">{t('cardLabels.client')}: </span>
                <span className="text-sm text-gray-900">{contract.lead?.nameEn}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">{t('cardLabels.property')}: </span>
                <span className="text-sm text-gray-900">{contract.inventory?.title}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">{t('cardLabels.dealValue')}: </span>
                <span className="text-sm font-bold text-green-600">{contract.dealValue}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">{t('cardLabels.date')}: </span>
                <span className="text-sm text-gray-900">{contract.contractDate}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cardLabels.notes')}</h4>
              <p className="text-sm text-gray-600 line-clamp-3">{contract.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractsManagement;

