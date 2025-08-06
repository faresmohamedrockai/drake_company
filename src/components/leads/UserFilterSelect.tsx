import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { User } from '../../types';

interface UserFilterSelectProps {
  currentUser: User;
  users: User[];
  selectedManager: User | null;
  setSelectedManager: (manager: User | null) => void;
  selectedSalesRep: User | null;
  setSelectedSalesRep: (salesRep: User | null) => void;
}

// Helper function to get user avatar or default
const getUserAvatar = (user: User, size: 'small' | 'normal' = 'normal') => {
  const sizeClass = size === 'small' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'small' ? 'text-xs' : 'text-sm';
  const marginClass = size === 'small' ? '' : 'mr-2';
  
  if (user.image) {
    return (
      <div className="relative">
        <img
          src={user.image}
          alt={`${user.name} avatar`}
          className={`${sizeClass} rounded-full object-cover ${marginClass}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className={`${sizeClass} rounded-full bg-blue-600 flex items-center justify-center text-white ${textSize} font-semibold ${marginClass} absolute top-0 left-0 hidden`}>
          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
        </div>
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-blue-600 flex items-center justify-center text-white ${textSize} font-semibold ${marginClass}`}>
      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
    </div>
  );
};

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string; // This will be the user ID
  onChange: (value: string) => void; // This will receive the user ID
  options: User[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedUser = options.find(option => option.id === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px] text-left flex items-center justify-between ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
        disabled={disabled}
      >
        <div className="flex items-center">
          {selectedUser && (
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {getUserAvatar(selectedUser, 'small')}
            </div>
          )}
          <span className={selectedUser ? '' : 'text-gray-500'}>
            {selectedUser ? selectedUser.name : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div
            className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">-</span>
            </div>
            <span className="ml-3 text-gray-500">{placeholder}</span>
          </div>
          {options.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
            >
              {getUserAvatar(option, 'small')}
              <div className="ml-3 flex-1">
                <span className={`${value === option.id ? 'font-medium text-blue-600' : ''}`}>
                  {option.name}
                </span>
                <div className="text-xs text-gray-500">
                  {option.role === 'team_leader' ? 'Team Leader' : 
                   option.role === 'sales_rep' ? 'Sales Representative' : 
                   option.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserFilterSelect: React.FC<UserFilterSelectProps> = ({
  currentUser,
  users,
  selectedManager,
  setSelectedManager,
  selectedSalesRep,
  setSelectedSalesRep,
}) => {
  const { t } = useTranslation('leads');

  // Filter users based on current user's role
  const managers = users.filter(user => user.role === 'team_leader');
  
  // Get sales reps based on selected manager and current user's role
  const getSalesReps = () => {
    if (currentUser.role === 'team_leader') {
      // For team leaders, include both team leaders and sales reps
      return users.filter(user => ['sales_rep', 'team_leader'].includes(user.role));
    } else if (['admin', 'sales_admin'].includes(currentUser.role)) {
      // For admin/sales_admin, filter based on selected manager
      if (selectedManager) {
        // Show sales reps under the selected manager + the manager themselves
        const teamMembers = users.filter(user => 
          user.role === 'sales_rep' && user.teamLeaderId === selectedManager.id
        );
        // Include the selected manager as well
        return [selectedManager, ...teamMembers];
      } else {
        // Show all sales reps when no manager is selected
        return users.filter(user => user.role === 'sales_rep');
      }
    }
    return users.filter(user => user.role === 'sales_rep');
  };

  const salesReps = getSalesReps();

  // Only show filters for admin, sales_admin, or team_leader
  if (!['admin', 'sales_admin', 'team_leader'].includes(currentUser.role)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Manager Filter - Only show for admin and sales_admin */}
        {['admin', 'sales_admin'].includes(currentUser.role) && (
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {t('filterByManager') || 'Filter by Manager'}
            </label>
            <CustomDropdown
              value={selectedManager?.id || ''}
              onChange={(managerId) => {
                const manager = managers.find(m => m.id === managerId) || null;
                setSelectedManager(manager);
                // Clear sales rep selection when manager changes since the available options will change
                setSelectedSalesRep(null);
              }}
              options={managers}
              placeholder={t('selectManager') || 'Select Manager'}
              className="w-full"
            />
          </div>
        )}

        {/* Sales Rep Filter - Show for admin, sales_admin, and team_leader */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            {t('filterBySalesRep') || 'Filter by Sales Rep'}
          </label>
          <CustomDropdown
            value={selectedSalesRep?.id || ''}
            onChange={(salesRepId) => {
              const salesRep = salesReps.find(s => s.id === salesRepId) || null;
              setSelectedSalesRep(salesRep);
            }}
            options={salesReps}
            placeholder={t('selectSalesRep') || 'Select Sales Rep'}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default UserFilterSelect; 