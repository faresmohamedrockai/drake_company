import React, { useState, ChangeEvent } from 'react';
import { User as UserType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInterceptor from '../../../axiosInterceptor/axiosInterceptor';
import imageCompression from 'browser-image-compression';
import { validateEmail, getEmailErrorMessage } from '../../utils/emailValidation';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';

interface UserProfileModalProps {
  user: UserType | null;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  // const { updateUser } = useData();
  const { logout, user: authUser } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation('settings');
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    image: user?.image || '',
  });

  const queryClient = useQueryClient();
  const { mutateAsync: updateUserMutation, isPending } = useMutation({
    mutationFn: (data: { id: string; formData: any }) => updateUser(data.id, data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User updated successfully");
      localStorage.setItem('propai_user', JSON.stringify(formData));
    }
  })

  const updateUser = async (userId: string, formData: any) => {
    const response = await axiosInterceptor.patch(`/auth/update-user/${userId}`, formData);
    return response.data;
  }
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.image || '');
  const [homeScreenConfig, setHomeScreenConfig] = useState({
    appName: settings?.companyName || 'Propai CRM',
    appLogo: '/src/aspects/propai logo.png',
    appLogoPreview: '/src/aspects/propai logo.png',
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [showInstallError, setShowInstallError] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const [emailError, setEmailError] = useState('');

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

    // Clear email error when user types
    if (name === 'email') {
      setEmailError('');
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImageToBase64(file);
      setFormData((prev) => ({ ...prev, image: base64 }));
      setImagePreview(base64);
    }
  };

  const compressImageToBase64 = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.2,            
      maxWidthOrHeight: 300,     
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const base64 = await imageCompression.getDataUrlFromFile(compressedFile);
      return base64;
    } catch (error) {
      console.error('Compression failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    // Email validation
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError(getEmailErrorMessage(formData.email, language));
      return;
    }

    // Update user in DataContext
    await updateUserMutation({ id: user.id, formData });

    // Also update the current user in AuthContext if it's the same user
    if (authUser && authUser.id === user.id) {
      const updatedUser = { ...authUser, ...formData };
      localStorage.setItem('propai_user', JSON.stringify(updatedUser));
    }

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
          setInstallMessage(t('profile.installSuccess'));
          setShowInstallSuccess(true);
          setTimeout(() => setShowInstallSuccess(false), 3000);
        } else {
          setInstallMessage(t('profile.installCancelled'));
          setShowInstallError(true);
          setTimeout(() => setShowInstallError(false), 3000);
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
      setInstallMessage(`${t('profile.iosInstructions')}\n\n1. ${t('profile.iosStep1')}\n2. ${t('profile.iosStep2')}\n3. ${t('profile.iosStep3')}`);
      setShowInstallError(true);
      setTimeout(() => setShowInstallError(false), 5000);
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
      setInstallMessage(`${t('profile.urlCopied')}\n\n${url}\n\n${t('profile.manualInstructions')}`);
      setShowInstallSuccess(true);
      setTimeout(() => setShowInstallSuccess(false), 5000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setInstallMessage(`${t('profile.urlCopied')}\n\n${url}\n\n${t('profile.manualInstructions')}`);
      setShowInstallSuccess(true);
      setTimeout(() => setShowInstallSuccess(false), 5000);
    }
  };

  return (
    <>
      {/* Success/Error Notifications */}
      {showInstallSuccess && (
        <div className="fixed top-4 right-4 z-60 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slideInRight">
          <CheckCircle className="h-5 w-5" />
          <div className="whitespace-pre-line">{installMessage}</div>
        </div>
      )}

      {showInstallError && (
        <div className="fixed top-4 right-4 z-60 bg-yellow-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-slideInRight max-w-md">
          <AlertCircle className="h-5 w-5" />
          <div className="whitespace-pre-line">{installMessage}</div>
        </div>
      )}

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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${emailError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                required
                placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-1">{emailError}</p>
              )}
            </div>

            {/* Add to Home Screen Section */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{t('profile.addToHomeScreen')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Install this app on your device for quick access and offline functionality.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={addToHomeScreen}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  <span>{t('profile.addToHomeScreen')}</span>
                </button>

                {deferredPrompt && (
                  <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span>PWA installation available</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
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
                  disabled={isPending}
                >
                  {t('profile.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                  disabled={isPending}
                >
                  {isPending ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserProfileModal; 