import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('vendor_token'));
    const [loading, setLoading] = useState(true);

    // Fetch user profile when component mounts if token exists
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('vendor_token');
            if (storedToken) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/vendor/profile`, {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setUser(res.data.user);
                    setToken(storedToken);
                } catch (err) {
                    // Token invalid, clear it
                    localStorage.removeItem('vendor_token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []); // Only run once on mount

    const login = (newToken, userData) => {
        localStorage.setItem('vendor_token', newToken);
        setToken(newToken);
        setUser(userData);
        setLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('vendor_token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const loginWithToken = (newToken) => {
        localStorage.setItem('vendor_token', newToken);
        setToken(newToken);
        // User will be fetched by existing useEffect logic
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, updateUser, loginWithToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
