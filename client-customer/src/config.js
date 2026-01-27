const getApiBaseUrl = () => {
    // Reverting to main domain as it handles CORS correctly for www, using testali param to bust cache
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
