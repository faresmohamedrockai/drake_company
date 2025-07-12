import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

const TestTranslation: React.FC = () => {
  const { t } = useTranslation('common');
  const { language, setLanguage, isRTL } = useLanguage();

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Translation Test</h2>
      
      <div className="space-y-4">
        <div>
          <strong>Current Language:</strong> {language}
        </div>
        
        <div>
          <strong>RTL Mode:</strong> {isRTL ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Document Direction:</strong> {document.documentElement.dir}
        </div>
        
        <div className="space-y-2">
          <div><strong>Navigation Test:</strong></div>
          <div>Dashboard: {t('navigation.dashboard')}</div>
          <div>Leads: {t('navigation.leads')}</div>
          <div>Inventory: {t('navigation.inventory')}</div>
        </div>
        
        <div className="space-y-2">
          <div><strong>Actions Test:</strong></div>
          <div>Add: {t('actions.add')}</div>
          <div>Edit: {t('actions.edit')}</div>
          <div>Delete: {t('actions.delete')}</div>
        </div>
        
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Language
        </button>
      </div>
    </div>
  );
};

export default TestTranslation; 