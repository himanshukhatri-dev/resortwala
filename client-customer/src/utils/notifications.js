import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const requestNotificationPermission = async (userId, token) => {
    if (!messaging) return null;

    try {
        if (typeof window === 'undefined' || !window.Notification) {
            console.log('Notification API not supported');
            return null;
        }

        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
            // console.log('Notification permission granted.');

            // Get FCM Token
            // VAPID Key is optional if you haven't generated one, but recommended
            // For now we try without VAPID or assume standard config
            const fcmToken = await getToken(messaging, {
                // vapidKey: 'BM...' // Add your VAPID key pair public key here if generated
            });

            if (fcmToken) {
                // console.log('FCM Token:', fcmToken);

                // Save token to backend
                if (userId && token) {
                    await saveTokenToBackend(fcmToken, token);
                }

                return fcmToken;
            } else {
                // console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            // console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        try {
            axios.post(`${API_BASE_URL}/debug/log`, {
                error: error.message,
                stack: error.stack,
                ua: navigator.userAgent
            });
        } catch (e) { }
    }
    return null;
};

const saveTokenToBackend = async (fcmToken, authToken) => {
    try {
        await axios.post(
            `${API_BASE_URL}/customer/device-token`,
            { fcm_token: fcmToken },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        // console.log('Token saved to backend');
    } catch (error) {
        console.error('Failed to save device token', error);
    }
};
