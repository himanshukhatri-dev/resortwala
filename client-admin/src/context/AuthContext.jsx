import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import adminAnalytics from '../utils/analytics';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [loading, setLoading] = useState(true);

    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);

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
                    setRoles(res.data.roles || []);
                    setPermissions(res.data.permissions || []);
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
                    setRoles([]);
                    setPermissions([]);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []); // Only run once on mount

    const login = (newToken, userData, userRoles = [], userPermissions = []) => {
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        setUser(userData);
        setRoles(userRoles);
        setPermissions(userPermissions);
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
        setRoles([]);
        setPermissions([]);
    };

    const hasPermission = (permission) => {
        if (roles.includes('Developer')) return true;
        return permissions.includes(permission);
    };

    const hasRole = (role) => {
        return roles.includes(role);
    };

    const loginWithToken = (newToken) => {
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        // User will be fetched by existing useEffect logic
    };

    return (
        <AuthContext.Provider value={{
            user, token, roles, permissions,
            login, logout, loading, loginWithToken,
            hasPermission, hasRole
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
