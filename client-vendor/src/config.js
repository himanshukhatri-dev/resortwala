const getApiBaseUrl = () => {
    // If explicitly set in env (e.g. valid for local dev with proxy), use it
    if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.startsWith('/')) {
        // Check if we are in production where /api proxy might missing
        if (import.meta.env.PROD) {
            // In production, construction API URL dynamically based on hostname
            // Strategy: Switch 'staging', 'stagingadmin', 'stagingvendor' -> 'stagingapi'
            const hostname = window.location.hostname;

            if (hostname.includes('staging')) {
                return 'http://stagingapi.resortwala.com/api';
            }

            // Fallback for main production (if applicable in future)
            return 'http://api.resortwala.com/api';
        }
    }

    // Default Fallbacks
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;

    // Localhost Default
    return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
