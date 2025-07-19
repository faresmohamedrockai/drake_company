import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../contexts/AuthContext';
import { User as UserIcon, ChevronDown } from 'lucide-react';

interface UserFilterSelectProps {
  currentUser: User;
  users: User[];
  selectedManager: string;
  setSelectedManager: (manager: string) => void;
  selectedSalesRep: string;
  setSelectedSalesRep: (salesRep: string) => void;
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
  value: string;
  onChange: (value: string) => void;
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

  const selectedUser = options.find(option => option.name === value);

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
                onChange(option.name);
                setIsOpen(false);
              }}
            >
              {getUserAvatar(option, 'small')}
              <span className={`ml-3 ${value === option.name ? 'font-medium text-blue-600' : ''}`}>
                {option.name}
              </span>
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
  const { t, i18n } = useTranslation('leads');

  // Get all managers (team_leader, sales_admin, admin)
  const managers = users.filter(
    (u) => u.role === 'team_leader' || u.role === 'sales_admin' || u.role === 'admin'
  );

  // Get all sales reps for a given manager
  const getSalesRepsForManager = (managerName: string) =>
    users.filter((u) => u.role === 'sales_rep' && u.teamId === managerName);

  // Role-based logic
  if (currentUser.role === 'sales_rep') {
    // Sales reps do not see the select
    return null;
  }

  let managerOptions = managers;
  let salesRepOptions: User[] = [];
  let managerValue = selectedManager;
  let salesRepValue = selectedSalesRep;
  let managerDisabled = false;

  if (currentUser.role === 'team_leader') {
    // Team leader: manager select is their own name, not changeable
    managerOptions = managers.filter((m) => m.name === currentUser.name);
    managerValue = currentUser.name;
    managerDisabled = true;
    salesRepOptions = getSalesRepsForManager(currentUser.name);
  } else if (currentUser.role === 'sales_admin' || currentUser.role === 'admin') {
    // Admin/Sales Manager: can select any manager, and their sales reps
    salesRepOptions = getSalesRepsForManager(selectedManager);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      {/* Manager Select */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">{t('manager')}</label>
        <CustomDropdown
          value={managerValue}
          onChange={setSelectedManager}
          options={managerOptions}
          placeholder={t('allManagers')}
          disabled={managerDisabled}
        />
      </div>
      {/* Sales Rep Select */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">{t('salesRep')}</label>
        <CustomDropdown
          value={salesRepValue}
          onChange={setSelectedSalesRep}
          options={salesRepOptions}
          placeholder={t('allSalesReps')}
        />
      </div>
    </div>
  );
};

export default UserFilterSelect; 