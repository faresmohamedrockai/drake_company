import React, { useMemo } from 'react';
import { Minus, Calendar as CalendarIcon, Check, X, Clock } from 'lucide-react';
import { Lead } from '../../types';

interface VisitStatusCardsProps {
  leads: Lead[];
  activeCard: string;
  onCardClick: (key: string) => void;
  t: (key: string) => string;
}

// Icon and color mappings for visit statuses
const visitIcons: Record<string, JSX.Element> = {
  Completed: <Check className="h-6 w-6 text-white" />,
  Cancelled: <X className="h-6 w-6 text-white" />,
  Rescheduled: <Clock className="h-6 w-6 text-white" />,
};

const visitColors: Record<string, string> = {
  Completed: 'bg-green-500',
  Cancelled: 'bg-red-500',
  Rescheduled: 'bg-yellow-500',
};

// Helper to add spaces to camelCase or PascalCase
function addSpacesToCamelCase(text: string) {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\b([A-Z])([A-Z]+)\b/g, '$1 $2');
}

// Helper to get translated label for cards
function getCardLabel(key: string, t: (k: string) => string) {
  const translated = t(key);
  return translated !== key ? translated : addSpacesToCamelCase(key);
}

export const VisitStatusCards: React.FC<VisitStatusCardsProps> = React.memo(({
  leads,
  activeCard,
  onCardClick,
  t
}) => {
  const visitStatusCards = useMemo(() => {
    const allVisitStatuses = Array.from(new Set(
      leads.flatMap(lead => (lead.visits || []).map(visit => visit.status))
    )).filter(Boolean);

    return allVisitStatuses.map(status => ({
      key: status,
      count: leads.filter(lead => 
        (lead.visits || []).some(visit => visit.status === status)
      ).length,
    }));
  }, [leads]);

  if (visitStatusCards.length === 0) return null;

  return (
    <div className="mb-2 mt-6">
      <h2 className="text-lg font-semibold mb-4">
        {t('visitStatusCards') !== 'visitStatusCards' ? t('visitStatusCards') : addSpacesToCamelCase('Visit Statuses')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {visitStatusCards.map(card => {
          const icon = visitIcons[card.key] || <CalendarIcon className="h-6 w-6 text-white" />;
          const iconBg = visitColors[card.key] || 'bg-purple-400';
          const isActive = activeCard === card.key;
          
          return (
            <div
              key={card.key}
              onClick={() => onCardClick(card.key)}
              className={`bg-white rounded-xl shadow p-5 flex items-center border-2 transition-all hover:shadow-lg cursor-pointer ${
                isActive ? 'border-purple-400 bg-purple-50' : 'border-transparent'
              }`}
              role="button"
              tabIndex={0}
              aria-label={`${getCardLabel(card.key, t)} (${card.count})`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCardClick(card.key);
                }
              }}
            >
              <div className={`flex items-center justify-center rounded-full h-12 w-12 ${iconBg} mr-4`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="text-gray-700 font-medium">{getCardLabel(card.key, t)}</div>
                <div className="text-2xl font-bold">{card.count}</div>
                <div className="flex items-center text-sm mt-1 text-gray-400">
                  <Minus className="h-4 w-4 mr-1" />0%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

VisitStatusCards.displayName = 'VisitStatusCards'; 