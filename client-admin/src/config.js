export const API_BASE_URL = import.meta.env.PROD
    ? 'http://stagingapi.resortwala.com/api'
    : '/api'; // Use proxy in dev
