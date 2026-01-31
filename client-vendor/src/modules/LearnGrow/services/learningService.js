import axios from 'axios';
import { API_BASE_URL } from '../../../config';

// Ensure API base URL includes /api/vendor if not already configured in config
const getBaseUrl = () => {
    // Assuming API_BASE_URL is something like 'http://localhost:8000/api'
    return `${API_BASE_URL}/vendor/learning`;
};

// Helper to get auth headers
const getAuthOptions = () => {
    const token = localStorage.getItem('vendor_token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const learningService = {
    /**
     * Get all learning videos
     */
    getVideos: async (category = null) => {
        try {
            const params = category ? { category } : {};
            // Merge params into auth options
            const options = { ...getAuthOptions(), params };
            const response = await axios.get(`${getBaseUrl()}/videos`, options);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching videos:', error);
            throw error;
        }
    },

    /**
     * Get single video by slug
     */
    getVideoBySlug: async (slug) => {
        try {
            const response = await axios.get(`${getBaseUrl()}/videos/${slug}`, getAuthOptions());
            return response.data.data;
        } catch (error) {
            console.error('Error fetching video:', error);
            throw error;
        }
    },

    /**
     * Update video progress
     */
    updateProgress: async (videoId, data) => {
        try {
            const response = await axios.post(`${getBaseUrl()}/videos/${videoId}/progress`, data, getAuthOptions());
            return response.data.data;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    },

    /**
     * Get onboarding status
     */
    getOnboardingStatus: async () => {
        try {
            const response = await axios.get(`${getBaseUrl()}/onboarding/status`, getAuthOptions());
            return response.data.data;
        } catch (error) {
            console.error('Error fetching onboarding status:', error);
            throw error;
        }
    },

    /**
     * Update onboarding milestone
     */
    updateMilestone: async (milestone) => {
        try {
            const response = await axios.post(`${getBaseUrl()}/onboarding/update`, { milestone }, getAuthOptions());
            return response.data.data;
        } catch (error) {
            console.error('Error updating milestone:', error);
            throw error;
        }
    },

    /**
     * Get contextual help
     */
    getContextualHelp: async (route) => {
        try {
            const options = { ...getAuthOptions(), params: { route } };
            const response = await axios.get(`${getBaseUrl()}/help`, options);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching help:', error);
            return [];
        }
    },

    /**
     * Track help interaction
     */
    trackHelpInteraction: async (data) => {
        try {
            await axios.post(`${getBaseUrl()}/help/track`, data, getAuthOptions());
        } catch (error) {
            console.error('Error tracking help:', error);
        }
    },

    /**
     * Send message to AI assistant
     */
    sendAIMessage: async (sessionId, message, context = null) => {
        try {
            // Ensure context is a string if it's an object, as backend expects string
            const contextString = (typeof context === 'object' && context !== null)
                ? JSON.stringify(context)
                : context;

            const response = await axios.post(`${getBaseUrl()}/ai/chat`, {
                session_id: sessionId,
                message,
                context: contextString
            }, getAuthOptions());
            return response.data.data;
        } catch (error) {
            console.error('Error sending AI message:', error);
            throw error;
        }
    },

    /**
     * Check triggers
     */
    checkTriggers: async (pageRoute, context = {}) => {
        try {
            const response = await axios.post(`${getBaseUrl()}/triggers/check`, {
                page_route: pageRoute,
                context
            }, getAuthOptions());
            return response.data.data;
        } catch (error) {
            console.error('Error checking triggers:', error);
            return null;
        }
    },

    /**
     * Get walkthrough for a page
     */
    getMainWalkthrough: async (pageRoute) => {
        try {
            const options = { ...getAuthOptions(), params: { route: pageRoute } };
            const response = await axios.get(`${getBaseUrl()}/walkthroughs`, options);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching walkthrough:', error);
            return null;
        }
    },

    /**
     * Update walkthrough progress
     */
    updateWalkthroughProgress: async (walkthroughId, data) => {
        try {
            await axios.post(`${getBaseUrl()}/walkthroughs/${walkthroughId}/progress`, data, getAuthOptions());
        } catch (error) {
            console.error('Error updating walkthrough:', error);
        }
    }
};

