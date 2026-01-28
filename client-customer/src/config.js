const getApiBaseUrl = () => {
    // 1. If explicitly set in environment (e.g. for creating specific builds), use it
    if (import.meta.env.VITE_FORCE_API_URL) {
        return import.meta.env.VITE_FORCE_API_URL;
    }

    // 2. Dynamic Hostname Check
    const hostname = window.location.hostname;

    // Local / Dev Environment
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'local.resortwala.com') {
        return 'http://local.resortwala.com:8085/api';
    }

    // Production / Beta / Staging (where API is on same domain under /api)
    return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
