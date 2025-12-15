import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('customer_token'));
    const [loading, setLoading] = useState(true);

const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Initialize Auth
    useEffect(() => {
        if (token) {
            axios.get(`${API_URL}/api/customer/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    setUser(res.data);
                    setLoading(false);
                })
                .catch(() => {
                    localStorage.removeItem('customer_token');
                    setToken(null);
                    setUser(null);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/api/customer/login`, {
            email,
            password
        });
        const newToken = response.data.token;
        localStorage.setItem('customer_token', newToken);
        setToken(newToken);
        setUser(response.data.customer);
        return response.data;
    };

    const register = async (name, email, phone, password) => {
        const response = await axios.post(`${API_URL}/api/customer/register`, {
            name,
            email,
            phone,
            password
        });
        const newToken = response.data.token;
        localStorage.setItem('customer_token', newToken);
        setToken(newToken);
        setUser(response.data.customer);
        return response.data;
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/api/customer/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Logout failed", error);
        }
        localStorage.removeItem('customer_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
