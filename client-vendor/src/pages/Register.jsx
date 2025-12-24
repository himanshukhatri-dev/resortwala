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

            login(response.data.token, response.data.user);
            await showSuccess('Welcome!', response.data.message || 'Registration successful');
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Vendor Account</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Join ResortWala to list and manage your properties
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="vendor@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone <span className="text-red-500">*</span>
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
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="10 digit mobile"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Business Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.business_name}
                                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="ResortWala Resort"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Primary Property Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.vendor_type}
                                onChange={e => setFormData({ ...formData, vendor_type: e.target.value })}
                                className="block w-full px-3 py-3 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="Resort">Resort</option>
                                <option value="WaterPark">Water Park</option>
                                <option value="Villa">Villa/Bungalow</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">You can add more property types later.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Min 8 chars"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password_confirmation}
                                onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Retype password"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                'Register'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4 border-t pt-6 border-gray-100">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
