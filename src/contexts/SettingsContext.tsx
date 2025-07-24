import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  companyName: import.meta.env.VITE_SIDE_BAR_NAME||"Propai CRM Real Estate",
  companyImage: import.meta.env.VITE_COMPANY_IMAGE||'https://res.cloudinary.com/db152mwtg/image/upload/v1753326042/images/hrglyn29vz6vdzvq0gnk.jpg',
  companyWebsite: import.meta.env.VITE_COMPANY_WEBSITE || 'www.propaicrm.com',
  companyEmail:import.meta.env.VITE_COMPANY_EMAIL || 'info@propaicrm.com' ,
  companyAddress: import.meta.env.VITE_COMPANY_ADDRESS || 'Rockai Dev Software Solutions, Sidi Gaber, Alexandria, Egypt',
};

const SettingsContext = createContext({
  settings: defaultSettings,
  setGlobalSettings: (settings: typeof defaultSettings) => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('propai_system_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const setGlobalSettings = (newSettings: typeof defaultSettings) => {
    setSettings(newSettings);
    localStorage.setItem('propai_system_settings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    // Listen for changes in localStorage (multi-tab sync)
    const handler = () => {
      const saved = localStorage.getItem('propai_system_settings');
      if (saved) setSettings(JSON.parse(saved));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setGlobalSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 