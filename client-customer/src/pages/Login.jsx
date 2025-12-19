import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            await login(formData.email, formData.password);

            // Check for redirect target
            const state = location.state;
            if (state?.returnTo) {
                navigate(state.returnTo, { state: state.bookingState });
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = () => {
        if (location.key !== 'default') {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 cursor-pointer"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 left-4 z-10"
            >
                <Link to="/" className="flex items-center text-gray-600 hover:text-black transition p-2 bg-white/50 rounded-full hover:bg-white">
                    <FaArrowLeft className="mr-2" /> Back to Home
                </Link>
            </div>

            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-fade-up cursor-default"
            >

                <div className="flex justify-center mb-6">
                    <img src="/resortwala-logo.png" alt="ResortWala" className="h-12 w-auto" />
                </div>

                <h2 className="text-2xl font-bold text-center mb-8">Welcome back</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black transition"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black transition"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#FF385C] hover:bg-[#D90B3E] text-white font-bold py-3.5 rounded-lg transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-bold underline hover:text-black">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
