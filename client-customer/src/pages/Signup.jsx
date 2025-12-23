import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AuthCard from '../components/auth/AuthCard';

export default function Signup() {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    // States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/customer/register`, formData);

            // Login immediately
            loginWithToken(res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard
            title="Create account"
            subtitle="Join ResortWala to find your perfect getaway"
        >
            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100 animate-in fade-in zoom-in duration-300">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="Rahul Sharma"
                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone (Optional)</label>
                        <input
                            type="tel"
                            placeholder="+91..."
                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                        type="email"
                        placeholder="rahul@example.com"
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Choose Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">!</div>
                    <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-[#1e1e1e] hover:bg-black text-white font-black py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-xl shadow-gray-200 uppercase text-xs tracking-widest mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Creating Account...' : 'Create My Account'}
                </button>
            </form>

            <div className="pt-6 border-t border-gray-100 mt-6 text-center">
                <p className="text-sm font-bold text-gray-400">
                    Already have an account? {' '}
                    <Link to="/login" className="text-black hover:underline underline-offset-4">
                        Login here
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
}
