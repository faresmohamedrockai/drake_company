import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enLeads from './locales/en/leads.json';
import enInventory from './locales/en/inventory.json';
import enMeetings from './locales/en/meetings.json';
import enContracts from './locales/en/contracts.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enAuth from './locales/en/auth.json';
import arCommon from './locales/ar/common.json';
import arDashboard from './locales/ar/dashboard.json';
import arLeads from './locales/ar/leads.json';
import arInventory from './locales/ar/inventory.json';
import arMeetings from './locales/ar/meetings.json';
import arContracts from './locales/ar/contracts.json';
import arReports from './locales/ar/reports.json';
import arSettings from './locales/ar/settings.json';
import arAuth from './locales/ar/auth.json';

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    leads: enLeads,
    inventory: enInventory,
    meetings: enMeetings,
    contracts: enContracts,
    reports: enReports,
    settings: enSettings,
    auth: enAuth,
  },
  ar: {
    common: arCommon,
    dashboard: arDashboard,
    leads: arLeads,
    inventory: arInventory,
    meetings: arMeetings,
    contracts: arContracts,
    reports: arReports,
    settings: arSettings,
    auth: arAuth,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n; 