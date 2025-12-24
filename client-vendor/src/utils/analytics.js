/**
 * Event Tracking SDK for ResortWala Analytics (Vendor)
 * 
 * Captures vendor interactions and sends them to the analytics backend
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class EventTracker {
    constructor() {
        this.sessionId = this.getOrCreateSession();
        this.userId = null;
        this.batchQueue = [];
        this.batchInterval = null;
        this.maxBatchSize = 10;
        this.batchDelayMs = 5000;

        this.startBatchProcessing();
        this.trackPageVisibility();
    }

    /**
     * Initialize with user context
     */
    setUser(userId) {
        this.userId = userId;
    }

    /**
     * Track an event
     * @param {string} type - Event type
     * @param {string} category - Event category
     * @param {object} data - Event-specific data
     */
    track(type, category, data = {}) {
        const event = {
            session_id: this.sessionId,
            event_type: type,
            event_category: category,
            event_data: {
                ...data,
                timestamp: new Date().toISOString(),
                app_type: 'vendor'
            },
            context: this.getContext()
        };

        this.batchQueue.push(event);

        if (this.batchQueue.length >= this.maxBatchSize) {
            this.flush();
        }
    }

    /**
     * Common tracking shortcuts
     */
    pageView(pageName, additionalData = {}) {
        this.track('page_view', 'navigation', {
            page_name: pageName,
            url: window.location.href,
            ...additionalData
        });
    }

    /**
     * Get or create session ID
     */
    getOrCreateSession() {
        let sessionId = sessionStorage.getItem('rw_vendor_session_id');

        if (!sessionId) {
            sessionId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('rw_vendor_session_id', sessionId);
        }

        return sessionId;
    }

    /**
     * Get context information
     */
    getContext() {
        return {
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            viewport_width: window.innerWidth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            url: window.location.href,
            path: window.location.pathname
        };
    }

    /**
     * Start batch processing interval
     */
    startBatchProcessing() {
        this.batchInterval = setInterval(() => {
            if (this.batchQueue.length > 0) {
                this.flush();
            }
        }, this.batchDelayMs);
    }

    /**
     * Send all queued events
     */
    async flush() {
        if (this.batchQueue.length === 0) return;

        const eventsToSend = [...this.batchQueue];
        this.batchQueue = [];

        try {
            const token = localStorage.getItem('vendor_token');
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            await axios.post(`${API_BASE_URL}/events/batch`, {
                events: eventsToSend
            }, {
                headers: headers
            });
        } catch (error) {
            console.error('Failed to send vendor analytics:', error);
        }
    }

    /**
     * Track page visibility changes
     */
    trackPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flush();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }
}

const vendorAnalytics = new EventTracker();

export default vendorAnalytics;
