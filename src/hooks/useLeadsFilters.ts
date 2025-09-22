import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../types';

interface Filters {
  name: string;
  contact: string;
  gender: string;
  budget: string;
  isuntouched: boolean;
  inventoryInterestId: string;
  projectInterestId: string;
  otherProject: string;
  source: string;
  status: string;
  assignedTo: string;
  lastVisitDate: string;
  createdAtStart?: string;
  createdAtEnd?: string;
}

export const useLeadsFilters = (location: ReturnType<typeof useLocation>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    name: '',
    contact: '',
    budget: '',
    isuntouched: false,
    gender: '',
    inventoryInterestId: '',
    projectInterestId: '',
    otherProject: '',
    source: '',
    status: '',
    assignedTo: '',
    lastVisitDate: '',
    createdAtStart: '',
    createdAtEnd: '',
  });
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [selectedSalesRep, setSelectedSalesRep] = useState<User | null>(null);
  const [activeStatusCard, setActiveStatusCard] = useState<string>('');
  const [activeCallOutcomeCard, setActiveCallOutcomeCard] = useState<string>('');
  const [activeVisitStatusCard, setActiveVisitStatusCard] = useState<string>('');
  const [showAllCards, setShowAllCards] = useState(false);

  // Calculate active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Clear all filters function
  const clearAllFilters = () => {
    setFilters({
      name: '',
      contact: '',
      gender: '',
      budget: '',
      isuntouched: false,
      projectInterestId:'',
      inventoryInterestId: '',
      otherProject:'',
      source: '',
      status: '',
      assignedTo: '',
      lastVisitDate: '',
      createdAtStart: '',
      createdAtEnd: '',
    });
  };

  // On mount, check for filterType and filterValue in query params and set active card
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterType = params.get('filterType');
    const filterValue = params.get('filterValue');
    
    if (filterType && filterValue) {
      if (filterType === 'status') {
        setActiveStatusCard(filterValue);
        setActiveCallOutcomeCard('');
        setActiveVisitStatusCard('');
      } else if (filterType === 'callOutcome') {
        setActiveStatusCard('');
        setActiveCallOutcomeCard(filterValue);
        setActiveVisitStatusCard('');
      } else if (filterType === 'visitStatus') {
        setActiveStatusCard('');
        setActiveCallOutcomeCard('');
        setActiveVisitStatusCard(filterValue);
      }
    }
  }, [location.search]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    activeFiltersCount,
    clearAllFilters,
    selectedManager,
    setSelectedManager,
    selectedSalesRep,
    setSelectedSalesRep,
    activeStatusCard,
    setActiveStatusCard,
    activeCallOutcomeCard,
    setActiveCallOutcomeCard,
    activeVisitStatusCard,
    setActiveVisitStatusCard,
    showAllCards,
    setShowAllCards
  };
}; 