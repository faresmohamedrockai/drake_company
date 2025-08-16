import React from 'react';
import { TrendingUp, TrendingDown, Minus, User, Phone, Calendar as CalendarIcon, Check, X, Clock, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, Star, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Icon and color mappings (same as LeadsList)
const statusCardIcons: Record<string, JSX.Element> = {
  all: <User className="h-6 w-6 text-white" />, // All Leads
  duplicate: <AlertTriangle className="h-6 w-6 text-white" />, // Duplicate
  fresh_lead: <Star className="h-6 w-6 text-white" />, // Fresh
  cold_call: <Phone className="h-6 w-6 text-white" />, // Cold Call
  follow_up: <MessageSquare className="h-6 w-6 text-white" />, // Follow Up
  scheduled_visit: <CalendarIcon className="h-6 w-6 text-white" />, // Visit
  open_deal: <Check className="h-6 w-6 text-white" />, // Open Deal
  closed_deal: <Check className="h-6 w-6 text-white" />, // Closed Deal
  cancellation: <X className="h-6 w-6 text-white" />, // Cancellation
  no_answer: <HelpCircle className="h-6 w-6 text-white" />, // No Answer
  not_interested_now: <ThumbsDown className="h-6 w-6 text-white" />, // Not Interested
  reservation: <Clock className="h-6 w-6 text-white" />, // Reservation
};
const statusCardColors: Record<string, string> = {
  all: 'bg-blue-500',
  duplicate: 'bg-yellow-500',
  fresh_lead: 'bg-blue-400',
  cold_call: 'bg-indigo-500',
  follow_up: 'bg-green-500',
  scheduled_visit: 'bg-purple-500',
  open_deal: 'bg-green-600',
  closed_deal: 'bg-green-800',
  cancellation: 'bg-red-500',
  no_answer: 'bg-orange-500',
  not_interested_now: 'bg-gray-500',
  reservation: 'bg-pink-500',
};
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

function addSpacesToCamelCase(text: string) {
  return text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/\b([A-Z])([A-Z]+)\b/g, '$1 $2');
}

function getCardLabel(key: string, t: (k: string) => string) {
  const translated = t(key);
  return translated !== key ? translated : addSpacesToCamelCase(key);
}

// Helper function to get translated section titles
function getSectionTitle(key: string, t: (k: string) => string) {
  const translated = t(key);
  return translated !== key ? translated : addSpacesToCamelCase(key);
}

// Card type
interface CardData {
  key: string;
  label?: string; // Optional since we now use translation function
  count: number;
  change?: number; // for status cards
}

interface LeadsSummaryCardsProps {
  statusCards: CardData[];
  callOutcomeCards: CardData[];
  visitStatusCards: CardData[];
  onStatusCardClick?: (key: string) => void;
  onCallOutcomeCardClick?: (key: string) => void;
  onVisitStatusCardClick?: (key: string) => void;
  activeStatusCard?: string;
  activeCallOutcomeCard?: string;
  activeVisitStatusCard?: string;
  showAllStatusCards?: boolean;
  onShowAllStatusCardsToggle?: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, type: 'spring' as const, stiffness: 120 } }),
};

const LeadsSummaryCards: React.FC<LeadsSummaryCardsProps> = ({
  statusCards,
  callOutcomeCards,
  visitStatusCards,
  onStatusCardClick,
  onCallOutcomeCardClick,
  onVisitStatusCardClick,
  activeStatusCard,
  activeCallOutcomeCard,
  activeVisitStatusCard,
  showAllStatusCards = false,
  onShowAllStatusCardsToggle,
}) => {
  const { t } = useTranslation('leads');
  const compactCards = statusCards.slice(0, 4);
  const fullCards = statusCards;

  return (
    <div className="space-y-10">
      {/* Lead Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            {getSectionTitle('leadStatusCards', t)}
          </h2>
        </div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
        >
          {(showAllStatusCards ? fullCards : compactCards).map((card, i) => {
            const icon = statusCardIcons[card.key] || <User className="h-6 w-6 text-white" />;
            const iconBg = statusCardColors[card.key] || 'bg-gray-400';
            const isActive = activeStatusCard === card.key;
            const label = getCardLabel(card.key, t);
            const change = card.change ?? 0;
            return (
              <motion.div
                key={card.key}
                custom={i}
                variants={cardVariants}
                className={`bg-white rounded-2xl shadow-lg p-6 flex items-center border-2 transition-all hover:shadow-2xl cursor-pointer group relative overflow-hidden ${isActive ? 'border-blue-400 bg-blue-50 scale-105' : 'border-transparent'}`}
                whileHover={{ scale: 1.04 }}
                onClick={() => onStatusCardClick && onStatusCardClick(card.key)}
              >
                <div className={`flex items-center justify-center rounded-full h-14 w-14 ${iconBg} mr-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="text-gray-700 font-semibold text-lg mb-1">{label}</div>
                  <div className="text-3xl font-extrabold text-gray-900">{card.count}</div>
                  <div className={`flex items-center text-sm mt-1 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {change > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : change < 0 ? <TrendingDown className="h-4 w-4 mr-1" /> : <Minus className="h-4 w-4 mr-1" />}
                    {Math.abs(change)}%
                  </div>
                </div>
                {/* Animated background effect */}
                <motion.div
                  className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-blue-100 opacity-30 group-hover:scale-125 transition-transform"
                  animate={{ scale: isActive ? 1.2 : 1 }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      {/* Call Outcomes Cards */}
      {callOutcomeCards.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            {getSectionTitle('callOutcomesCards', t)}
          </h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
          >
            {callOutcomeCards.map((card, i) => {
              const icon = outcomeIcons[card.key] || <Phone className="h-6 w-6 text-white" />;
              const iconBg = outcomeColors[card.key] || 'bg-blue-400';
              const isActive = activeCallOutcomeCard === card.key;
              const label = getCardLabel(card.key, t);
              return (
                <motion.div
                  key={card.key}
                  custom={i}
                  variants={cardVariants}
                  className={`bg-white rounded-2xl shadow-lg p-6 flex items-center border-2 transition-all hover:shadow-2xl cursor-pointer group relative overflow-hidden ${isActive ? 'border-green-400 bg-green-50 scale-105' : 'border-transparent'}`}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => onCallOutcomeCardClick && onCallOutcomeCardClick(card.key)}
                >
                  <div className={`flex items-center justify-center rounded-full h-14 w-14 ${iconBg} mr-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-700 font-semibold text-lg mb-1">{label}</div>
                    <div className="text-3xl font-extrabold text-gray-900">{card.count}</div>
                    <div className="flex items-center text-sm mt-1 text-gray-400">
                      <Minus className="h-4 w-4 mr-1" />0%
                    </div>
                  </div>
                  <motion.div
                    className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-green-100 opacity-30 group-hover:scale-125 transition-transform"
                    animate={{ scale: isActive ? 1.2 : 1 }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
      {/* Visit Status Cards */}
      {visitStatusCards.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            {getSectionTitle('visitStatusCards', t)}
          </h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
          >
            {visitStatusCards.map((card, i) => {
              const icon = visitIcons[card.key] || <CalendarIcon className="h-6 w-6 text-white" />;
              const iconBg = visitColors[card.key] || 'bg-purple-400';
              const isActive = activeVisitStatusCard === card.key;
              const label = getCardLabel(card.key, t);
              return (
                <motion.div
                  key={card.key}
                  custom={i}
                  variants={cardVariants}
                  className={`bg-white rounded-2xl shadow-lg p-6 flex items-center border-2 transition-all hover:shadow-2xl cursor-pointer group relative overflow-hidden ${isActive ? 'border-purple-400 bg-purple-50 scale-105' : 'border-transparent'}`}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => onVisitStatusCardClick && onVisitStatusCardClick(card.key)}
                >
                  <div className={`flex items-center justify-center rounded-full h-14 w-14 ${iconBg} mr-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-700 font-semibold text-lg mb-1">{label}</div>
                    <div className="text-3xl font-extrabold text-gray-900">{card.count}</div>
                    <div className="flex items-center text-sm mt-1 text-gray-400">
                      <Minus className="h-4 w-4 mr-1" />0%
                    </div>
                  </div>
                  <motion.div
                    className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-purple-100 opacity-30 group-hover:scale-125 transition-transform"
                    animate={{ scale: isActive ? 1.2 : 1 }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}









      
    </div>
  );
};

export default LeadsSummaryCards; 