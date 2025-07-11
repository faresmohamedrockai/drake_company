import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import MapComponent from './MapComponent';

const ZonesTab: React.FC = () => {
  const { zones, deleteZone, updateZone } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editZone, setEditZone] = useState<any | null>(null);
  const [editZoneData, setEditZoneData] = useState<any>({ name: '', description: '', latitude: '', longitude: '', properties: 0 });

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteZone = (id: string) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      deleteZone(id);
    }
  };

  const handleEditZone = (zone: any) => {
    setEditZone(zone);
    setEditZoneData({ ...zone });
  };

  const handleEditZoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditZoneData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editZone) {
      updateZone(editZone.id, {
        ...editZoneData,
        properties: Number(editZoneData.properties) || 0
      });
      setEditZone(null);
    }
  };

  return (
    <div>
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search zones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Map Placeholder */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Map</h3>
          <MapComponent 
            showAddZoneModal={showAddModal}
            setShowAddZoneModal={setShowAddModal}
          />
          <p className="text-sm text-gray-500 mt-2">Click on the map to add new zones</p>
        </div>

        {/* Zones List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zones List</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{zone.name}</h4>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800" onClick={() => handleEditZone(zone)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteZone(zone.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{zone.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Lat: {zone.latitude}, Lng: {zone.longitude}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Properties: {zone.properties}
                  </span>
                </div>
              </div>
            ))}
            {filteredZones.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No zones found matching your search.' : 'No zones created yet. Click on the map to add zones.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Zone Modal as right-side drawer */}
      {editZone && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          {/* Overlay */}
          <div className="flex-1 bg-black bg-opacity-40" onClick={() => setEditZone(null)} />
          {/* Drawer */}
          <div className="w-full max-w-md max-h-[60vh] sm:max-h-[70vh] bg-white shadow-2xl p-4 sm:p-6 flex flex-col relative animate-slide-in-right overflow-y-auto rounded-2xl my-6">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setEditZone(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Zone</h3>
            <form onSubmit={handleEditZoneSubmit} className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input type="text" name="name" value={editZoneData.name} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea name="description" value={editZoneData.description} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input type="text" name="latitude" value={editZoneData.latitude} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input type="text" name="longitude" value={editZoneData.longitude} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Properties</label>
                <input
                  type="number"
                  name="properties"
                  min={0}
                  value={editZoneData.properties}
                  onChange={e => setEditZoneData((prev: any) => ({ ...prev, properties: Number(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-auto">
                <button type="button" onClick={() => setEditZone(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesTab;