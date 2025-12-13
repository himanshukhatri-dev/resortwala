import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
                    const res = await axios.get('/api/admin/profile', {
                        headers: { Authorization: `Bearer ${storedToken}` }
                    });
                    setUser(res.data.user);
                    setToken(storedToken);
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
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
