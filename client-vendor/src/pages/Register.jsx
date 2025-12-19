import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showSuccess } = useModal();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        business_name: '',
        phone: '',
        vendor_type: 'Resort'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        if (formData.phone.length !== 10) {
            setError('Phone number must be exactly 10 digits.');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/vendor/register`, formData);
            console.log('Registration response:', response.data);
            login(response.data.token, response.data.user);
            await showSuccess('Welcome!', response.data.message || 'Registration successful');
            // Small delay not strictly needed with await showSuccess, but safe to keep logic simple
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', padding: '20px' }}>
            <div style={{ maxWidth: '500px', width: '100%', padding: '40px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '10px', textAlign: 'center', color: 'var(--primary-color)' }}>Vendor Registration</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-color)', opacity: 0.7, marginBottom: '30px' }}>Join ResortWala as a property vendor</p>

                {error && (
                    <div style={{ padding: '12px', backgroundColor: 'var(--hover-bg-red)', color: 'var(--danger-color)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Full Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Email <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Business Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.business_name}
                            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Phone <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={e => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) {
                                    setFormData({ ...formData, phone: val });
                                }
                            }}
                            placeholder="10 digit mobile number"
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Property Type <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select
                            required
                            value={formData.vendor_type}
                            onChange={e => setFormData({ ...formData, vendor_type: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        >
                            <option value="Resort">Resort</option>
                            <option value="WaterPark">Water Park</option>
                            <option value="Villa">Villa/Bungalow</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Password <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-color)' }}>
                            Confirm Password <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password_confirmation}
                            onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn"
                        style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600', marginTop: '10px', backgroundColor: 'var(--primary-color)', color: 'white' }}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-color)', opacity: 0.7 }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Login</Link>
                </p>
            </div>
        </div>
    );
}
