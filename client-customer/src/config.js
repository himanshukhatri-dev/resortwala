const getApiBaseUrl = () => {
    // Reverting to main domain as it handles CORS correctly for www, using testali param to bust cache
    if (import.meta.env.PROD) {
        // Use relative path to avoid CORS issues between www and non-www
        return '/api';
    }
    return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();
