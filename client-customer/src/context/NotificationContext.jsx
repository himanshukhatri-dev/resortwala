import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async (silent = false) => {
        if (!user || !token) return;

        if (!silent) setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.data ? response.data.data : response.data; // Handle pagination data.data vs array
            const list = Array.isArray(data) ? data : (data.data || []);

            setNotifications(list);
            const unread = list.filter(n => !n.read_at).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await axios.post(`${API_BASE_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            fetchNotifications(true); // Revert on error
        }
    };

    const markAllRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);

            await axios.post(`${API_BASE_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    // Initial Fetch & Polling
    useEffect(() => {
        if (user && token) {
            fetchNotifications();
            // Poll every 60 seconds
            const interval = setInterval(() => fetchNotifications(true), 60000);
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, token]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
