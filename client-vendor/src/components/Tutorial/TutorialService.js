import axios from 'axios';
import { API_BASE_URL } from '../../config';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const TutorialService = {
    // Get all available tutorials
    getAllModules: async (category = null) => {
        try {
            let url = `${API_BASE_URL}/vendor/learning/videos`; // Endpoint mapping
            if (category) url += `?category=${category}`;

            const response = await axios.get(url, getHeaders());
            return response.data.data;
        } catch (error) {
            console.error("Failed to fetch tutorials:", error);
            throw error;
        }
    },

    // Get single module with steps
    getModuleBySlug: async (slug) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vendor/learning/videos/${slug}`, getHeaders());
            return response.data.data;
        } catch (error) {
            console.error("Failed to fetch tutorial details:", error);
            throw error;
        }
    },

    // Update progress
    updateProgress: async (moduleId, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/vendor/learning/videos/${moduleId}/progress`, data, getHeaders());
            return response.data.data;
        } catch (error) {
            console.error("Failed to update progress:", error);
            // Don't throw, just log, as progress save shouldn't block user
        }
    }
};
