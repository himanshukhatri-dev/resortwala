/**
 * Event Tracking SDK for ResortWala Analytics
 * 
 * Captures user interactions and sends them to the analytics backend
 */

import axios from 'axios';

import { API_BASE_URL } from '../config';

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
     * @param {string} type - Event type (e.g., 'page_view', 'click', 'search')
     * @param {string} category - Event category (e.g., 'discovery', 'booking', 'property')
     * @param {object} data - Event-specific data
     */
    track(type, category, data = {}) {
        const event = {
            session_id: this.sessionId,
            event_type: type,
            event_category: category,
            event_data: {
                ...data,
                user_id: this.userId,
                timestamp: new Date().toISOString()
            },
            context: this.getContext()
        };

        this.batchQueue.push(event);

        // Send immediately for critical events
        if (this.isCriticalEvent(type)) {
            this.flush();
        } else if (this.batchQueue.length >= this.maxBatchSize) {
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
            referrer: document.referrer,
            ...additionalData
        });
    }

    propertyView(propertyId, propertyName, additionalData = {}) {
        this.track('property_view', 'discovery', {
            property_id: propertyId,
            property_name: propertyName,
            ...additionalData
        });
    }

    search(query, filters = {}) {
        this.track('search', 'discovery', {
            query,
            filters,
            result_count: filters.result_count || 0
        });
    }

    bookingAttempt(propertyId, dates, guests) {
        this.track('book_click', 'booking', {
            property_id: propertyId,
            check_in: dates.from,
            check_out: dates.to,
            guests
        });
    }

    bookingSuccess(bookingId, amount) {
        this.track('book_success', 'booking', {
            booking_id: bookingId,
            amount
        });
    }

    bookingFailure(propertyId, reason) {
        this.track('book_fail', 'booking', {
            property_id: propertyId,
            failure_reason: reason
        });
    }

    /**
     * Get or create session ID
     */
    getOrCreateSession() {
        let sessionId = sessionStorage.getItem('rw_session_id');

        if (!sessionId) {
            sessionId = this.generateSessionId();
            sessionStorage.setItem('rw_session_id', sessionId);
        }

        return sessionId;
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get context information
     */
    getContext() {
        return {
            device: this.getDeviceType(),
            user_agent: navigator.userAgent,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            url: window.location.href,
            path: window.location.pathname
        };
    }

    /**
     * Detect device type
     */
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'mobile';
        }
        return 'desktop';
    }

    /**
     * Check if event is critical (should send immediately)
     */
    isCriticalEvent(type) {
        const criticalEvents = ['book_success', 'book_fail', 'payment_complete', 'error'];
        return criticalEvents.includes(type);
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
            const token = localStorage.getItem('customer_token');
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
            console.error('Failed to send analytics events:', error);
            // Optional: Re-queue events or send to fallback
        }
    }

    /**
     * Track page visibility changes (user leaving/returning)
     */
    trackPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.track('page_hide', 'navigation', {
                    url: window.location.href
                });
                this.flush(); // Send immediately before user leaves
            } else {
                this.track('page_show', 'navigation', {
                    url: window.location.href
                });
            }
        });

        // Track before unload
        window.addEventListener('beforeunload', () => {
            this.track('exit', 'navigation', {
                url: window.location.href,
                time_on_page: performance.now()
            });
            this.flushSync(); // Synchronous flush before page closes
        });
    }

    /**
     * Synchronous flush for page unload
     */
    flushSync() {
        if (this.batchQueue.length === 0) return;

        const eventsToSend = [...this.batchQueue];
        this.batchQueue = [];

        // Use sendBeacon for guaranteed delivery
        const data = JSON.stringify({ events: eventsToSend });
        navigator.sendBeacon(`${API_BASE_URL}/events/batch`, data);
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
        }
        this.flush();
    }
}

// Create singleton instance
const analytics = new EventTracker();

export default analytics;
