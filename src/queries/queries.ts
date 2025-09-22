import axiosInterceptor from "../../axiosInterceptor/axiosInterceptor";
import { Project } from "../components/inventory/ProjectsTab";
import { Contract, Developer, Lead, Log, Meeting, Property, User, Zone, Task, TaskStatistics, CreateTaskDto, UpdateTaskDto, TaskFilters } from "../types";

export const getDevelopers = async () => {
    const response = await axiosInterceptor.get('/developers');

    return response.data.developers as Developer[];
}

export const getZones = async () => {
    const response = await axiosInterceptor.get('/zones');
    return response.data.zones as Zone[];
}











import { useQuery } from '@tanstack/react-query';

async function fetchStreamLeads(token: string) {
  const response = await fetch(`${process.env.VITE_BASE_URL}/leads/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let leads: any[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true }).trim();
    if (!chunk) continue;

    
    for (const line of chunk.split("\n")) {
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        leads.push(...parsed);
      } catch (e) {
        console.error("Failed to parse line:", line);
      }
    }
  }

  return leads;
}

export function useStreamLeads(token: string) {
  return useQuery({
    queryKey: ['leads', 'stream'],
    queryFn: () => fetchStreamLeads(token),
  });
}












export const getLeads = async () => {
    const response = await axiosInterceptor.get('/leads');

   
    if (response.data.leads) {
        return response.data.leads as Lead[];
    } else if (response.data.data) {
        return response.data.data as Lead[];
    } else if (Array.isArray(response.data)) {
        return response.data as Lead[];
    } else {
        console.error('Unexpected leads API response structure:', response.data);
        return [];
    }
}




// Get leads with calls and visits populated
export const getLeadsWithDetails = async () => {
    const response = await axiosInterceptor.get('/leads?include=calls,visits');
    return response.data.leads as Lead[];
}


export const deleteLead = async (leadId: string) => {
    const response = await axiosInterceptor.delete(`/leads/${leadId}`);
    return response.data;
}

export const createLead = async (lead: Partial<Lead>) => {
    const response = await axiosInterceptor.post('/leads/create', lead);
    return response.data.data.lead;
}

















export const bulkUpdateLeads = async (leadIds: string[], updateData: Partial<Lead>) => {
    // Since there's no bulk endpoint, we'll update each lead individually
    const promises = leadIds.map(leadId =>
        axiosInterceptor.post(`/transfer/`, { ...updateData, leadId: leadId })
    );

    const responses = await Promise.all(promises);
    getLeads()
    return { success: true, updated: responses.length };
}


















export const getUsers = async () => {
    const response = await axiosInterceptor.get('/auth/users');

    // Handle different possible response structures
    if (response.data.users) {
        return response.data.users as User[];
    } else if (response.data.data) {
        return response.data.data as User[];
    } else if (Array.isArray(response.data)) {
        return response.data as User[];
    } else {
        console.error('Unexpected users API response structure:', response.data);
        return [];
    }
}

export const getProperties = async () => {
    const response = await axiosInterceptor.get('/properties');
    return response.data.properties as Property[];
}

export const getMeetings = async () => {
    const response = await axiosInterceptor.get('/meetings');

    // Handle different possible response structures
    if (response.data.meetings) {
        return response.data.meetings as Meeting[];
    } else if (response.data.data) {
        return response.data.data as Meeting[];
    } else if (Array.isArray(response.data)) {
        return response.data as Meeting[];
    } else {
        console.error('Unexpected meetings API response structure:', response.data);
        return [];
    }
}

export const getContracts = async () => {
    const response = await axiosInterceptor.get('/contracts');
    return response.data.data as Contract[];
}
export const getDashboardData = async () => {
    const response = await axiosInterceptor.get('/leads/dashboard-data');
    return response.data.data;
}

export const getUsersStatus = async (timeframe: string = 'last30days', activity: string = 'all', sort: string = "performance", role: string = '') => {
    const response = await axiosInterceptor.get('auth/users-data', {
        params: { timeframe, activity, sort, role },
    });
    return response.data;
};


export const addContract = async (contract: Contract) => {
    const response = await axiosInterceptor.post('/contracts', contract);
    return response.data.data as Contract[];
}

export const updateContract = async (editId: string, contract: Contract) => {
    const response = await axiosInterceptor.patch(`/contracts/${contract.id}`, contract);
    return response.data.data as Contract[];
}

export const deleteContract = async (id: string) => {
    const response = await axiosInterceptor.delete(`/contracts/${id}`);
    return response.data;
}

export const getProjects = async () => {
    const response = await axiosInterceptor.get('/projects');
    return response.data.projects as Project[];
}

export const getLogs = async () => {
    const response = await axiosInterceptor.get('/logs');
    return response.data as Log[];
}

// Task Management Queries
export const getTasks = async (filters?: TaskFilters) => {
    const params = new URLSearchParams();

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
    }

    const response = await axiosInterceptor.get(`/tasks?${params.toString()}`);
    return response.data as Task[];
}

export const getMyTasks = async (filters?: Omit<TaskFilters, 'assignedToId' | 'createdById'>) => {
    const params = new URLSearchParams();

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value.toString());
            }
        });
    }

    const response = await axiosInterceptor.get(`/tasks/my-tasks?${params.toString()}`);
    return response.data as Task[];
}

export const getTasksByLead = async (leadId: string) => {
    const response = await axiosInterceptor.get(`/tasks/lead/${leadId}`);
    return response.data as Task[];
}

export const getTasksByProject = async (projectId: string) => {
    const response = await axiosInterceptor.get(`/tasks/project/${projectId}`);
    return response.data as Task[];
}

export const getTaskStatistics = async () => {
    const response = await axiosInterceptor.get('/tasks/statistics');
    return response.data as TaskStatistics;
}

export const getNotificationData = async () => {
    const response = await axiosInterceptor.get('/notificationData');
    return response.data as TaskStatistics;
}
export const markNotificationAsSeen = async (notificationId: string): Promise<Notification> => {
  console.log("Before Edit", notificationId);
  const response = await axiosInterceptor.patch(`/notificationData/${notificationId}`, {
    isSeen: true,
  });
  return response.data;
}


export const getTask = async (id: string) => {
    const response = await axiosInterceptor.get(`/tasks/${id}`);
    return response.data as Task;
}

export const createTask = async (task: CreateTaskDto) => {
    const response = await axiosInterceptor.post('/tasks', task);
    return response.data as Task;
}

export const updateTask = async (id: string, task: UpdateTaskDto) => {
    const response = await axiosInterceptor.patch(`/tasks/${id}`, task);
    return response.data as Task;
}

export const updateTaskStatus = async (id: string, status: Task['status']) => {
    const response = await axiosInterceptor.patch(`/tasks/${id}/status`, { status });
    return response.data as Task;
}

export const deleteTask = async (id: string) => {
    const response = await axiosInterceptor.delete(`/tasks/${id}`);
    return response.data;
}

export const getLeadLogs = async (leadId: string) => {
    const response = await axiosInterceptor.get(`/logs?leadId=${leadId}`);
    return response.data as Log[];
}

// Get all calls data
export const getAllCalls = async () => {
    const response = await axiosInterceptor.get('/calls');
    return response.data.data || response.data.calls || [];
}

// Get all visits data
export const getAllVisits = async () => {
    const response = await axiosInterceptor.get('/visits');
    return response.data.visits || response.data.data || [];
}

// Get calls for a specific lead
export const getCallsByLead = async (leadId: string) => {
    const response = await axiosInterceptor.get(`/calls/${leadId}`);
    return response.data.data || [];
}

// Get visits for a specific lead
export const getVisitsByLead = async (leadId: string) => {
    const response = await axiosInterceptor.get(`/visits/${leadId}`);
    return response.data.visits || [];
}

// Populate leads with their calls and visits data
export const populateLeadsWithCallsAndVisits = async (leads: Lead[]): Promise<Lead[]> => {
    try {
        const populatedLeads = await Promise.all(
            leads.map(async (lead) => {
                try {
                    // Only fetch if calls/visits are not already populated
                    if (!lead.calls || !lead.visits) {
                        const [calls, visits] = await Promise.all([
                            lead.calls ? Promise.resolve(lead.calls) : getCallsByLead(lead.id!).catch(() => []),
                            lead.visits ? Promise.resolve(lead.visits) : getVisitsByLead(lead.id!).catch(() => [])
                        ]);

                        return {
                            ...lead,
                            calls: calls || [],
                            visits: visits || []
                        };
                    }
                    return lead;
                } catch (error) {
                    console.warn(`Failed to populate data for lead ${lead.id}:`, error);
                    return lead; // Return original lead if population fails
                }
            })
        );
        return populatedLeads;
    } catch (error) {
        console.warn('Failed to populate leads with calls and visits:', error);
        return leads; // Return original leads if population fails
    }
}
