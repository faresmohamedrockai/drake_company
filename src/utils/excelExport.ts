import * as XLSX from 'xlsx';
import { User, Lead, Meeting, Contract } from '../types';

export interface TeamLeaderReport {
  teamLeader: User;
  teamMembers: User[];
  teamPerformance: {
    totalLeads: number;
    totalCalls: number;
    completedCalls: number;
    totalVisits: number;
    completedVisits: number;
    totalMeetings: number;
    completedMeetings: number;
    closedDeals: number;
    openDeals: number;
    conversionRate: number;
    callCompletionRate: number;
    visitCompletionRate: number;
    meetingCompletionRate: number;
    totalRevenue: number;
    averageDealSize: number;
  };
  memberDetails: Array<{
    user: User;
    leads: Lead[];
    meetings: Meeting[];
    contracts: Contract[];
    performance: {
      totalLeads: number;
      completedCalls: number;
      totalCalls: number;
      completedVisits: number;
      totalVisits: number;
      completedMeetings: number;
      totalMeetings: number;
      closedDeals: number;
      conversionRate: number;
      callCompletionRate: number;
      visitCompletionRate: number;
      meetingCompletionRate: number;
      totalRevenue: number;
      lastActivity: string;
    };
  }>;
}

export interface SalesMemberReport {
  user: User;
  period: string;
  dateRange: { startDate: Date | null; endDate: Date | null };
  // Lead Management
  totalLeads: number;
  newLeads: number;
  activeLeads: number;
  convertedLeads: number;
  lostLeads: number;
  leadConversionRate: number;

  // Activity Metrics
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  callCompletionRate: number;
  averageCallDuration: string;

  totalVisits: number;
  completedVisits: number;
  scheduledVisits: number;
  visitCompletionRate: number;

  totalMeetings: number;
  completedMeetings: number;
  scheduledMeetings: number;
  meetingCompletionRate: number;

  // Follow-ups
  totalFollowUps: number;
  completedFollowUps: number;
  pendingFollowUps: number;
  followUpCompletionRate: number;

  // Sales Performance
  totalReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  cancelledReservations: number;

  totalContracts: number;
  signedContracts: number;
  pendingContracts: number;
  cancelledContracts: number;

  totalRevenue: number;
  averageDealSize: number;
  totalDeals: number;
  closedDeals: number;
  openDeals: number;

  // Lead Status Breakdown
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;

  // Activity Timeline
  recentActivities: Array<{
    type: 'call' | 'visit' | 'meeting' | 'follow_up' | 'reservation' | 'contract';
    date: string;
    description: string;
    leadName: string;
    outcome: string;
  }>;

  // Performance Metrics
  conversionRate: number;
  averageResponseTime: string;
  customerSatisfactionScore: number;

  // Detailed Data
  leads: Lead[];
  meetings: Meeting[];
  contracts: Contract[];
  calls: Array<{
    leadId: string;
    leadName: string;
    date: string;
    duration: string;
    outcome: string;
    notes: string;
  }>;
  visits: Array<{
    leadId: string;
    leadName: string;
    date: string;
    status: string;
    notes: string;
  }>;
  followUps: Array<{
    leadId: string;
    leadName: string;
    date: string;
    type: string;
    status: string;
    notes: string;
  }>;
}

export interface SalesReportData {
  period: string;
  totalLeads: number;
  totalCalls: number;
  completedCalls: number;
  totalVisits: number;
  completedVisits: number;
  totalMeetings: number;
  completedMeetings: number;
  closedDeals: number;
  openDeals: number;
  totalRevenue: number;
  averageDealSize: number;
  conversionRate: number;
  callCompletionRate: number;
  visitCompletionRate: number;
  meetingCompletionRate: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  revenueByMonth: Record<string, number>;
  topPerformingUsers: Array<{
    user: User;
    performance: {
      totalLeads: number;
      closedDeals: number;
      conversionRate: number;
      totalRevenue: number;
    };
  }>;
}

const parseDateString = (dateString: string | null | undefined): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;

  // Handles 'YYYY-MM-DD' format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Handles 'DD/MM/YYYY' format
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // Month is 0-indexed in JavaScript Date (parts[1] - 1)
      const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      return isNaN(date.getTime()) ? null : date;
    }
  }

  // Fallback for other potential formats
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};



export const exportTeamLeaderReport = (report: TeamLeaderReport, dateRange: { startDate: Date | null; endDate: Date | null }) => {
  const workbook = XLSX.utils.book_new();

  // Team Overview Sheet
  const teamOverviewData = [
    {
      'Team Leader': report.teamLeader.name,
      'Team Size': report.teamMembers.length,
      'Total Leads': report.teamPerformance.totalLeads,
      'Total Calls': report.teamPerformance.totalCalls,
      'Completed Calls': report.teamPerformance.completedCalls,
      'Call Completion Rate (%)': report.teamPerformance.callCompletionRate.toFixed(1),
      'Total Visits': report.teamPerformance.totalVisits,
      'Completed Visits': report.teamPerformance.completedVisits,
      'Visit Completion Rate (%)': report.teamPerformance.visitCompletionRate.toFixed(1),
      'Total Meetings': report.teamPerformance.totalMeetings,
      'Completed Meetings': report.teamPerformance.completedMeetings,
      'Meeting Completion Rate (%)': report.teamPerformance.meetingCompletionRate.toFixed(1),
      'Closed Deals': report.teamPerformance.closedDeals,
      'Open Deals': report.teamPerformance.openDeals,
      'Conversion Rate (%)': report.teamPerformance.conversionRate.toFixed(1),
      'Total Revenue (EGP)': report.teamPerformance.totalRevenue.toLocaleString(),
      'Average Deal Size (EGP)': report.teamPerformance.averageDealSize.toLocaleString(),
    }
  ];

  const teamOverviewSheet = XLSX.utils.json_to_sheet(teamOverviewData);
  XLSX.utils.book_append_sheet(workbook, teamOverviewSheet, 'Team Overview');

  // Team Members Performance Sheet
  const membersData = report.memberDetails.map(member => ({
    'Name': member.user.name,
    'Role': member.user.role,
    'Email': member.user.email,
    'Total Leads': member.performance.totalLeads,
    'Completed Calls': member.performance.completedCalls,
    'Total Calls': member.performance.totalCalls,
    'Call Completion Rate (%)': member.performance.callCompletionRate.toFixed(1),
    'Completed Visits': member.performance.completedVisits,
    'Total Visits': member.performance.totalVisits,
    'Visit Completion Rate (%)': member.performance.visitCompletionRate.toFixed(1),
    'Completed Meetings': member.performance.completedMeetings,
    'Total Meetings': member.performance.totalMeetings,
    'Meeting Completion Rate (%)': member.performance.meetingCompletionRate.toFixed(1),
    'Closed Deals': member.performance.closedDeals,
    'Conversion Rate (%)': member.performance.conversionRate.toFixed(1),
    'Total Revenue (EGP)': member.performance.totalRevenue.toLocaleString(),
    'Last Activity': member.performance.lastActivity,
  }));

  const membersSheet = XLSX.utils.json_to_sheet(membersData);
  XLSX.utils.book_append_sheet(workbook, membersSheet, 'Team Members Performance');

  // Leads Details Sheet
  const leadsData = report.memberDetails.flatMap(member =>
    member.leads.map(lead => ({
      'Team Member': member.user.name,
      'Lead Name': lead.nameEn || lead.nameAr || 'N/A',
      'Contact': lead.contact,
      'Email': lead.email || 'N/A',
      'Status': lead.status,
      'Source': lead.source,
      'Budget (EGP)': lead.budget.toLocaleString(),
      'Assigned Date': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A',
      'Last Call Date': lead.lastCallDate ? new Date(lead.lastCallDate).toLocaleDateString() : 'N/A',
      'Last Visit Date': lead.lastVisitDate ? new Date(lead.lastVisitDate).toLocaleDateString() : 'N/A',
    }))
  );

  const leadsSheet = XLSX.utils.json_to_sheet(leadsData);
  XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Leads Details');

  // Meetings Details Sheet
  const meetingsData = report.memberDetails.flatMap(member =>
    member.meetings.map(meeting => ({
      'Team Member': member.user.name,
      'Meeting Title': meeting.title,
      'Client': meeting.client,
      'Date': meeting.date ? new Date(meeting.date).toLocaleDateString() : 'N/A',
      'Time': meeting.time,
      'Duration': meeting.duration,
      'Type': meeting.type,
      'Status': meeting.status,
      'Location': meeting.location || 'N/A',
    }))
  );

  const meetingsSheet = XLSX.utils.json_to_sheet(meetingsData);
  XLSX.utils.book_append_sheet(workbook, meetingsSheet, 'Meetings Details');

  // Contracts Details Sheet
  const contractsData = report.memberDetails.flatMap(member =>
    member.contracts.map(contract => ({
      'Team Member': member.user.name,
      'Lead Name': contract.lead?.nameEn || contract.lead?.nameAr || 'N/A',
      'Property': contract.inventory?.title || 'N/A',
      'Deal Value (EGP)': contract.dealValue.toLocaleString(),
      'Contract Date': contract.contractDate ? new Date(contract.contractDate).toLocaleDateString() : 'N/A',
      'Status': contract.status,
      'Notes': contract.notes || 'N/A',
    }))
  );

  const contractsSheet = XLSX.utils.json_to_sheet(contractsData);
  XLSX.utils.book_append_sheet(workbook, contractsSheet, 'Contracts Details');

  // Generate filename
  const startDate = dateRange.startDate ? dateRange.startDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const endDate = dateRange.endDate ? dateRange.endDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const filename = `Team_Leader_Report_${report.teamLeader.name.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.xlsx`;

  // Save the file
  XLSX.writeFile(workbook, filename);

  return filename;
};

export const exportSalesMemberReport = (report: SalesMemberReport) => {
  const workbook = XLSX.utils.book_new();

  // Combined Sales Members Overview Sheet
  const overviewData = [
  {
    'Report Type': 'Combined Sales Members Report',
    'Total Members': report.user?.role === 'team_leader' ? 'Team Members' : 'All Sales Members',
    'Total Leads': report.totalLeads ?? 0,
    'New Leads': report.newLeads ?? 0,
    'Active Leads': report.activeLeads ?? 0,
    'Converted Leads': report.convertedLeads ?? 0,
    'Lost Leads': report.lostLeads ?? 0,
    'Lead Conversion Rate (%)': (report.leadConversionRate ?? 0).toFixed(1),
    'Total Calls': report.totalCalls ?? 0,
    'Completed Calls': report.completedCalls ?? 0,
    'Call Completion Rate (%)': (report.callCompletionRate ?? 0).toFixed(1),
    'Completed Visits': report.completedVisits ?? 0,
    'Visit Completion Rate (%)': (report.visitCompletionRate ?? 0).toFixed(1),
    'Total Meetings': report.totalMeetings ?? 0,
    'Completed Meetings': report.completedMeetings ?? 0,
    'Meeting Completion Rate (%)': (report.meetingCompletionRate ?? 0).toFixed(1),
    'Total Follow-ups': report.totalFollowUps ?? 0,
    'Completed Follow-ups': report.completedFollowUps ?? 0,
    'Follow-up Completion Rate (%)': (report.followUpCompletionRate ?? 0).toFixed(1),
    'Total Reservations': report.totalReservations ?? 0,
    'Confirmed Reservations': report.confirmedReservations ?? 0,
    'Total Contracts': report.totalContracts ?? 0,
    'Signed Contracts': report.signedContracts ?? 0,
    'Total Revenue (EGP)': (report.totalRevenue ?? 0).toLocaleString(),
    'Average Deal Size (EGP)': (report.averageDealSize ?? 0).toLocaleString(),
    'Total Deals': report.totalDeals ?? 0,
    'Closed Deals': report.closedDeals ?? 0,
    'Conversion Rate (%)': (report.conversionRate ?? 0).toFixed(1),
  }
];


  const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Combined Overview');

  // Combined Activity Summary Sheet
  const activityData = [
    {
      'Metric': 'Calls',
      'Total': report.totalCalls,
      'Completed': report.completedCalls,
      'Missed': report.totalCalls - report.completedCalls,
      'Completion Rate (%)': report.callCompletionRate.toFixed(1),
      'Average Duration': report.averageCallDuration,
    },
    {
      'Metric': 'Visits',
      'Total': report.totalVisits,
      'Completed': report.completedVisits,
      'Scheduled': report.totalVisits - report.completedVisits,
      'Completion Rate (%)': report.visitCompletionRate.toFixed(1),
      'Average Duration': 'N/A',
    },
    {
      'Metric': 'Meetings',
      'Total': report.totalMeetings,
      'Completed': report.completedMeetings,
      'Scheduled': report.totalMeetings - report.completedMeetings,
      'Completion Rate (%)': report.meetingCompletionRate.toFixed(1),
      'Average Duration': 'N/A',
    },
    {
      'Metric': 'Follow-ups',
      'Total': report.totalFollowUps,
      'Completed': report.completedFollowUps,
      'Pending': report.totalFollowUps - report.completedFollowUps,
      'Completion Rate (%)': report.followUpCompletionRate.toFixed(1),
      'Average Duration': 'N/A',
    },
  ];

  const activitySheet = XLSX.utils.json_to_sheet(activityData);
  XLSX.utils.book_append_sheet(workbook, activitySheet, 'Combined Activity Summary');

  // Combined Sales Performance Sheet
  const salesData = [
    {
      'Metric': 'Reservations',
      'Total': report.totalReservations,
      'Confirmed': report.confirmedReservations,
      'Pending': report.totalReservations - report.confirmedReservations,
      'Cancelled': 0,
      'Success Rate (%)': report.totalReservations > 0 ? ((report.confirmedReservations / report.totalReservations) * 100).toFixed(1) : '0.0',
    },
    {
      'Metric': 'Contracts',
      'Total': report.totalContracts,
      'Signed': report.signedContracts,
      'Pending': report.totalContracts - report.signedContracts,
      'Cancelled': 0,
      'Success Rate (%)': report.totalContracts > 0 ? ((report.signedContracts / report.totalContracts) * 100).toFixed(1) : '0.0',
    },
    {
      'Metric': 'Deals',
      'Total': report.totalDeals,
      'Closed': report.closedDeals,
      'Open': report.totalDeals - report.closedDeals,
      'Lost': 0,
      'Success Rate (%)': report.totalDeals > 0 ? ((report.closedDeals / report.totalDeals) * 100).toFixed(1) : '0.0',
    },
  ];

  const salesSheet = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Combined Sales Performance');

  // Combined Leads by Status Sheet
  const leadsByStatusData = Object.entries(report.leadsByStatus).map(([status, count]) => ({
    'Status': status,
    'Count': count,
    'Percentage (%)': ((count / report.totalLeads) * 100).toFixed(1),
  }));

  const leadsByStatusSheet = XLSX.utils.json_to_sheet(leadsByStatusData);
  XLSX.utils.book_append_sheet(workbook, leadsByStatusSheet, 'Combined Leads by Status');

  // Combined Leads by Source Sheet
  const leadsBySourceData = Object.entries(report.leadsBySource).map(([source, count]) => ({
    'Source': source,
    'Count': count,
    'Percentage (%)': ((count / report.totalLeads) * 100).toFixed(1),
  }));

  const leadsBySourceSheet = XLSX.utils.json_to_sheet(leadsBySourceData);
  XLSX.utils.book_append_sheet(workbook, leadsBySourceSheet, 'Combined Leads by Source');

  // Combined Recent Activities Sheet
  const activitiesData = report.recentActivities.map(activity => ({
    'Date': activity.date,
    'Type': activity.type,
    'Description': activity.description,
    'Lead Name': activity.leadName,
    'Outcome': activity.outcome,
  }));

  const activitiesSheet = XLSX.utils.json_to_sheet(activitiesData);
  XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Combined Recent Activities');

  // Combined Detailed Calls Sheet
  const callsData = report.calls.map(call => ({
    'Lead Name': call.leadName,
    'Date': call.date,
    'Duration': call.duration,
    'Outcome': call.outcome,
    'Notes': call.notes,
  }));

  const callsSheet = XLSX.utils.json_to_sheet(callsData);
  XLSX.utils.book_append_sheet(workbook, callsSheet, 'Combined Detailed Calls');

  // Combined Detailed Visits Sheet
  const visitsData = report.visits.map(visit => ({
    'Lead Name': visit.leadName,
    'Date': visit.date,
    'Status': visit.status,
    'Notes': visit.notes,
  }));

  const visitsSheet = XLSX.utils.json_to_sheet(visitsData);
  XLSX.utils.book_append_sheet(workbook, visitsSheet, 'Combined Detailed Visits');

  // Combined Detailed Follow-ups Sheet
  const followUpsData = report.followUps.map(followUp => ({
    'Lead Name': followUp.leadName,
    'Date': followUp.date,
    'Type': followUp.type,
    'Status': followUp.status,
    'Notes': followUp.notes,
  }));

  const followUpsSheet = XLSX.utils.json_to_sheet(followUpsData);
  XLSX.utils.book_append_sheet(workbook, followUpsSheet, 'Combined Detailed Follow-ups');

  // Combined Detailed Leads Sheet
  const detailedLeadsData = report.leads.map(lead => ({
    'Lead Name': lead.nameEn || lead.nameAr || 'N/A',
    'Contact': lead.contact,
    'Email': lead.email || 'N/A',
    'Status': lead.status,
    'Source': lead.source,
    'Budget (EGP)': lead.budget.toLocaleString(),
    'Assigned Date': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A',
    'Last Call Date': lead.lastCallDate ? new Date(lead.lastCallDate).toLocaleDateString() : 'N/A',
    'Last Visit Date': lead.lastVisitDate ? new Date(lead.lastVisitDate).toLocaleDateString() : 'N/A',
    'Notes': lead.notes ? lead.notes.join('; ') : 'N/A',
  }));

  const detailedLeadsSheet = XLSX.utils.json_to_sheet(detailedLeadsData);
  XLSX.utils.book_append_sheet(workbook, detailedLeadsSheet, 'Combined Detailed Leads');

  // Combined Detailed Meetings Sheet
  const detailedMeetingsData = report.meetings.map(meeting => ({
    'Meeting Title': meeting.title,
    'Client': meeting.client,
    'Date': meeting.date ? new Date(meeting.date).toLocaleDateString() : 'N/A',
    'Time': meeting.time,
    'Duration': meeting.duration,
    'Type': meeting.type,
    'Status': meeting.status,
    'Location': meeting.location || 'N/A',
    'Notes': meeting.notes || 'N/A',
  }));

  const detailedMeetingsSheet = XLSX.utils.json_to_sheet(detailedMeetingsData);
  XLSX.utils.book_append_sheet(workbook, detailedMeetingsSheet, 'Combined Detailed Meetings');

  // Combined Detailed Contracts Sheet
  const detailedContractsData = report.contracts.map(contract => ({
    'Lead Name': contract.lead?.nameEn || contract.lead?.nameAr || 'N/A',
    'Property': contract.inventory?.title || 'N/A',
    'Deal Value (EGP)': contract.dealValue.toLocaleString(),
    'Contract Date': contract.contractDate ? new Date(contract.contractDate).toLocaleDateString() : 'N/A',
    'Status': contract.status,
    'Notes': contract.notes || 'N/A',
  }));

  const detailedContractsSheet = XLSX.utils.json_to_sheet(detailedContractsData);
  XLSX.utils.book_append_sheet(workbook, detailedContractsSheet, 'Combined Detailed Contracts');

  // Generate filename
  const startDate = report.dateRange.startDate ? report.dateRange.startDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const endDate = report.dateRange.endDate ? report.dateRange.endDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const filename = `Combined_Sales_Members_Report_${startDate}_to_${endDate}.xlsx`;

  // Save the file
  XLSX.writeFile(workbook, filename);

  return filename;
};


















export const exportSalesReport = (report: SalesReportData, dateRange: { startDate: Date | null; endDate: Date | null }) => {
  const workbook = XLSX.utils.book_new();

  // Sales Summary Sheet
  const salesSummaryData = [
    {
      'Period': report.period,
      'Total Leads': report.totalLeads,
      'Total Calls': report.totalCalls,
      'Completed Calls': report.completedCalls,
      'Call Completion Rate (%)': report.callCompletionRate.toFixed(1),
      // 'Total Visits': report.totalVisits,
      'Completed Visits': report.completedVisits,
      'Visit Completion Rate (%)': report.visitCompletionRate.toFixed(1),
      'Total Meetings': report.totalMeetings,
      'Completed Meetings': report.completedMeetings,
      'Meeting Completion Rate (%)': report.meetingCompletionRate.toFixed(1),
      'Closed Deals': report.closedDeals,
      'Open Deals': report.openDeals,
      'Conversion Rate (%)': report.conversionRate.toFixed(1),
      'Total Revenue (EGP)': report.totalRevenue.toLocaleString(),
      'Average Deal Size (EGP)': report.averageDealSize.toLocaleString(),
    }
  ];

  const salesSummarySheet = XLSX.utils.json_to_sheet(salesSummaryData);
  XLSX.utils.book_append_sheet(workbook, salesSummarySheet, 'Sales Summary');

  // Top Performers Sheet
  const topPerformersData = report.topPerformingUsers.map((user, index) => ({
    'Rank': index + 1,
    'Name': user.user.name,
    'Role': user.user.role,
    'Total Leads': user.performance.totalLeads,
    'Closed Deals': user.performance.closedDeals,
    'Conversion Rate (%)': user.performance.conversionRate.toFixed(1),
    'Total Revenue (EGP)': user.performance.totalRevenue.toLocaleString(),
  }));

  const topPerformersSheet = XLSX.utils.json_to_sheet(topPerformersData);
  XLSX.utils.book_append_sheet(workbook, topPerformersSheet, 'Top Performers');

  // Leads by Status Sheet
  const leadsByStatusData = Object.entries(report.leadsByStatus).map(([status, count]) => ({
    'Status': status,
    'Count': count,
    'Percentage (%)': ((count / report.totalLeads) * 100).toFixed(1),
  }));

  const leadsByStatusSheet = XLSX.utils.json_to_sheet(leadsByStatusData);
  XLSX.utils.book_append_sheet(workbook, leadsByStatusSheet, 'Leads by Status');

  // Leads by Source Sheet
  const leadsBySourceData = Object.entries(report.leadsBySource).map(([source, count]) => ({
    'Source': source,
    'Count': count,
    'Percentage (%)': ((count / report.totalLeads) * 100).toFixed(1),
  }));

  const leadsBySourceSheet = XLSX.utils.json_to_sheet(leadsBySourceData);
  XLSX.utils.book_append_sheet(workbook, leadsBySourceSheet, 'Leads by Source');

  // Revenue by Month Sheet
  const revenueByMonthData = Object.entries(report.revenueByMonth).map(([month, revenue]) => ({
    'Month': month,
    'Revenue (EGP)': revenue.toLocaleString(),
  }));

  const revenueByMonthSheet = XLSX.utils.json_to_sheet(revenueByMonthData);
  XLSX.utils.book_append_sheet(workbook, revenueByMonthSheet, 'Revenue by Month');

  // Generate filename
  const startDate = dateRange.startDate ? dateRange.startDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const endDate = dateRange.endDate ? dateRange.endDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const filename = `Sales_Report_${startDate}_to_${endDate}.xlsx`;

  // Save the file
  XLSX.writeFile(workbook, filename);

  return filename;
};

export const exportAllSalesMembersReport = (reports: SalesMemberReport[], dateRange: { startDate: Date | null; endDate: Date | null }) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    {
      'Total Team Members': reports.length,
      'Total Leads': reports.reduce((sum, report) => sum + report.totalLeads, 0),
      'Total Revenue (EGP)': reports.reduce((sum, report) => sum + report.totalRevenue, 0).toLocaleString(),
      'Total Contracts': reports.reduce((sum, report) => sum + report.totalContracts, 0),
      'Average Conversion Rate (%)': (reports.reduce((sum, report) => sum + report.conversionRate, 0) / reports.length).toFixed(1),
      'Average Deal Size (EGP)': (reports.reduce((sum, report) => sum + report.averageDealSize, 0) / reports.length).toLocaleString(),
    }
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Team Summary');

  // Individual Reports Sheet
  const individualData = reports.map(report => ({
    'Name': report.user.name,
    'Email': report.user.email,
    'Role': report.user.role,
    'Total Leads': report.totalLeads,
    'New Leads': report.newLeads,
    'Active Leads': report.activeLeads,
    'Converted Leads': report.convertedLeads,
    'Lead Conversion Rate (%)': report.leadConversionRate.toFixed(1),
    'Total Calls': report.totalCalls,
    'Completed Calls': report.completedCalls,
    'Call Completion Rate (%)': report.callCompletionRate.toFixed(1),
    'Total Visits': report.totalVisits,
    'Completed Visits': report.completedVisits,
    'Visit Completion Rate (%)': report.visitCompletionRate.toFixed(1),
    'Total Meetings': report.totalMeetings,
    'Completed Meetings': report.completedMeetings,
    'Meeting Completion Rate (%)': report.meetingCompletionRate.toFixed(1),
    'Total Follow-ups': report.totalFollowUps,
    'Completed Follow-ups': report.completedFollowUps,
    'Follow-up Completion Rate (%)': report.followUpCompletionRate.toFixed(1),
    'Total Reservations': report.totalReservations,
    'Confirmed Reservations': report.confirmedReservations,
    'Total Contracts': report.totalContracts,
    'Signed Contracts': report.signedContracts,
    'Total Revenue (EGP)': report.totalRevenue.toLocaleString(),
    'Average Deal Size (EGP)': report.averageDealSize.toLocaleString(),
    'Conversion Rate (%)': report.conversionRate.toFixed(1),
    'Average Response Time': report.averageResponseTime,
    'Customer Satisfaction Score': report.customerSatisfactionScore,
  }));

  const individualSheet = XLSX.utils.json_to_sheet(individualData);
  XLSX.utils.book_append_sheet(workbook, individualSheet, 'Individual Performance');

  // Performance Comparison Sheet
  const comparisonData = reports.map(report => ({
    'Name': report.user.name,
    'Role': report.user.role,
    'Leads per Member': report.totalLeads,
    'Revenue per Member (EGP)': report.totalRevenue,
    'Contracts per Member': report.totalContracts,
    'Conversion Rate (%)': report.conversionRate,
    'Call Completion Rate (%)': report.callCompletionRate,
    'Meeting Completion Rate (%)': report.meetingCompletionRate,
    'Follow-up Completion Rate (%)': report.followUpCompletionRate,
    'Average Deal Size (EGP)': report.averageDealSize,
    'Customer Satisfaction Score': report.customerSatisfactionScore,
  }));

  const comparisonSheet = XLSX.utils.json_to_sheet(comparisonData);
  XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Performance Comparison');

  // Generate filename
  const startDate = dateRange.startDate ? dateRange.startDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const endDate = dateRange.endDate ? dateRange.endDate.toLocaleDateString().replace(/\//g, '-') : 'all';
  const filename = `All_Sales_Members_Report_${startDate}_to_${endDate}.xlsx`;

  // Save the file
  XLSX.writeFile(workbook, filename);

  return filename;
};

export const exportUserPerformanceReport = (users: User[], leads: Lead[], meetings: Meeting[], contracts: Contract[], dateRange: { startDate: Date | null; endDate: Date | null }) => {
  const workbook = XLSX.utils.book_new();

  const userPerformanceData = users.map(user => {
    // [FIX 1] Correctly filter leads for the user (assigned or owned)
    const userLeads = leads.filter(lead =>
      lead.assignedToId === user.id ||
      lead.ownerId === user.id ||
      lead.owner?.id === user.id
    );

    const userMeetings = meetings.filter(meeting => meeting.assignedToId === user.id);
    const userContracts = contracts.filter(contract => contract.createdById === user.id);

    // Filter by date range if specified
    let filteredLeads = userLeads;
    let filteredMeetings = userMeetings;
    let filteredContracts = userContracts;

    if (dateRange.startDate && dateRange.endDate) {
      // [FIX 2] Use the robust parseDateString function
      filteredLeads = userLeads.filter(lead => {
        const createdDate = parseDateString(lead.createdAt);
        return createdDate && createdDate >= dateRange.startDate! && createdDate <= dateRange.endDate!;
      });

      filteredMeetings = userMeetings.filter(meeting => {
        const meetingDate = parseDateString(meeting.date);
        return meetingDate && meetingDate >= dateRange.startDate! && meetingDate <= dateRange.endDate!;
      });

      filteredContracts = userContracts.filter(contract => {
        const contractDate = parseDateString(contract.contractDate);
        return contractDate && contractDate >= dateRange.startDate! && contractDate <= dateRange.endDate!;
      });
    }

    // Calculate calls from the filtered leads
    let totalCalls = 0;
    let completedCalls = 0;
    const userCallsData: Array<{ leadName: string; date: string; duration: string; outcome: string; notes: string; }> = [];

    filteredLeads.forEach(lead => {
      if (lead.calls && Array.isArray(lead.calls)) {
        lead.calls.forEach(call => {
          totalCalls++;
          // [FIX 3] Correctly check the outcome of the CURRENT call
          const isCompleted = call.outcome && call.outcome.toLowerCase() !== 'not interested' && call.outcome.toLowerCase() !== 'no answer';
          if (isCompleted) {
            completedCalls++;
          }
          userCallsData.push({
            leadName: lead.nameEn || lead.nameAr || 'N/A',
            date: call.date || 'N/A',
            duration: call.duration || 'N/A',
            outcome: call.outcome || 'N/A',
            notes: call.notes || 'N/A'
          });
        });
      }
    });

    const closedDeals = filteredLeads.filter(lead => lead.status === 'closed_deal').length;
    const openDeals = filteredLeads.filter(lead => lead.status === 'open_deal').length;
    const conversionRate = filteredLeads.length > 0 ? ((closedDeals + openDeals) / filteredLeads.length) * 100 : 0;
    const totalRevenue = filteredContracts.reduce((sum, contract) => sum + contract.dealValue, 0);
    const averageDealSize = filteredContracts.length > 0 ? totalRevenue / filteredContracts.length : 0;
    const callCompletionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;
    const meetingCompletionRate = filteredMeetings.length > 0 ? (filteredMeetings.filter(m => m.status === 'Completed').length / filteredMeetings.length) * 100 : 0;

    const activityDates = [
      ...filteredLeads.map(l => parseDateString(l.lastCallDate)),
      ...filteredMeetings.map(m => parseDateString(m.date)),
    ].filter((d): d is Date => d !== null);

    const lastActivity = activityDates.length > 0 ? new Date(Math.max(...activityDates.map(d => d.getTime()))).toLocaleDateString() : 'N/A';

    return {
      // Data for the main summary sheet
      summary: {
        'Name': user.name,
        'Email': user.email,
        'Role': user.role,
        'Total Leads': filteredLeads.length,
        'Closed Deals': closedDeals,
        'Open Deals': openDeals,
        'Conversion Rate (%)': conversionRate.toFixed(1),
        'Total Calls': totalCalls,
        'Completed Calls': completedCalls,
        'Call Completion Rate (%)': callCompletionRate.toFixed(1),
        'Total Meetings': filteredMeetings.length,
        'Completed Meetings': filteredMeetings.filter(m => m.status === 'Completed').length,
        'Meeting Completion Rate (%)': meetingCompletionRate.toFixed(1),
        'Total Contracts': filteredContracts.length,
        'Total Revenue (EGP)': totalRevenue,
        'Average Deal Size (EGP)': averageDealSize,
        'Last Activity': lastActivity,
      },
      // Detailed data for other sheets
      details: {
        user,
        leads: filteredLeads,
        calls: userCallsData,
        meetings: filteredMeetings,
        contracts: filteredContracts,
      }
    };
  });

  // Create the main overview sheet from the summary data
  const overviewSheetData = userPerformanceData.map(data => data.summary);
  const userPerformanceSheet = XLSX.utils.json_to_sheet(overviewSheetData);
  XLSX.utils.book_append_sheet(workbook, userPerformanceSheet, 'User Performance Overview');

  // Create Detailed Calls Sheet
  const allCalls = userPerformanceData.flatMap(data => data.details.calls.map(call => ({
    'User Name': data.details.user.name,
    'Lead Name': call.leadName,
    'Call Date': call.date,
    'Duration': call.duration,
    'Outcome': call.outcome,
    'Notes': call.notes,
  })));
  if (allCalls.length > 0) {
    const callsSheet = XLSX.utils.json_to_sheet(allCalls);
    XLSX.utils.book_append_sheet(workbook, callsSheet, 'Detailed Calls');
  }

  // Create Detailed Meetings Sheet
  const allMeetings = userPerformanceData.flatMap(data => data.details.meetings.map(meeting => ({
    'User Name': data.details.user.name,
    'Meeting Title': meeting.title,
    'Client': meeting.client,
    'Date': meeting.date ? parseDateString(meeting.date)?.toLocaleDateString() : 'N/A',
    'Time': meeting.time,
    'Status': meeting.status,
    'Location': meeting.location || 'N/A',
  })));
  if (allMeetings.length > 0) {
    const meetingsSheet = XLSX.utils.json_to_sheet(allMeetings);
    XLSX.utils.book_append_sheet(workbook, meetingsSheet, 'Detailed Meetings');
  }

  // Create Detailed Leads Sheet
  const allLeads = userPerformanceData.flatMap(data => data.details.leads.map(lead => ({
    'Assigned User': data.details.user.name,
    'Lead Name': lead.nameEn || lead.nameAr || 'N/A',
    'Contact': lead.contact,
    'Status': lead.status,
    'Source': lead.source,
    'Budget (EGP)': lead.budget,
    'Created Date': lead.createdAt ? parseDateString(lead.createdAt)?.toLocaleDateString() : 'N/A',
  })));
  if (allLeads.length > 0) {
    const leadsSheet = XLSX.utils.json_to_sheet(allLeads);
    XLSX.utils.book_append_sheet(workbook, leadsSheet, 'Detailed Leads');
  }

  // Create Detailed Contracts Sheet
  const allContracts = userPerformanceData.flatMap(data => data.details.contracts.map(contract => ({
    'Created By User': data.details.user.name,
    'Lead Name': contract.lead?.nameEn || contract.lead?.nameAr || 'N/A',
    'Property': contract.inventory?.title || 'N/A',
    'Deal Value (EGP)': contract.dealValue,
    'Contract Date': contract.contractDate ? parseDateString(contract.contractDate)?.toLocaleDateString() : 'N/A',
    'Status': contract.status,
  })));
  if (allContracts.length > 0) {
    const contractsSheet = XLSX.utils.json_to_sheet(allContracts);
    XLSX.utils.book_append_sheet(workbook, contractsSheet, 'Detailed Contracts');
  }

  const startDateStr = dateRange.startDate ? dateRange.startDate.toLocaleDateString().replace(/\//g, '-') : 'all-time';
  const filename = `User_Performance_Report_${startDateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);

  return filename;
};