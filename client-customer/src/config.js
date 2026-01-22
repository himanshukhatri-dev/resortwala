const getApiBaseUrl = () => {
    // 1. Env Variable Priority (Allows override in .env or .env.production)
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // 2. Production / Staging Environment Check
    if (import.meta.env.PROD) {
        return 'https://api.resortwala.com/api';
    }

    // 3. Fallback for local development
    return 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();
