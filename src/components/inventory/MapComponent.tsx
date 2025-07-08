import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  showAddZoneModal?: boolean;
  setShowAddZoneModal?: (show: boolean) => void;
}

const MapClickHandler: React.FC<{ onLocationSelect?: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  onLocationSelect, 
  showAddZoneModal, 
  setShowAddZoneModal 
}) => {
  const { zones, addZone } = useData();
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    description: ''
  });
  const [successMsg, setSuccessMsg] = useState('');

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    if (setShowAddZoneModal) {
      setShowAddZoneModal(true);
    }
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation && user && zoneForm.name.trim() && zoneForm.description.trim()) {
      addZone({
        name: zoneForm.name.trim(),
        description: zoneForm.description.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        createdBy: user.name
      });
      setZoneForm({ name: '', description: '' });
      setSelectedLocation(null);
      setSuccessMsg('Zone added successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
      if (setShowAddZoneModal) {
        setShowAddZoneModal(false);
      }
    }
  };

  
  const defaultCenter: [number, number] = [31.221169, 29.938073]; // sidi gaber - Alexandria

  return (
    <div className={`flex flex-col md:flex-row gap-6 w-full`}>
      <div className={showAddZoneModal && selectedLocation ? 'md:w-2/3 w-full' : 'w-full'}>
        <MapContainer
          center={defaultCenter}
          zoom={10}
          style={{ height: '400px', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {/* Existing zones */}
          {zones.map((zone) => (
            <Marker key={zone.id} position={[zone.latitude, zone.longitude]}>
              <Popup>
                <div>
                  <h3 className="font-semibold">{zone.name}</h3>
                  <p className="text-sm text-gray-600">{zone.description}</p>
                  <p className="text-xs text-gray-500">{zone.properties} properties</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Selected location for new zone */}
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>
                <div>
                  <p className="text-sm">New zone location</p>
                  <p className="text-xs text-gray-500">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {showAddZoneModal && selectedLocation && (
        <div className="md:w-1/3 w-full bg-white rounded-lg p-6 shadow-lg self-start">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Zone</h3>
          {successMsg && <div className="mb-2 text-green-600 text-sm font-medium">{successMsg}</div>}
          <form onSubmit={handleAddZone} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
              <input
                type="text"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter zone name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={zoneForm.description}
                onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter zone description"
                required
              />
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Location:</p>
              <p className="text-sm font-mono">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation(null);
                  if (setShowAddZoneModal) {
                    setShowAddZoneModal(false);
                  }
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!(zoneForm.name.trim() && zoneForm.description.trim())}
              >
                Add Zone
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MapComponent;