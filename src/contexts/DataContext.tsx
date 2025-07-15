import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Lead, Property, Project, Zone, Developer, Meeting, Contract, Activity, CallLog, VisitLog, Note, LeadStatus } from '../types';

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
  getStatistics: (user?: { name: string; role: string; teamId?: string } | null) => {
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
    name: 'fadel',
    email: 'fadel@propai.com',
    username: 'fadel',
    password: 'password',
    role: 'admin',
    createdAt: '2025-01-01',
    isActive: true
  },
  {
    id: '2',
    name: 'Sales Manager',
    email: 'sales@propai.com',
    username: 'sales',
    password: 'password',
    role: 'sales_admin',
    createdAt: '2025-01-01',
    isActive: true
  },
  {
    id: '3',
    name: 'Abdullah Sobhy',
    email: 'admin@propai.com',
    username: 'Team Leader',
    password: 'password',
    role: 'team_leader',
    createdAt: '2025-01-01',
    isActive: true
  }
];

const initialLeads: Lead[] = [
  {
    id: '1',
    name: 'Mohamed Salah',
    nameEn: 'Mohamed Salah',
    nameAr: 'محمد صلاح',
    phone: '01001234567',
    email: 'm.salah@gmail.com',
    budget: 'EGP 2,000,000 - 3,000,000',
    inventoryInterest: 'Madinaty',
    source: 'Facebook',
    status: LeadStatus.FRESH_LEAD,
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
    nameEn: 'Sara Mostafa',
    nameAr: 'سارة مصطفى',
    phone: '01122334455',
    email: 'sara.mostafa@yahoo.com',
    budget: 'EGP 1,500,000 - 2,500,000',
    inventoryInterest: 'Mountain View',
    source: 'Referral',
    status: LeadStatus.FOLLOW_UP,
    lastCallDate: '2025-02-12',
    lastVisitDate: '------',
    assignedTo: 'Abdullah Sobhy',
    createdAt: '2025-02-05',
    createdBy: 'Abdullah Sobhy',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '3',
    name: 'Ahmed Hassan',
    nameEn: 'Ahmed Hassan',
    nameAr: 'أحمد حسن',
    phone: '01234567890',
    email: 'ahmed.hassan@hotmail.com',
    budget: 'EGP 3,500,000 - 5,000,000',
    inventoryInterest: 'Palm Hills',
    source: 'Cold Call',
    status: LeadStatus.SCHEDULED_VISIT,
    lastCallDate: '2025-02-14',
    lastVisitDate: '2025-02-15',
    assignedTo: 'fadel',
    createdAt: '2025-01-15',
    createdBy: 'fadel',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '4',
    name: 'Fatima Ali',
    nameEn: 'Fatima Ali',
    nameAr: 'فاطمة علي',
    phone: '01567890123',
    email: 'fatima.ali@outlook.com',
    budget: 'EGP 800,000 - 1,200,000',
    inventoryInterest: 'New Cairo',
    source: 'Instagram',
    status: LeadStatus.OPEN_DEAL,
    lastCallDate: '2025-02-16',
    lastVisitDate: '2025-02-18',
    assignedTo: 'Sales Manager',
    createdAt: '2025-01-20',
    createdBy: 'Sales Manager',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '5',
    name: 'Omar Khalil',
    nameEn: 'Omar Khalil',
    nameAr: 'عمر خليل',
    phone: '01987654321',
    email: 'omar.khalil@gmail.com',
    budget: 'EGP 4,000,000 - 6,000,000',
    inventoryInterest: 'Mountain View',
    source: 'Website',
    status: LeadStatus.FRESH_LEAD,
    lastCallDate: '2025-02-19',
    lastVisitDate: '------',
    assignedTo: 'Abdullah Sobhy',
    createdAt: '2025-02-01',
    createdBy: 'Abdullah Sobhy',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '6',
    name: 'Nour El-Din',
    nameEn: 'Nour El-Din',
    nameAr: 'نور الدين',
    phone: '01456789012',
    email: 'nour.eldin@yahoo.com',
    budget: 'EGP 1,800,000 - 2,500,000',
    inventoryInterest: 'Madinaty',
    source: 'Referral',
    status: LeadStatus.FOLLOW_UP,
    lastCallDate: '2025-02-20',
    lastVisitDate: '------',
    assignedTo: 'fadel',
    createdAt: '2025-02-03',
    createdBy: 'fadel',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '7',
    name: 'Layla Mahmoud',
    nameEn: 'Layla Mahmoud',
    nameAr: 'ليلى محمود',
    phone: '01345678901',
    email: 'layla.mahmoud@hotmail.com',
    budget: 'EGP 2,500,000 - 3,500,000',
    inventoryInterest: 'Palm Hills',
    source: 'Facebook',
    status: LeadStatus.CANCELLATION,
    lastCallDate: '2025-02-21',
    lastVisitDate: '------',
    assignedTo: 'Sales Manager',
    createdAt: '2025-02-05',
    createdBy: 'Sales Manager',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '8',
    name: 'Karim Abdel-Rahman',
    nameEn: 'Karim Abdel-Rahman',
    nameAr: 'كريم عبد الرحمن',
    phone: '01876543210',
    email: 'karim.abdelrahman@gmail.com',
    budget: 'EGP 5,500,000 - 8,000,000',
    inventoryInterest: 'Mountain View',
    source: 'Cold Call',
    status: LeadStatus.SCHEDULED_VISIT,
    lastCallDate: '2025-02-22',
    lastVisitDate: '2025-02-25',
    assignedTo: 'Abdullah Sobhy',
    createdAt: '2025-02-08',
    createdBy: 'Abdullah Sobhy',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '9',
    name: 'Yasmine Saleh',
    nameEn: 'Yasmine Saleh',
    nameAr: 'ياسمين صالح',
    phone: '01678901234',
    email: 'yasmine.saleh@outlook.com',
    budget: 'EGP 1,200,000 - 1,800,000',
    inventoryInterest: 'New Cairo',
    source: 'Instagram',
    status: LeadStatus.OPEN_DEAL,
    lastCallDate: '2025-02-23',
    lastVisitDate: '2025-02-26',
    assignedTo: 'fadel',
    createdAt: '2025-02-10',
    createdBy: 'fadel',
    notes: [],
    calls: [],
    visits: []
  },
  {
    id: '10',
    name: 'Tarek Ibrahim',
    nameEn: 'Tarek Ibrahim',
    nameAr: 'طارق إبراهيم',
    phone: '01789012345',
    email: 'tarek.ibrahim@yahoo.com',
    budget: 'EGP 3,000,000 - 4,500,000',
    inventoryInterest: 'Madinaty',
    source: 'Website',
    status: LeadStatus.FRESH_LEAD,
    lastCallDate: '2025-02-24',
    lastVisitDate: '------',
    assignedTo: 'Sales Manager',
    createdAt: '2025-02-12',
    createdBy: 'Sales Manager',
    notes: [],
    calls: [],
    visits: []
  }
];

const initialProperties: Property[] = [
  {
    id: '1',
    title: 'Apartment in Nasr City',
    titleEn: 'Apartment in Nasr City',
    titleAr: 'شقة في مدينة نصر',
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
    titleEn: 'Villa in 6th of October',
    titleAr: 'فيلا في السادس من أكتوبر',
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
  },
  {
    id: '3',
    title: 'Luxury Apartment in New Cairo',
    titleEn: 'Luxury Apartment in New Cairo',
    titleAr: 'شقة فاخرة في القاهرة الجديدة',
    type: 'Apartment',
    price: 3800000,
    location: 'New Cairo, Cairo',
    area: '220',
    bedrooms: '4',
    bathrooms: '3',
    parking: '2',
    amenities: ['Elevator', 'Security', 'Garden', 'Pool'],
    project: 'Palm Hills',
    status: 'Available',
    createdAt: '2025-01-20',
    createdBy: 'Sales Manager'
  },
  {
    id: '4',
    title: 'Townhouse in Sheikh Zayed',
    titleEn: 'Townhouse in Sheikh Zayed',
    titleAr: 'تاون هاوس في الشيخ زايد',
    type: 'Townhouse',
    price: 4200000,
    location: 'Sheikh Zayed, Giza',
    area: '280',
    bedrooms: '4',
    bathrooms: '3',
    parking: '2',
    amenities: ['Garden', 'Security'],
    project: 'Mountain View',
    status: 'Available',
    createdAt: '2025-01-25',
    createdBy: 'Abdullah Sobhy'
  },
  {
    id: '5',
    title: 'Commercial Office in Maadi',
    titleEn: 'Commercial Office in Maadi',
    titleAr: 'مكتب تجاري في المعادي',
    type: 'Commercial',
    price: 1800000,
    location: 'Maadi, Cairo',
    area: '150',
    bedrooms: '0',
    bathrooms: '2',
    parking: '3',
    amenities: ['Elevator', 'Security'],
    project: 'New Cairo',
    status: 'Available',
    createdAt: '2025-02-01',
    createdBy: 'fadel'
  },
  {
    id: '6',
    title: 'Studio Apartment in Heliopolis',
    titleEn: 'Studio Apartment in Heliopolis',
    titleAr: 'استوديو في مصر الجديدة',
    type: 'Apartment',
    price: 950000,
    location: 'Heliopolis, Cairo',
    area: '85',
    bedrooms: '1',
    bathrooms: '1',
    parking: '1',
    amenities: ['Elevator', 'Security'],
    project: 'Madinaty',
    status: 'Sold',
    createdAt: '2025-02-05',
    createdBy: 'Sales Manager'
  },
  {
    id: '7',
    title: 'Penthouse in Zamalek',
    titleEn: 'Penthouse in Zamalek',
    titleAr: 'بنتهاوس في الزمالك',
    type: 'Apartment',
    price: 8500000,
    location: 'Zamalek, Cairo',
    area: '450',
    bedrooms: '5',
    bathrooms: '4',
    parking: '3',
    amenities: ['Elevator', 'Security', 'Garden', 'Pool'],
    project: 'Palm Hills',
    status: 'Available',
    createdAt: '2025-02-10',
    createdBy: 'fadel'
  },
  {
    id: '8',
    title: 'Shop in Downtown Cairo',
    titleEn: 'Shop in Downtown Cairo',
    titleAr: 'محل في وسط البلد',
    type: 'Commercial',
    price: 3200000,
    location: 'Downtown Cairo',
    area: '120',
    bedrooms: '0',
    bathrooms: '1',
    parking: '1',
    amenities: ['Security'],
    project: 'New Cairo',
    status: 'Rented',
    createdAt: '2025-02-12',
    createdBy: 'Abdullah Sobhy'
  },
  {
    id: '9',
    title: 'Duplex Villa in Katameya',
    titleEn: 'Duplex Villa in Katameya',
    titleAr: 'فيلا دوبلكس في الكاتمية',
    type: 'Villa',
    price: 7200000,
    location: 'Katameya, Cairo',
    area: '380',
    bedrooms: '6',
    bathrooms: '5',
    parking: '3',
    amenities: ['Garden', 'Pool', 'Security'],
    project: 'Mountain View',
    status: 'Available',
    createdAt: '2025-02-15',
    createdBy: 'Sales Manager'
  },
  {
    id: '10',
    title: 'Land Plot in 6th of October',
    titleEn: 'Land Plot in 6th of October',
    titleAr: 'قطعة أرض في السادس من أكتوبر',
    type: 'Land',
    price: 1500000,
    location: '6th of October, Giza',
    area: '500',
    bedrooms: '0',
    bathrooms: '0',
    parking: '0',
    amenities: [],
    project: 'Mountain View',
    status: 'Available',
    createdAt: '2025-02-18',
    createdBy: 'fadel'
  },
  {
    id: '11',
    title: 'Garden Apartment in Maadi',
    titleEn: 'Garden Apartment in Maadi',
    titleAr: 'شقة حديقة في المعادي',
    type: 'Apartment',
    price: 2800000,
    location: 'Maadi, Cairo',
    area: '200',
    bedrooms: '3',
    bathrooms: '2',
    parking: '2',
    amenities: ['Garden', 'Security'],
    project: 'Palm Hills',
    status: 'Available',
    createdAt: '2025-02-20',
    createdBy: 'Abdullah Sobhy'
  },
  {
    id: '12',
    title: 'Luxury Villa in New Cairo',
    titleEn: 'Luxury Villa in New Cairo',
    titleAr: 'فيلا فاخرة في القاهرة الجديدة',
    type: 'Villa',
    price: 9500000,
    location: 'New Cairo, Cairo',
    area: '420',
    bedrooms: '6',
    bathrooms: '5',
    parking: '4',
    amenities: ['Garden', 'Pool', 'Security', 'Elevator'],
    project: 'Palm Hills',
    status: 'Available',
    createdAt: '2025-02-22',
    createdBy: 'Sales Manager'
  }
];

const initialProjects: Project[] = [
  {
    id: '1',
    name: 'Madinaty',
    nameEn: 'Madinaty',
    nameAr: 'مدينتي',
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
    nameEn: 'Mountain View',
    nameAr: 'ماونتن فيو',
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
  },
  {
    id: '3',
    name: 'Palm Hills',
    nameEn: 'Palm Hills',
    nameAr: 'بالم هيلز',
    developer: 'Palm Hills Developments',
    zone: 'New Cairo',
    type: 'Residential',
    paymentPlans: [
      {
        downPayment: 20,
        delivery: 15,
        schedule: '6 years semi-annual installments',
        payYears: 6,
        installmentPeriod: 'semi-annual',
        installmentMonthsCount: 6,
        firstInstallmentDate: '2025-12-01',
        deliveryDate: '2031-12-01'
      }
    ],
    createdAt: '2025-01-05',
    createdBy: 'Sales Manager'
  },
  {
    id: '4',
    name: 'New Cairo',
    nameEn: 'New Cairo',
    nameAr: 'القاهرة الجديدة',
    developer: 'New Cairo Development',
    zone: 'New Cairo',
    type: 'Mixed',
    paymentPlans: [
      {
        downPayment: 25,
        delivery: 10,
        schedule: '5 years quarterly installments',
        payYears: 5,
        installmentPeriod: 'quarterly',
        installmentMonthsCount: 3,
        firstInstallmentDate: '2025-09-01',
        deliveryDate: '2030-09-01'
      }
    ],
    createdAt: '2025-01-10',
    createdBy: 'fadel'
  }
];

const initialDevelopers: Developer[] = [
  {
    id: '1',
    name: 'Talaat Moustafa Group',
    nameEn: 'Talaat Moustafa Group',
    nameAr: 'مجموعة طلعت مصطفى',
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
    nameEn: 'Palm Hills Developments',
    nameAr: 'بالم هيلز للتطوير',
    email: 'contact@palmhills.com.eg',
    phone: '0235390000',
    projects: 7,
    established: '2005',
    location: 'Giza',
    createdAt: '2025-01-01',
    createdBy: 'Abdullah Sobhy',
    image: ''
  },
  {
    id: '3',
    name: 'Mountain View Egypt',
    nameEn: 'Mountain View Egypt',
    nameAr: 'ماونتن فيو مصر',
    email: 'info@mountainview.com.eg',
    phone: '0234567890',
    projects: 3,
    established: '2010',
    location: '6th of October',
    createdAt: '2025-01-05',
    createdBy: 'Sales Manager',
    image: ''
  },
  {
    id: '4',
    name: 'New Cairo Development',
    nameEn: 'New Cairo Development',
    nameAr: 'تطوير القاهرة الجديدة',
    email: 'info@newcairo.com.eg',
    phone: '0234567891',
    projects: 4,
    established: '2015',
    location: 'New Cairo',
    createdAt: '2025-01-10',
    createdBy: 'fadel',
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
  const [zones, setZones] = useState<Zone[]>([
    {
      id: '1',
      name: 'New Cairo',
      nameEn: 'New Cairo',
      nameAr: 'القاهرة الجديدة',
      description: 'Modern residential area in New Cairo',
      latitude: 30.0444,
      longitude: 31.2357,
      properties: 0,
      createdAt: '2025-01-01',
      createdBy: 'System'
    },
    {
      id: '2',
      name: '6th of October',
      nameEn: '6th of October',
      nameAr: 'السادس من أكتوبر',
      description: 'Growing city west of Cairo',
      latitude: 29.9499,
      longitude: 30.9146,
      properties: 0,
      createdAt: '2025-01-01',
      createdBy: 'System'
    },
    {
      id: '3',
      name: 'Sheikh Zayed',
      nameEn: 'Sheikh Zayed',
      nameAr: 'الشيخ زايد',
      description: 'Luxury residential area',
      latitude: 30.0444,
      longitude: 31.2357,
      properties: 0,
      createdAt: '2025-01-05',
      createdBy: 'Sales Manager'
    },
    {
      id: '4',
      name: 'Maadi',
      nameEn: 'Maadi',
      nameAr: 'المعادي',
      description: 'Established residential area',
      latitude: 29.9627,
      longitude: 31.2597,
      properties: 0,
      createdAt: '2025-01-10',
      createdBy: 'fadel'
    },
    {
      id: '5',
      name: 'Heliopolis',
      nameEn: 'Heliopolis',
      nameAr: 'مصر الجديدة',
      description: 'Historic residential district',
      latitude: 30.1083,
      longitude: 31.3302,
      properties: 0,
      createdAt: '2025-01-15',
      createdBy: 'Abdullah Sobhy'
    },
    {
      id: '6',
      name: 'Zamalek',
      nameEn: 'Zamalek',
      nameAr: 'الزمالك',
      description: 'Upscale island district',
      latitude: 30.0596,
      longitude: 31.2230,
      properties: 0,
      createdAt: '2025-01-20',
      createdBy: 'Sales Manager'
    },
    {
      id: '7',
      name: 'Downtown Cairo',
      nameEn: 'Downtown Cairo',
      nameAr: 'وسط البلد',
      description: 'Historic city center',
      latitude: 30.0444,
      longitude: 31.2357,
      properties: 0,
      createdAt: '2025-01-25',
      createdBy: 'fadel'
    },
    {
      id: '8',
      name: 'Katameya',
      nameEn: 'Katameya',
      nameAr: 'الكاتمية',
      description: 'Exclusive residential area',
      latitude: 30.0444,
      longitude: 31.2357,
      properties: 0,
      createdAt: '2025-02-01',
      createdBy: 'Abdullah Sobhy'
    }
  ]);
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
      action: `New lead ${lead.nameEn || lead.name} added to system`,
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
  const getStatistics = (user?: { name: string; role: string; teamId?: string } | null) => {
    let filteredLeads = leads;
    let filteredMeetings = meetings;
    let filteredContracts = contracts;
    if (user) {
      if (user.role === 'sales_rep') {
        filteredLeads = leads.filter(lead => lead.assignedTo === user.name);
        filteredMeetings = meetings.filter(meeting => meeting.assignedTo === user.name);
        filteredContracts = contracts.filter(contract => contract.createdBy === user.name);
      } else if (user.role === 'team_leader') {
        // Team leaders see their own and their sales reps' leads/meetings/contracts
        const salesReps = users.filter(u => u.role === 'sales_rep' && u.teamId === user.name).map(u => u.name);
        filteredLeads = leads.filter(lead => lead.assignedTo === user.name || salesReps.includes(lead.assignedTo));
        filteredMeetings = meetings.filter(meeting => meeting.assignedTo === user.name || salesReps.includes(meeting.assignedTo));
        filteredContracts = contracts.filter(contract => contract.createdBy === user.name || salesReps.includes(contract.createdBy));
      } else if (user.role === 'sales_admin' || user.role === 'admin') {
        // See all
      }
    }
    const totalProspects = filteredLeads.length;
    const activeLeads = filteredLeads.filter(lead => ['Fresh Lead', 'Follow Up', 'Scheduled Visit', 'Open Deal'].includes(lead.status)).length;
    const today = new Date().toISOString().split('T')[0];
    const todayMeetings = filteredMeetings.filter(meeting => meeting.date === today).length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = filteredContracts
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
    const followUpLeads = filteredLeads.filter(lead => lead.status === LeadStatus.FOLLOW_UP).length;
    const allCalls = filteredLeads.flatMap(lead => lead.calls);
    const totalCalls = allCalls.length;
    const totalMeetings = filteredMeetings.length;
    const closedDeals = filteredLeads.filter(lead => lead.status === LeadStatus.ClosedDeal).length;
    const completedCalls = allCalls.filter(call => ['Interested', 'Meeting Scheduled', 'Follow Up Required'].includes(call.outcome)).length;
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