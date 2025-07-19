import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import MapComponent from './MapComponent';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import { toast } from 'react-toastify';

export interface Zone {
  id?: string;
  nameEn: string;
  nameAr: string;
  description: string;
  latitude: number;
  longitude: number;
  projects?: any[];
}

const ZonesTab: React.FC = () => {
  // const { zones, deleteZone, updateZone } = useData();
  const { language } = useLanguage(); // Add language context
  const { t } = useTranslation('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editZone, setEditZone] = useState<any | null>(null);
  const [editZoneData, setEditZoneData] = useState<any>({ name: '', nameEn: '', nameAr: '', description: '', latitude: '', longitude: '', properties: 0 });
  const queryClient = useQueryClient();
  const { data: zones, isLoading, error } = useQuery<Zone[]>({
    queryKey: ['zones'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: () => getZones(),
  });

  const getZones = async () => {
    const response = await axiosInterceptor.get('/zones');
    return response.data.zones as Zone[];
  }

  const { mutateAsync: editZoneMutation, isPending: isEditing } = useMutation({
    mutationFn: (zone: Zone) => updateZone(zone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success(t('zoneUpdated'));
      setEditZone(null);
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
      setEditZone(null);
    }
  });

  const { mutateAsync: deleteZoneMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast.success(t('zoneDeleted'));
    },
    onError: (error: any) => {
      toast.error(error.response.data.message);
    }
  });

  const updateZone = async (zone: Zone) => {
    const response = await axiosInterceptor.patch(`/zones/${zone.id}`, zone);
    return response.data as Zone;
  }

  const deleteZone = async (id: string) => {
    const response = await axiosInterceptor.delete(`/zones/${id}`);
    return response.data as Zone;
  }

  useEffect(() => {
    if (error) {
      toast.error((error as any).response.data.message);
    }
  }, [error]);

  // Helper function to get language-appropriate zone name
  const getZoneName = (zone: Zone) => {
    if (!zone) return '';
    if (language === 'ar' && zone.nameAr) {
      return zone.nameAr;
    }
    return zone.nameEn;
  };

  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  useEffect(() => {
    const filteredZones = zones?.filter(zone =>
      getZoneName(zone).toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredZones(filteredZones || []);
  }, [zones, searchTerm]);


  const handleDeleteZone = (id: string) => {
    if (window.confirm(t('confirmDeleteZone'))) {
      deleteZoneMutation(id);
    }
  };

  const handleEditZone = (zone: any) => {
    setEditZone(zone);
    setEditZoneData({
      ...zone,
      nameEn: zone.nameEn || '',
      nameAr: zone.nameAr || ''
    });
  };

  const handleEditZoneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditZoneData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editZoneMutation(editZoneData as Zone);
    setEditZone(null);
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'المناطق' : 'Zones'}
        </h2>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchZones')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Map Placeholder */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('zoneMap')}</h3>
          <MapComponent
            showAddZoneModal={showAddModal}
            setShowAddZoneModal={setShowAddModal}
            zones={zones}
          />
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  {language === 'ar' ? 'إضافة منطقة جديدة' : 'Add New Zone'}
                </p>
                <p className="text-sm text-blue-700">
                  {language === 'ar' 
                    ? 'انقر على الخريطة لإنشاء منطقة جديدة. يمكنك تحديد الموقع بدقة وإضافة تفاصيل المنطقة.'
                    : 'Click on the map to create a new zone. You can precisely select the location and add zone details.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Zones List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('zonesList')}</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredZones?.map((zone: Zone) => (
              <div key={zone.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{getZoneName(zone)}</h4>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800" onClick={() => handleEditZone(zone)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id as string)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{zone.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{t('latitude')}: {zone.latitude}, {t('longitude')}: {zone.longitude}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {t('properties')}: {zone.projects?.length || 0}
                  </span>
                </div>
              </div>
            ))}
            {filteredZones?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? t('noZonesFound') : t('noZonesCreated')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Zone Modal as right-side drawer */}
      {editZone && (
        <div className="fixed inset-0 z-[9999] flex justify-center items-center">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => setEditZone(null)} />
          {/* Drawer */}
          <div className="right-0 top-0 h-full w-full max-w-md max-h-[60vh] sm:max-h-[70vh] bg-white shadow-2xl p-4 sm:p-6 flex flex-col relative animate-slide-in-right overflow-y-auto rounded-2xl my-6 z-[10000]">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setEditZone(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('editZone')}</h3>
            <form onSubmit={handleEditZoneSubmit} className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('zoneNameEn')}</label>
                <input type="text" name="nameEn" value={editZoneData.nameEn} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('zoneNameAr')}</label>
                <input type="text" name="nameAr" value={editZoneData.nameAr} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('descriptionOptional')}</label>
                <textarea name="description" value={editZoneData.description} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('latitude')}</label>
                <input type="text" name="latitude" value={editZoneData.latitude} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('longitude')}</label>
                <input type="text" name="longitude" value={editZoneData.longitude} onChange={handleEditZoneChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex justify-end gap-2 mt-auto">
                <button type="button" onClick={() => setEditZone(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800">{t('cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={isEditing}>{isEditing ? t('saving') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesTab;