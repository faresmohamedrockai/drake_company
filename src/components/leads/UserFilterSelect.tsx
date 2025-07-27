import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, ChevronDown } from 'lucide-react';
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
                  {option.role === 'team_leader' ? 'Team Leader' : 'Sales Representative'}
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
  const { t, i18n } = useTranslation('leads');

  // Get all team leaders (users with role 'team_leader')
  const teamLeaders = users.filter((u) => u.role === 'team_leader');

  // Get all sales reps
  const allSalesReps = users.filter((u) => u.role === 'sales_rep');

  // Role-based logic
  if (currentUser.role === 'sales_rep') {
    // Sales reps do not see the select
    return null;
  }

  let teamLeaderOptions = teamLeaders;
  let salesRepOptions: User[] = [...allSalesReps, ...teamLeaders]; // Include team leaders in sales rep options
  let teamLeaderValue = selectedManager;
  let salesRepValue = selectedSalesRep;
  let teamLeaderDisabled = false;

  if (currentUser.role === 'team_leader') {
    // Team leader: manager select is their own name, not changeable
    teamLeaderOptions = teamLeaders.filter((m) => m.id === currentUser.id);
    teamLeaderValue = currentUser;
    teamLeaderDisabled = true;
    // Team leaders can see all sales reps and other team leaders in the dropdown
    // The filtering logic in the parent components will handle the actual filtering
  } else if (currentUser.role === 'sales_admin' || currentUser.role === 'admin') {
    // Admin/Sales Manager: can select any team leader and any sales rep
    // All sales reps and team leaders are shown in the dropdown
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      {/* Team Leader Select */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">{t('manager')}</label>
        <CustomDropdown
          value={teamLeaderValue?.id || ''}
          onChange={(value) => {
            const selectedUser = users.find(u => u.id === value) || null;
            setSelectedManager(selectedUser);
            // Don't clear sales rep selection when team leader changes
            // This allows independent selection of team leader and sales rep
          }}
          options={teamLeaderOptions}
          placeholder={t('allManagers')}
          disabled={teamLeaderDisabled}
        />
      </div>
      {/* Sales Rep/Team Leader Select */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">Team Member</label>
        <CustomDropdown
          value={salesRepValue?.id || ''}
          onChange={(value) => {
            const selectedUser = users.find(u => u.id === value) || null;
            setSelectedSalesRep(selectedUser);
          }}
          options={salesRepOptions}
          placeholder="All Team Members"
        />
      </div>
    </div>
  );
};

export default UserFilterSelect; 