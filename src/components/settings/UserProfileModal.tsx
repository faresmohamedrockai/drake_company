import React, { useState, ChangeEvent } from 'react';
import { User as UserType } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserProfileModalProps {
  user: UserType | null;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const { updateUser } = useData();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation('settings');
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.avatar);
  const [saving, setSaving] = useState(false);
  const [showHomeScreenConfig, setShowHomeScreenConfig] = useState(false);
  const [homeScreenConfig, setHomeScreenConfig] = useState({
    appName: settings?.companyName || 'Propai CRM',
    appLogo: '/src/aspects/propai logo.png',
    appLogoPreview: '/src/aspects/propai logo.png',
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  if (!user) return null;

  // Listen for the beforeinstallprompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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

  const handleHomeScreenConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHomeScreenConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHomeScreenConfig((prev) => ({ 
          ...prev, 
          appLogo: reader.result as string,
          appLogoPreview: reader.result as string 
        }));
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

  const addToHomeScreen = async () => {
    // Check if we have a deferred prompt (PWA installation)
    if (deferredPrompt) {
      try {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          alert(t('profile.installSuccess'));
        } else {
          alert(t('profile.installCancelled'));
        }
        
        // Clear the deferred prompt
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Error during PWA installation:', error);
        fallbackAddToHomeScreen();
      }
    } else {
      fallbackAddToHomeScreen();
    }
  };

  const fallbackAddToHomeScreen = () => {
    const url = window.location.href;
    const title = homeScreenConfig.appName;
    
    // Check if it's iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      // iOS Safari instructions
      alert(`${t('profile.iosInstructions')}\n\n1. ${t('profile.iosStep1')}\n2. ${t('profile.iosStep2')}\n3. ${t('profile.iosStep3')}`);
    } else if (navigator.share) {
      // Use Web Share API if available
      navigator.share({
        title: title,
        url: url,
        text: t('profile.shareText')
      }).catch(() => {
        copyToClipboard(url);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert(`${t('profile.urlCopied')}\n\n${url}\n\n${t('profile.manualInstructions')}`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`${t('profile.urlCopied')}\n\n${url}\n\n${t('profile.manualInstructions')}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('profile.myProfile')}</h2>
        
        {!showHomeScreenConfig ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col items-center">
              <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200 shadow-md">
                  {imagePreview ? (
                    <img src={imagePreview} alt="avatar" className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-3xl text-blue-600 font-bold">{user.name.charAt(0)}</span>
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
            
            {/* Add to Home Screen Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowHomeScreenConfig(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>{t('profile.addToHomeScreen')}</span>
              </button>
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
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.configureHomeScreen')}</h3>
              <p className="text-gray-600 text-sm">{t('profile.configureHomeScreenDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.appName')}</label>
              <input
                type="text"
                name="appName"
                value={homeScreenConfig.appName}
                onChange={handleHomeScreenConfigChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('profile.appNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.appLogo')}</label>
              <div className="flex items-center space-x-3">
                <label htmlFor="app-logo-upload" className="cursor-pointer">
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-colors">
                                      {homeScreenConfig.appLogoPreview ? (
                    <img src={homeScreenConfig.appLogoPreview} alt="app logo" className="object-cover w-full h-full" />
                  ) : (
                    <img src="/src/aspects/propai logo.png" alt="Propai logo" className="object-cover w-full h-full" />
                  )}
                  </div>
                  <input
                    id="app-logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAppLogoChange}
                  />
                </label>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{t('profile.appLogoDesc')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setHomeScreenConfig(prev => ({
                        ...prev,
                        appLogo: '/src/aspects/propai logo.png',
                        appLogoPreview: '/src/aspects/propai logo.png'
                      }));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    {t('profile.resetToPropaiLogo')}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">{t('profile.preview')}</h4>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center overflow-hidden">
                  {homeScreenConfig.appLogoPreview ? (
                    <img src={homeScreenConfig.appLogoPreview} alt="preview" className="object-cover w-full h-full" />
                  ) : (
                    <img src="/src/aspects/propai logo.png" alt="Propai logo" className="object-cover w-full h-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{homeScreenConfig.appName}</p>
                  <p className="text-sm text-gray-500">Propai CRM</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowHomeScreenConfig(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                {t('profile.back')}
              </button>
              <button
                type="button"
                onClick={addToHomeScreen}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {t('profile.createShortcut')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal; 