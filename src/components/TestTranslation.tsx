import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

// RTL Responsive Wrapper Component
const RTLWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ""
}) => {
  const { isRTL } = useLanguage();

  return (
    <div className={`rtl-responsive-wrapper ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
};

const TestTranslation: React.FC = () => {
  const { language, setLanguage, isRTL, rtlClass, rtlMargin, rtlPosition } = useLanguage();
  const { t } = useTranslation('common');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">RTL Responsive Test</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Language: {language}</h3>
        <h3 className="text-lg font-semibold mb-2">RTL Mode: {isRTL ? 'Yes' : 'No'}</h3>
        <button
          onClick={toggleLanguage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Toggle Language
        </button>
      </div>

      {/* Test Grid Layout */}
      <RTLWrapper className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold">Grid Item 1</h4>
            <p>This should be properly aligned in RTL</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold">Grid Item 2</h4>
            <p>This should be properly aligned in RTL</p>
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold">Grid Item 3</h4>
            <p>This should be properly aligned in RTL</p>
          </div>
        </div>
      </RTLWrapper>

      {/* Test Flex Layout */}
      <RTLWrapper className="mb-6">
        <div className="flex items-center justify-between bg-gray-100 p-4 rounded">
          <div className="flex items-center">
            <span className="mr-3">Icon</span>
            <span>Left Content</span>
          </div>
          <div className="flex items-center">
            <span>Right Content</span>
            <span className="ml-3">Icon</span>
          </div>
        </div>
      </RTLWrapper>

      {/* Test Form Layout */}
      <RTLWrapper className="mb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span>Label:</span>
            <input type="text" placeholder="Input field" className="border p-2 rounded" />
          </div>

          <div className="flex items-center space-x-4">
            <span>Another Label:</span>
            <select className="border p-2 rounded">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </RTLWrapper>

      {/* Test Button Layout */}
      <RTLWrapper className="mb-6">
        <div className="flex items-center space-x-2">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">Button 1</button>
          <button className="bg-green-500 text-white px-4 py-2 rounded">Button 2</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded">Button 3</button>
        </div>
      </RTLWrapper>

      {/* Test Card Layout */}
      <RTLWrapper className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold mb-2">Card Title 1</h4>
            <p className="text-gray-600">This is card content that should be properly aligned in RTL mode.</p>
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span>
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold mb-2">Card Title 2</h4>
            <p className="text-gray-600">This is another card with content that should be properly aligned in RTL mode.</p>
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-500">Status:</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Pending</span>
            </div>
          </div>
        </div>
      </RTLWrapper>

      {/* Test Table Layout */}
      <RTLWrapper className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">John Doe</td>
                <td className="px-4 py-2">john@example.com</td>
                <td className="px-4 py-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span>
                </td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:text-blue-800">Edit</button>
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2">Jane Smith</td>
                <td className="px-4 py-2">jane@example.com</td>
                <td className="px-4 py-2">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Pending</span>
                </td>
                <td className="px-4 py-2">
                  <button className="text-blue-600 hover:text-blue-800">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </RTLWrapper>

      {/* Test Navigation Menu */}
      <RTLWrapper className="mb-6">
        <nav className="bg-gray-100 rounded-lg p-4">
          <ul className="flex space-x-4">
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-800">Home</a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-gray-800">About</a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-gray-800">Services</a>
            </li>
            <li>
              <a href="#" className="text-gray-600 hover:text-gray-800">Contact</a>
            </li>
          </ul>
        </nav>
      </RTLWrapper>

      {/* Test Modal-like Layout */}
      <RTLWrapper className="mb-6">
        <div className="bg-white border rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Modal Title</h3>
            <button className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          <p className="text-gray-600 mb-4">This is modal content that should be properly aligned in RTL mode.</p>
          <div className="flex items-center space-x-2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
            <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      </RTLWrapper>

      {/* Test Responsive Utilities */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">RTL Utility Tests:</h3>
        <div className="space-y-2">
          <div>rtlClass('left-4', 'right-4'): {rtlClass('left-4', 'right-4')}</div>
          <div>rtlMargin('md:ml-64', 'md:mr-64'): {rtlMargin('md:ml-64', 'md:mr-64')}</div>
          <div>rtlPosition('md:left-0', 'md:right-0'): {rtlPosition('md:left-0', 'md:right-0')}</div>
        </div>
      </div>
    </div>
  );
};

export default TestTranslation; 