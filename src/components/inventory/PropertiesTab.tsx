import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, MapPin, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { generatePaymentSchedule } from './ProjectsTab';

// Fix default marker icon for leaflet in React
if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface Property {
  id: string;
  title: string;
  type: string;
  price: string;
  location: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  amenities: string[];
  project: string;
  status: 'Available' | 'Rented' | 'Sold';
}

// Add FormState type for form
type FormState = {
  title: string;
  type: string;
  price: string;
  location: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  amenities: string[];
  project: string;
  status: string;
  zoneId: string;
  projectId: string;
  developerId: string;
  typeOther: string;
  amenitiesOther: string;
};

const PropertiesTab: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, projects, zones, developers, leads } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    title: '',
    type: '',
    price: '', // will be handled as number in input and calculations
    location: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    amenities: [],
    project: '',
    status: 'Available',
    zoneId: '',
    projectId: '',
    developerId: '',
    typeOther: '',
    amenitiesOther: ''
  });
  const [filterProject, setFilterProject] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterDeveloper, setFilterDeveloper] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showPaymentPlan, setShowPaymentPlan] = useState<any>(null);
  const [showTypeOther, setShowTypeOther] = useState(false);
  const [showAmenitiesOther, setShowAmenitiesOther] = useState(false);
  const [zoneModal, setZoneModal] = useState<{ name: string, latitude: number, longitude: number } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStep, setReportStep] = useState<'input'|'preview'>("input");
  const [reportPhone, setReportPhone] = useState('');
  const [reportLead, setReportLead] = useState<any>(null);
  const [reportProperty, setReportProperty] = useState<any>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [reportError, setReportError] = useState('');
  const userRolesAllowed = ['Admin', 'Sales Admin', 'Team Leader', 'Sales Rep'];
  const canGenerateReport = userRolesAllowed.includes(user?.role || '');

  const openAddForm = () => {
    setEditId(null);
    setForm({
      title: '',
      type: '',
      price: '', // will be handled as number in input and calculations
      location: '',
      area: '',
      bedrooms: '',
      bathrooms: '',
      parking: '',
      amenities: [],
      project: '',
      status: 'Available',
      zoneId: '',
      projectId: '',
      developerId: '',
      typeOther: '',
      amenitiesOther: ''
    });
    setShowForm(true);
  };

  const openEditForm = (property: any) => {
    setEditId(property.id);
    setForm({ ...property, zoneId: property.zoneId || '', projectId: property.projectId || '', developerId: property.developerId || '', typeOther: '', amenitiesOther: '' });
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'projectId') {
      // Find the selected project and set developerId accordingly
      const selectedProject = projects.find(p => p.id === value);
      setForm((prev) => ({
        ...prev,
        [name]: value,
        developerId: selectedProject?.developerId || '',
        typeOther: '', // Clear other type
        amenitiesOther: '' // Clear other amenities
      }));
      setShowPaymentPlan(selectedProject?.paymentPlans || null);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Destructure numeric fields to avoid spreading as strings
    const propertyData = {
      ...form,
      price: form.price ? Number(form.price) : 0,
      status: form.status as 'Available' | 'Rented' | 'Sold',
      createdBy: user.name,
      project: projects.find(p => p.id === form.projectId)?.name || '',
      type: showTypeOther ? form.typeOther : form.type,
      amenities: showAmenitiesOther
        ? [...form.amenities.filter((a: string) => a !== 'Other'), form.amenitiesOther].filter(Boolean)
        : form.amenities,
    };
    if (editId) {
      updateProperty(editId, propertyData);
    } else {
      addProperty(propertyData);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      deleteProperty(id);
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

  const filteredProperties = properties.filter(property =>
    (property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterProject ? property.projectId === filterProject : true) &&
    (filterZone ? property.zoneId === filterZone : true) &&
    (filterDeveloper ? property.developerId === filterDeveloper : true) &&
    (filterStatus ? property.status === filterStatus : true)
  );

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
    // Access control: Team Leader can only for their team, Sales Rep only for their own
    let found = leads.find(l => l.phone === reportPhone);
    if (!found) {
      setReportError('No client found with this number. Please check and try again.');
      return;
    }
    if (user?.role === 'Sales Rep' && found.assignedTo !== user.name) {
      setReportError('You do not have permission to generate a report for this client.');
      return;
    }
    if (user?.role === 'Team Leader' && found.assignedTo !== user.name && !(user.teamId && found.assignedTo.includes(user.teamId))) {
      setReportError('You do not have permission to generate a report for this client.');
      return;
    }
    setReportLead(found);
    setReportStep('preview');
    // KPI: increment report count
    const today = new Date().toISOString().slice(0,10);
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
      await html2pdf().from(element).save(`${reportProperty?.title}-${reportLead?.name}-Report.pdf`);
      style.remove();
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* Search and Actions + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select value={filterZone} onChange={e => setFilterZone(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">All Zones</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
          <select value={filterDeveloper} onChange={e => setFilterDeveloper(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">All Developers</option>
            {developers.map(dev => (
              <option key={dev.id} value={dev.id}>{dev.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Rented">Rented</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </button>
        </div>
      </div>

      {/* Properties Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area (SQFT)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed/Bathrooms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amenities</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProperties.map((property) => {
              const zone = zones.find(z => z.id === property.zoneId);
              return (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Number(property.price).toLocaleString()} EGP</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.area}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.bedrooms} / {property.bathrooms}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Array.isArray(property.amenities) ? property.amenities.join(', ') : property.amenities}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 underline cursor-pointer" onClick={() => zone && setZoneModal(zone)}>
                    {zone ? <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{zone.name}</span> : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.project}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.status)}`}>{property.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800" onClick={() => openEditForm(property)}><Edit className="h-4 w-4" /></button>
                      <button className="text-red-600 hover:text-red-800" onClick={() => handleDelete(property.id)}><Trash2 className="h-4 w-4" /></button>
                      {canGenerateReport && (
                        <button className="text-green-600 hover:text-green-800" title="Generate Client Report" onClick={() => handleOpenReport(property)}>
                          <FileText className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Property Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{editId ? 'Edit Property' : 'Add Property'}</h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" name="title" value={form.title} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required>
                  <option value="">Select Type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
                {showTypeOther && (
                  <input type="text" name="typeOther" placeholder="Specify other type" value={form.typeOther || ''} onChange={e => setForm(prev => ({ ...prev, typeOther: e.target.value }))} className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                )}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input type="number" name="price" value={form.price} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required placeholder="2200000" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Area (SQFT)</label>
                <input type="text" name="area" value={form.area} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1 flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input type="text" name="bedrooms" value={form.bedrooms} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input type="text" name="bathrooms" value={form.bathrooms} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Parking</label>
                <input type="text" name="parking" value={form.parking} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                <div className="flex flex-wrap gap-3">
                  {['Elevator', 'Security', 'Garden', 'Pool', 'Other'].map(option => (
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
                      {option}
                    </label>
                  ))}
                </div>
                {showAmenitiesOther && (
                  <input type="text" name="amenitiesOther" placeholder="Specify other amenities" value={form.amenitiesOther || ''} onChange={e => setForm(prev => ({ ...prev, amenitiesOther: e.target.value }))} className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                )}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <select name="zoneId" value={form.zoneId} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select name="projectId" value={form.projectId} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer</label>
                <select name="developerId" value={form.developerId} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="">Select Developer</option>
                  {developers.map(dev => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required>
                  <option value="Available">Available</option>
                  <option value="Rented">Rented</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
              {/* Payment Plan Display */}
              {showPaymentPlan && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inherited Payment Plan</label>
                  {showPaymentPlan.map((plan: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4 mb-2 bg-gray-50">
                      <div className="flex gap-4 text-xs">
                        <div><span className="font-semibold text-blue-600">{plan.downPayment}%</span> Down Payment</div>
                        <div><span className="font-semibold text-green-600">{plan.installments}%</span> Installments</div>
                        <div><span className="font-semibold text-orange-600">{plan.delivery}%</span> Delivery</div>
                        <div><span className="font-semibold text-gray-700">{plan.schedule}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="col-span-2 flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors">{editId ? 'Update' : 'Add'} Property</button>
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Zone: {zoneModal.name}</h3>
            <div className="mb-2 text-gray-700">Latitude: <span className="font-mono">{zoneModal.latitude}</span></div>
            <div className="mb-4 text-gray-700">Longitude: <span className="font-mono">{zoneModal.longitude}</span></div>
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
                    {zoneModal.name}<br />({zoneModal.latitude}, {zoneModal.longitude})
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-500">No geo-location available</span>
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
              aria-label="Close Report"
            >
              &times;
            </button>
            {reportStep === 'input' && (
              <form onSubmit={handleReportPhoneSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Client Report</h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter Client Phone Number</label>
                <input type="text" value={reportPhone} onChange={e => setReportPhone(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {reportError && <div className="text-red-600 text-sm">{reportError}</div>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowReportModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Next</button>
                </div>
              </form>
            )}
            {reportStep === 'preview' && reportLead && (
              <div id="report-preview" className="bg-white p-4 print:p-0 print:bg-white print:shadow-none" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                {/* Header */}
                <div className="flex items-center mb-4 border-b pb-2 justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Propai Real Estate</h2>
                    <div className="text-xs text-gray-500">www.propai.com | info@propai.com</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src="src\RockaidevLogo.jpg" alt="Company Logo" className="h-12 w-12 rounded-lg ml-2" style={{borderRadius: '12px'}} onError={e => (e.currentTarget.style.display='none')} />
                  </div>
                </div>
                {/* Client Info */}
                {reportLead && (
                  <>
                    {(reportLead.name || reportLead.phone || reportLead.budget || reportLead.status || reportLead.assignedTo) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Client Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {reportLead.name && <div><span className="font-medium">Name:</span> {reportLead.name}</div>}
                          {reportLead.phone && <div><span className="font-medium">Phone:</span> {reportLead.phone}</div>}
                          {reportLead.budget && <div><span className="font-medium">Budget:</span> {reportLead.budget}</div>}
                          {reportLead.status && <div><span className="font-medium">Status:</span> {reportLead.status}</div>}
                          {reportLead.assignedTo && <div><span className="font-medium">Assigned Rep:</span> {reportLead.assignedTo}</div>}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* Property Info */}
                {reportProperty && (
                  <>
                    {(reportProperty.title || reportProperty.type || reportProperty.price || reportProperty.area || reportProperty.location || reportProperty.bedrooms || reportProperty.bathrooms || reportProperty.parking || reportProperty.amenities || reportProperty.project) && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Property Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {reportProperty.title && <div><span className="font-medium">Title:</span> {reportProperty.title}</div>}
                          {reportProperty.type && <div><span className="font-medium">Type:</span> {reportProperty.type}</div>}
                          {reportProperty.price && <div><span className="font-medium">Price:</span> {Number(reportProperty.price).toLocaleString()} EGP</div>}
                          {reportProperty.area && <div><span className="font-medium">Area:</span> {reportProperty.area}</div>}
                          {reportProperty.location && <div><span className="font-medium">Location:</span> {reportProperty.location}</div>}
                          {reportProperty.bedrooms && <div><span className="font-medium">Bedrooms:</span> {reportProperty.bedrooms}</div>}
                          {reportProperty.bathrooms && <div><span className="font-medium">Bathrooms:</span> {reportProperty.bathrooms}</div>}
                          {reportProperty.parking && <div><span className="font-medium">Parking:</span> {reportProperty.parking}</div>}
                          {reportProperty.amenities && <div><span className="font-medium">Amenities:</span> {Array.isArray(reportProperty.amenities) ? reportProperty.amenities.join(', ') : reportProperty.amenities}</div>}
                          {reportProperty.project && <div><span className="font-medium">Project:</span> {reportProperty.project}</div>}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {/* Payment Plan Table - Full Installments */}
                {(() => {
                  // Find the linked project and its first payment plan
                  const project = projects.find(p => p.id === reportProperty?.projectId);
                  const plan = project && Array.isArray(project.paymentPlans) ? project.paymentPlans[0] : null;
                  const price = Number(reportProperty?.price || 0);
                  if (!plan || !price) return null;
                  const schedule = generatePaymentSchedule(price, plan);
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
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Plan {project?.name ? ` ${project.name}` : ''}</h3>
                      {/* Summary Card */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center bg-blue-100 text-blue-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                          Down Payment: <span className="ml-1">{plan.downPayment}%</span>
                        </div>
                        <div className="flex items-center bg-green-100 text-green-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>
                          Installments: <span className="ml-1">{100 - (plan.downPayment || 0) - (plan.delivery || 0)}%</span>
                        </div>
                        <div className="flex items-center bg-orange-100 text-orange-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" /></svg>
                          Delivery: <span className="ml-1">{plan.delivery}%</span>
                        </div>
                        <div className="flex items-center bg-gray-100 text-gray-800 rounded-lg px-4 py-2 font-bold text-sm shadow-sm">
                          <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3M16 7V3M4 11H20M4 19H20M4 15H20" /></svg>
                          Delivery Date: <span className="ml-1">{deliveryDateStr}</span>
                        </div>
                      </div>
                      {/* Table */}
                      <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-blue-600 text-white">
                              <th className="border px-3 py-2 font-bold">Payment</th>
                              <th className="border px-3 py-2 font-bold">Date</th>
                              <th className="border px-3 py-2 font-bold">Amount</th>
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
                                <td className="border px-3 py-2">{item.dueDate}</td>
                                <td className={`border px-3 py-2 ${item.label && item.label.toLowerCase().includes('down payment') ? 'text-blue-700' : item.label && item.label.toLowerCase().includes('delivery') ? 'text-orange-700' : ''}`}>{item.amount.toLocaleString()} EGP</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* Totals */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-base font-bold">
                        <div>Total Price: <span className="text-blue-700">{price.toLocaleString()} EGP</span></div>
                        <div>Down Payment: <span className="text-green-700">{downPayment.toLocaleString()} EGP</span></div>
                        <div>Installments: <span className="text-orange-700">{installmentsTotal.toLocaleString()} EGP</span></div>
                        <div>Developer: <span className="text-gray-700">{developers.find(d => d.id === project?.developerId)?.name || project?.developer || '-'}</span></div>
                      </div>
                    </div>
                  );
                })()}
                {/* Images */}
                {reportProperty && Array.isArray(reportProperty.images) && reportProperty.images.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Property Images</h3>
                    <div className="flex gap-2">
                      {reportProperty.images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="Property" className="h-24 w-32 object-cover rounded border" />
                      ))}
                    </div>
                  </div>
                )}
                {/* Notes */}
                {reportNotes && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Custom Notes</h3>
                    <textarea value={reportNotes} onChange={e => setReportNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} placeholder="Add custom notes..." />
                  </div>
                )}
                {/* Footer */}
                <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                  <div>Propai Real Estate | www.propai.com | info@propai.com</div>
                  <div>123 Main St, Alexandria, Egypt</div>
                  <div className="mt-1">This report is confidential and intended for the recipient only.</div>
                </div>
                {/* Export Buttons (restored to original position) */}
                <div className="flex justify-end gap-2 mt-6 print:hidden no-pdf" id="report-export-buttons">
                  <button onClick={handlePrint} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Print</button>
                  <button onClick={handleDownloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesTab;