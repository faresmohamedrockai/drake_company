import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, MapPin, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { generatePaymentSchedule, Project } from './ProjectsTab';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Id, toast } from 'react-toastify';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { Zone } from './ZonesTab';
import { Developer } from '../../types';
import { Lead } from '../../types';
import { validatePhoneNumber, getPhoneErrorMessage } from '../../utils/phoneValidation';
import { PhoneNumber } from '../ui/PhoneNumber';

// Fix default marker icon for leaflet in React
if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}


// Add FormState type for form
type Property = {
  id?: string;
  title?: string;
  titleEn: string;
  titleAr: string;
  type: string;
  price: number;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  status: string;
  zoneId: string;
  projectId: string;
  developerId: string;
  typeOther?: string;
  amenitiesOther?: string;
  images: string[];
  parking?: string;
  paymentPlanIndex?: number; // For frontend use only
};

const PropertiesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastIsLoading, setToastIsLoading] = useState<Id | null>(null);
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProperties()
  });
  const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    // Defensive: always return an array
    return Array.isArray(response.data.properties) ? response.data.properties : [];
  }
  const addProperty = async (property: any) => {
    const response = await axiosInterceptor.post('/properties/create', property);
    return response.data.property as Property;
  }
  const { data: zones } = useQuery<Zone[]>({
    queryKey: ['zones'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getZones()
  });
  const getZones = async () => {
    const response = await axiosInterceptor.get('/zones');
    return response.data.zones as Zone[];
  }
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getProjects()
  });
  const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.data as Project[];
  }
  const updateProperty = async (property: Property) => {
    const response = await axiosInterceptor.patch(`/properties/${property.id}`, property);
    return response.data.property as Property;
  }
  const deleteProperty = async (id: string) => {
    const response = await axiosInterceptor.delete(`/properties/${id}`);
    return response.data.property as Property;
  }
  const { data: developers } = useQuery<Developer[]>({
    queryKey: ['developers'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getDevelopers()
  });
  const getDevelopers = async () => {
    const response = await axiosInterceptor.get('/developers');
    return response.data.developers as Developer[];
  }
  const { mutateAsync: addPropertyMutation, isPending: isAdding } = useMutation({
    mutationFn: (property: any) => addProperty(property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.update(toastIsLoading!, {
        render: "Property added successfully",
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setShowForm(false);
      setFormStep(0);
    },
    onError: (error: any) => {
      toast.update(toastIsLoading!, {
        render: error.response.data.message,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
      setFormStep(0);
      setShowForm(false);
    }
  });
  const { mutateAsync: updatePropertyMutation, isPending: isUpdating } = useMutation({
    mutationFn: (property: Property) => updateProperty(property),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.update(toastIsLoading!, {
        render: "Property updated successfully",
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      }); setShowForm(false);
      setFormStep(0);
    },
    onError: (error: any) => {
      toast.update(toastIsLoading!, {
        render: error.response.data.message,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      }); setFormStep(0);
      setShowForm(false);
    }
  });
  const { mutateAsync: deletePropertyMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.update(toastIsLoading!, {
        render: t('propertyDeleted'),
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    },
    onError: (error: any) => {
      toast.update(toastIsLoading!, {
        render: error.response.data.message,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  });
  const { data: leads } = useQuery<Lead[]>({
    queryKey: ['leads'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getLeads()
  });
  const getLeads = async () => {
    const response = await axiosInterceptor.get('/leads');
    return response.data.leads as Lead[];
  }
  const { user } = useAuth();
  const { settings } = useSettings(); // Add settings context
  const { language } = useLanguage(); // Add language context
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Property>({
    id: '',
    title: '',
    titleEn: '',
    titleAr: '',
    type: '',
    price: 0, // will be handled as number in input and calculations
    location: '',
    area: 0,
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
    status: 'Available',
    zoneId: '',
    projectId: '',
    developerId: '',
    typeOther: '',
    amenitiesOther: '',
    images: [],
    parking: '',
    paymentPlanIndex: undefined,
  });
  const [filterProject, setFilterProject] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterDeveloper, setFilterDeveloper] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPaymentPlan, setShowPaymentPlan] = useState<any>(null);
  const [showTypeOther, setShowTypeOther] = useState(false);
  const [showAmenitiesOther, setShowAmenitiesOther] = useState(false);
  const [zoneModal, setZoneModal] = useState<Zone | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStep, setReportStep] = useState<'input' | 'preview'>("input");
  const [reportPhone, setReportPhone] = useState('');
  const [reportPhoneError, setReportPhoneError] = useState('');
  const [reportLead, setReportLead] = useState<any>(null);
  const [reportProperty, setReportProperty] = useState<any>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [reportError, setReportError] = useState('');
  const userRolesAllowed = ['admin', 'sales_admin', 'team_leader', 'sales_rep'];
  const canGenerateReport = userRolesAllowed.includes(user?.role || '');
  const [formStep, setFormStep] = useState(0); // Stepper for add/edit form
  const { t } = useTranslation('inventory');
  const formSteps = [
    t('stepBasicInfo'),
    t('stepDetails'),
    t('stepLocation'),
    t('stepReview')
  ];
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [showImageModal, setShowImageModal] = useState<{ images: string[], title: string } | null>(null);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [priceError, setPriceError] = useState<string>('');

  useEffect(() => {
    if (isAdding || isUpdating || isDeleting) {
      setToastIsLoading(toast.loading("Loading..."))
    }

  }, [isDeleting, isAdding, isUpdating]);
  // Helper functions to get language-appropriate data
  const getPropertyName = (property: any) => {
    if (!property) return '';
    if (language === 'ar' && property.titleAr) {
      return property.titleAr;
    }
    return property.titleEn || property.title || '';
  };

  const getPropertyType = (type: string | undefined) => {
    if (!type) return '';
    if (language === 'ar') {
      const typeMap: { [key: string]: string } = {
        'Apartment': 'شقة',
        'Villa': 'فيلا',
        'Townhouse': 'تاون هاوس',
        'Commercial': 'تجاري',
        'Office': 'مكتب',
        'Shop': 'محل',
        'Land': 'أرض',
        'Other': 'أخرى'
      };
      return typeMap[type] || type;
    }
    return type;
  };

  const getAmenities = (amenities: string[]) => {
    if (language === 'ar') {
      const amenitiesMap: { [key: string]: string } = {
        'Elevator': 'مصعد',
        'Security': 'أمن',
        'Garden': 'حديقة',
        'Pool': 'مسبح',
        'Parking': 'موقف سيارات',
        'Other': 'أخرى'
      };
      return amenities.map(amenity => amenitiesMap[amenity] || amenity);
    }
    return amenities;
  };

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return '';
    const project = projects?.find(p => p.id === projectId);
    if (!project) return '';

    if (language === 'ar' && project.nameAr) {
      return project.nameAr;
    }
    return project.nameEn || project.nameEn;
  };

  const getStatusText = (status: string | undefined) => {
    if (!status) return '';
    if (language === 'ar') {
      const statusMap: { [key: string]: string } = {
        'Available': 'متاح',
        'Rented': 'مؤجر',
        'Sold': 'مباع'
      };
      return statusMap[status] || status;
    }
    return status;
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({
      id: '',
      title: '',
      titleEn: '',
      titleAr: '',
      type: '',
      price: 0, // will be handled as number in input and calculations
      location: '',
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      amenities: [],
      status: 'Available',
      zoneId: '',
      projectId: '',
      developerId: '',
      typeOther: '',
      amenitiesOther: '',
      images: [],
      parking: '',
      paymentPlanIndex: undefined,
    });
    setShowForm(true);
    setFormStep(0); // Reset step to 0 for new form
  };

  const openEditForm = (property: any) => {
    setEditId(property.id);
    setForm({
      ...property,
      titleEn: property.titleEn || '',
      titleAr: property.titleAr || '',
      zoneId: property.zoneId || '',
      projectId: property.projectId || '',
      developerId: property.developerId || '',
      typeOther: '',
      amenitiesOther: '',
      images: property.images && property.images.length ? property.images : [],
      paymentPlanIndex: property.paymentPlanIndex,
    });
    setShowForm(true);
    setFormStep(0); // Reset step to 0 for edit form
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'price') {
      const numValue = Number(value);
      if (numValue < 0) {
        setPriceError(language === 'ar' ? 'لا يمكن أن يكون السعر سالبًا' : 'Price cannot be negative');
        setForm(prev => ({ ...prev, price: 0 }));
        return;
      } else {
        setPriceError('');
      }
    }
    if (name === 'projectId') {
      // Find the selected project and set developerId accordingly
      const selectedProject = projects?.find(p => p.id === value);
      let paymentPlanIndex: number | undefined = undefined;
      if (selectedProject && Array.isArray(selectedProject.paymentPlans) && selectedProject.paymentPlans.length > 0) {
        paymentPlanIndex = 0;
      }

      // Handle zone selection based on project
      let zoneId = '';
      if (selectedProject?.zoneId) {
        zoneId = selectedProject.zoneId;
      }

      setForm((prev) => ({
        ...prev,
        [name]: value,
        developerId: selectedProject?.developerId || '',
        zoneId: zoneId, // Auto-set zone if project has one
        typeOther: '', // Clear other type
        amenitiesOther: '', // Clear other amenities
        paymentPlanIndex: paymentPlanIndex,
      }));
      setShowPaymentPlan(selectedProject?.paymentPlans || null);
    } else if (name === 'paymentPlanIndex') {
      setForm((prev) => ({ ...prev, paymentPlanIndex: Number(value) }));
    } else if (name === 'type') {
      setShowTypeOther(value === 'Other');
      setForm((prev) => ({ ...prev, [name]: value }));
    } else if (name === 'amenities') {
      // No-op: handled by checkboxes
      return;
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle image upload (multiple images, data URLs)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setForm(prev => ({ ...prev, images: [...prev.images, ...images] }));
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.price < 0) {
      setPriceError(language === 'ar' ? 'لا يمكن أن يكون السعر سالبًا' : 'Price cannot be negative');
      return;
    } else {
      setPriceError('');
    }
    // Helper function to check if a string is a valid UUID
    const isValidUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Prepare data to match backend DTO
    const propertyData = {
      ...(editId && { id: editId }), // Include id when updating
      title: form.titleEn + (form.titleAr ? ' / ' + form.titleAr : ''), // Combine names for display
      titleEn: form.titleEn,
      titleAr: form.titleAr,
      type: showTypeOther ? form.typeOther : form.type,
      price: form.price ? Number(form.price) : 0,
      location: form.location,
      area: form.area ? Number(form.area) : 0,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : 0,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : 0,
      amenities: showAmenitiesOther
        ? [...form.amenities.filter((a: string) => a !== 'Other'), form.amenitiesOther].filter(Boolean)
        : form.amenities,
      images: form.images && form.images.length ? form.images : [],
      typeOther: form.typeOther,
      amenitiesOther: form.amenitiesOther,
      status: form.status,
      zoneId: form.zoneId,
      projectId: form.projectId,
      developerId: form.developerId,
      parking: form.parking,
      // Include paymentPlanIndex so we know which payment plan was selected for this property
      ...(form.paymentPlanIndex !== undefined && { paymentPlanIndex: form.paymentPlanIndex }),
    };
    if (editId) {
      updatePropertyMutation(propertyData as unknown as Property);
    } else {
      addPropertyMutation(propertyData as unknown as Property);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      deletePropertyMutation(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Rented': return 'bg-yellow-100 text-yellow-800';
      case 'Sold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    // console.log("properties", properties);
    const filteredProperties = properties?.filter(property =>
      (getPropertyName(property).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPropertyType(property.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAmenities(property.amenities || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProjectName(property.projectId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getStatusText(property.status).toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterProject ? property.projectId === filterProject : true) &&
      (filterZone ? property.zoneId === filterZone : true) &&
      (filterDeveloper ? property.developerId === filterDeveloper : true) &&
      (filterStatus ? property.status === filterStatus : true)
    );
    setFilteredProperties(filteredProperties || []);
  }, [properties, searchTerm, filterProject, filterZone, filterDeveloper, filterStatus]);

  function handleOpenReport(property: any) {
    setReportProperty(property);
    setShowReportModal(true);
    setReportStep('input');
    setReportPhone('');
    setReportLead(null);
    setReportNotes('');
    setReportError('');
  }

  function handleReportPhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReportError('');
    setReportPhoneError('');

    // Phone validation
    if (!validatePhoneNumber(reportPhone)) {
      setReportPhoneError(getPhoneErrorMessage(reportPhone, language));
      return;
    }

    // Access control: Team Leader can only for their team, Sales Rep only for their own
    let found = leads?.find(l => l.contact === reportPhone);

    if (!found) {
      setReportError('No client found with this number. Please check and try again.');
      return;
    }
    if (user?.role === 'sales_rep' && found.assignedToId !== user.id) {
      setReportError('You do not have permission to generate a report for this client.');
      return;
    }
    setReportLead(found);
    setReportStep('preview');
    // KPI: increment report count
    const today = new Date().toISOString().slice(0, 10);
    const kpiKey = `report_kpi_${user?.id || 'unknown'}_${today}`;
    localStorage.setItem(kpiKey, String(Number(localStorage.getItem(kpiKey) || 0) + 1));
  }

  async function handleDownloadPDF() {
    const element = document.getElementById('report-preview');
    if (element) {
      // Add a style block to hide .no-pdf for PDF export
      let style = document.createElement('style');
      style.innerHTML = '.no-pdf { display: none !important; }';
      element.prepend(style);
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().from(element).save(`${reportProperty?.title}-${language === 'ar' && reportLead?.nameAr ? reportLead.nameAr : (reportLead?.nameEn || 'Unknown')}-Report.pdf`);
      style.remove();
    }
  }

  function handlePrint() {
    window.print();
  }

  // Helper to get selected project's payment plans
  const selectedProject = projects?.find(p => p.id === form.projectId);
  const paymentPlans = selectedProject?.paymentPlans || [];

  // Helper function to get developer name properly
  const getDeveloperName = (project: any, language: string) => {
    // First try to get from developers array
    const developerFromArray = developers?.find(d => d.id === project?.developerId);
    if (developerFromArray) {
      return language === 'ar' && developerFromArray.nameAr ? developerFromArray.nameAr : developerFromArray.nameEn || developerFromArray.name;
    }

    // Then try to get from nested developer object
    if (project?.developer && typeof project.developer === 'object') {
      return language === 'ar' && project.developer.nameAr ? project.developer.nameAr : project.developer.nameEn || project.developer.name;
    }

    // Finally, try to get from developer string field
    if (project?.developer && typeof project.developer === 'string') {
      return project.developer;
    }

    return '-';
  };

  // Helper function to get project name from project object
  const getProjectDisplayName = (project: any, language: string) => {
    if (!project) return '-';

    if (typeof project === 'object') {
      return language === 'ar' && project.nameAr ? project.nameAr : project.nameEn || project.name || '-';
    }

    if (typeof project === 'string') {
      return project;
    }

    return '-';
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'العقارات' : 'Properties'}
        </h2>
      </div>

      {/* Search and Actions + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'البحث في العقارات...' : 'Search properties...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">{language === 'ar' ? 'جميع المشاريع' : 'All Projects'}</option>
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {language === 'ar' && project.nameAr ? project.nameAr : (project.nameEn || project.nameEn)}
              </option>
            ))}
          </select>
          <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">{language === 'ar' ? 'جميع المناطق' : 'All Zones'}</option>
            {zones?.map(zone => (
              <option key={zone.id} value={zone.id}>
                {language === 'ar' && zone.nameAr ? zone.nameAr : (zone.nameEn || zone.nameEn)}
              </option>
            ))}
          </select>
          <select value={filterDeveloper} onChange={e => setFilterDeveloper(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">{language === 'ar' ? 'جميع المطورين' : 'All Developers'}</option>
            {developers?.map(dev => (
              <option key={dev.id} value={dev.id}>
                {language === 'ar' && dev.nameAr ? dev.nameAr : (dev.nameEn || dev.nameEn)}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="Available">{getStatusText('Available')}</option>
            <option value="Rented">{getStatusText('Rented')}</option>
            <option value="Sold">{getStatusText('Sold')}</option>
          </select>
        </div>
        <div className="flex flex-row gap-2 items-center">
          {user?.role !== 'sales_rep' && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
              <Plus className="h-5 w-5 mr-2" />
              {t('addProperty')}
            </button>
          )}
        </div>
      </div>

      {/* Properties Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">{t('propertyName')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('propertyType')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('propertyPrice')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('propertyLocation')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">{t('area')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">{t('bedrooms')}/{t('bathrooms')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('amenities')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">{t('zone')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('project')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">{t('status')}</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {
              isLoadingProperties ? (
                <tr>
                  <td colSpan={10} className="px-2 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProperties && filteredProperties.length > 0 ? (
                  filteredProperties?.map((property) => {
                    const zone = zones?.find(z => z.id === property.zoneId);
                    return (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-2 py-4">
                          <button
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer truncate block w-full text-left text-xs"
                            title={getPropertyName(property)}
                            onClick={() => {
                              const propertyImages = (property as any).images || [];
                              const projectImages = (projects?.find(p => p.id === property.projectId) as any)?.images || [];
                              const allImages = [...propertyImages, ...projectImages];
                              if (allImages.length > 0) {
                                setShowImageModal({ images: allImages, title: getPropertyName(property) });
                              }
                            }}
                          >
                            {getPropertyName(property)}
                          </button>
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={getPropertyType(property.type)}>
                            {getPropertyType(property.type)}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={`${Math.round(Number(property.price)).toLocaleString()} EGP`}>
                            {Math.round(Number(property.price)).toLocaleString()} EGP
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={property.location}>
                            {property.location}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={property.area.toString()}>
                            {property.area.toString()}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={`${property.bedrooms} / ${property.bathrooms}`}>
                            {property.bedrooms} / {property.bathrooms}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={getAmenities(property.amenities || []).join(', ')}>
                            {getAmenities(property.amenities || []).join(', ')}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          {zone ? (
                            <button
                              className="text-xs text-blue-600 underline cursor-pointer truncate block w-full text-left flex items-center"
                              title={zone.nameEn}
                              onClick={() => setZoneModal(zone as Zone)}
                            >
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{zone.nameEn}</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-4">
                          <span className="text-xs text-gray-900 truncate block" title={getProjectName(property.projectId)}>
                            {getProjectName(property.projectId)}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(property.status)} truncate max-w-full`} title={getStatusText(property.status)}>
                            {getStatusText(property.status)}
                          </span>
                        </td>
                        <td className="px-2 py-4">
                          <div className="flex space-x-1">
                            {user?.role !== 'sales_rep' && (
                              <>
                                <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditForm(property)} title={t('editProperty')}>
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(property.id!)} title={t('deleteProperty')}>
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            {canGenerateReport && (
                              <button className="text-green-600 hover:text-green-800" title={t('generateClientReport')} onClick={() => handleOpenReport(property)}>
                                <FileText className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-2 py-4 text-center text-gray-500">
                      {t('noPropertiesFound')}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Property Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-3xl mx-2 sm:mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{editId ? t('editProperty') : t('addProperty')}</h3>
            {/* Stepper */}
            <div className="flex items-center justify-center mb-6">
              {formSteps.map((label, idx) => (
                <div key={label} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setFormStep(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${formStep === idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                    aria-current={formStep === idx ? 'step' : undefined}
                  >
                    {idx + 1}
                  </button>
                  {idx < formSteps.length - 1 && <div className="w-8 h-1 bg-gray-300 mx-1 rounded" />}
                </div>
              ))}
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Step 1: Basic Info */}
              {formStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyNameEn')}</label>
                    <input type="text" name="titleEn" value={form.titleEn} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyNameAr')}</label>
                    <input type="text" name="titleAr" value={form.titleAr} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyType')}</label>
                    <select name="type" value={form.type} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required>
                      <option value="">{t('selectType')}</option>
                      <option value="Apartment">{getPropertyType('Apartment')}</option>
                      <option value="Villa">{getPropertyType('Villa')}</option>
                      <option value="Townhouse">{getPropertyType('Townhouse')}</option>
                      <option value="Commercial">{getPropertyType('Commercial')}</option>
                      <option value="Other">{getPropertyType('Other')}</option>
                    </select>
                    {showTypeOther && (
                      <input type="text" name="typeOther" placeholder={t('specifyOtherType')} value={form.typeOther || ''} onChange={e => setForm(prev => ({ ...prev, typeOther: e.target.value }))} className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyPrice')}</label>
                    <input type="number" name="price" value={form.price} onChange={handleFormChange} min="0" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required placeholder={language === 'ar' ? 'أدخل السعر' : 'Enter price'} />
                    {priceError && <div className="text-red-600 text-xs mt-1">{priceError}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyLocation')}</label>
                    <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required placeholder={language === 'ar' ? 'أدخل الموقع' : 'Enter location'} />
                  </div>
                  {/* Image upload (multiple images) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyImages')}</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-base"
                    />
                    {form.images && form.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} alt="Preview" className="h-24 w-32 object-cover rounded border" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                              title={t('removeImage')}
                              onClick={() => setForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx)
                              }))}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Step 2: Details */}
              {formStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('area')}</label>
                    <input type="text" name="area" value={form.area} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required placeholder={language === 'ar' ? 'أدخل المساحة' : 'Enter area'} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('parking') || 'Parking'}</label>
                    <input type="text" name="parking" value={form.parking || ''} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" placeholder={language === 'ar' ? 'تفاصيل موقف السيارات' : 'Parking details'} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('bedrooms')}</label>
                      <input type="text" name="bedrooms" value={form.bedrooms} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required placeholder={language === 'ar' ? 'عدد الغرف' : 'Number of bedrooms'} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('bathrooms')}</label>
                      <input type="text" name="bathrooms" value={form.bathrooms} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required placeholder={language === 'ar' ? 'عدد الحمامات' : 'Number of bathrooms'} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('amenities')}</label>
                    <div className="flex flex-wrap gap-3">
                      {['Elevator', 'Security', 'Garden', 'Pool', 'Parking', 'Other'].map(option => (
                        <label key={option} className="inline-flex items-center text-sm font-normal">
                          <input
                            type="checkbox"
                            name="amenities"
                            value={option}
                            checked={form.amenities.includes(option)}
                            onChange={e => {
                              const checked = e.target.checked;
                              setForm(prev => {
                                let newAmenities: string[] = prev.amenities.filter((a) => a !== option);
                                if (checked) newAmenities = [...prev.amenities, option];
                                return { ...prev, amenities: newAmenities };
                              });
                              if (option === 'Other') setShowAmenitiesOther(e.target.checked);
                            }}
                            className="mr-2"
                          />
                          <span className="ml-2">{getAmenities([option])[0]}</span>
                        </label>
                      ))}
                      {showAmenitiesOther && (
                        <input type="text" name="amenitiesOther" placeholder={t('specifyOtherAmenity')} value={form.amenitiesOther || ''} onChange={e => setForm(prev => ({ ...prev, amenitiesOther: e.target.value }))} className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" />
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Step 3: Location/Links */}
              {formStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('project')}</label>
                    <select name="projectId" value={form.projectId} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base">
                      <option value="">{t('selectProject')}</option>
                      {projects?.map(project => (
                        <option key={project.id} value={project.id}>
                          {language === 'ar' && project.nameAr ? project.nameAr : (project.nameEn || project.nameEn)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Developer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('developer')}</label>
                    <select name="developerId" value={form.developerId} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base">
                      <option value="">{t('selectDeveloper')}</option>
                      {developers?.map(dev => (
                        <option key={dev.id} value={dev.id}>{dev.nameEn}</option>
                      ))}
                    </select>
                  </div>
                  {/* Zone */}
                  {(() => {
                    const selectedProject = projects?.find(p => p.id === form.projectId);
                    const projectHasZone = selectedProject?.zoneId;

                    // If project has a zone, show it as read-only
                    if (projectHasZone) {
                      const zone = zones?.find(z => z.id === projectHasZone);
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('zoneFromProject')}</label>
                          <input
                            type="text"
                            value={zone?.nameEn || t('unknownZone')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-base cursor-not-allowed"
                            readOnly
                          />
                        </div>
                      );
                    }

                    // If project doesn't have a zone, show zone selection
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('zone')}</label>
                        <select name="zoneId" value={form.zoneId} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base">
                          <option value="">{t('selectZone')}</option>
                          {zones?.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.nameEn}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  {/* Status (last) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                    <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-base" required>
                      <option value="Available">{getStatusText('Available')}</option>
                      <option value="Rented">{getStatusText('Rented')}</option>
                      <option value="Sold">{getStatusText('Sold')}</option>
                    </select>
                  </div>
                  {/* Payment Plan Selector (now always show cards, no select or popup) */}
                  {selectedProject && paymentPlans.length > 0 && (
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectPaymentPlan')}</label>
                      {/* Responsive slider/grid for payment plans */}
                      <div className="flex md:grid md:grid-cols-2 gap-6 overflow-x-auto md:overflow-x-visible pb-2 snap-x snap-mandatory px-4 md:px-0">
                        {paymentPlans.map((plan, idx) => {
                          const isSelected = form.paymentPlanIndex === idx;
                          return (
                            <div
                              key={idx}
                              className={`min-w-[60vw] max-w-[70vw] md:min-w-0 md:max-w-none snap-center cursor-pointer transition-all duration-200 rounded-xl border-2 shadow-md p-2 bg-gradient-to-br from-blue-100 via-white to-pink-100 hover:from-blue-200 hover:to-pink-200 hover:shadow-xl relative group ${isSelected ? 'border-blue-600 ring-2 ring-blue-300 scale-105' : 'border-gray-200'}`}
                              style={{ flex: '0 0 60vw' }}
                              onClick={() => setForm(prev => ({ ...prev, paymentPlanIndex: idx }))}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'} shadow-md`}>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                                </span>
                                <span className="font-semibold text-blue-800 text-base">{t('plan')} {idx + 1}</span>
                                {plan.schedule && <span className="ml-2 text-[10px] bg-pink-200 text-pink-800 px-1.5 py-0.5 rounded-full">{plan.schedule}</span>}
                                {isSelected && <span className="ml-auto text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full shadow">{t('selected')}</span>}
                              </div>
                              <div className="text-xs text-gray-800 space-y-0.5">
                                <div className="flex items-center gap-2"><span className="font-medium">{t('downPayment')}:</span> <span className="text-blue-700 font-bold">{plan.downpayment}%</span></div>
                                <div className="flex items-center gap-2"><span className="font-medium">{t('installments')}:</span> <span className="text-green-700 font-bold">{100 - (plan.downpayment || 0) - (plan.delivery || 0)}%</span></div>
                                <div className="flex items-center gap-2"><span className="font-medium">{t('delivery')}:</span> <span className="text-orange-700 font-bold">{plan.delivery}%</span></div>
                                <div className="flex items-center gap-2"><span className="font-medium">{t('yearsToPay')}:</span> <span className="text-purple-700 font-bold">{plan.yearsToPay}</span></div>
                                <div className="flex items-center gap-2"><span className="font-medium">{t('installmentPeriod')}:</span> <span className="text-pink-700 font-bold">{plan.installmentPeriod}{plan.installmentPeriod === 'custom' && plan.installmentMonthsCount ? ` (${plan.installmentMonthsCount} {t('months')})` : ''}</span></div>
                                <div className="flex items-center gap-2"><span className="font-medium">{t('firstInstallmentDate')}:</span> <span className="text-gray-700 font-bold">{plan.firstInstallmentDate}</span></div>
                                <div className="flex items-center gap-2"><span className="font-medium">{t('deliveryDate')}:</span> <span className="text-gray-700 font-bold">{plan.deliveryDate}</span></div>
                                {plan.schedule && <div className="flex items-center gap-2"><span className="font-medium">{t('scheduleDescription')}:</span> <span className="text-blue-700 font-bold">{plan.schedule}</span></div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Step 4: Review */}
              {formStep === 3 && (
                <div className="space-y-2 text-sm max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-1 sm:px-2">
                  <div><span className="font-semibold">{t('propertyNameEn')}:</span> {form.titleEn}</div>
                  <div><span className="font-semibold">{t('propertyNameAr')}:</span> {form.titleAr}</div>
                  <div><span className="font-semibold">{t('type')}:</span> {showTypeOther ? form.typeOther : getPropertyType(form.type)}</div>
                  <div><span className="font-semibold">{t('price')}:</span> {form.price}</div>
                  <div><span className="font-semibold">{t('location')}:</span> {form.location}</div>
                  <div><span className="font-semibold">{t('area')}:</span> {form.area}</div>
                  <div><span className="font-semibold">{t('bedrooms')}:</span> {form.bedrooms}</div>
                  <div><span className="font-semibold">{t('bathrooms')}:</span> {form.bathrooms}</div>
                  <div><span className="font-semibold">{t('parking') || 'Parking'}:</span> {form.parking || '-'}</div>
                  <div><span className="font-semibold">{t('amenities')}:</span> {showAmenitiesOther ? [...form.amenities.filter(a => a !== 'Other'), form.amenitiesOther].filter(Boolean).join(', ') : getAmenities(form.amenities).join(', ')}</div>
                  <div><span className="font-semibold">{t('zone')}:</span> {zones?.find(z => z.id === form.zoneId)?.nameEn || ''}</div>
                  <div><span className="font-semibold">{t('project')}:</span> {getProjectName(form.projectId)}</div>
                  <div><span className="font-semibold">{t('developer')}:</span> {developers?.find(d => d.id === form.developerId)?.nameEn || ''}</div>
                  <div><span className="font-semibold">{t('status')}:</span> {getStatusText(form.status)}</div>
                  {/* Payment Plan Review (always show if project selected) */}
                  {(() => {
                    // Get the project and payment plan data
                    const selectedProject = projects?.find(p => p.id === form.projectId);
                    if (!selectedProject || !Array.isArray(selectedProject.paymentPlans) || selectedProject.paymentPlans.length === 0) {
                      return null;
                    }
                    
                    const planIndex = form.paymentPlanIndex !== undefined ? form.paymentPlanIndex : 0;
                    const plan = selectedProject.paymentPlans[planIndex];

                    if (!plan) {
                      return null;
                    }

                          const price = Number(form.price || 0);
                    
                    // Create a safe payment plan with extensive date validation
                    const createSafeDate = (dateStr: string | undefined | null | object, defaultDate: string) => {
                      if (!dateStr || typeof dateStr === 'object') return defaultDate;
                      const parsed = Date.parse(dateStr);
                      if (isNaN(parsed)) return defaultDate;
                      const dateObj = new Date(dateStr);
                      if (dateObj.toString() === 'Invalid Date') return defaultDate;
                      return dateStr;
                    };

                    const safePlan = {
                      ...plan,
                      firstInstallmentDate: createSafeDate(plan.firstInstallmentDate, "2024-12-01"),
                      deliveryDate: createSafeDate(plan.deliveryDate, "2026-12-01"),
                      downpayment: Number(plan.downpayment) || 0,
                      delivery: Number(plan.delivery) || 0,
                      yearsToPay: Number(plan.yearsToPay) || 1,
                      installmentMonthsCount: Number(plan.installmentMonthsCount) || 1
                    };
                    
                    // Generate schedule with safe plan and comprehensive error handling
                    let schedule: any[] = [];
                    try {
                      // Additional validation before calling generatePaymentSchedule
                      if (safePlan.firstInstallmentDate && safePlan.deliveryDate && safePlan.yearsToPay > 0 && price > 0) {
                        schedule = generatePaymentSchedule(price, safePlan);
                      }
                    } catch (error) {
                      console.error('Error generating payment schedule for report:', error);
                      // Return early with error message instead of continuing
                      return (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'} {getProjectDisplayName(selectedProject, language)}
                          </h3>
                          <p className="text-yellow-800 text-sm">
                            {language === 'ar' ? 'لا يمكن عرض جدول المدفوعات - بيانات غير صحيحة' : 'Cannot display payment schedule - invalid data'}
                          </p>
                        </div>
                      );
                    }
                    
                    if (schedule.length === 0) {
                      return (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'} {getProjectDisplayName(selectedProject, language)}
                          </h3>
                          <p className="text-yellow-800 text-sm">
                            {language === 'ar' ? 'لا توجد بيانات متاحة لجدول المدفوعات' : 'No payment schedule data available'}
                          </p>
                        </div>
                      );
                    }
                    
                          return (
                            <div className="mt-4">
                              <div className="font-semibold mb-1">{t('selectedPaymentPlan')}:</div>
                        <div className="mb-2 text-xs text-gray-700">
                          {plan.schedule ? plan.schedule : `${t('plan')} ${planIndex + 1}`}
                          {(!plan.firstInstallmentDate || !plan.deliveryDate) && (
                            <span className="ml-2 text-orange-600">({language === 'ar' ? 'تواريخ افتراضية' : 'Default dates used'})</span>
                          )}
                        </div>
                        {schedule.length > 0 ? (
                              <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-blue-600 text-white">
                                      <th className="border px-2 py-1 font-bold">{t('payment')}</th>
                                      <th className="border px-2 py-1 font-bold">{t('date')}</th>
                                      <th className="border px-2 py-1 font-bold">{t('amount')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {schedule.map((item: any, idx: number) => (
                                      <tr key={idx} className={
                                        item.label && item.label.toLowerCase().includes('down payment')
                                          ? 'bg-blue-50 font-semibold'
                                          : item.label && item.label.toLowerCase().includes('delivery')
                                            ? 'bg-orange-50 font-semibold'
                                            : idx % 2 === 0
                                              ? 'bg-gray-50'
                                              : 'bg-white'
                                      }>
                                        <td className={`border px-2 py-1 ${item.label && item.label.toLowerCase().includes('down payment') ? 'text-blue-700' : item.label && item.label.toLowerCase().includes('delivery') ? 'text-orange-700' : ''}`}>{item.label}</td>
                                        <td className="border px-2 py-1">
                                          {item.label && item.label.toLowerCase().includes('down payment') && item.dueDate ?
                                            new Date(item.dueDate).toISOString().slice(0, 10) :
                                            item.dueDate
                                          }
                                        </td>
                                        <td className={`border px-2 py-1 ${item.label && item.label.toLowerCase().includes('down payment') ? 'text-blue-700' : item.label && item.label.toLowerCase().includes('delivery') ? 'text-orange-700' : ''}`}>{Math.round(item.amount).toLocaleString()} EGP</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            {language === 'ar' ? 'لا يمكن عرض جدول المدفوعات - يرجى التحقق من بيانات خطة الدفع' : 'Cannot display payment schedule - please check payment plan data'}
                          </div>
                        )}
                            </div>
                          );
                  })()}
                </div>
              )}
              {/* Stepper Navigation */}
              <div className="flex justify-between items-center pt-4 gap-2 flex-col sm:flex-row">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors w-full sm:w-auto mb-2 sm:mb-0">{t('cancel')}</button>
                <div className="flex gap-2 w-full sm:w-auto">
                  {formStep > 0 && (
                    <button type="button" onClick={() => setFormStep(s => s - 1)} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 w-full sm:w-auto">{t('back')}</button>
                  )}
                  {formStep < formSteps.length - 1 && (
                    <button type="button" onClick={() => setFormStep(s => s + 1)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto">{t('next')}</button>
                  )}
                  {formStep === formSteps.length - 1 && (
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors w-full sm:w-auto">{editId ? isUpdating ? <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> {t('updatingProperty')}</div> : t('updateProperty') : isAdding ? <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div></div> : isLoadingProperties ? <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div></div> : t('addProperty')}</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {zoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={() => setZoneModal(null)}>&times;</button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('zone')}: {zoneModal.nameEn}</h3>
            <div className="mb-2 text-gray-700">{t('latitude')}: <span className="font-mono">{zoneModal.latitude}</span></div>
            <div className="mb-4 text-gray-700">{t('longitude')}: <span className="font-mono">{zoneModal.longitude}</span></div>
            {/* Real map using react-leaflet */}
            {zoneModal.latitude && zoneModal.longitude ? (
              <MapContainer
                center={[zoneModal.latitude, zoneModal.longitude]}
                zoom={13}
                scrollWheelZoom={false}
                style={{ width: '100%', height: '200px', borderRadius: '12px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker position={[zoneModal.latitude, zoneModal.longitude]}>
                  <Popup>
                    {zoneModal.nameEn}<br />({zoneModal.latitude}, {zoneModal.longitude})
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-500">{t('noGeoLocationAvailable')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative print:max-h-full print:overflow-visible">
            {/* Exit Button (styled, but not fixed) */}
            <button
              className="absolute top-2 right-2 z-50 text-white bg-red-500 hover:bg-red-700 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-3xl font-bold transition-all duration-200 border-4 border-white focus:outline-none focus:ring-2 focus:ring-red-400 print:hidden"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
              onClick={() => setShowReportModal(false)}
              aria-label={t('closeReport')}
            >
              &times;
            </button>
            {reportStep === 'input' && (
              <form onSubmit={handleReportPhoneSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language === 'ar' ? 'إنشاء تقرير العميل' : 'Generate Client Report'}
                </h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'أدخل رقم هاتف العميل' : 'Enter Client Phone Number'}
                </label>
                <input
                  type="tel"
                  value={reportPhone}
                  onChange={e => {
                    setReportPhone(e.target.value);
                    setReportPhoneError(''); // Clear error when user types
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${reportPhoneError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  required
                  placeholder={language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                />
                {reportPhoneError && <div className="text-red-600 text-sm">{reportPhoneError}</div>}
                {reportError && <div className="text-red-600 text-sm">{reportError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </form>
            )}
            {reportStep === 'preview' && reportLead && (
              <div id="report-preview" className="bg-white p-4 print:p-0 print:bg-white print:shadow-none" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                {/* Header */}
                <div className="flex items-center mb-4 border-b pb-2 justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{settings?.companyName || t('propaiRealEstate')}</h2>
                    <div className="text-xs text-gray-500">
                      {settings?.companyWebsite || t('companyWebsite') + ' | ' + (settings?.companyEmail || t('companyEmail'))}
                    </div>
                    {settings?.companyAddress && (
                      <div className="text-xs text-gray-500 mt-1">{settings.companyAddress}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={settings?.companyImage || "/src/RockaidevLogo.jpg"}
                      alt={t('companyLogo')}
                      className="h-12 w-12 rounded-lg ml-2"
                      style={{ borderRadius: '12px' }}
                      onError={e => {
                        e.currentTarget.src = "/src/RockaidevLogo.jpg";
                      }}
                    />
                  </div>
                </div>
                {/* Client Info */}
                {/* {reportLead && (
                  <>
                    {(reportLead.nameEn || reportLead.nameAr || reportLead.contact || reportLead.budget || reportLead.status || reportLead.assignedToId) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {language === 'ar' ? 'معلومات العميل' : 'Client Information'}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {(reportLead.nameEn || reportLead.nameAr) && <div><span className="font-medium">{t('name')}:</span> {language === 'ar' && reportLead.nameAr ? reportLead.nameAr : (reportLead.nameEn || '')}</div>}
                          {reportLead.contact && <div><span className="font-medium">{t('phone')}:</span> <PhoneNumber phone={reportLead.contact} className="inline" /></div>}
                          {reportLead.budget && <div><span className="font-medium">{t('budget')}:</span> {reportLead.budget}</div>}
                          {reportLead.status && <div><span className="font-medium">{t('status')}:</span> {reportLead.status}</div>}
                          {reportLead.assignedToId && <div><span className="font-medium">{t('assignedRep')}:</span> {reportLead.assignedToId}</div>}
                        </div>
                      </div>
                    )}
                  </>
                )} */}
                {/* Property Info */}
                {reportProperty && (
                  <>
                    {(reportProperty.title || reportProperty.type || reportProperty.price || reportProperty.area || reportProperty.location || reportProperty.bedrooms || reportProperty.bathrooms || reportProperty.amenities || reportProperty.project) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {language === 'ar' ? 'معلومات العقار' : 'Property Information'}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {reportProperty.title && <div><span className="font-medium">{t('title')}:</span> {reportProperty.title}</div>}
                          {reportProperty.type && <div><span className="font-medium">{t('type')}:</span> {reportProperty.type}</div>}
                          {reportProperty.price && <div><span className="font-medium">{t('price')}:</span> {Math.round(Number(reportProperty.price)).toLocaleString()} EGP</div>}
                          {reportProperty.area && <div><span className="font-medium">{t('area')}:</span> {reportProperty.area}</div>}
                          {reportProperty.location && <div><span className="font-medium">{t('location')}:</span> {reportProperty.location}</div>}
                          {reportProperty.bedrooms && <div><span className="font-medium">{t('bedrooms')}:</span> {reportProperty.bedrooms}</div>}
                          {reportProperty.bathrooms && <div><span className="font-medium">{t('bathrooms')}:</span> {reportProperty.bathrooms}</div>}
                          {reportProperty.amenities && <div><span className="font-medium">{t('amenities')}:</span> {Array.isArray(reportProperty.amenities) ? reportProperty.amenities.join(', ') : reportProperty.amenities}</div>}
                          {reportProperty.project && <div><span className="font-medium">{t('project')}:</span> {getProjectDisplayName(reportProperty.project, language)}</div>}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* Payment Plan Table - Full Installments */}
                {(() => {
                  // Find the linked project and its selected payment plan
                  // First try to use nested project object from property, then fallback to projects array
                  const project = reportProperty?.project && typeof reportProperty.project === 'object'
                    ? reportProperty.project
                    : projects?.find(p => p.id === reportProperty?.projectId);
                  
                  if (!project || !Array.isArray(project.paymentPlans) || project.paymentPlans.length === 0) {
                    return null;
                  }
                  
                  const idx = typeof reportProperty?.paymentPlanIndex === 'number' ? reportProperty.paymentPlanIndex : 0;
                  const plan = project.paymentPlans[idx];
                  const price = Number(reportProperty?.price || 0);
                  
                  if (!plan || !price) return null;
                  
                  // Create a safe payment plan with extensive date validation
                  const createSafeDate = (dateStr: string | undefined | null | object, defaultDate: string) => {
                    if (!dateStr || typeof dateStr === 'object') return defaultDate;
                    const parsed = Date.parse(dateStr);
                    if (isNaN(parsed)) return defaultDate;
                    const dateObj = new Date(dateStr);
                    if (dateObj.toString() === 'Invalid Date') return defaultDate;
                    return dateStr;
                  };

                  const safePlan = {
                    ...plan,
                    firstInstallmentDate: createSafeDate(plan.firstInstallmentDate, "2024-12-01"),
                    deliveryDate: createSafeDate(plan.deliveryDate, "2026-12-01"),
                    downpayment: Number(plan.downpayment) || 0,
                    delivery: Number(plan.delivery) || 0,
                    yearsToPay: Number(plan.yearsToPay) || 1,
                    installmentMonthsCount: Number(plan.installmentMonthsCount) || 1
                  };
                  
                  // Generate schedule with safe plan and comprehensive error handling
                  let schedule: any[] = [];
                  try {
                    // Additional validation before calling generatePaymentSchedule
                    if (safePlan.firstInstallmentDate && safePlan.deliveryDate && safePlan.yearsToPay > 0 && price > 0) {
                      schedule = generatePaymentSchedule(price, safePlan);
                    }
                  } catch (error) {
                    console.error('Error generating payment schedule for report:', error);
                    // Return early with error message instead of continuing
                    return (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'} {getProjectDisplayName(project, language)}
                        </h3>
                        <p className="text-yellow-800 text-sm">
                          {language === 'ar' ? 'لا يمكن عرض جدول المدفوعات - بيانات غير صحيحة' : 'Cannot display payment schedule - invalid data'}
                        </p>
                      </div>
                    );
                  }
                  
                  if (schedule.length === 0) {
                    return (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'} {getProjectDisplayName(project, language)}
                        </h3>
                        <p className="text-yellow-800 text-sm">
                          {language === 'ar' ? 'لا توجد بيانات متاحة لجدول المدفوعات' : 'No payment schedule data available'}
                        </p>
                      </div>
                    );
                  }
                  
                  // Find down payment and delivery rows
                  const downPaymentRow = schedule.find(row => row.label && row.label.toLowerCase().includes('down payment'));
                  const deliveryRow = schedule.find(row => row.label && row.label.toLowerCase().includes('delivery'));
                  const downPayment = downPaymentRow ? downPaymentRow.amount : 0;
                  const delivery = deliveryRow ? deliveryRow.amount : 0;
                  // Installments total: sum only rows that include 'Installment' in label
                  const installmentsTotal = schedule
                    .filter(row => row.label && row.label.toLowerCase().includes('installment'))
                    .reduce((sum, item) => sum + item.amount, 0);
                  // Remaining: price - down payment - delivery
                  const remaining = price - downPayment - delivery;
                  let deliveryDateStr = '-';
                  if (plan && typeof plan === 'object' && 'deliveryDate' in plan && plan.deliveryDate) {
                    deliveryDateStr = String(plan.deliveryDate);
                  }
                  return (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'} {getProjectDisplayName(project, language)}
                        {(!plan.firstInstallmentDate || !plan.deliveryDate) && (
                          <span className="ml-2 text-sm text-orange-600 font-normal">
                            ({language === 'ar' ? 'تواريخ افتراضية مستخدمة' : 'Default dates used'})
                          </span>
                        )}
                      </h3>
                      {/* Summary Card */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center bg-blue-100 text-blue-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                          {t('downPayment')}: <span className="ml-1">{plan.downpayment}%</span>
                        </div>
                        <div className="flex items-center bg-green-100 text-green-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>
                          {t('installments')}: <span className="ml-1">{100 - (plan.downpayment || 0) - (plan.delivery || 0)}%</span>
                        </div>
                        <div className="flex items-center bg-orange-100 text-orange-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" /></svg>
                          {t('delivery')}: <span className="ml-1">{plan.delivery}%</span>
                        </div>
                        <div className="flex items-center bg-gray-100 text-gray-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3M16 7V3M4 11H20M4 19H20M4 15H20" /></svg>
                          {t('deliveryDate')}: <span className="ml-1">{deliveryDateStr}</span>
                        </div>
                      </div>
                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-blue-600 text-white">
                              <th className="border px-3 py-2 font-bold">
                                {language === 'ar' ? 'الدفعة' : 'Payment'}
                              </th>
                              <th className="border px-3 py-2 font-bold">
                                {language === 'ar' ? 'التاريخ' : 'Date'}
                              </th>
                              <th className="border px-3 py-2 font-bold">
                                {language === 'ar' ? 'المبلغ' : 'Amount'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.map((item, idx) => (
                              <tr key={idx} className={
                                item.label && item.label.toLowerCase().includes('down payment')
                                  ? 'bg-blue-50 font-semibold'
                                  : item.label && item.label.toLowerCase().includes('delivery')
                                    ? 'bg-orange-50 font-semibold'
                                    : idx % 2 === 0
                                      ? 'bg-gray-50'
                                      : 'bg-white'
                              }>
                                <td className={`border px-3 py-2 ${item.label && item.label.toLowerCase().includes('down payment') ? 'text-blue-700' : item.label && item.label.toLowerCase().includes('delivery') ? 'text-orange-700' : ''}`}>{item.label}</td>
                                <td className="border px-3 py-2">
                                  {item.label && item.label.toLowerCase().includes('down payment') && item.dueDate ?
                                    new Date(item.dueDate).toISOString().slice(0, 10) :
                                    item.dueDate
                                  }
                                </td>
                                <td className={`border px-3 py-2 ${item.label && item.label.toLowerCase().includes('down payment') ? 'text-blue-700' : item.label && item.label.toLowerCase().includes('delivery') ? 'text-orange-700' : ''}`}>{Math.round(item.amount).toLocaleString()} EGP</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Totals */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-base font-bold">
                        <div>{language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}: <span className="text-blue-700">{Math.round(price).toLocaleString()} EGP</span></div>
                        <div>{language === 'ar' ? 'الدفعة الأولى' : 'Down Payment'}: <span className="text-green-700">{Math.round(downPayment).toLocaleString()} EGP</span></div>
                        <div>{language === 'ar' ? 'الأقساط' : 'Installments'}: <span className="text-orange-700">{Math.round(installmentsTotal).toLocaleString()} EGP</span></div>
                        <div>{language === 'ar' ? 'المطور' : 'Developer'}: <span className="text-gray-700">{getDeveloperName(project, language)}</span></div>
                      </div>
                    </div>
                  );
                })()}
                {/* Images */}
                {(() => {
                  // Get property images
                  const propertyImages = reportProperty && Array.isArray(reportProperty.images) ? reportProperty.images : [];

                  // Get project images - first try nested project object, then fallback to projects array
                  const project = reportProperty?.project && typeof reportProperty.project === 'object'
                    ? reportProperty.project
                    : projects?.find(p => p.id === reportProperty?.projectId);
                  const projectImages = project && Array.isArray(project.images) ? project.images : [];

                  // Combine all images
                  const allImages = [...propertyImages, ...projectImages];

                  if (allImages.length > 0) {
                    return (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{t('images')}</h3>
                        {propertyImages.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'صور العقار' : 'Property Images'}
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                              {propertyImages.map((img: string, idx: number) => (
                                <img key={idx} src={img} alt={language === 'ar' ? 'صورة العقار' : 'Property Image'} className="h-24 w-32 object-cover rounded border shadow-sm" />
                              ))}
                            </div>
                          </div>
                        )}
                        {projectImages.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              {language === 'ar' ? 'صور المشروع' : 'Project Images'}
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                              {projectImages.map((img: string, idx: number) => (
                                <img key={idx} src={img} alt={language === 'ar' ? 'صورة المشروع' : 'Project Image'} className="h-24 w-32 object-cover rounded border shadow-sm" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Notes */}
                {reportNotes && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {language === 'ar' ? 'ملاحظات مخصصة' : 'Custom Notes'}
                    </h3>
                    <textarea value={reportNotes} onChange={e => setReportNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} placeholder={language === 'ar' ? 'أضف ملاحظات مخصصة' : 'Add custom notes'} />
                  </div>
                )}
                {/* Footer */}
                <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                  <div>{settings?.companyName || (language === 'ar' ? 'بروباي العقارية' : 'Propai Real Estate')} | {settings?.companyWebsite || (language === 'ar' ? 'www.propai.com' : 'www.propai.com')} | {settings?.companyEmail || (language === 'ar' ? 'info@propai.com' : 'info@propai.com')}</div>
                  {settings?.companyAddress && <div>{settings.companyAddress}</div>}
                  <div className="mt-1">
                    {language === 'ar' ? 'هذا التقرير سري' : 'This report is confidential'}
                  </div>
                </div>
                {/* Print Button */}
                <div className="flex justify-end gap-2 mt-6 print:hidden no-pdf" id="report-export-buttons">
                  <button onClick={handlePrint} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                    {language === 'ar' ? 'طباعة' : 'Print'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{showImageModal.title} - {t('images')}</h3>
              <button
                onClick={() => setShowImageModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {showImageModal.images.map((img: string, idx: number) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`${showImageModal.title} ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      // Open image in new tab for full view
                      window.open(img, '_blank');
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                      {t('clickToViewFullSize')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              {showImageModal.images.length} {t('image')}
              {showImageModal.images.length !== 1 ? t('s') : ''} • {t('clickAnyImageToViewFullSize')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesTab;