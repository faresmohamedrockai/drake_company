import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface ImportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  isImporting: boolean;
  importProgress: number;
}

const ImportLeadsModal: React.FC<ImportLeadsModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isImporting,
  importProgress
}) => {
  const { t } = useTranslation('leads');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      await onImport(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      ['Phone Number', 'Arabic Name', 'English Name', 'Email', 'Budget', 'Source'],
      ['+971501234567', 'أحمد محمد', 'Ahmed Mohamed', 'ahmed@example.com', '500000', 'Website'],
      ['+971507654321', 'فاطمة علي', 'Fatima Ali', 'fatima@example.com', '750000', 'Referral']
    ];

    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('importLeads') || 'Import Leads'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isImporting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('importInstructions') || 'Import Leads from Excel'}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('importDescription') || 'Upload an Excel file (.xlsx, .xls) or CSV file with lead information. The file should contain at least a phone number column.'}
            </p>
            
            {/* Template Download */}
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>{t('downloadTemplate') || 'Download Template'}</span>
              </button>
            </div>

            {/* Required Fields */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                {t('requiredFields') || 'Required Fields:'}
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• {t('phoneNumber') || 'Phone Number'} (required)</li>
                <li>• {t('arabicName') || 'Arabic Name'} (optional)</li>
                <li>• {t('englishName') || 'English Name'} (optional)</li>
                <li>• {t('email') || 'Email'} (optional)</li>
                <li>• {t('budget') || 'Budget'} (optional)</li>
                <li>• {t('source') || 'Source'} (optional)</li>
              </ul>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-3">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isImporting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {t('dragAndDrop') || 'Drag and drop your file here'}
                </p>
                <p className="text-gray-500 mb-4">
                  {t('orClickToSelect') || 'or click to select a file'}
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('selectFile') || 'Select File'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Progress Bar */}
          {isImporting && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {t('importing') || 'Importing...'}
                </span>
                <span className="text-sm text-gray-500">{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Import Notes */}
          <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">
                  {t('importNotes') || 'Important Notes:'}
                </p>
                <ul className="space-y-1">
                  <li>• {t('duplicatePhoneSkip') || 'Leads with duplicate phone numbers will be skipped'}</li>
                  <li>• {t('defaultValues') || 'Default values will be set for missing fields'}</li>
                  <li>• {t('phoneValidation') || 'Phone numbers must be at least 10 digits'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isImporting}
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('importing') || 'Importing...'}</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{t('importLeads') || 'Import Leads'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportLeadsModal; 