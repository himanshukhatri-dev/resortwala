import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
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
            const response = await axios.post(`${API_BASE_URL}/vendor/login`, formData);
            console.log('Login response:', response.data);
            login(response.data.token, response.data.user);
            // Small delay to ensure state updates
            setTimeout(() => {
                navigate('/dashboard');
            }, 100);
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', padding: '20px' }}>
            <div style={{ maxWidth: '400px', width: '100%', padding: '40px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '10px', textAlign: 'center', color: 'var(--primary-color)' }}>Vendor Login</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-color)', opacity: 0.7, marginBottom: '30px' }}>Manage your properties</p>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: 'var(--hover-bg-red)', color: 'var(--danger-color)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                            placeholder="vendor@example.com"
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>Password</label>
                            <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none' }}>Forgot Password?</Link>
                        </div>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn"
                        style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600', backgroundColor: 'var(--primary-color)', color: 'white' }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFormData({ email: 'vendor@resortwala.com', password: 'password' });
                            // Trigger submit logic programmatically or just let user click login
                            setTimeout(() => document.querySelector('form').requestSubmit(), 100);
                        }}
                        style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '500', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '6px', marginTop: '10px', cursor: 'pointer' }}
                    >
                        ⚡ Quick Vendor Login
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-color)', opacity: 0.7 }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Register</Link>
                </p>
            </div>
        </div>
    );
}
