69999999
import { useMemo, useEffect } from 'react';
import { Lead } from '../types';

export const useLeadsStats = (leads: Lead[], filteredLeads: Lead[], userId?: string) => {
  const stats = useMemo(() => {
    const allLeadsCount = filteredLeads.length;
    const duplicateLeadsCount = filteredLeads.filter((lead, idx, arr) =>
      arr.findIndex(l => 
        (l.contact && l.contact === lead.contact) || 
        (l.email && l.email === lead.email)
      ) !== idx
    ).length;
    const freshLeadsCount = filteredLeads.filter(lead => lead.status === 'fresh_lead').length;
    const coldCallsCount = filteredLeads.filter(lead => lead.source === 'Cold Call').length;

    // Performance tracking for reports
    const userLeads = leads?.filter(lead => lead.assignedToId === userId);
    const totalCalls = userLeads?.reduce((sum, lead) => sum + (lead.calls?.length || 0), 0) || 0;
    const completedCalls = userLeads?.reduce((sum, lead) =>
      sum + (lead.calls?.filter((call: any) =>
        ['Interested', 'Meeting Scheduled', 'Follow Up Required'].includes(call.outcome)
      ).length || 0), 0);

    const totalVisits = userLeads?.reduce((sum, lead) => sum + (lead.visits?.length || 0), 0) || 0;
    const completedVisits = userLeads?.reduce((sum, lead) =>
      sum + (lead.visits?.filter((visit: any) => visit.status === 'Completed').length || 0), 0);

    return {
      allLeadsCount,
      duplicateLeadsCount,
      freshLeadsCount,
      coldCallsCount,
      userPerformance: {
        totalLeads: userLeads?.length || 0,
        totalCalls,
        completedCalls,
        callCompletionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0,
        totalVisits,
        completedVisits,
        visitCompletionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0
      }
    };
  }, [leads, filteredLeads, userId]);

  // Save performance data to localStorage for reports
  useEffect(() => {
    if (userId && stats.userPerformance) {
      const performanceKey = `user_performance_${userId}`;
      localStorage.setItem(performanceKey, JSON.stringify({
        ...stats.userPerformance,
        lastUpdated: new Date().toISOString(),
        userId
      }));
    }
  }, [stats.userPerformance, userId]);

  // Previous values for percentage change calculations
  const prevLeadsStats = JSON.parse(localStorage.getItem('leads_kpi_stats') || '{}');
  
  const getChange = (current: number, previous: number) => {
    if (previous === undefined || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const changes = useMemo(() => ({
    allLeadsChange: getChange(stats.allLeadsCount, prevLeadsStats.allLeadsCount),
    duplicateLeadsChange: getChange(stats.duplicateLeadsCount, prevLeadsStats.duplicateLeadsCount),
    freshLeadsChange: getChange(stats.freshLeadsCount, prevLeadsStats.freshLeadsCount),
    coldCallsChange: getChange(stats.coldCallsCount, prevLeadsStats.coldCallsCount)
  }), [stats, prevLeadsStats]);

  // Save current values for next time
  useEffect(() => {
    localStorage.setItem('leads_kpi_stats', JSON.stringify({
      allLeadsCount: stats.allLeadsCount,
      duplicateLeadsCount: stats.duplicateLeadsCount,
      freshLeadsCount: stats.freshLeadsCount,
      coldCallsCount: stats.coldCallsCount
    }));
  }, [stats]);

  return {
    ...stats,
    changes
  };
}; 