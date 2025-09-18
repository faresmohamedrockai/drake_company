import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
import { Notification } from '../../types';
import { FaUser, FaCalendarAlt, FaTasks, FaTimes } from 'react-icons/fa';

interface NotificationModalProps {
  notifications: Notification[];
  onClose: () => void;
  onItemClick: (notification: Notification) => void;
}

// -- START: تعديل الأنيميشن هنا إلى "تلاشي" بسيط --
const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeOut' } // تسريع الخروج
  },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeIn' } // تسريع الدخول
  },
};
// -- END: تعديل الأنيميشن --

const NotificationItem: React.FC<{ notification: Notification; onClick: (notification: Notification) => void }> = ({ notification, onClick }) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const getNotificationIcon = () => {
    const route = notification.notificationData?.route || '';
    if (route.includes('leads')) return <FaUser className="h-5 w-5" />;
    if (route.includes('meeting')) return <FaCalendarAlt className="h-5 w-5" />;
    if (route.includes('tasks')) return <FaTasks className="h-5 w-5" />;
    return <span className="font-bold text-sm">{notification.createdBy?.name.substring(0, 2).toUpperCase() || '...'}</span>;
  };

  return (
    <motion.div
      onClick={() => onClick(notification)}
      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 ${!notification.isSeen ? 'bg-blue-50' : 'bg-white'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
          {getNotificationIcon()}
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{notification.title}</p>
          <p className="text-xs text-gray-500 truncate">{notification.body}</p>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
          {timeAgo}
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationModal: React.FC<NotificationModalProps> = ({ notifications, onClose, onItemClick }) => {
  const unreadCount = notifications.filter(n => !n.isSeen).length;

  const todayNotifications = notifications.filter(n => isToday(new Date(n.createdAt)));
  const thisWeekNotifications = notifications.filter(n => !isToday(new Date(n.createdAt)) && isThisWeek(new Date(n.createdAt), { weekStartsOn: 1 }));
  const olderNotifications = notifications.filter(n => !isToday(new Date(n.createdAt)) && !isThisWeek(new Date(n.createdAt), { weekStartsOn: 1 }));

  return (
    <>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-[60]"
      />

      <motion.div
        className="fixed top-0 right-0 h-full w-full md:max-w-sm bg-white shadow-xl z-[70] flex flex-col"
        variants={modalVariants} // تطبيق الأنيميشن البسيط
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
            <p className="text-sm text-gray-500">
              You have <span className="font-semibold text-blue-600">{unreadCount}</span> unread notifications.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close notifications"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 && (
            <div className="flex justify-center items-center h-full p-10">
              <p className="text-gray-500">No notifications yet.</p>
            </div>
          )}

          {todayNotifications.length > 0 && (
            <div className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 border-b">Today</div>
          )}
          {todayNotifications.map(n => <NotificationItem key={n.id} notification={n} onClick={onItemClick} />)}
          
          {thisWeekNotifications.length > 0 && (
            <div className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 border-b">This Week</div>
          )}
          {thisWeekNotifications.map(n => <NotificationItem key={n.id} notification={n} onClick={onItemClick} />)}

          {olderNotifications.length > 0 && (
            <div className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 border-b">Older</div>
          )}
          {olderNotifications.map(n => <NotificationItem key={n.id} notification={n} onClick={onItemClick} />)}
        </div>
        <div className="p-6 border-t border-gray-200 mt-auto">
      
 
        </div>
      </motion.div>
    </>
  );
};