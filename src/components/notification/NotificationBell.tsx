import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell } from 'react-icons/fa';

interface NotificationBellProps {
  hasNew?: boolean;
  onClick: () => void;
  notificationCount: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ hasNew = false, notificationCount, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      // -- START: تعديلات التصميم المتجاوب --
      className="fixed bottom-4 right-4 md:bottom-10 md:right-10 h-14 w-14 md:h-16 md:w-16 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer z-50"
      // -- END: تعديلات التصميم المتجاوب --
      aria-label="View notifications"
      whileHover={{ scale: 1.1, rotate: 10 }}
      whileTap={{ scale: 0.9, rotate: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      <AnimatePresence>
        {hasNew && (
          <motion.span
            className="absolute h-full w-full rounded-full bg-red-500"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{
              repeat: Infinity,
              repeatType: 'loop',
              duration: 1.5,
              ease: 'easeInOut',
            }}
          />
        )}
      </AnimatePresence>
      
      <FaBell className="relative h-6 w-6 md:h-7 md:w-7" />
      
      <AnimatePresence>
        {notificationCount > 0 && (
          <motion.span
            key={notificationCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-1 -right-1 h-6 w-6 md:h-7 md:w-7 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default NotificationBell;