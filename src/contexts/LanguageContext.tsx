import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isRTL: boolean;
  rtlClass: (ltrClass: string, rtlClass: string) => string;
  rtlMargin: (ltrMargin: string, rtlMargin: string) => string;
  rtlPadding: (ltrPadding: string, rtlPadding: string) => string;
  rtlPosition: (ltrPosition: string, rtlPosition: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Store in localStorage
    localStorage.setItem('language', lang);
  };

  const isRTL = language === 'ar';

  // RTL utility functions
  const rtlClass = (ltrClass: string, rtlClass: string) => {
    return isRTL ? rtlClass : ltrClass;
  };

  const rtlMargin = (ltrMargin: string, rtlMargin: string) => {
    return isRTL ? rtlMargin : ltrMargin;
  };

  const rtlPadding = (ltrPadding: string, rtlPadding: string) => {
    return isRTL ? rtlPadding : ltrPadding;
  };

  const rtlPosition = (ltrPosition: string, rtlPosition: string) => {
    return isRTL ? rtlPosition : ltrPosition;
  };

  useEffect(() => {
    // Initialize language from localStorage
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
  }, []);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      isRTL, 
      rtlClass, 
      rtlMargin, 
      rtlPadding, 
      rtlPosition 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 