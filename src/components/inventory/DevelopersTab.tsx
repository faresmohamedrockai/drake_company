import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Building } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface Developer {
  id: string;
  name: string;
  email: string;
  phone: string;
  projects: number;
  established: string;
  location: string;
}

const DevelopersTab: React.FC = () => {
  const { developers, addDeveloper, updateDeveloper, deleteDeveloper } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  // Add image and bilingual name to form state
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLink, setImageLink] = useState('');

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
    setImageFile(null);
    setImageLink('');
    setShowForm(true);
  };

  const openEditForm = (developer: any) => {
    setEditId(developer.id);
    setForm({ ...developer, nameEn: developer.nameEn || '', nameAr: developer.nameAr || '', image: developer.image || '', createdBy: developer.createdBy || user?.name || 'System' });
    setImageFile(null);
    setImageLink('');
    setShowForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'projects' ? Number(value) : value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageLink(e.target.value);
    setForm((prev) => ({ ...prev, image: e.target.value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const developerData = {
      ...form,
      name: form.nameEn + (form.nameAr ? ' / ' + form.nameAr : ''),
      image: form.image,
      createdBy: user.name
    };
    if (editId) {
      updateDeveloper(editId, developerData);
    } else {
      addDeveloper(developerData);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this developer?')) {
      deleteDeveloper(id);
    }
  };

  const filteredDevelopers = developers.filter(developer =>
    developer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    developer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    developer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search developers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center" onClick={openAddForm}>
          <Plus className="h-5 w-5 mr-2" />
          Add Developer
        </button>
      </div>

      {/* Developers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevelopers.map((developer) => (
          <div key={developer.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col items-center">
            <div className="flex flex-col items-center mb-4 w-full">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-2 overflow-hidden border-2 border-blue-200">
                {(developer as any).image ? (
                  <img
                    src={(developer as any).image}
                    alt={developer.name}
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
                <Building className={`h-10 w-10 text-blue-600 ${(developer as any).image ? 'hidden' : ''}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                {developer.name}
              </h3>
            </div>
            <div className="space-y-2 w-full">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Location:</span>
                <span className="text-sm text-gray-900">{developer.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Established:</span>
                <span className="text-sm text-gray-900">{developer.established}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Active Projects:</span>
                <a
                  href="#"
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // Custom event or navigation logic to go to Projects tab and filter by developer
                    const event = new CustomEvent('navigateToProjects', { detail: { developer: developer.name } });
                    window.dispatchEvent(event);
                  }}
                >
                  {developer.projects}
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
        ))}
      </div>

      {/* Add/Edit Developer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{editId ? 'Edit Developer' : 'Add Developer'}</h3>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input type="text" name="nameEn" value={form.nameEn} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                <input type="text" name="nameAr" value={form.nameAr} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="block" />
                  <span className="text-gray-500 text-xs">or</span>
                  <input type="url" placeholder="Paste image URL" value={imageLink} onChange={handleImageLinkChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.image && (
                    <img src={form.image} alt="Preview" className="h-12 w-12 rounded-full object-cover border ml-2" />
                  )}
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" name="location" value={form.location} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Established</label>
                <input type="text" name="established" value={form.established} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Projects</label>
                <input type="number" name="projects" value={form.projects} onChange={handleFormChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" required min={0} />
              </div>
              <div className="col-span-2 flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg bg-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-semibold transition-colors">{editId ? 'Update' : 'Add'} Developer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopersTab;