import React, { useMemo, useState } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Interest, Lead, LeadStatus, Property, Tier, User } from '../../types';
import { PhoneNumber } from '../ui/PhoneNumber';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  properties: Property[];
  users: User[];
  selectedLeads: Set<string>;
  isSelectAllChecked: boolean;
  onSelectLead: (leadId: string) => void;
  onSelectAll: () => void;
  onLeadClick: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
  t: (key: string) => string;
  i18n: any;
  searchTerm: string;
}

// User color mapping
const USER_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
  'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
];

export const LeadsTable: React.FC<LeadsTableProps> = React.memo(({
  leads,
  isLoading,
  properties,
  users,
  selectedLeads,
  isSelectAllChecked,
  onSelectLead,
  onSelectAll,
  onLeadClick,
  onEditLead,
  onDeleteLead,
  t,
  i18n,
  searchTerm
}) => {
  const getUserColor = useMemo(() => (userName: string) => {
    const userIndex = users?.findIndex(user => user.name === userName);
    return userIndex !== undefined && userIndex >= 0 ? USER_COLORS[userIndex % USER_COLORS.length] : 'bg-gray-500';
  }, [users]);



  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Sort leads from newest to oldest based on createdAt
  const sortedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  }, [leads]);
  
  const totalPages = Math.ceil(sortedLeads.length / rowsPerPage);
  // البيانات اللي هتتعرض
  const paginatedLeads = sortedLeads.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // دالة توليد الصفحات مع "..."
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const project = leads.map((lead) => lead.inventoryInterest?.project.nameAr)

  const meetings = leads.map((lead) => {
    if (!lead.meetings || lead.meetings.length === 0) {
      return null; // لو مفيش اجتماعات
    }
    const lastMeeting = lead.meetings[lead.meetings.length - 1]; // آخر اجتماع
    return lastMeeting.date;
  });

  console.log(meetings);

  // console.log(meettings);



  const getUserInitials = useMemo(() => (userName: string) => {
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getDisplayName = useMemo(() => (lead: Lead) => {
    if (i18n.language === 'ar') {
      return lead.nameAr || lead.nameEn || '';
    } else {
      return lead.nameEn || lead.nameAr || '';
    }
  }, [i18n.language]);

  const projectName = useMemo(() => (lead: Lead) => {
    if (i18n.language === 'ar') {
      return lead.inventoryInterest?.project.nameAr || lead.inventoryInterest?.project.nameEn || 'لا يوجد';
    } else {
      return lead.inventoryInterest?.project.nameEn || lead.inventoryInterest?.project.nameAr || 'Not Found ';
    }
  }, [i18n.language]);




  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case LeadStatus.FRESH_LEAD: return 'bg-blue-100 text-blue-800';
      case LeadStatus.FOLLOW_UP: return 'bg-yellow-100 text-yellow-800';
      case LeadStatus.SCHEDULED_VISIT: return 'bg-purple-100 text-purple-800';
      case LeadStatus.OPEN_DEAL: return 'bg-green-100 text-green-800';
      case LeadStatus.VIP: return 'bg-green-100 text-yellow-800';
      case LeadStatus.NON_STOP: return 'bg-green-100 text-green-800';
      case LeadStatus.CANCELLATION: return 'bg-red-100 text-red-800';
      case LeadStatus.NO_ANSWER: return 'bg-orange-100 text-orange-800';
      case LeadStatus.NOT_INTERSTED_NOW: return 'bg-gray-200 text-gray-800';
      case LeadStatus.RESERVATION: return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColorInterst = useMemo(() => (status: string) => {
    switch (status) {
      case Interest.UNDER_DECISION: return 'bg-blue-100 text-blue-800';
      case Interest.HOT: return 'bg-yellow-100 text-yellow-800';
      case Interest.WARM: return 'bg-purple-100 text-purple-800';

      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusColorTier = useMemo(() => (status: string) => {
    switch (status) {
      case Tier.BRONZE: return 'bg-blue-100 text-blue-800';
      case Tier.GOLD: return 'bg-yellow-100 text-yellow-800';
      case Tier.PLATINUM: return 'bg-purple-100 text-purple-800';
      case Tier.SILVER: return 'bg-green-100 text-green-800';

      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handleSelectLead = (leadId: string) => {
    onSelectLead(leadId);
  };

  const handleSelectAll = () => {
    onSelectAll();
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newRowsPerPage = parseInt(event.target.value);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 py-3 text-left w-6 sm:w-8">
                <input
                  type="checkbox"
                  checked={isSelectAllChecked}
                  onChange={handleSelectAll}
                  className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  aria-label={t('selectAll') || 'Select all leads'}
                />
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24">
                {t('name')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20 hidden sm:table-cell">
                {t('phone')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-24 hidden md:table-cell">
                {t('budget')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-24 hidden md:table-cell">
                {t('IntersName')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-24 hidden md:table-cell">
                {t('TierName')}
              </th>

              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20 hidden lg:table-cell">
                {t('interestProperty')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-24 hidden md:table-cell">
                {t('project')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16 hidden lg:table-cell">
                {t('source')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20">
                {t('status')}
              </th>

              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20 hidden md:table-cell">
                {t('assignedTo')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16 hidden lg:table-cell">
                {t('lastCall')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16 hidden lg:table-cell">
                {t('lastVisit')}
              </th>
              <th className="px-2 sm:px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 sm:w-20">
                {t('meetting')}
              </th>
              <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8 sm:w-12">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm sm:text-base">Loading leads...</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLeads?.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id!)}
                      onChange={() => handleSelectLead(lead.id!)}
                      className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Select ${getDisplayName(lead)}`}
                    />
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4">
                    <button
                      onClick={() => onLeadClick(lead)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:scale-105 transition-transform text-xs sm:text-sm truncate block w-full text-left"
                      title={getDisplayName(lead)}
                      aria-label={`View details for ${getDisplayName(lead)}`}
                    >
                      {getDisplayName(lead)}
                    </button>
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden sm:table-cell">
                    <PhoneNumber 
                      phone={lead.contact}
                      className="text-xs sm:text-sm"
                    />
                  </td>

                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden md:table-cell">
                    <span className="text-xs sm:text-sm text-gray-900 truncate block" title={lead.budget.toString()}>
                      {typeof lead.budget === 'number' ? lead.budget.toLocaleString() : Number(lead.budget).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden md:table-cell">
                    <span
                      className={`text-xs sm:text-sm px-2 py-1 rounded-full font-medium truncate block ${getStatusColorInterst(lead.interest)}`}
                      title={lead.interest.toString()}
                    >
                      {lead.interest}
                    </span>
                  </td>

                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden md:table-cell">
                    <span
                      className={`text-xs sm:text-sm px-2 py-1 rounded-full font-medium truncate block ${getStatusColorTier(lead.tier)}`}
                      title={lead.tier.toString()}
                    >
                      {lead.tier}
                    </span>
                  </td>


                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden lg:table-cell">
                    <span className="text-xs sm:text-sm text-gray-900 truncate block" title={lead.inventoryInterestId}>
                      {properties?.find(property => property.id === lead.inventoryInterestId)?.titleEn}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden md:table-cell">
                    <span className="text-xs sm:text-sm text-gray-900 truncate block" title={lead.budget.toLocaleString()}>
                      {projectName(lead)}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4">
                    <span className="text-sm text-gray-900 truncate block" title={lead.source}>
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)} truncate max-w-full`}
                      title={lead.status}
                    >
                      {lead.status}
                    </span>
                  </td>



                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden md:table-cell">
                    {lead.owner ? (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-semibold flex-shrink-0 ${getUserColor(lead.owner.name)}`}>
                          {getUserInitials(lead.owner.name)}
                        </span>
                        <span className="text-sm text-gray-900 truncate block" title={lead.owner.name}>
                          {lead.owner?.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">{t('unassigned')}</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-900 truncate block" title={lead.calls?.[lead.calls.length - 1]?.date}>
                      {lead.calls?.[lead.calls.length - 1]?.date}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-900 truncate block" title={lead.lastVisitDate}>
                      {lead.visits?.[lead.visits.length - 1]?.date}
                    </span>
                  </td>

                  <td className="px-2 sm:px-3 md:px-6 py-4">
                    {lead.meetings && lead.meetings.length > 0 ? (
                      (() => {
                        const lastMeeting = [...lead.meetings].sort(
                          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                        )[0];

                        // ✅ صياغة الوقت من "HH:mm" → "hh:mm AM/PM"
                        const formatTime = (timeStr: string) => {
                          if (!timeStr) return "";
                          const [hours, minutes] = timeStr.split(":").map(Number);
                          const date = new Date();
                          date.setHours(hours, minutes);
                          return date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          });
                        };

                        return (
                          <div>
                            {/* عرض التاريخ */}
                            <div>{new Date(lastMeeting.date).toLocaleDateString()}</div>

                            {/* عرض الوقت بالصياغة الجديدة */}
                            <div className="text-md text-gray-500">
                              {formatTime(lastMeeting.time)}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-gray-400">No Meetings</span>
                    )}
                  </td>




                  <td className="px-2 sm:px-3 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onLeadClick(lead)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title={t('viewDetails')}
                        aria-label={`View details for ${getDisplayName(lead)}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditLead(lead)}
                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                        title={t('editLead')}
                        aria-label={`Edit ${getDisplayName(lead)}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteLead(lead)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title={t('deleteLead')}
                        aria-label={`Delete ${getDisplayName(lead)}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {sortedLeads?.length === 0 && !isLoading && (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? t('noLeadsFound') : t('noLeadsAvailable')}
                </td>
              </tr>
            )}

          </tbody>

        </table>



      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 space-y-3 sm:space-y-0">
        {/* Rows per page selector and page info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Show:</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-500">entries</span>
          </div>
          <span className="text-sm text-gray-500 hidden sm:block">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedLeads.length)} of {sortedLeads.length} leads
          </span>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Pagination */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            &lt; Back
          </button>

          {getPageNumbers().map((page, idx) => (
            <button
              key={idx}
              onClick={() => typeof page === "number" && setCurrentPage(page)}
              disabled={page === "..."}
              className={`px-3 py-1 text-sm border rounded 
            ${page === currentPage ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-100"}
            ${page === "..." ? "cursor-default" : ""}`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
});

LeadsTable.displayName = 'LeadsTable'; 