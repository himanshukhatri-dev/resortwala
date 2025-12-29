const getApiBaseUrl = () => {
    // 1. Production / Staging Environment Check
    if (import.meta.env.PROD) {
        return '/api';
    }

    // 2. Local / Development Environment
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // 3. Fallback for local development without env
    return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();
