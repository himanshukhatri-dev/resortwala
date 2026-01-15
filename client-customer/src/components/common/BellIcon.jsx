import React from 'react';
import { FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function BellIcon() {
    const { unreadCount } = useNotifications();

    return (
        <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
            <FaBell size={20} />
            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.div>
                )}
            </AnimatePresence>
        </Link>
    );
}
