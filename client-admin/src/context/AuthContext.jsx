import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import adminAnalytics from '../utils/analytics';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [loading, setLoading] = useState(true);

    // Fetch user profile when component mounts if token exists
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('admin_token');
            if (storedToken) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/admin/profile`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setUser(res.data.user);
                    setToken(storedToken);
                    // Set user context for analytics
                    if (res.data.user && res.data.user.id) {
                        adminAnalytics.setUser(res.data.user.id);
                    }
                } catch (err) {
                    // Token invalid, clear it
                    localStorage.removeItem('admin_token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []); // Only run once on mount

    const login = (newToken, userData) => {
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        setUser(userData);
        setLoading(false);
        // Set user context for analytics
        if (userData && userData.id) {
            adminAnalytics.setUser(userData.id);
        }
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
    };

    const loginWithToken = (newToken) => {
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        // User will be fetched by existing useEffect logic
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, loginWithToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
