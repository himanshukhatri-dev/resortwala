const getApiBaseUrl = () => {
    // Reverting to main domain as it handles CORS correctly for www, using testali param to bust cache
    if (import.meta.env.PROD) {
        return 'https://resortwala.com/api';
    }
    return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();
