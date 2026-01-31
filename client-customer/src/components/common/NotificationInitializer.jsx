import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestNotificationPermission } from '../../utils/notifications';

// This component handles notification logic without cluttering App.jsx
const NotificationInitializer = () => {
    const { user, token } = useAuth();

    const requestedRef = React.useRef(false);

    useEffect(() => {
        if (user && token && !requestedRef.current) {
            // Request permission and sync token
            requestedRef.current = true;
            requestNotificationPermission(user.id, token);
        }
    }, [user, token]);

    return null; // Render nothing
};

export default NotificationInitializer;
