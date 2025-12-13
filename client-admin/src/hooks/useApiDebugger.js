import { useState, useEffect } from 'react';
import axios from 'axios';

// Axios interceptor to track API calls
export function useApiDebugger() {
    const [apiCalls, setApiCalls] = useState([]);

    useEffect(() => {
        // Check if debug mode is enabled
        const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1';
        if (!isDebugMode) return;

        // Request interceptor
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                config.metadata = { startTime: new Date() };
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        const responseInterceptor = axios.interceptors.response.use(
            (response) => {
                const duration = new Date() - response.config.metadata.startTime;

                const callData = {
                    method: response.config.method.toUpperCase(),
                    url: response.config.url,
                    status: response.status,
                    duration: duration,
                    timestamp: new Date().toISOString(),
                    debug: response.data._debug || null
                };

                setApiCalls(prev => [...prev, callData]);
                return response;
            },
            (error) => {
                if (error.config) {
                    const duration = new Date() - error.config.metadata.startTime;

                    const callData = {
                        method: error.config.method.toUpperCase(),
                        url: error.config.url,
                        status: error.response?.status || 0,
                        duration: duration,
                        timestamp: new Date().toISOString(),
                        error: error.message
                    };

                    setApiCalls(prev => [...prev, callData]);
                }
                return Promise.reject(error);
            }
        );

        // Cleanup
        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    return apiCalls;
}
