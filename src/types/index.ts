export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'Admin' | 'Sales Admin' | 'Team Leader' | 'Sales Rep';
  teamId?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget: string;
  inventoryInterest: string;
  source: string;
  status: 'Fresh Lead' | 'Follow Up' | 'Scheduled Visit' | 'Open Deal' | 'Closed Deal' | 'Cancellation';
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
  type: string;
  price: string;
  location: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  amenities: string;
  project: string;
  status: 'Available' | 'Rented' | 'Sold';
  latitude?: number;
  longitude?: number;
  createdAt: string;
  createdBy: string;
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  zone: string;
  type: string;
  paymentPlan: {
    downPayment: number;
    installments: number;
    delivery: number;
    schedule: string;
  };
  createdAt: string;
  createdBy: string;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  properties: number;
  createdAt: string;
  createdBy: string;
}

export interface Developer {
  id: string;
  name: string;
  email: string;
  phone: string;
  projects: number;
  established: string;
  location: string;
  createdAt: string;
  createdBy: string;
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