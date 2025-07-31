import React, { useMemo } from 'react';
import { Minus, Phone, ThumbsUp, ThumbsDown, MessageSquare, Calendar as CalendarIcon } from 'lucide-react';
import { Lead } from '../../types';

interface CallOutcomeCardsProps {
  leads: Lead[];
  activeCard: string;
  onCardClick: (key: string) => void;
  t: (key: string) => string;
}

// Icon and color mappings for call outcomes
const outcomeIcons: Record<string, JSX.Element> = {
  Interested: <ThumbsUp className="h-6 w-6 text-white" />,
  'Not Interested': <ThumbsDown className="h-6 w-6 text-white" />,
  'Follow Up Required': <MessageSquare className="h-6 w-6 text-white" />,
  'Meeting Scheduled': <CalendarIcon className="h-6 w-6 text-white" />,
};

const outcomeColors: Record<string, string> = {
  Interested: 'bg-green-500',
  'Not Interested': 'bg-red-500',
  'Follow Up Required': 'bg-yellow-500',
  'Meeting Scheduled': 'bg-blue-500',
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

export const CallOutcomeCards: React.FC<CallOutcomeCardsProps> = React.memo(({
  leads,
  activeCard,
  onCardClick,
  t
}) => {
  const callOutcomeCards = useMemo(() => {
    const allCallOutcomes = Array.from(new Set(
      leads.flatMap(lead => (lead.calls || []).map(call => call.outcome))
    )).filter(Boolean);

    return allCallOutcomes.map(outcome => ({
      key: outcome,
      count: leads.filter(lead => 
        (lead.calls || []).some(call => call.outcome === outcome)
      ).length,
    }));
  }, [leads]);

  if (callOutcomeCards.length === 0) return null;

  return (
    <div className="mb-2 mt-6">
      <h2 className="text-lg font-semibold mb-4">
        {t('callOutcomesCards') !== 'callOutcomesCards' ? t('callOutcomesCards') : addSpacesToCamelCase('Call Outcomes')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {callOutcomeCards.map(card => {
          const icon = outcomeIcons[card.key] || <Phone className="h-6 w-6 text-white" />;
          const iconBg = outcomeColors[card.key] || 'bg-blue-400';
          const isActive = activeCard === card.key;
          
          return (
            <div
              key={card.key}
              onClick={() => onCardClick(card.key)}
              className={`bg-white rounded-xl shadow p-5 flex items-center border-2 transition-all hover:shadow-lg cursor-pointer ${
                isActive ? 'border-green-400 bg-green-50' : 'border-transparent'
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

CallOutcomeCards.displayName = 'CallOutcomeCards'; 