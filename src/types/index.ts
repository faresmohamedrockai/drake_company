import { Project } from "../components/inventory/ProjectsTab";

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
  VIP = 'vip',
  NON_STOP = 'non_stop',
  NOT_INTERSTED_NOW = 'not_intersted_now',
  RESERVATION = 'reservation',

}




export enum Interest {
  HOT = 'hot',
  WARM = 'warm',
  UNDER_DECISION = 'under_decision',
}

export enum Tier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}



export interface Log {
  id: number,
  action: string,
  description: string,
  userId: string,
  userName: string | null,
  email: string | null,
  userRole: string,
  leadId: string | null,
  ip: string | null,
  userAgent: string | null,
  createdAt: string,
}


export interface Lead {
  id?: string;
  nameEn?: string; // English name
  nameAr?: string; // Arabic name
  gender?: string; // Arabic name
  description?: string; // Arabic name
  otherProject?: string;
  contact?: string;
  contacts?: string[];
  
  meetings?: Meeting[];
  email?: string;
  familyName?: string
  toAgentId: string;
  transferType: string;
  // notes: string;
  firstConection?: string | Date;
  budget: number;
  inventoryInterestId?: string;
  projectInterestId?: string;
  source: string;
  interest: Interest;
  tier: Tier;
  cil?: boolean
  isuntouched?: boolean
  status: LeadStatus;
  lastCallDate?: string;
  lastVisitDate?: string;
  // assignedToId: string;
  ownerId?: string; // Backend uses this field name
  createdAt?: string;
  createdBy?: string;
  inventoryInterest?: any
  projectInterest?: any
  project?: any | null;
  notes?: string[] | string|null;
  calls?: CallLog[] | null;
  visits?: VisitLog[] | null;
  transfers: []
  owner?: User | null;
}

export interface CallLog {
  id: string;
  leadId: string;
  date: string;
  outcome: string;
  duration: string;
  projectId: string;
  notes: string;
  createdBy: string;
}

export interface VisitLog {
  inventoryId: string;
  id: string;
  leadId: string;
  type: string
  date: string;
  project: string;
  meettingId: string;
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

// export interface Project {
//   id: string;
//   name: string;
//   nameEn?: string; // English name
//   nameAr?: string; // Arabic name
//   developer: string;
//   otherProject?:string;
//   zone: string;
//   type: string;
//   paymentPlans: {
//     downPayment: number;
//     delivery: number;
//     schedule?: string;
//     payYears: number;
//     installmentPeriod: string;
//     installmentMonthsCount: number;
//     firstInstallmentDate: string;
//     deliveryDate: string;
//   }[];
//   createdAt: string;
//   createdBy: string;
//   zoneId?: string;
//   developerId?: string;
//   propertyIds?: string[];
//   images?: string[]; // Array of image URLs or data URLs
// }

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
  createdAt: string;
  createdBy: string;
  image?: string; // 
  projectIds?: string[];
  nameEn?: string; // English name
  nameAr: string;
  email: string;
  phone: string;
  projects: Project[];
  established: string;
  location: string;
  logo: string;

}

export interface Meeting {
  id?: string;
  title: string;
  client: string;
  leadId?: string;
  date: string;
  time: string;
  // meetingDone?: boolean;
  duration: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  assignedToId: string;
  notes?: string;
  createdAt?: string;
  createdBy?: string;
  createdById?: string;
  location?: string;
  locationType?: string;
}

export interface Contract {
  id?: string;
  leadId?: string;
  inventoryId: string;
  cNumber: string;
  dealValue: number;
  contractDate: string;
  status: 'Pending' | 'Signed' | 'Cancelled';
  notes: string;
  createdById?: string;
  lead?: Lead,
  inventory?: Property,
  createdBy?: User,
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'lead' | 'property' | 'meeting' | 'contract' | 'call' | 'visit';
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date | {} | null; // Handle empty object and null cases from backend
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  type: 'follow_up' | 'meeting_preparation' | 'contract_review' | 'payment_reminder' | 'visit_scheduling' | 'lead_nurturing' | 'general';
  reminder: boolean;
  reminderTime?: Date | {} | null; // Handle empty object and null cases from backend
  emailSent: boolean;

  // Relations
  assignedToId?: string | null;
  createdById?: string | null;
  leadId?: string | null;
  projectId?: string | null;
  inventoryId?: string | null;

  createdAt: Date | {} | null; // Handle empty object and null cases from backend
  updatedAt: Date | {} | null; // Handle empty object and null cases from backend

  // Populated relations
  assignedTo?: User | null;
  createdBy?: User | null;
  lead?: Lead | null;
  project?: Project | null;
  inventory?: Property | null;
}

export interface TaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByPriority: Array<{ priority: string; _count: { id: number } }>;
  tasksByType: Array<{ type: string; _count: { id: number } }>;
  completionRate: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate: string | Date | {}; // Allow string, Date object, or empty object for backend
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  type: 'follow_up' | 'meeting_preparation' | 'contract_review' | 'payment_reminder' | 'visit_scheduling' | 'lead_nurturing' | 'general';
  reminder?: boolean;
  reminderTime?: string | Date | null; // Allow string, Date object, or null for backend
  assignedToId?: string | null;
  createdById?: string | null;
  leadId?: string | null;
  projectId?: string | null;
  inventoryId?: string | null;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> { }

export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  type?: Task['type'];
  assignedToId?: string;
  createdById?: string;
  leadId?: string;
  projectId?: string;
  inventoryId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
}

export interface SimpleUser {
  id: string;
  name: string;
  role: string;
}

export interface Notification {
  id: string;
  notificationData: {
    data?: any; // To keep it simple for now, you can replace 'any' with the detailed interfaces from before
    route: string;
    meetingId?: string;
  };
  title: string;
  body: string;
  isSeen: boolean;
  createdAt: string; // ISO Date string
  createdById: string;
  assignToId: string;
  createdBy: SimpleUser;
  assignTo: SimpleUser;
}