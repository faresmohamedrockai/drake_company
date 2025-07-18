import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../contexts/AuthContext';

interface UserFilterSelectProps {
  currentUser: User;
  users: User[];
  selectedManager: string;
  setSelectedManager: (manager: string) => void;
  selectedSalesRep: string;
  setSelectedSalesRep: (salesRep: string) => void;
}

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
        <select
          value={managerValue}
          onChange={(e) => setSelectedManager(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px]"
          disabled={managerDisabled}
        >
          <option value="">{t('allManagers')}</option>
          {managerOptions.map((manager) => (
            <option key={manager.id} value={manager.name}>
              {manager.name}
            </option>
          ))}
        </select>
        {/* Avatar and name display for selected manager */}
        {managerOptions.length === 1 && managerOptions[0].image && (
          <div className="flex items-center mt-2">
            <img
              src={managerOptions[0].image}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
            <span className="text-sm text-gray-700">{managerOptions[0].name}</span>
          </div>
        )}
      </div>
      {/* Sales Rep Select */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 mb-1">{t('salesRep')}</label>
        <select
          value={salesRepValue}
          onChange={(e) => setSelectedSalesRep(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[180px]"
        >
          <option value="">{t('allSalesReps')}</option>
          {salesRepOptions.map((rep) => (
            <option key={rep.id} value={rep.name}>
              {rep.name}
            </option>
          ))}
        </select>
        {/* Avatar and name display for selected sales rep */}
        {salesRepOptions.length === 1 && salesRepOptions[0].image && (
          <div className="flex items-center mt-2">
            <img
              src={salesRepOptions[0].image}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover mr-2"
            />
            <span className="text-sm text-gray-700">{salesRepOptions[0].name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilterSelect; 