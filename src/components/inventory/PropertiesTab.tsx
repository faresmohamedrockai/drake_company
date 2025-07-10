import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  amenities: string;
  project: string;
  status: 'Available' | 'Rented' | 'Sold';
}

const PropertiesTab: React.FC = () => {
  const { properties, addProperty, updateProperty, deleteProperty, projects, zones, developers } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    type: '',
    price: '',
    location: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    amenities: '',
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

  const openAddForm = () => {
    setEditId(null);
    setForm({
      title: '',
      type: '',
      price: '',
      location: '',
      area: '',
      bedrooms: '',
      bathrooms: '',
      parking: '',
      amenities: '',
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
      setShowAmenitiesOther(value === 'Other');
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const propertyData = {
      ...form,
      status: form.status as 'Available' | 'Rented' | 'Sold',
      createdBy: user.name,
      project: projects.find(p => p.id === form.projectId)?.name || '',
      type: showTypeOther ? form.typeOther : form.type,
      amenities: showAmenitiesOther ? form.amenitiesOther : form.amenities,
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
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
          <Plus className="h-5 w-5 mr-2" />
          Add Property
        </button>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.area}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.bedrooms} / {property.bathrooms}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.amenities}</td>
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
                <input type="text" name="price" value={form.price} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
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
                <select name="amenities" value={form.amenities} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required>
                  <option value="">Select Amenities</option>
                  <option value="Elevator">Elevator</option>
                  <option value="Security">Security</option>
                  <option value="Garden">Garden</option>
                  <option value="Pool">Pool</option>
                  <option value="Other">Other</option>
                </select>
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
    </div>
  );
};

export default PropertiesTab;