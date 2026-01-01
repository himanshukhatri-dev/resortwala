import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../utils/notifications';

// This component handles notification logic without cluttering App.jsx
const NotificationInitializer = () => {
    const { user, token } = useAuth();

    useEffect(() => {
        if (user && token) {
            // Request permission and sync token
            requestNotificationPermission(user.id, token);
        }
    }, [user, token]);

    return null; // Render nothing
};

export default NotificationInitializer;
