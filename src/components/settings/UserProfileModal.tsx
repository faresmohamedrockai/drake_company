import React, { useState, ChangeEvent } from 'react';
import { User as UserType } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
// import { useLanguage } from '../../contexts/LanguageContext';

interface UserProfileModalProps {
  user: UserType | null;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const { updateUser } = useData();
  const { logout } = useAuth();
  const { t } = useTranslation('settings');
  // const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.avatar);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    updateUser(user.id, formData);
    setSaving(false);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fadeIn">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('profile.myProfile')}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center">
            <label htmlFor="avatar-upload" className="cursor-pointer group relative">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200 shadow-md">
                {imagePreview ? (
                  <img src={imagePreview} alt="avatar" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-3xl text-blue-600 font-bold">{user.name}</span>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity">{t('profile.edit')}</span>
                </div>
              </div>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.fullName')}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.email')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              {t('profile.logout')}
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={saving}
              >
                {t('profile.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? t('profile.saving') : t('profile.saveChanges')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal; 