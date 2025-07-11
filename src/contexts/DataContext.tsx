import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Lead, Property, Project, Zone, Developer, Meeting, Contract, Activity, CallLog, VisitLog, Note } from '../types';

interface DataContextType {
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Leads
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'notes' | 'calls' | 'visits'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addCallLog: (leadId: string, call: Omit<CallLog, 'id' | 'leadId'>) => void;
  addVisitLog: (leadId: string, visit: Omit<VisitLog, 'id' | 'leadId'>) => void;
  addNote: (leadId: string, note: Omit<Note, 'id' | 'leadId'>) => void;
  
  // Properties
  properties: Property[];
  addProperty: (property: Omit<Property, 'id' | 'createdAt'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Zones
  zones: Zone[];
  addZone: (zone: Omit<Zone, 'id' | 'createdAt' | 'properties'>) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  deleteZone: (id: string) => void;
  
  // Developers
  developers: Developer[];
  addDeveloper: (developer: Omit<Developer, 'id' | 'createdAt' | 'projects'>) => void;
  updateDeveloper: (id: string, updates: Partial<Developer>) => void;
  deleteDeveloper: (id: string) => void;
  
  // Meetings
  meetings: Meeting[];
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  
  // Contracts
  contracts: Contract[];
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  
  // Activities
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  
  // Statistics
  getStatistics: () => {
    totalProspects: number;
    activeLeads: number;
    todayMeetings: number;
    monthlyRevenue: number;
    conversionRates: {
      leadsToFollowUp: number;
      callsToMeetings: number;
      meetingsToDeals: number;
      callCompletionRate: number;
    };
  };

  // New stats functions
  getPreviousStats: () => {
    totalProspects: number;
    activeLeads: number;
    todayMeetings: number;
    monthlyRevenue: number;
    conversionRates: {
      leadsToFollowUp: number;
      callsToMeetings: number;
      meetingsToDeals: number;
      callCompletionRate: number;
    };
  } | null;

  getChangeForStat: (current: number, previous: number) => number;

  // New helper functions
  updateDashboardStats: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DASHBOARD_STATS_KEY = 'propai_dashboard_stats';

    // Initial mock data
  const initialUsers: User[] = [
  {
    id: '1',
    name: 'Abdullah Sobhy',
    email: 'admin@propai.com',
    username: 'admin',
    password: 'password',
    role: 'Admin',
    createdAt: '2025-01-01',
    isActive: true
  },
  {
    id: '2',
    name: 'Sales Manager',
    email: 'sales@propai.com',
    username: 'sales',
    password: 'password',
    role: 'Sales Admin',
    createdAt: '2025-01-01',
    isActive: true
  },
  {
    id: '3',
    name: 'fadel',
    email: 'fadel@propai.com',
    username: 'fadel',
    password: 'password',
    role: 'Admin',
    createdAt: '2025-01-01',
    isActive: true
  }
];

const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Mohamed Salah',
    phone: '01001234567',
    email: 'm.salah@gmail.com',
    budget: 'EGP 2,000,000 - 3,000,000',
    inventoryInterest: 'Madinaty',
    source: 'Facebook',
    status: 'Fresh Lead',
    lastCallDate: '2025-02-10',
    lastVisitDate: '------',
    assignedTo: 'Abdullah Sobhy',
    createdAt: '2025-01-01',
    createdBy: 'Abdullah Sobhy',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '2',
    name: 'Sara Mostafa',
    phone: '01122334455',
    email: 'sara.mostafa@yahoo.com',
    budget: 'EGP 1,500,000 - 2,500,000',
    inventoryInterest: 'Mountain View',
    source: 'Referral',
    status: 'Follow Up',
    lastCallDate: '2025-02-12',
    lastVisitDate: '------',
    assignedTo: 'Abdullah Sobhy',
    createdAt: '2025-02-05',
    createdBy: 'Abdullah Sobhy',
    notes: [],
    calls: [],
    visits: []
  }
];

const initialProperties: Property[] = [
  {
    id: '1',
    title: 'Apartment in Nasr City',
    type: 'Apartment',
    price: 2200000,
    location: 'Nasr City, Cairo',
    area: '180',
    bedrooms: '3',
    bathrooms: '2',
    parking: '1',
    amenities: ['Elevator', 'Security'],
    project: 'Madinaty',
    status: 'Available',
    createdAt: '2025-01-10',
    createdBy: 'fadel'
  },
  {
    id: '2',
    title: 'Villa in 6th of October',
    type: 'Villa',
    price: 5500000,
    location: '6th of October, Giza',
    area: '350',
    bedrooms: '5',
    bathrooms: '4',
    parking: '2',
    amenities: ['Garden', 'Pool'],
    project: 'Mountain View',
    status: 'Rented',
    createdAt: '2025-01-15',
    createdBy: 'Abdullah Sobhy'
  }
];

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Madinaty',
    developer: 'Talaat Moustafa Group',
    zone: 'New Cairo',
    type: 'Residential',
    paymentPlans: [
      {
        downPayment: 10,
        delivery: 10,
        schedule: '7 years monthly installments',
        payYears: 7,
        installmentPeriod: 'monthly',
        installmentMonthsCount: 1,
        firstInstallmentDate: '2025-10-08',
        deliveryDate: '2032-10-08'
      }
    ],
    createdAt: new Date().toISOString(),
    createdBy: 'System'
  },
  {
    id: '2',
    name: 'Mountain View',
    developer: 'Mountain View Egypt',
    zone: '6th of October',
    type: 'Residential',
    paymentPlans: [
      {
        downPayment: 15,
        delivery: 10,
        schedule: '8 years quarterly installments',
        payYears: 8,
        installmentPeriod: 'quarterly',
        installmentMonthsCount: 3,
        firstInstallmentDate: '2025-11-01',
        deliveryDate: '2033-11-01'
      }
    ],
    createdAt: '2025-01-01',
    createdBy: 'Abdullah Sobhy'
  }
];

const initialDevelopers: Developer[] = [
  {
    id: '1',
    name: 'Talaat Moustafa Group',
    email: 'info@tmg.com.eg',
    phone: '0224800000',
    projects: 5,
    established: '1974',
    location: 'Cairo',
    createdAt: '2025-01-01',
    createdBy: 'fadel',
    image: ''
  },
  {
    id: '2',
    name: 'Palm Hills Developments',
    email: 'contact@palmhills.com.eg',
    phone: '0235390000',
    projects: 7,
    established: '2005',
    location: 'Giza',
    createdAt: '2025-01-01',
    createdBy: 'Abdullah Sobhy',
    image: ''
  }
];

const initialMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Site Visit - Madinaty',
    client: 'Mohamed Salah',
    date: '2025-02-15',
    time: '11:00',
    duration: '60 mins',
    type: 'Site Visit',
    status: 'Scheduled',
    assignedTo: 'fadel',
    notes: 'Discuss payment plan and available units.',
    createdAt: '2025-02-10',
    createdBy: 'fadel'
  },
  {
    id: '2',
    title: 'Contract Signing - Villa',
    client: 'Sara Mostafa',
    date: '2025-02-20',
    time: '15:00',
    duration: '90 mins',
    type: 'Proposal',
    status: 'Scheduled',
    assignedTo: 'Abdullah Sobhy',
    notes: 'Review contract terms and handover.',
    createdAt: '2025-02-12',
    createdBy: 'Abdullah Sobhy'
  }
];

const initialContracts: Contract[] = [
  {
    id: 'C-1001',
    leadId: '1',
    leadName: 'Mohamed Salah',
    property: 'Apartment in Nasr City',
    dealValue: 'EGP 2,200,000',
    contractDate: '2025-02-16',
    status: 'Signed',
    createdBy: 'fadel',
    notes: 'Standard contract. Payment: 10% down, 80% installments, 10% on delivery.',
    createdAt: '2025-02-16'
  },
  {
    id: 'C-1002',
    leadId: '2',
    leadName: 'Sara Mostafa',
    property: 'Villa in 6th of October',
    dealValue: 'EGP 5,500,000',
    contractDate: '2025-02-22',
    status: 'Pending',
    createdBy: 'Abdullah Sobhy',
    notes: 'Awaiting client signature.',
    createdAt: '2025-02-20'
  }
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [zones, setZones] = useState<Zone[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>(initialDevelopers);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('propai_data');
    if (savedData) {
      const data = JSON.parse(savedData);
      setUsers(data.users || initialUsers);
      setLeads(data.leads || initialLeads);
      setProperties(data.properties || initialProperties);
      setProjects(data.projects || initialProjects);
      setZones(data.zones || []);
      setDevelopers(data.developers || initialDevelopers);
      setMeetings(data.meetings || initialMeetings);
      setContracts(data.contracts || initialContracts);
      setActivities(data.activities || []);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const data = {
      users,
      leads,
      properties,
      projects,
      zones,
      developers,
      meetings,
      contracts,
      activities
    };
    localStorage.setItem('propai_data', JSON.stringify(data));
  }, [users, leads, properties, projects, zones, developers, meetings, contracts, activities]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity = {
      ...activity,
      id: generateId()
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep only last 50 activities
  };

  // User management
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser = {
      ...user,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    addActivity({
      user: user.name,
      action: `New user ${user.name} added to system`,
      time: 'Just now',
      type: 'lead'
    });
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => user.id === id ? { ...user, ...updates } : user));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  // Lead management
  const addLead = (lead: Omit<Lead, 'id' | 'createdAt' | 'notes' | 'calls' | 'visits'>) => {
    const newLead = {
      ...lead,
      id: generateId(),
      createdAt: new Date().toISOString(),
      notes: [],
      calls: [],
      visits: []
    };
    setLeads(prev => [...prev, newLead]);
    addActivity({
      user: lead.createdBy,
      action: `New lead ${lead.name} added to system`,
      time: 'Just now',
      type: 'lead'
    });
    updateDashboardStats();
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead));
    updateDashboardStats();
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    updateDashboardStats();
  };

  const addCallLog = (leadId: string, call: Omit<CallLog, 'id' | 'leadId'>) => {
    const newCall = {
      ...call,
      id: generateId(),
      leadId
    };
    
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { 
            ...lead, 
            calls: [...lead.calls, newCall],
            lastCallDate: call.date
          }
        : lead
    ));
    
    addActivity({
      user: call.createdBy,
      action: `${call.createdBy} logged a call with lead`,
      time: 'Just now',
      type: 'call'
    });
    updateDashboardStats();
  };

  const addVisitLog = (leadId: string, visit: Omit<VisitLog, 'id' | 'leadId'>) => {
    const newVisit = {
      ...visit,
      id: generateId(),
      leadId
    };
    
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { 
            ...lead, 
            visits: [...lead.visits, newVisit],
            lastVisitDate: visit.date
          }
        : lead
    ));
    
    addActivity({
      user: visit.createdBy,
      action: `${visit.createdBy} logged a visit with lead`,
      time: 'Just now',
      type: 'visit'
    });
    updateDashboardStats();
  };

  const addNote = (leadId: string, note: Omit<Note, 'id' | 'leadId'>) => {
    const newNote = {
      ...note,
      id: generateId(),
      leadId
    };
    
    setLeads(prev => prev.map(lead => 
      lead.id === leadId 
        ? { ...lead, notes: [...lead.notes, newNote] }
        : lead
    ));
    updateDashboardStats();
  };

  // Property management
  const addProperty = (property: Omit<Property, 'id' | 'createdAt'>) => {
    const newProperty = {
      ...property,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setProperties(prev => [...prev, newProperty]);
    // Sync with zone
    if (newProperty.zoneId) {
      setZones(prev => prev.map(zone =>
        zone.id === newProperty.zoneId
          ? { ...zone, propertyIds: [...(zone.propertyIds || []), newProperty.id] }
          : zone
      ));
    }
    // Sync with project
    if (newProperty.projectId) {
      setProjects(prev => prev.map(project =>
        project.id === newProperty.projectId
          ? { ...project, propertyIds: [...(project.propertyIds || []), newProperty.id] }
          : project
      ));
    }
    addActivity({
      user: property.createdBy,
      action: `New property ${property.title} added to inventory`,
      time: 'Just now',
      type: 'property'
    });
    updateDashboardStats();
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(property => property.id === id ? { ...property, ...updates } : property));
    // Sync with zone
    if (updates.zoneId) {
      setZones(prev => prev.map(zone =>
        zone.id === updates.zoneId
          ? { ...zone, propertyIds: [...(zone.propertyIds || []), id] }
          : zone
      ));
    }
    // Sync with project
    if (updates.projectId) {
      setProjects(prev => prev.map(project =>
        project.id === updates.projectId
          ? { ...project, propertyIds: [...(project.propertyIds || []), id] }
          : project
      ));
    }
    updateDashboardStats();
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(property => property.id !== id));
    updateDashboardStats();
  };

  // Project management
  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject = {
      ...project,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setProjects(prev => [...prev, newProject]);
    // Sync with zone
    if (newProject.zoneId) {
      setZones(prev => prev.map(zone =>
        zone.id === newProject.zoneId
          ? { ...zone, projectIds: [...(zone.projectIds || []), newProject.id] }
          : zone
      ));
    }
    // Sync with developer
    if (newProject.developerId) {
      setDevelopers(prev => prev.map(dev =>
        dev.id === newProject.developerId
          ? { ...dev, projectIds: [...(dev.projectIds || []), newProject.id] }
          : dev
      ));
    }
    addActivity({
      user: project.createdBy,
      action: `New project ${project.name} added to system`,
      time: 'Just now',
      type: 'property'
    });
    updateDashboardStats();
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => project.id === id ? { ...project, ...updates } : project));
    // Sync with zone
    if (updates.zoneId) {
      setZones(prev => prev.map(zone =>
        zone.id === updates.zoneId
          ? { ...zone, projectIds: [...(zone.projectIds || []), id] }
          : zone
      ));
    }
    // Sync with developer
    if (updates.developerId) {
      setDevelopers(prev => prev.map(dev =>
        dev.id === updates.developerId
          ? { ...dev, projectIds: [...(dev.projectIds || []), id] }
          : dev
      ));
    }
    updateDashboardStats();
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    updateDashboardStats();
  };

  // Zone management
  const addZone = (zone: Omit<Zone, 'id' | 'createdAt' | 'properties'>) => {
    const newZone = {
      ...zone,
      id: generateId(),
      createdAt: new Date().toISOString(),
      properties: 0,
      propertyIds: zone.propertyIds || []
    };
    setZones(prev => [...prev, newZone]);
    // Sync properties
    if (newZone.propertyIds && newZone.propertyIds.length > 0) {
      setProperties(prev => prev.map(property =>
        newZone.propertyIds!.includes(property.id)
          ? { ...property, zoneId: newZone.id }
          : property
      ));
    }
    addActivity({
      user: zone.createdBy,
      action: `New zone ${zone.name} added to system`,
      time: 'Just now',
      type: 'property'
    });
    updateDashboardStats();
  };

  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones(prev => prev.map(zone => zone.id === id ? { ...zone, ...updates } : zone));
    // Sync properties
    if (updates.propertyIds) {
      setProperties(prev => prev.map(property =>
        updates.propertyIds!.includes(property.id)
          ? { ...property, zoneId: id }
          : property.zoneId === id && !updates.propertyIds!.includes(property.id)
          ? { ...property, zoneId: undefined }
          : property
      ));
    }
    updateDashboardStats();
  };

  const deleteZone = (id: string) => {
    setZones(prev => prev.filter(zone => zone.id !== id));
    updateDashboardStats();
  };

  // Developer management
  const addDeveloper = (developer: Omit<Developer, 'id' | 'createdAt' | 'projects'>) => {
    const newDeveloper = {
      ...developer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      projects: 0
    };
    setDevelopers(prev => [...prev, newDeveloper]);
    addActivity({
      user: developer.createdBy,
      action: `New developer ${developer.name} added to system`,
      time: 'Just now',
      type: 'property'
    });
    updateDashboardStats();
  };

  const updateDeveloper = (id: string, updates: Partial<Developer>) => {
    setDevelopers(prev => prev.map(developer => developer.id === id ? { ...developer, ...updates } : developer));
    updateDashboardStats();
  };

  const deleteDeveloper = (id: string) => {
    setDevelopers(prev => prev.filter(developer => developer.id !== id));
    updateDashboardStats();
  };

  // Meeting management
  const addMeeting = (meeting: Omit<Meeting, 'id' | 'createdAt'>) => {
    const newMeeting = {
      ...meeting,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setMeetings(prev => [...prev, newMeeting]);
    addActivity({
      user: meeting.createdBy,
      action: `New meeting scheduled with ${meeting.client}`,
      time: 'Just now',
      type: 'meeting'
    });
    updateDashboardStats();
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings(prev => prev.map(meeting => meeting.id === id ? { ...meeting, ...updates } : meeting));
    updateDashboardStats();
  };

  const deleteMeeting = (id: string) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== id));
    updateDashboardStats();
  };

  // Contract management
  const addContract = (contract: Omit<Contract, 'id' | 'createdAt'>) => {
    const newContract = {
      ...contract,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setContracts(prev => [...prev, newContract]);
    addActivity({
      user: contract.createdBy,
      action: `New contract created for ${contract.leadName}`,
      time: 'Just now',
      type: 'contract'
    });
    updateDashboardStats();
  };

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setContracts(prev => prev.map(contract => contract.id === id ? { ...contract, ...updates } : contract));
    updateDashboardStats();
  };

  const deleteContract = (id: string) => {
    setContracts(prev => prev.filter(contract => contract.id !== id));
    updateDashboardStats();
  };

  // Statistics
  const getStatistics = () => {
    const totalProspects = leads.length;
    const activeLeads = leads.filter(lead => 
      ['Fresh Lead', 'Follow Up', 'Scheduled Visit', 'Open Deal'].includes(lead.status)
    ).length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayMeetings = meetings.filter(meeting => meeting.date === today).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = contracts
      .filter(contract => {
        const contractDate = new Date(contract.contractDate);
        return contractDate.getMonth() === currentMonth && 
               contractDate.getFullYear() === currentYear &&
               contract.status === 'Signed';
      })
      .reduce((total, contract) => {
        const value = parseFloat(contract.dealValue.replace(/[$,]/g, ''));
        return total + (isNaN(value) ? 0 : value);
      }, 0);

    const followUpLeads = leads.filter(lead => lead.status === 'Follow Up').length;
    const allCalls = leads.flatMap(lead => lead.calls);
    const totalCalls = allCalls.length;
    const totalMeetings = meetings.length;
    const closedDeals = leads.filter(lead => lead.status === 'Closed Deal').length;

    // Dynamic call completion: count only successful outcomes
    const completedCalls = allCalls.filter(call =>
      ['Interested', 'Meeting Scheduled', 'Follow Up Required'].includes(call.outcome)
    ).length;
    const callCompletionRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

    const stats = {
      totalProspects,
      activeLeads,
      todayMeetings,
      monthlyRevenue,
      conversionRates: {
        leadsToFollowUp: totalProspects > 0 ? Math.round((followUpLeads / totalProspects) * 100) : 0,
        callsToMeetings: totalCalls > 0 ? Math.round((totalMeetings / totalCalls) * 100) : 0,
        meetingsToDeals: totalMeetings > 0 ? Math.round((closedDeals / totalMeetings) * 100) : 0,
        callCompletionRate,
      }
    };

    return stats;
  };

  // Helper to get previous stats from localStorage
  const getPreviousStats = () => {
    const prev = localStorage.getItem(DASHBOARD_STATS_KEY);
    return prev ? JSON.parse(prev) : null;
  };

  // Helper to calculate change percentage
  const getChangeForStat = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // New helper function
  const updateDashboardStats = () => {
    const stats = getStatistics();
    localStorage.setItem(DASHBOARD_STATS_KEY, JSON.stringify(stats));
  };

  // Add this effect at the end of DataProvider to update stats on page unload
  useEffect(() => {
    const handleUnload = () => {
      updateDashboardStats();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <DataContext.Provider value={{
      users, addUser, updateUser, deleteUser,
      leads, addLead, updateLead, deleteLead, addCallLog, addVisitLog, addNote,
      properties, addProperty, updateProperty, deleteProperty,
      projects, addProject, updateProject, deleteProject,
      zones, addZone, updateZone, deleteZone,
      developers, addDeveloper, updateDeveloper, deleteDeveloper,
      meetings, addMeeting, updateMeeting, deleteMeeting,
      contracts, addContract, updateContract, deleteContract,
      activities, addActivity,
      getStatistics,
      getPreviousStats,
      getChangeForStat,
      updateDashboardStats
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};