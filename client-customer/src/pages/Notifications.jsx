import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { FaBell, FaCheckDouble, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Notifications() {
    const { notifications, loading, markAsRead, markAllRead } = useNotifications();

    if (loading && notifications.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[70vh]">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FaBell className="text-primary-600" /> Notifications
                </h1>
                {notifications.length > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                        <FaCheckDouble /> Mark all as read
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBell className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${!notification.read_at
                                    ? 'bg-blue-50 border-blue-100 shadow-sm'
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                            onClick={() => !notification.read_at && markAsRead(notification.id)}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <h4 className={`font-semibold text-sm mb-1 ${!notification.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {notification.data?.title || 'Notification'}
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {notification.data?.body || ''}
                                    </p>
                                    <span className="text-xs text-gray-400 mt-2 block">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                {!notification.read_at && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
