export interface User {
  id: string,
  email: string,
  name: string,
  password: string,
  role: string,
  refreshToken: string | null,
  createdAt: string,
  image: string | null,
  teamLeaderId: string | null,
  teamId: string | null,
  username: string,
  isActive: boolean,
}












export enum LeadStatus {
  FRESH_LEAD = 'fresh_lead',
  FOLLOW_UP = 'follow_up',
  SCHEDULED_VISIT = 'scheduled_visit',
  OPEN_DEAL = 'open_deal',
  CANCELLATION = 'cancellation',
  CLOSED_DEAL = "closed_deal",
  NO_ANSWER = 'no_answer',
  NOT_INTERESTED_NOW = 'not_interested_now',
  RESERVATION = 'reservation',
}







export interface Lead {
  id: string;
  name: string;
  nameEn?: string; // English name
  nameAr?: string; // Arabic name
  phone: string;
  email?: string;
  budget: string;
  inventoryInterest: string;
  source: string;
  status: LeadStatus;
  lastCallDate: string;
  lastVisitDate: string;
  assignedTo: string;
  createdAt: string;
  createdBy: string;
  notes: Note[];
  calls: CallLog[];
  visits: VisitLog[];
}

export interface CallLog {
  id: string;
  leadId: string;
  date: string;
  outcome: string;
  duration: string;
  project: string;
  notes: string;
  createdBy: string;
}

export interface VisitLog {
  id: string;
  leadId: string;
  date: string;
  project: string;
  status: string;
  objections: string;
  notes: string;
  createdBy: string;
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Property {
  id: string;
  title: string;
  titleEn?: string; // English title
  titleAr?: string; // Arabic title
  type: string;
  price: number;
  location: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  amenities: string[];
  project: string;
  status: 'Available' | 'Rented' | 'Sold';
  latitude?: number;
  longitude?: number;
  createdAt: string;
  createdBy: string;
  zoneId?: string;
  projectId?: string;
  developerId?: string;
  // Payment plan fields
  downPayment?: number; // EGP
  payYears?: number; // total years to pay
  installmentPeriod?: string; // 'monthly' | 'quarterly' | 'yearly' | 'custom'
  installmentMonthsCount?: number; // for custom period
  firstInstallmentDate?: string; // ISO date
  deliveryDate?: string; // ISO date
}

export interface Project {
  id: string;
  name: string;
  nameEn?: string; // English name
  nameAr?: string; // Arabic name
  developer: string;
  zone: string;
  type: string;
  paymentPlans: {
    downPayment: number;
    delivery: number;
    schedule?: string;
    payYears: number;
    installmentPeriod: string;
    installmentMonthsCount: number;
    firstInstallmentDate: string;
    deliveryDate: string;
  }[];
  createdAt: string;
  createdBy: string;
  zoneId?: string;
  developerId?: string;
  propertyIds?: string[];
  images?: string[]; // Array of image URLs or data URLs
}

export interface Zone {
  id: string;
  name: string;
  nameEn?: string; // English name
  nameAr?: string; // Arabic name
  description: string;
  latitude: number;
  longitude: number;
  properties: number;
  createdAt: string;
  createdBy: string;
  propertyIds?: string[];
  projectIds?: string[];
}

export interface Developer {
  id: string;
  name: string;
  nameEn?: string; // English name
  nameAr?: string; // Arabic name
  email: string;
  phone: string;
  projects: number;
  established: string;
  location: string;
  createdAt: string;
  createdBy: string;
  image?: string; // 
  projectIds?: string[];
}

export interface Meeting {
  id: string;
  title: string;
  client: string;
  leadId?: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  assignedTo: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Contract {
  id: string;
  leadId: string;
  leadName: string;
  property: string;
  dealValue: string;
  contractDate: string;
  status: 'Pending' | 'Signed' | 'Cancelled';
  createdBy: string;
  notes: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'lead' | 'property' | 'meeting' | 'contract' | 'call' | 'visit';
}