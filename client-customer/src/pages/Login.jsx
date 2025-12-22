import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft } from 'react-icons/fa';
import { auth, setupRecaptcha } from '../firebase';
import { signInWithPhoneNumber } from "firebase/auth";
import axios from 'axios';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginWithToken } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [mode, setMode] = useState('email'); // 'email' or 'phone'
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [confirmObj, setConfirmObj] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const verifier = setupRecaptcha('recaptcha-container');
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`; // Default to India +91 if missing
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
            setConfirmObj(confirmationResult);
            setStep('otp');
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to send OTP. Try again.');
            setLoading(false);
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await confirmObj.confirm(otp);
            const firebaseUser = result.user;
            const idToken = await firebaseUser.getIdToken();

            // Send to Backend
            const backendRes = await axios.post(`${API_URL}/api/customer/login-otp`, {
                phone: firebaseUser.phoneNumber,
                firebase_token: idToken
            });

            loginWithToken(backendRes.data.token);

            // Redirect
            const state = location.state;
            if (state?.returnTo) {
                navigate(state.returnTo, { state: state.bookingState });
            } else {
                navigate('/');
            }

        } catch (err) {
            console.error(err);
            setError('Invalid OTP or Login Failed.');
        } finally {
            setLoading(false);
        }
    };

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

                <h2 className="text-2xl font-bold text-center mb-4">Welcome back</h2>

                <div className="flex justify-center mb-6 border-b">
                    <button
                        onClick={() => setMode('email')}
                        className={`pb-2 px-4 font-medium ${mode === 'email' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}
                    >
                        Email
                    </button>
                    <button
                        onClick={() => setMode('phone')}
                        className={`pb-2 px-4 font-medium ${mode === 'phone' ? 'border-b-2 border-black text-black' : 'text-gray-400'}`}
                    >
                        Phone
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                {mode === 'email' ? (
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
                ) : (
                    <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                        {step === 'phone' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                        +91
                                    </span>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        className="w-full p-3 border border-gray-300 rounded-r-lg outline-none focus:border-black transition"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                <div id="recaptcha-container" className="mt-4"></div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                                <input
                                    type="text"
                                    placeholder="123456"
                                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-black transition text-center tracking-widest text-xl"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (step === 'phone' && phone.length < 10)}
                            className={`w-full bg-[#FF385C] hover:bg-[#D90B3E] text-white font-bold py-3.5 rounded-lg transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Processing...' : (step === 'phone' ? 'Send OTP' : 'Verify & Login')}
                        </button>
                    </form>
                )}

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
