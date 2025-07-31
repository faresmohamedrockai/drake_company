import React from 'react';
import { X } from 'lucide-react';
import { Lead } from '../../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lead: Lead | null;
  t: (key: string) => string;
  i18n: any;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  lead,
  t,
  i18n
}) => {
  if (!isOpen || !lead) return null;

  const getDisplayName = (lead: Lead) => {
    if (i18n.language === 'ar') {
      return lead.nameAr || lead.nameEn || '';
    } else {
      return lead.nameEn || lead.nameAr || '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{t('confirmDelete')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          {t('deleteLeadConfirm').replace('{name}', getDisplayName(lead))}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            aria-label={t('delete')}
          >
            {t('delete')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            aria-label={t('cancel')}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmationModal.displayName = 'DeleteConfirmationModal'; 