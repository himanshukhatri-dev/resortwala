import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import { useModal } from '../context/ModalContext';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showSuccess, showError } = useModal();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/admin/login`, formData);
            console.log('Login response:', response.data);
            login(response.data.token, response.data.user);
            await showSuccess('Welcome Admin', 'Logged in successfully');
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <div style={{ maxWidth: '400px', width: '100%', padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '10px', textAlign: 'center', color: 'var(--primary-color)' }}>Admin Login</h1>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>ResortWala Admin Panel</p>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            placeholder="admin@resortwala.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn"
                        style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600' }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => {
                        setFormData({ email: 'admin@resortwala.com', password: 'password' });
                        setTimeout(() => document.querySelector('form').requestSubmit(), 100);
                    }}
                    style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '500', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', marginTop: '10px', cursor: 'pointer' }}
                >
                    ⚡ Quick Admin Login
                </button>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#999' }}>
                    Default: admin@resortwala.com / password
                </p>
            </div>
        </div>
    );
}
