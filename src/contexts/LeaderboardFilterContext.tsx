import React, { createContext, useState, useContext, ReactNode, FC } from 'react';

// تعريف شكل البيانات التي سيحتويها الـ Context
interface FilterContextType {
  selectedTimeframe: string;
  activityFilter: string;
  sortBy: string;
  selectedRole: string;
  setSelectedTimeframe: (value: string) => void;
  setActivityFilter: (value: string) => void;
  setSortBy: (value: string) => void;
  setSelectedRole: (value: string) => void;
}

// إنشاء الـ Context
const LeaderboardFilterContext = createContext<FilterContextType | undefined>(undefined);

// Props للـ Provider
interface LeaderboardFilterProviderProps {
  children: ReactNode;
}

// إنشاء "المُزوّد" (Provider) الذي سيحتوي على الحالة ويوفرها للتطبيق
export const LeaderboardFilterProvider: FC<LeaderboardFilterProviderProps> = ({ children }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [activityFilter, setActivityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('performance');
  const [selectedRole, setSelectedRole] = useState('');

  const value = {
    selectedTimeframe,
    activityFilter,
    sortBy,
    selectedRole,
    setSelectedTimeframe,
    setActivityFilter,
    setSortBy,
    setSelectedRole,
  };

  return (
    <LeaderboardFilterContext.Provider value={value}>
      {children}
    </LeaderboardFilterContext.Provider>
  );
};

// Hook مخصص لتسهيل استخدام الـ Context
export const useLeaderboardFilters = () => {
  const context = useContext(LeaderboardFilterContext);
  if (context === undefined) {
    throw new Error('useLeaderboardFilters must be used within a LeaderboardFilterProvider');
  }
  return context;
};