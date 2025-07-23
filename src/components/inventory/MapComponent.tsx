import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useLanguage } from '../../contexts/LanguageContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone } from './ZonesTab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';

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
  zones?: Zone[];
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
  setShowAddZoneModal,
  zones
}) => {
  // const { zones, addZone } = useData();
  const user = JSON.parse(localStorage.getItem('propai_user') || '{}');
  const { language } = useLanguage(); // Add language context
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    nameEn: '',
    nameAr: '',
    description: ''
  });
  const [successMsg, setSuccessMsg] = useState('');
  const queryClient = useQueryClient();
  // Helper function to get language-appropriate zone name
  const getZoneName = (zone: any) => {
    if (!zone) return '';
    if (language === 'ar' && zone.nameAr) {
      return zone.nameAr;
    }
    return zone.nameEn || zone.name;
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    if (setShowAddZoneModal) {
      setShowAddZoneModal(true);
    }
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  const { mutateAsync: addZoneMutation, isPending: isAdding } = useMutation({
    mutationFn: (zone: Zone) => addZone(zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone added successfully!');
      if (setShowAddZoneModal) {
        setShowAddZoneModal(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
      if (setShowAddZoneModal) {
        setShowAddZoneModal(false);
      }
    }
  });

  const addZone = async (zone: Zone) => {
    const response = await axiosInterceptor.post('/zones/create', zone);
    return response.data as Zone;
  }

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation && user && zoneForm.nameEn.trim()) {
      addZoneMutation({
        nameEn: zoneForm.nameEn.trim(),
        nameAr: zoneForm.nameAr.trim(),
        description: zoneForm.description.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      setZoneForm({ name: '', nameEn: '', nameAr: '', description: '' });
      setSelectedLocation(null);
      // setSuccessMsg(language === 'ar' ? 'تم إضافة المنطقة بنجاح!' : 'Zone added successfully!');
      // setTimeout(() => setSuccessMsg(''), 2000);

    }
  };


  const defaultCenter: [number, number] = [31.221169, 29.938073]; // sidi gaber - Alexandria

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      {/* Map Section */}
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
          {zones?.map((zone: Zone) => (
            <Marker key={zone.id} position={[zone.latitude, zone.longitude]}>
              <Popup>
                <div>
                  <h3 className="font-semibold">{getZoneName(zone)}</h3>
                  <p className="text-sm text-gray-600">{zone.description}</p>
                  <p className="text-xs text-gray-500">{zone.projects?.length || 0} properties</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Pin for new zone location (no popup) */}
          {showAddZoneModal && selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
          )}
        </MapContainer>
      </div>
      {/* Side Panel Form */}
      {showAddZoneModal && selectedLocation && (
        <div className="md:w-1/3 w-full bg-white rounded-2xl shadow-2xl border border-blue-200 self-start mt-2 mb-2 flex flex-col animate-fadeIn">
          <div className="bg-blue-600 rounded-t-2xl px-6 py-3 mb-0 flex items-center">
            <h3 className="text-lg font-bold text-white flex-1">
              {language === 'ar' ? 'إضافة منطقة جديدة' : 'Add New Zone'}
            </h3>
          </div>
          <div className="p-6">
            {successMsg && <div className="mb-2 text-green-600 text-sm font-medium">{successMsg}</div>}
            <form onSubmit={handleAddZone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  name="nameEn"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={zoneForm.nameEn}
                  onChange={e => setZoneForm({ ...zoneForm, nameEn: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                </label>
                <input
                  type="text"
                  name="nameAr"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={zoneForm.nameAr}
                  onChange={e => setZoneForm({ ...zoneForm, nameAr: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  name="description"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={zoneForm.description}
                  onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })}
                />
              </div>
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs">
                <span className="text-gray-600">
                  {language === 'ar' ? 'الموقع: ' : 'Location: '}
                </span>
                <span className="font-mono">{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(null);
                    if (setShowAddZoneModal) {
                      setShowAddZoneModal(false);
                    }
                  }}
                  className="px-4 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors text-sm"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors text-sm"
                  disabled={!zoneForm.nameEn.trim()}
                >
                  {language === 'ar' ? 'إضافة المنطقة' : 'Add Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;