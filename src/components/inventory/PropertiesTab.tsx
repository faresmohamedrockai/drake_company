import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, MapPin, FileText } from 'lucide-react';
// import { useData } from '../../contexts/DataContext';
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
import { getAllLeads } from '@/queries/queries';

 
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
    queryKey: ['Allleads'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getAllLeads()
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
    price: 0,
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
  const [showPrintPage, setShowPrintPage] = useState(false);
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
  // const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [showImageModal, setShowImageModal] = useState<{ images: string[], title: string } | null>(null);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [priceError, setPriceError] = useState<string>('');
  const [paymentPlanMode, setPaymentPlanMode] = useState('existing'); // 'existing' أو 'custom'
  const [customPlan, setCustomPlan] = useState({
    downpayment: 20,
    delivery: 10,
    yearsToPay: 5,
    deliveryDate: "2026-12-01",
    firstInstallmentDate: "2024-12-01",
    installmentMonthsCount: 60, // 5 years * 12 months
    paymentFrequency: 1 // 1 = monthly, 3 = quarterly, 6 = semi-annually, 12 = annually
  });
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
    if (user?.role === 'sales_rep' && found.ownerId !== user.id) {
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
 
 
 
  function handlePrint() {
    // Ensure the modal is visible and content is loaded
    if (!showReportModal || !reportLead) {
      console.error('Report not ready for printing');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('Could not open print window');
      return;
    }

    // Get the project and payment plan data - using the same logic as preview
    const project = projects?.find(p => p.id === reportProperty?.projectId) || {} as Project;
    const paymentPlan = paymentPlanMode === 'custom' ? customPlan : (project?.paymentPlans?.[reportProperty?.paymentPlanIndex || 0]);

    // Debug: Log the data being used for print
    console.log('Print Data:', {
      paymentPlanMode,
      customPlan,
      paymentPlan,
      reportProperty,
      project
    });

    // Generate the print content
    const printContent = generatePrintHTML(project, paymentPlan);
    
    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  function handleClosePrintPage() {
    setShowPrintPage(false);
  }

  // Unified payment schedule generation function (moved to component level)
  const generateUnifiedPaymentSchedule = (totalPrice: number, plan: any, language: string = 'en'): Array<{
    no: number;
    dueDate: string;
    amount: number;
    label: string;
    type?: string;
    typeAr?: string;
    percentage?: number;
  }> => {
    try {
      const schedule: Array<{
        no: number;
        dueDate: string;
        amount: number;
        label: string;
        type?: string;
        typeAr?: string;
        percentage?: number;
      }> = [];
      
      // Validate inputs
      if (!plan || totalPrice <= 0) {
        console.warn('Invalid payment plan or price data:', { plan, totalPrice });
        return schedule;
      }

      // Create safe plan with consistent structure
      const safePlan = {
        downpayment: Math.max(0, Math.min(100, Number(plan.downpayment) || 0)),
        delivery: Math.max(0, Math.min(100, Number(plan.delivery) || 0)),
        yearsToPay: Math.max(0.1, Number(plan.yearsToPay) || 1),
        firstInstallmentDate: plan.firstInstallmentDate || new Date().toISOString().slice(0, 10),
        deliveryDate: plan.deliveryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        // Handle both installmentPeriod and paymentFrequency
        installmentPeriod: plan.installmentPeriod || (plan.paymentFrequency === 12 ? 'yearly' : 
                                                    plan.paymentFrequency === 3 ? 'quarterly' : 
                                                    plan.paymentFrequency === 6 ? 'semi-annually' : 'monthly'),
        installmentMonthsCount: plan.installmentMonthsCount || (plan.paymentFrequency || 1)
      };

      // Calculate periods and interval based on installment period
      let periods = 0;
      let intervalMonths = 1;
      
      if (safePlan.installmentPeriod === 'monthly') {
        periods = safePlan.yearsToPay * 12;
        intervalMonths = 1;
      } else if (safePlan.installmentPeriod === 'quarterly') {
        periods = safePlan.yearsToPay * 4;
        intervalMonths = 3;
      } else if (safePlan.installmentPeriod === 'yearly') {
        periods = safePlan.yearsToPay;
        intervalMonths = 12;
      } else if (safePlan.installmentPeriod === 'custom') {
        periods = Math.floor((safePlan.yearsToPay * 12) / safePlan.installmentMonthsCount);
        intervalMonths = safePlan.installmentMonthsCount;
      } else {
        // Fallback to paymentFrequency
        periods = Math.ceil(safePlan.yearsToPay * 12 / safePlan.installmentMonthsCount);
        intervalMonths = safePlan.installmentMonthsCount;
      }

      if (!periods || !safePlan.firstInstallmentDate) {
        console.warn('Cannot calculate periods or missing first installment date');
        return schedule;
      }

      // Calculate amounts
      const downPaymentAmount = Math.round((safePlan.downpayment / 100) * totalPrice);
      const deliveryAmount = Math.round((safePlan.delivery / 100) * totalPrice);
      const installmentTotal = totalPrice - downPaymentAmount - deliveryAmount;
      const installmentAmount = Math.round(installmentTotal / periods);

      // Down Payment
      if (downPaymentAmount > 0) {
        schedule.push({
          no: 0,
          dueDate: safePlan.firstInstallmentDate,
          amount: downPaymentAmount,
          label: language === 'ar' ? `الدفعة الأولى (${safePlan.downpayment}%)` : `Down Payment (${safePlan.downpayment}%)`,
          type: 'Down Payment',
          typeAr: 'دفعة أولى',
          percentage: safePlan.downpayment
        });
      }

      // Generate Installments
      let currentDate = new Date(safePlan.firstInstallmentDate);
      currentDate.setMonth(currentDate.getMonth() + intervalMonths); // Start after down payment
      
      for (let i = 1; i <= periods; i++) {
        const installmentLabel = language === 'ar' ? `القسط ${i}` : `Installment ${i}`;
        
        schedule.push({
          no: i,
          dueDate: currentDate.toISOString().slice(0, 10),
          amount: installmentAmount,
          label: installmentLabel,
          type: `Installment ${i}`,
          typeAr: `قسط ${i}`,
          percentage: totalPrice > 0 ? (installmentTotal / totalPrice) * 100 / periods : 0
        });
        
        currentDate.setMonth(currentDate.getMonth() + intervalMonths);
      }

      // Delivery Payment
      if (deliveryAmount > 0 && safePlan.deliveryDate) {
        const deliveryRow = {
          no: schedule.length,
          dueDate: safePlan.deliveryDate,
          amount: deliveryAmount,
          label: language === 'ar' ? `دفعة التسليم (${safePlan.delivery}%)` : `Delivery (${safePlan.delivery}%)`,
          type: 'Delivery Payment',
          typeAr: 'دفعة التسليم',
          percentage: safePlan.delivery
        };

        // Check if delivery date matches any installment date
        const existingIndex = schedule.findIndex(row => row.dueDate === deliveryRow.dueDate);
        if (existingIndex !== -1) {
          // Merge with existing installment
          schedule[existingIndex] = {
            ...schedule[existingIndex],
            amount: schedule[existingIndex].amount + deliveryRow.amount,
            label: `${schedule[existingIndex].label} + ${deliveryRow.label}`
          };
        } else {
          schedule.push(deliveryRow);
        }
      }

      // Sort by due date
      schedule.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      // Reassign sequential numbers after sorting
      schedule.forEach((item, index) => {
        item.no = index;
      });

      console.log('Unified Payment Schedule Generated:', schedule);
      return schedule;
    } catch (error) {
      console.error('Error in generateUnifiedPaymentSchedule:', error);
      return [];
    }
  };

  function generatePrintHTML(project: Project, paymentPlan: any) {
    const lead = reportLead;
    const property = reportProperty;
    const totalPrice = property.price || 0;
    
    // Get lead name based on language
    const getLeadName = () => {
      if (language === 'ar') {
        return lead.nameAr || lead.nameEn;
      }
      return lead.nameEn || lead.nameAr;
    };

    // Get project name based on language
    const getProjectName = () => {
      if (language === 'ar') {
        return project.nameAr || project.nameEn;
      }
      return project.nameEn || project.nameAr;
    };

    // Get property name based on language
    const getPropertyName = () => {
      if (language === 'ar') {
        return property.nameAr || property.nameEn;
      }
      return property.nameEn || property.nameAr;
    };

    // Generate payment schedule for print (using unified function)
    const generatePaymentSchedule = (): Array<{
      type: string;
      typeAr: string;
      amount: number;
      dueDate: string;
      percentage: number;
    }> => {
      const price = Number(property?.price) || 0;
      const plan = paymentPlan;
      
      if (!plan || price <= 0) {
        return [];
      }

      const unifiedSchedule = generateUnifiedPaymentSchedule(price, plan, language);
      
      // Convert to print format
      return unifiedSchedule.map(item => ({
        type: item.type || item.label,
        typeAr: item.typeAr || item.label,
        amount: item.amount,
        dueDate: item.dueDate,
        percentage: item.percentage || 0
      }));
    };

    const paymentSchedule = generatePaymentSchedule();

    const formatCurrency = (amount: number) => {
      try {
        const safeAmount = Number(amount) || 0;
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(safeAmount) + ' EGP';
      } catch (error) {
        console.warn('Error formatting currency:', error);
        return '0 EGP';
      }
    };

    const formatDate = (dateString: string) => {
      try {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString);
          return '';
        }
        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
      } catch (error) {
        console.warn('Error formatting date:', error);
        return '';
      }
    };

    return `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${language === 'ar' ? 'تقرير تفاصيل العقار' : 'Property Details Report'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            background: #f9fafb;
            padding: 20px;
          }
          
          .print-page {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: #1f2937;
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          .report-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            opacity: 0.95;
          }
          
          .report-subtitle {
            font-size: 16px;
            opacity: 0.8;
            font-weight: 400;
          }
          
          .company-info {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 20px;
            margin-top: 20px;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            text-align: center;
          }
          
          .company-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-top: 12px;
          }
          
          .company-detail {
            text-align: center;
            font-size: 13px;
            opacity: 0.9;
          }
          
          .company-detail-label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            opacity: 0.7;
            font-weight: 500;
          }
          
          .section {
            margin-bottom: 32px;
            page-break-inside: avoid;
            padding: 0 30px;
          }
          
          .first-page-sections {
            page-break-after: always;
            background: #f9fafb;
            padding: 30px;
          }
          
          .payment-schedule-section {
            page-break-before: always;
            padding: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            position: relative;
          }
          
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 40px;
            height: 2px;
            background: #3b82f6;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .info-item {
            background: white;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            border-left: 3px solid #3b82f6;
          }
          
          .info-label {
            font-weight: 500;
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            display: block;
          }
          
          .info-value {
            color: #1f2937;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
          }
          
          .payment-plan-card {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }
          
          .plan-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .plan-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
          }
          
          .plan-item {
            text-align: center;
            padding: 16px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .plan-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          
          .plan-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.2;
          }
          
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border-radius: 6px;
            overflow: hidden;
            background: white;
            border: 1px solid #e5e7eb;
          }
          
          .schedule-table th {
            background: #f8fafc;
            color: #374151;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .schedule-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f3f4f6;
            background: white;
            font-size: 14px;
          }
          
          .schedule-table tbody tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .payment-type {
            font-weight: 500;
            color: #1f2937;
          }
          
          .down-payment {
            color: #3b82f6;
            font-weight: 600;
          }
          
          .delivery-payment {
            color: #f59e0b;
            font-weight: 600;
          }
          
          .delivery-row {
            background: #fef3c7 !important;
          }
          
          .delivery-row .delivery-payment {
            color: #f59e0b;
            font-weight: 600;
          }
          
          .delivery-row .delivery-date {
            color: #f59e0b;
            font-weight: 500;
          }
          
          .delivery-row .delivery-amount {
            color: #f59e0b;
            font-weight: 600;
          }
          
          .amount-cell {
            font-weight: 600;
            color: #1f2937;
            font-size: 14px;
          }
          
          .down-amount {
            color: #3b82f6;
            font-weight: 600;
          }
          
          .date-cell {
            color: #6b7280;
            font-weight: 500;
          }
          
          .summary-section {
            margin-top: 24px;
            background: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            border: 1px solid #e5e7eb;
          }
          
          .summary-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
            text-align: center;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 16px;
          }
          
          .summary-item {
            text-align: center;
            padding: 12px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .summary-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 6px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .summary-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .print-page {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
            }
            
            .header {
              background: #1f2937 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .section-title::after {
              background: #3b82f6 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .info-item {
              border-left-color: #3b82f6 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .schedule-table th {
              background: #f8fafc !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .delivery-row {
              background: #fef3c7 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          
          .total-price {
            color: #3b82f6;
          }
          
          .down-payment-summary {
            color: #10b981;
          }
          
          .installments-summary {
            color: #f59e0b;
          }
          
          .developer-name {
            color: #667eea;
          }
          
          .footer {
            margin-top: 50px;
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
          }
          
          .confidential {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 16px;
            padding: 25px;
            margin-top: 20px;
            text-align: center;
            color: #92400e;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          .confidential::before {
            content: '🔒';
            position: absolute;
            top: 15px;
            left: 20px;
            font-size: 20px;
          }
          
          .confidential::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #f59e0b, #d97706);
          }
          
          .generation-date {
            margin-top: 20px;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
          }
          
          .ai-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 15px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .section {
              page-break-inside: avoid;
              margin-bottom: 20px;
            }
            
            .first-page-sections {
              page-break-after: always;
            }
            
            .payment-schedule-section {
              page-break-before: always;
            }
            
            .schedule-table {
              page-break-inside: auto;
            }
            
            .schedule-table thead {
              display: table-header-group;
            }
            
            .schedule-table tbody tr {
              page-break-inside: avoid;
            }
            
            .payment-plan-card {
              page-break-inside: avoid;
            }
            
            .header {
              page-break-after: avoid;
            }
            
            .footer {
              page-break-before: avoid;
            }
          }
          
          /* RTL Support */
          [dir="rtl"] {
            text-align: right;
          }
          
          [dir="rtl"] .info-item {
            flex-direction: row-reverse;
          }
          
          [dir="rtl"] .schedule-table th,
          [dir="rtl"] .schedule-table td {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="print-page">
          <!-- Header -->
          <div class="header">
            <div class="logo">PROPAI CRM</div>
            <div class="report-title">
              ${language === 'ar' ? 'تقرير تفاصيل العقار' : 'Property Details Report'}
            </div>
            <div class="report-subtitle">
              ${language === 'ar' ? 'تقرير شامل للعقار والعميل' : 'Comprehensive Property & Client Report'}
            </div>
            <div class="company-info">
              <div class="company-name">
                ${settings?.companyName || (language === 'ar' ? 'بروباي العقارية' : 'Propai Real Estate')}
              </div>
              <div class="company-details">
                ${settings?.companyAddress ? `
                  <div class="company-detail">
                    <span class="company-detail-label">${language === 'ar' ? 'العنوان' : 'Address'}</span>
                    ${settings.companyAddress}
                  </div>
                ` : ''}
                ${settings?.companyPhone ? `
                  <div class="company-detail">
                    <span class="company-detail-label">${language === 'ar' ? 'الهاتف' : 'Phone'}</span>
                    ${settings.companyPhone}
                  </div>
                ` : ''}
                ${settings?.companyEmail ? `
                  <div class="company-detail">
                    <span class="company-detail-label">${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</span>
                    ${settings.companyEmail}
                  </div>
                ` : ''}
                ${settings?.companyWebsite ? `
                  <div class="company-detail">
                    <span class="company-detail-label">${language === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</span>
                    ${settings.companyWebsite}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- First Page: Lead, Property, and Payment Plan Information -->
          <div class="first-page-sections">
            <!-- Lead Information -->
            <div class="section">
              <div class="section-title">
                ${language === 'ar' ? 'معلومات العميل' : 'Lead Information'}
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'الاسم' : 'Name'}:</span>
                  <span class="info-value">${getLeadName()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'الهاتف' : 'Phone'}:</span>
                  <span class="info-value">${lead.contact || lead.phone || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${lead.email || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'المصدر' : 'Source'}:</span>
                  <span class="info-value">${lead.source || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'مندوب المبيعات' : 'Sales Rep'}:</span>
                  <span class="info-value">${lead.owner?.name || lead.owner?.nameEn || lead.owner?.nameAr || 'Unassigned'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Budget:</span>
                  <span class="info-value">${lead.budget ? formatCurrency(lead.budget) : '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="info-value">${lead.status || '-'}</span>
                </div>
              </div>
              ${reportNotes ? `
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'ملاحظات' : 'Notes'}:</span>
                  <span class="info-value">${reportNotes}</span>
                </div>
              ` : ''}
            </div>

            <!-- Property Information -->
            <div class="section">
              <div class="section-title">
                ${language === 'ar' ? 'معلومات العقار' : 'Property Information'}
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'اسم العقار' : 'Property Name'}:</span>
                  <span class="info-value">${getPropertyName()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'المشروع' : 'Project'}:</span>
                  <span class="info-value">${getProjectName()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'النوع' : 'Type'}:</span>
                  <span class="info-value">${property.type || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'المساحة' : 'Area'}:</span>
                  <span class="info-value">${property.area ? `${property.area} ${language === 'ar' ? 'م²' : 'm²'}` : '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'الطابق' : 'Floor'}:</span>
                  <span class="info-value">${property.floor || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'عدد الغرف' : 'Rooms'}:</span>
                  <span class="info-value">${property.rooms || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'السعر' : 'Price'}:</span>
                  <span class="info-value">${formatCurrency(totalPrice)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${language === 'ar' ? 'الحالة' : 'Status'}:</span>
                  <span class="info-value">${property.status || '-'}</span>
                </div>
              </div>
            </div>

            <!-- Payment Plan -->
            <div class="section">
              <div class="section-title">
                ${language === 'ar' ? 'خطة الدفع' : 'Payment Plan'}
              </div>
              <div class="payment-plan-card">
                <div class="plan-title">
                  ${language === 'ar' ? 'تفاصيل خطة الدفع' : 'Payment Plan Details'}
                </div>
                <div class="plan-details">
                  <div class="plan-item">
                    <div class="plan-label">${language === 'ar' ? 'الدفعة الأولى' : 'Down Payment'}</div>
                    <div class="plan-value">${paymentPlan?.downpayment || 0}%</div>
                  </div>
                  <div class="plan-item">
                    <div class="plan-label">${language === 'ar' ? 'دفعة التسليم' : 'Delivery Payment'}</div>
                    <div class="plan-value">${paymentPlan?.delivery || 0}%</div>
                  </div>
                  <div class="plan-item">
                    <div class="plan-label">${language === 'ar' ? 'سنوات الدفع' : 'Payment Years'}</div>
                    <div class="plan-value">${paymentPlan?.yearsToPay || 0}</div>
                  </div>
                  <div class="plan-item">
                    <div class="plan-label">${language === 'ar' ? 'تكرار الدفع' : 'Payment Frequency'}</div>
                    <div class="plan-value">
                      ${paymentPlan?.paymentFrequency === 1 ? (language === 'ar' ? 'شهري' : 'Monthly') :
                        paymentPlan?.paymentFrequency === 3 ? (language === 'ar' ? 'ربعي' : 'Quarterly') :
                        paymentPlan?.paymentFrequency === 12 ? (language === 'ar' ? 'سنوي' : 'Yearly') :
                        `${paymentPlan?.paymentFrequency || 1} ${language === 'ar' ? 'شهر' : 'months'}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Schedule (Separate Page) -->
          <div class="section payment-schedule-section">
            <div class="section-title">
              ${language === 'ar' ? 'جدول الدفع' : 'Payment Schedule'}
            </div>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>${language === 'ar' ? 'الدفعة' : 'Payment'}</th>
                  <th>${language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th>${language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                ${paymentSchedule.map((payment, index) => {
                  const isDelivery = payment.type.includes('Delivery') || payment.typeAr.includes('التسليم');
                  const isDownPayment = payment.type.includes('Down') || payment.typeAr.includes('أولى');
                  
                  return `
                    <tr ${isDelivery ? 'class="delivery-row"' : ''}>
                      <td class="payment-type ${isDownPayment ? 'down-payment' : isDelivery ? 'delivery-payment' : ''}">
                        ${language === 'ar' ? payment.typeAr : payment.type}
                      </td>
                      <td class="date-cell ${isDelivery ? 'delivery-date' : ''}">
                        ${payment.dueDate}
                      </td>
                      <td class="amount-cell ${isDownPayment ? 'down-amount' : isDelivery ? 'delivery-amount' : ''}">
                        ${formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <!-- Summary Section -->
            <div class="summary-section">
              <div class="summary-title">
                ${language === 'ar' ? 'ملخص المدفوعات' : 'Payment Summary'}
              </div>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">${language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}</div>
                  <div class="summary-value total-price">${formatCurrency(totalPrice)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">${language === 'ar' ? 'الدفعة الأولى' : 'Down Payment'}</div>
                  <div class="summary-value down-payment-summary">${formatCurrency(paymentSchedule.find(p => p.type.includes('Down') || p.typeAr.includes('أولى'))?.amount || 0)}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">${language === 'ar' ? 'الأقساط' : 'Installments'}</div>
                  <div class="summary-value installments-summary">${formatCurrency(paymentSchedule.filter(p => p.type.includes('Installment') || p.typeAr.includes('قسط')).reduce((sum, p) => sum + p.amount, 0))}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">${language === 'ar' ? 'المطور' : 'Developer'}</div>
                  <div class="summary-value developer-name">${getProjectName()}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Images Section -->
          ${(() => {
            // Get property and project images
            const propertyImages = reportProperty?.images || [];
            const projectImages = project?.images || [];
            const allImages = [...propertyImages, ...projectImages];

            if (allImages.length > 0) {
              return `
                <div class="section">
                  <div class="section-title">
                    ${language === 'ar' ? 'الصور' : 'Images'}
                  </div>
                  
                  ${propertyImages.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                      <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                        ${language === 'ar' ? 'صور العقار' : 'Property Images'}
                      </h4>
                      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        ${propertyImages.map((img, idx) => `
                          <img 
                            src="${img}" 
                            alt="${language === 'ar' ? 'صورة العقار' : 'Property Image'} ${idx + 1}"
                            style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;"
                          />
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}

                  ${projectImages.length > 0 ? `
                    <div>
                      <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                        ${language === 'ar' ? 'صور المشروع' : 'Project Images'}
                      </h4>
                      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        ${projectImages.map((img, idx) => `
                          <img 
                            src="${img}" 
                            alt="${language === 'ar' ? 'صورة المشروع' : 'Project Image'} ${idx + 1}"
                            style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;"
                          />
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }
            return '';
          })()}

          <!-- Footer -->
          <div class="footer">
            <div class="generation-date">
              ${language === 'ar' ? 'تم إنشاء التقرير في' : 'Report generated on'} ${new Date().toLocaleDateString(language === 'ar' ? 'en-US' : 'en-US')}
            </div>
            <div class="ai-badge">
              ${language === 'ar' ? 'مدعوم بالذكاء الاصطناعي من Rockai Dev' : 'AI-Powered by Rockai Dev'}
            </div>
          </div>
        </div>
        <script>
          // Auto-print when window loads
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
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
                          <span className="text-xs text-gray-900 truncate block" title={property.area.toString() || ""}>
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
                              className="text-xs text-blue-600 underline cursor-pointer truncate  w-full text-left flex items-center"
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
                      firstInstallmentDate: new Date().toISOString().slice(0, 10),
                      deliveryDate: createSafeDate(plan.deliveryDate, "2026-12-01"),
                      downpayment: Number(plan.downpayment) || 0,
                      delivery: Number(plan.delivery) || 0,
                      yearsToPay: Number(plan.yearsToPay) || 1,
                      installmentMonthsCount: Number(plan.installmentMonthsCount) || 1
                    };
 
                    // Generate schedule with unified function for consistency
                    let schedule: any[] = [];
                    try {
                      // Use unified payment schedule generation
                      if (safePlan.firstInstallmentDate && safePlan.deliveryDate && safePlan.yearsToPay > 0 && price > 0) {
                        schedule = generateUnifiedPaymentSchedule(price, safePlan, language);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:static print-container">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative print:max-h-none print:overflow-visible print:shadow-none print:border-0 print:rounded-none print:p-4">
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
              <div id="report-preview" className="bg-white p-4 print:p-0 print:bg-white print:shadow-none print:overflow-visible">
                <div className="print-content">
                  {/* Helper Function for Custom Payment Schedule */}
                {(() => {
                  // Function to generate custom payment schedule (using unified logic)
                  window.generateCustomPaymentSchedule = (price, plan, language) => {
                    // Use the same unified function for consistency
                    const unifiedSchedule = generateUnifiedPaymentSchedule(price, plan, language);
                    
                    // Convert to preview format
                    return unifiedSchedule.map(item => ({
                      label: item.label,
                      amount: item.amount,
                      dueDate: item.dueDate
                    }));
                  };
 
                  return null;
                })()}
 
                {/* Payment Plan Customization Dropdown - في الأعلى خالص */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg print:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {language === 'ar' ? 'إعدادات خطة الدفع' : 'Payment Plan Settings'}
                    </h3>
                  </div>
 
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentPlanMode"
                        value="existing"
                        checked={paymentPlanMode === 'existing'}
                        onChange={(e) => setPaymentPlanMode(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'استخدم الخطة الموجودة' : 'Use Existing Plan'}
                      </span>
                    </label>
 
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentPlanMode"
                        value="custom"
                        checked={paymentPlanMode === 'custom'}
                        onChange={(e) => {
                          setPaymentPlanMode(e.target.value);
                          if (e.target.value === 'custom') {
                            try {
                              const project = reportProperty?.project && typeof reportProperty.project === 'object'
                                ? reportProperty.project
                                : projects?.find(p => p.id === reportProperty?.projectId);
                              const idx = typeof reportProperty?.paymentPlanIndex === 'number' ? reportProperty.paymentPlanIndex : 0;
                              const basePlan: any = project && Array.isArray(project.paymentPlans) ? project.paymentPlans[idx] : null;
                              if (basePlan) {
                                const frequency = basePlan.installmentPeriod === 'monthly' ? 1
                                  : basePlan.installmentPeriod === 'quarterly' ? 3
                                  : basePlan.installmentPeriod === 'yearly' ? 12
                                  : (Number(basePlan.installmentMonthsCount) || 1);
                                setCustomPlan({
                                  downpayment: Number(basePlan.downpayment) || 0,
                                  delivery: Number(basePlan.delivery) || 0,
                                  yearsToPay: Number(basePlan.yearsToPay) || 1,
                                  deliveryDate: basePlan.deliveryDate ? String(basePlan.deliveryDate).slice(0, 10) : '',
                                  firstInstallmentDate: basePlan.firstInstallmentDate ? String(basePlan.firstInstallmentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
                                  installmentMonthsCount: Number(basePlan.yearsToPay) * 12,
                                  paymentFrequency: frequency
                                });
                              }
                            } catch (err) {
                              // Fail silently; keep existing defaults
                            }
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {language === 'ar' ? 'إنشاء خطة مخصصة' : 'Create Custom Plan'}
                      </span>
                    </label>
                  </div>
 
                  {/* Custom Plan Form */}
                  {paymentPlanMode === 'custom' && (
                    <div className="bg-white rounded border overflow-hidden">
                      <div className="bg-blue-50 px-3 py-2 border-b">
                        <h4 className="font-semibold text-blue-800 text-sm">
                          {language === 'ar' ? 'إعداد الخطة المخصصة' : 'Custom Plan Setup'}
                        </h4>
                      </div>
 
                      <div className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {language === 'ar' ? 'الدفعة الأولى (%)' : 'Down Payment (%)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customPlan.downpayment}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                setCustomPlan({
                                  ...customPlan,
                                  downpayment: newValue
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
 
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {language === 'ar' ? 'عند التسليم (%)' : 'On Delivery (%)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customPlan.delivery}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                setCustomPlan({
                                  ...customPlan,
                                  delivery: newValue
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
 
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {language === 'ar' ? 'سنوات السداد' : 'Years to Pay'}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={customPlan.yearsToPay}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                setCustomPlan({
                                  ...customPlan,
                                  yearsToPay: newValue,
                                  installmentMonthsCount: newValue * 12 // حساب عدد الأشهر تلقائياً
                                });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
 
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {language === 'ar' ? 'تاريخ التسليم' : 'Delivery Date'}
                            </label>
                            <input
                              type="date"
                              value={customPlan.deliveryDate}
                              onChange={(e) => setCustomPlan({ ...customPlan, deliveryDate: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
 
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {language === 'ar' ? 'تاريخ أول قسط' : 'First Installment Date'}
                            </label>
                            <input
                              type="date"
                              value={customPlan.firstInstallmentDate}
                              onChange={(e) => setCustomPlan({ ...customPlan, firstInstallmentDate: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
 
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {language === 'ar' ? 'فترة الدفع (شهر)' : 'Payment Frequency (Months)'}
                            </label>
                            <select
                              value={customPlan.paymentFrequency || 1}
                              onChange={(e) => setCustomPlan({ ...customPlan, paymentFrequency: Number(e.target.value) })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                              <option value={1}>{language === 'ar' ? 'شهرياً' : 'Monthly'}</option>
                              <option value={3}>{language === 'ar' ? 'كل 3 أشهر' : 'Quarterly'}</option>
                              <option value={6}>{language === 'ar' ? 'كل 6 أشهر' : 'Semi-annually'}</option>
                              <option value={12}>{language === 'ar' ? 'سنوياً' : 'Annually'}</option>
                            </select>
                          </div>
                        </div>
 
                        {/* Preview Calculations */}
                        {reportProperty?.price && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <span className="font-medium text-gray-600">
                                  {language === 'ar' ? 'المقدم:' : 'Down Payment:'}
                                </span>
                                <div className="text-blue-700 font-bold">
                                  {Math.round(Number(reportProperty.price) * customPlan.downpayment / 100).toLocaleString()} EGP
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  {language === 'ar' ? 'التسليم:' : 'Delivery:'}
                                </span>
                                <div className="text-orange-700 font-bold">
                                  {Math.round(Number(reportProperty.price) * customPlan.delivery / 100).toLocaleString()} EGP
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  {language === 'ar' ? 'للأقساط:' : 'For Installments:'}
                                </span>
                                <div className="text-green-700 font-bold">
                                  {Math.round(Number(reportProperty.price) * (100 - customPlan.downpayment - customPlan.delivery) / 100).toLocaleString()} EGP
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  {language === 'ar' ? 'القسط الواحد:' : 'Per Installment:'}
                                </span>
                                <div className="text-purple-700 font-bold">
                                  {(() => {
                                    const installmentAmount = Number(reportProperty.price) * (100 - customPlan.downpayment - customPlan.delivery) / 100;
                                    const frequency = customPlan.paymentFrequency || 1;
                                    const totalInstallments = Math.ceil(customPlan.yearsToPay * 12 / frequency);
                                    return totalInstallments > 0 ? Math.round(installmentAmount / totalInstallments).toLocaleString() : '0';
                                  })()} EGP
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
 
                  {/* Existing Plan Selector */}
                  {paymentPlanMode === 'existing' && reportProperty?.project && Array.isArray(reportProperty.project.paymentPlans) && reportProperty.project.paymentPlans.length > 1 && (
                    <div className="p-3 bg-white rounded border">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {language === 'ar' ? 'اختر خطة الدفع' : 'Select Payment Plan'}
                      </label>
                      <select
                        value={reportProperty.paymentPlanIndex || 0}
                        onChange={(e) => setReportProperty({ ...reportProperty, paymentPlanIndex: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {reportProperty.project.paymentPlans.map((plan, idx) => (
                          <option key={idx} value={idx}>
                            {language === 'ar'
                              ? `خطة ${idx + 1}: ${plan.downpayment}% مقدم، ${100 - (plan.downpayment || 0) - (plan.delivery || 0)}% أقساط، ${plan.delivery}% تسليم`
                              : `Plan ${idx + 1}: ${plan.downpayment}% down, ${100 - (plan.downpayment || 0) - (plan.delivery || 0)}% installments, ${plan.delivery}% delivery`
                            }
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
 
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
 
                {/* Lead Info */}
                {reportLead && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {language === 'ar' ? 'معلومات العميل' : 'Lead Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {(() => {
                        const leadName = language === 'ar'
                          ? (reportLead.nameAr || reportLead.nameEn || reportLead.name)
                          : (reportLead.nameEn || reportLead.nameAr || reportLead.name);
                        const leadPhone = reportLead.contact || (Array.isArray(reportLead.contacts) ? reportLead.contacts[0] : reportLead.phone);
                        const leadEmail = reportLead.email;
                        return (
                          <>
                            <div><span className="font-medium">{t('name') || 'Name'}:</span> {leadName || '-'}</div>
                            <div><span className="font-medium">{t('phone') || 'Phone'}:</span> {leadPhone || '-'}</div>
                            <div><span className="font-medium">Email:</span> {leadEmail || '-'}</div>
                            <div><span className="font-medium">{t('source') || 'Source'}:</span> {reportLead.source || '-'}</div>
                            <div><span className="font-medium">{t('salesRep') || 'Sales Rep'}:</span> {reportLead.owner?.name || reportLead.owner?.nameEn || reportLead.owner?.nameAr || 'Unassigned'}</div>
                            <div><span className="font-medium">Budget:</span> {reportLead.budget || '-'}</div>
                            <div><span className="font-medium">Status:</span> {reportLead.status || '-'}</div>
                            
                          </>
                        );
                      })()}
                      {reportNotes && <div className="col-span-2"><span className="font-medium">{t('notes') || 'Notes'}:</span> {reportNotes}</div>}
                    </div>
                  </div>
                )}
 
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
 
                {/* Payment Plan Table - Modified to use selected mode */}
                {(() => {
                  const project = reportProperty?.project && typeof reportProperty.project === 'object'
                    ? reportProperty.project
                    : projects?.find(p => p.id === reportProperty?.projectId);
 
                  if (!project || !reportProperty?.price) return null;
 
                  const price = Number(reportProperty.price);
                  let plan;
 
                  // استخدام الخطة حسب الاختيار
                  if (paymentPlanMode === 'custom') {
                    plan = {
                      ...customPlan,
                      firstInstallmentDate: customPlan.firstInstallmentDate || "2024-12-01",
                      installmentMonthsCount: customPlan.installmentMonthsCount || (customPlan.yearsToPay * 12),
                      paymentFrequency: customPlan.paymentFrequency || 1
                    };
                  } else {
                    if (!Array.isArray(project.paymentPlans) || project.paymentPlans.length === 0) return null;
                    const idx = typeof reportProperty?.paymentPlanIndex === 'number' ? reportProperty.paymentPlanIndex : 0;
                    plan = project.paymentPlans[idx];
                  }
 
                  if (!plan || !price) return null;
 
                  // باقي الكود كما هو...
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
                    firstInstallmentDate: new Date().toISOString().slice(0, 10),
                    deliveryDate: createSafeDate(plan.deliveryDate, "2026-12-01"),
                    downpayment: Number(plan.downpayment) || 0,
                    delivery: Number(plan.delivery) || 0,
                    yearsToPay: Number(plan.yearsToPay) || 1,
                    installmentMonthsCount: Number(plan.installmentMonthsCount) || (Number(plan.yearsToPay) * 12),
                    paymentFrequency: Number(plan.paymentFrequency) || 1
                  };
 
                  // Debug log للـ custom plan
                  if (paymentPlanMode === 'custom') {
                    console.log('Custom Plan Data:', safePlan);
                  }
 
                  let schedule: any[] = [];
                  try {
                    if (safePlan.firstInstallmentDate && safePlan.deliveryDate && safePlan.yearsToPay > 0 && price > 0) {
                      // Use unified payment schedule generation for consistency
                      schedule = generateUnifiedPaymentSchedule(price, safePlan, language);

                      // Debug log for the schedule
                      console.log('Generated Unified Schedule:', schedule);
                    }
                  } catch (error) {
                    console.error('Error generating payment schedule for report:', error);
                    return (
                      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'}
                          {paymentPlanMode === 'custom'
                            ? (language === 'ar' ? ' (مخصصة)' : ' (Custom)')
                            : getProjectDisplayName(project, language)
                          }
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
                          {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'}
                          {paymentPlanMode === 'custom'
                            ? (language === 'ar' ? ' (مخصصة)' : ' (Custom)')
                            : getProjectDisplayName(project, language)
                          }
                        </h3>
                        <p className="text-yellow-800 text-sm">
                          {language === 'ar' ? 'لا توجد بيانات متاحة لجدول المدفوعات' : 'No payment schedule data available'}
                        </p>
                      </div>
                    );
                  }
 
                  const downPaymentRow = schedule.find(row => row.label && row.label.toLowerCase().includes('down payment'));
                  const deliveryRow = schedule.find(row => row.label && row.label.toLowerCase().includes('delivery'));
                  const downPayment = downPaymentRow ? downPaymentRow.amount : 0;
                  const delivery = deliveryRow ? deliveryRow.amount : 0;
                  const installmentsTotal = schedule
                    .filter(row => row.label && row.label.toLowerCase().includes('installment'))
                    .reduce((sum, item) => sum + item.amount, 0);
 
                  let deliveryDateStr = '-';
                  if (plan && typeof plan === 'object' && 'deliveryDate' in plan && plan.deliveryDate) {
                    deliveryDateStr = String(plan.deliveryDate);
                  }
 
                  return (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {language === 'ar' ? 'خطة الدفع' : 'Payment Plan'}
                        {paymentPlanMode === 'custom'
                          ? (language === 'ar' ? ' (مخصصة)' : ' (Custom)')
                          : getProjectDisplayName(project, language)
                        }
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
 
                {/* Images - باقي الكود كما هو */}
                {(() => {
                  const propertyImages = reportProperty && Array.isArray(reportProperty.images) ? reportProperty.images : [];
                  const project = reportProperty?.project && typeof reportProperty.project === 'object'
                    ? reportProperty.project
                    : projects?.find(p => p.id === reportProperty?.projectId);
                  const projectImages = project && Array.isArray(project.images) ? project.images : [];
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