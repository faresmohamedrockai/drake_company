import React, { useMemo } from 'react';
import { UserIcon, AlertTriangle, Star, Phone, MessageSquare, Calendar as CalendarIcon, Check, X, HelpCircle, ThumbsDown, Clock } from 'lucide-react';
import { Lead, LeadStatus, User } from '../../types';

interface StatusCardsProps {
  leads: Lead[];
  user: User | null;
  activeCard: string;
  onCardClick: (key: string) => void;
  showAllCards: boolean;
  onToggleShowAll: (value: boolean) => void;
  t: (key: string) => string;
}

// Icon and color mappings for status cards
// const statusCardIcons: Record<string, JSX.Element> = {
//   all: <UserIcon className="h-6 w-6 text-white" />,
//   duplicate: <AlertTriangle className="h-6 w-6 text-white" />,
//   fresh_lead: <Star className="h-6 w-6 text-white" />,
//   cold_call: <Phone className="h-6 w-6 text-white" />,
//   follow_up: <MessageSquare className="h-6 w-6 text-white" />,
//   scheduled_visit: <CalendarIcon className="h-6 w-6 text-white" />,
//   open_deal: <Check className="h-6 w-6 text-white" />,
//   closed_deal: <Check className="h-6 w-6 text-white" />,
//   cancellation: <X className="h-6 w-6 text-white" />,
//   no_answer: <HelpCircle className="h-6 w-6 text-white" />,
//   not_interested_now: <ThumbsDown className="h-6 w-6 text-white" />,
//   reservation: <Clock className="h-6 w-6 text-white" />,
// };

// Helper to add spaces to camelCase or PascalCase
function addSpacesToCamelCase(text: string) {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\b([A-Z])([A-Z]+)\b/g, '$1 $2');
}

// Helper to get translated label for cards
function getCardLabel(key: string, t: (k: string) => string) {
  if (key === 'my_leads') return t('myLeads') !== 'myLeads' ? t('myLeads') : 'My Leads';
  if (key === 'scheduled_visit') return t('scheduledVisit') !== 'scheduledVisit' ? t('scheduledVisit') : 'Scheduled Visit';
  const translated = t(key);
  return translated !== key ? translated : addSpacesToCamelCase(key);
}

export const StatusCards: React.FC<StatusCardsProps> = React.memo(({
  leads,
  user,
  activeCard,
  onCardClick,
  showAllCards,
  onToggleShowAll,
  t
}) => {
  const dashboardCards = useMemo(() => [
    { key: 'my_leads', count: leads.filter(lead => lead.owner?.id === user?.id).length },
    { key: 'scheduled_visit', count: leads.filter(lead => lead.status === LeadStatus.SCHEDULED_VISIT).length },
    { key: 'all', count: leads.length },
    { key: 'duplicate', count: leads.filter((lead, idx, arr) => 
      arr.findIndex(l => (l.contact && l.contact === lead.contact) || (l.contacts && l.contacts.includes(lead.contact as any)) || (l.email && l.email === lead.email)) !== idx
    ).length },
    { key: 'fresh_lead', count: leads.filter(lead => lead.status === LeadStatus.FRESH_LEAD).length },
    { key: 'cold_call', count: leads.filter(lead => lead.source === 'Cold Call').length },
    { key: 'follow_up', count: leads.filter(lead => lead.status === LeadStatus.FOLLOW_UP).length },
    { key: 'open_deal', count: leads.filter(lead => lead.status === LeadStatus.OPEN_DEAL).length },
    { key: 'closed_deal', count: leads.filter(lead => lead.status === LeadStatus.CLOSED_DEAL).length },
    { key: 'cancellation', count: leads.filter(lead => lead.status === LeadStatus.CANCELLATION).length },
    { key: 'no_answer', count: leads.filter(lead => lead.status === LeadStatus.NO_ANSWER).length },
    { key: 'not_interested_now', count: leads.filter(lead => lead.status === LeadStatus.NOT_INTERSTED_NOW).length },
    { key: 'reservation', count: leads.filter(lead => lead.status === LeadStatus.RESERVATION).length },
  ], [leads, user?.id]);

  // Always show these cards in the first row
  const compactCardKeys = [
    'all',
    'my_leads',
    'scheduled_visit',
    'fresh_lead',
    'cold_call',
    'follow_up',
  ];
  
  const compactCards = compactCardKeys
    .map(key => dashboardCards.find(card => card.key === key))
    .filter(Boolean);
  
  const fullCards = dashboardCards;

  return (
    <div className="mb-2 mt-4 sm:mt-6">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
        {t('leadStatusCards') !== 'leadStatusCards' ? t('leadStatusCards') : addSpacesToCamelCase('Lead Status')}
      </h2>
      <div className="w-full">
        {/* First row: compact cards + Show More button if needed */}
        <div className="flex flex-wrap gap-1 bg-white rounded-lg p-1 border">
          {compactCards.map((card, idx) => {
            if (!card) return null;
            
            // If this is the last card in the compact row and there are more cards, show the Show More button instead
            if (idx === compactCards.length - 1 && fullCards.length > compactCards.length) {
              return (
                <button
                  key="show-more"
                  onClick={() => onToggleShowAll(!showAllCards)}
                  className={`px-2 sm:px-4 py-2 flex items-center rounded-md border transition-all whitespace-nowrap text-xs sm:text-sm
                    ${showAllCards
                      ? 'border-b-4 border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-b-4 border-transparent text-gray-700 hover:bg-gray-100'}
                  `}
                  style={{ minWidth: 'fit-content' }}
                  aria-label={showAllCards ? t('showLess') : t('showMore')}
                >
                  {showAllCards ? (t('showLess') !== 'showLess' ? t('showLess') : 'Show Less') : (t('showMore') !== 'showMore' ? t('showMore') : 'Show More')}
                </button>
              );
            }
            
            // Render normal card
            const isActive = activeCard === card.key;
            return (
              <button
                key={card.key}
                onClick={() => onCardClick(card.key)}
                className={`px-2 sm:px-4 py-2 flex items-center rounded-md border transition-all whitespace-nowrap text-xs sm:text-sm
                  ${isActive
                    ? 'border-b-4 border-blue-600 bg-blue-50 text-blue-700 font-bold'
                    : 'border-b-4 border-transparent text-gray-700 hover:bg-gray-100'}
                `}
                style={{ minWidth: 'fit-content' }}
                aria-label={`${getCardLabel(card.key, t)} (${card.count})`}
              >
                <span className="hidden xs:inline">{getCardLabel(card.key, t)}</span>
                <span className="xs:hidden">{getCardLabel(card.key, t).split(' ')[0]}</span>
                <span className={`ml-1 sm:ml-2 font-bold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {card.count}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Second row: rest of the cards, only if showAllCards is true */}
        {showAllCards && fullCards.length > compactCards.length && (
          <div className="flex flex-wrap gap-1 bg-white rounded-lg p-1 border mt-2">
            {fullCards.slice(compactCards.length).map(card => {
              if (!card) return null;
              const isActive = activeCard === card.key;
              return (
                <button
                  key={card.key}
                  onClick={() => onCardClick(card.key)}
                  className={`px-2 sm:px-4 py-2 flex items-center rounded-md border transition-all whitespace-nowrap text-xs sm:text-sm
                    ${isActive
                      ? 'border-b-4 border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-b-4 border-transparent text-gray-700 hover:bg-gray-100'}
                  `}
                  style={{ minWidth: 'fit-content' }}
                  aria-label={`${getCardLabel(card.key, t)} (${card.count})`}
                >
                  <span className="hidden xs:inline">{getCardLabel(card.key, t)}</span>
                  <span className="xs:hidden">{getCardLabel(card.key, t).split(' ')[0]}</span>
                  <span className={`ml-1 sm:ml-2 font-bold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {card.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {fullCards.length === 0 && (
        <div className="text-gray-500 text-center py-4 text-sm sm:text-base">
          {t('noStatusCards') || 'No status cards to display.'}
        </div>
      )}
    </div>
  );
});

StatusCards.displayName = 'StatusCards'; 