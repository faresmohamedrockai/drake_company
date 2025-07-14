import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from 'react-i18next';
import { Building2, User, Lock, Eye, EyeOff, Calendar, Briefcase } from 'lucide-react';

// import { a } from 'framer-motion/client';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // const { login } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation('auth');
const { login } = useAuth(); // ✅ استدعاء الـ context


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  const success = await login(email, password);

  if (!success) {
    setError(t('errorOccurred'));
  }

  setIsLoading(false);
};

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding with Background Image */}
      <div 
        className="flex-1 relative p-6 lg:p-12 flex flex-col justify-center items-center text-white min-h-[50vh] lg:min-h-screen"
        style={{
          backgroundImage: 'url(/src/aspects/loginphoto.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-purple-700/80"></div>
        
        {/* Content with relative positioning to appear above overlay */}
        <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center">
          <div className="flex items-center mb-6 lg:mb-8">
            <Building2 className="h-6 w-6 lg:h-8 lg:w-8 mr-2 lg:mr-3" />
            <h1 className="text-xl lg:text-2xl font-bold">{settings?.companyName || 'Propai'}</h1>
          </div>
          
          <h2 className="text-2xl lg:text-4xl font-bold mb-4 lg:mb-6">{t('completeSolution')}</h2>
          <p className="text-base lg:text-xl mb-6 lg:mb-8 text-blue-100 px-4">
            {t('description')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full max-w-lg">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6">
              <User className="h-6 w-6 lg:h-8 lg:w-8 mb-3 lg:mb-4 text-blue-200 mx-auto" />
              <h3 className="text-sm lg:text-lg font-semibold mb-2">{t('features.leadManagement.title')}</h3>
              <p className="text-xs lg:text-sm text-blue-100">{t('features.leadManagement.description')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6">
              <Building2 className="h-6 w-6 lg:h-8 lg:w-8 mb-3 lg:mb-4 text-blue-200 mx-auto" />
              <h3 className="text-sm lg:text-lg font-semibold mb-2">{t('features.inventoryControl.title')}</h3>
              <p className="text-xs lg:text-sm text-blue-100">{t('features.inventoryControl.description')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6">
              <Calendar className="h-6 w-6 lg:h-8 lg:w-8 mb-3 lg:mb-4 text-blue-200 mx-auto" />
              <h3 className="text-sm lg:text-lg font-semibold mb-2">{t('features.meetingScheduler.title')}</h3>
              <p className="text-xs lg:text-sm text-blue-100">{t('features.meetingScheduler.description')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:p-6">
              <Briefcase className="h-6 w-6 lg:h-8 lg:w-8 mb-3 lg:mb-4 text-blue-200 mx-auto" />
              <h3 className="text-sm lg:text-lg font-semibold mb-2">{t('features.dealTracker.title')}</h3>
              <p className="text-xs lg:text-sm text-blue-100">{t('features.dealTracker.description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-gray-50 min-h-[50vh] lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">{t('loginTo')}</h2>
            <p className="text-sm lg:text-base text-gray-600 mb-6 lg:mb-8">{t('enterCredentials')}</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 lg:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className="w-full pl-10 pr-12 py-2.5 lg:py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 lg:h-5 lg:w-5" /> : <Eye className="h-4 w-4 lg:h-5 lg:w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                    {t('rememberMe')}
                  </label>
                </div>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                  {t('forgotPassword')}
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2.5 lg:py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm lg:text-base font-medium"
              >
                {isLoading ? t('signingIn') : t('loginButton')}
              </button>
            </form>

            <div className="mt-6 text-center text-xs lg:text-sm text-gray-600">
              {t('demoCredentials')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;