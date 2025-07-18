import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Building } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { toast } from 'react-toastify';
import { getDevelopers } from '../../queries/queries';
import { Developer } from '../../types';

const DevelopersTab: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('propai_user') || '{}');
  const [form, setForm] = useState({
    nameEn: '',
    nameAr: '',
    email: '',
    phone: '',
    projects: 0,
    established: '',
    location: '',
    image: '', // URL or base64
    createdBy: user?.name || 'System'
  });
  const queryClient = useQueryClient();
  const { data: developers, isLoading, isError } = useQuery<Developer[]>({
    queryKey: ['developers'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getDevelopers(),
  });
  const { mutateAsync: addDeveloperMutation, isPending: isAdding } = useMutation({
    mutationFn: (developerData: any) => addDeveloper(developerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      toast.success(t('developerAdded'));
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
      setShowForm(false);
    }
  });

  const { mutateAsync: updateDeveloperMutation, isPending: isUpdating } = useMutation({
    mutationFn: (developerData: any) => updateDeveloper(developerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      toast.success(t('developerUpdated'));
      setShowForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
      setShowForm(false);
    }
  });

  const { mutateAsync: deleteDeveloperMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteDeveloper(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developers'] });
      toast.success(t('developerDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
    }
  });

  // const getDevelopers = async () => {
  //   const response = await axiosInterceptor.get('/developers');
  //   return response.data.developers as Developer[];
  // }

  const addDeveloper = async (developerData: any) => {
    const response = await axiosInterceptor.post('/developers/create', developerData);
    return response.data as Developer;
  }

  const updateDeveloper = async (developerData: any) => {
    const response = await axiosInterceptor.patch(`/developers/${developerData.id}`, developerData);
    return response.data as Developer;
  }

  const deleteDeveloper = async (id: string) => {
    const response = await axiosInterceptor.delete(`/developers/${id}`);
    return response.data as Developer;
  }



  // const { developers, addDeveloper, updateDeveloper, deleteDeveloper } = useData();
  const { language } = useLanguage(); // Add language context
  const { t } = useTranslation('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filteredDevelopers, setFilteredDevelopers] = useState<Developer[]>([]);
  // Add image and bilingual name to form state

  // Helper function to get language-appropriate developer name
  const getDeveloperName = (developer: any) => {
    if (!developer) return '';
    if (language === 'ar' && developer.nameAr) {
      return developer.nameAr;
    }
    return developer.nameEn || developer.name;
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      nameEn: '',
      nameAr: '',
      email: '',
      phone: '',
      projects: 0,
      established: '',
      location: '',
      image: '',
      createdBy: user?.name || 'System'
    });
    setShowForm(true);
  };

  const openEditForm = (developer: any) => {
    setEditId(developer.id);
    setForm({
      ...developer,
      nameEn: developer.nameEn || '',
      nameAr: developer.nameAr || '',
      image: developer.logo || '', // Use logo for editing
      createdBy: developer.createdBy || user?.name || 'System'
    });
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'projects' ? Number(value) : value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
      };
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const developerData = {
      ...form,
      name: form.nameEn + (form.nameAr ? ' / ' + form.nameAr : ''),
      nameEn: form.nameEn,
      nameAr: form.nameAr,
      image: form.image,
      createdBy: user.name
    };
    if (editId) {
      updateDeveloperMutation(developerData as any);
    } else {
      addDeveloperMutation(developerData as any);
    }
    // setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('confirmDeleteDeveloper'))) {
      deleteDeveloperMutation(id);
    }
  };

  useEffect(() => {
    if (developers) {
      setFilteredDevelopers(developers.filter((developer: any) =>
        getDeveloperName(developer).toLowerCase().includes(searchTerm.toLowerCase()) ||
        developer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        developer.location.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  }, [developers, searchTerm]);

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'المطورين' : 'Developers'}
        </h2>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchDevelopers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {
          (user?.role === 'admin' || user?.role === 'sales_admin') && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
              <Plus className="h-5 w-5 mr-2" />
              {t('addDeveloper')}
            </button>
          )
        }
      </div>

      {/* Developers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {
          filteredDevelopers ? filteredDevelopers.map((developer: Developer) => (
            <div key={developer.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col items-center">
              <div className="flex flex-col items-center mb-4 w-full">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-blue-200">
                  {developer.logo ? (
                    <img
                      src={developer.logo}
                      alt={developer.nameEn}
                      className="object-cover w-full h-full"
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '';
                        target.style.display = 'none';
                        (target.nextSibling as HTMLElement)?.classList?.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Building className={`h-10 w-10 text-blue-600 ${developer.logo ? 'hidden' : ''}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  {getDeveloperName(developer)}
                </h3>
              </div>
              <div className="space-y-2 w-full">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{t('location')}:</span>
                  <span className="text-sm text-gray-900">{developer.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">{t('established')}:</span>
                  <span className="text-sm text-gray-900">{developer.established}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{t('activeProjects')}:</span>
                  <a
                    href="#"
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      // Custom event or navigation logic to go to Projects tab and filter by developer
                      const event = new CustomEvent('navigateToProjects', { detail: { developer: developer.nameEn } });
                      window.dispatchEvent(event);
                    }}
                  >
                    {developer.projects.length}
                  </a>
                </div>
              </div>
              <div className="flex space-x-2 mt-4 self-end">
                <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditForm(developer)}>
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(developer.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )) : isLoading ? <div className="spinner-border text-blue-600" role="status"></div> : <div className="w-full text-center text-gray-500">No developers found</div>}
      </div>

      {/* Add/Edit Developer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editId ? (language === 'ar' ? 'تعديل المطور' : 'Edit Developer') : (language === 'ar' ? 'إضافة المطور' : 'Add Developer')}
            </h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'اسم المطور (إنجليزي)' : 'Developer Name (English)'}
                </label>
                <input type="text" name="nameEn" value={form.nameEn} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'اسم المطور (عربي)' : 'Developer Name (Arabic)'}
                </label>
                <input type="text" name="nameAr" value={form.nameAr} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'صورة المطور' : 'Developer Image'}
                </label>
                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="block" />
                  {form.image && (
                    <img src={form.image} alt={language === 'ar' ? 'معاينة' : 'preview'} className="h-12 w-12 rounded-full object-cover border ml-2" />
                  )}
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'الموقع' : 'Location'}
                </label>
                <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'تاريخ التأسيس' : 'Established'}
                </label>
                <input type="text" name="established" value={form.established} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>

              <div className="col-span-2 flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors">
                  {isAdding ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></div> : editId ? (language === 'ar' ? 'تحديث المطور' : 'Update Developer') : (language === 'ar' ? 'إضافة المطور' : 'Add Developer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopersTab;