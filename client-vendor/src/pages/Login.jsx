import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import OTPInput from '../components/OTPInput';
import { FaEnvelope, FaMobileAlt, FaArrowLeft } from 'react-icons/fa';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState('input'); // 'input' | 'otp'
    const [method, setMethod] = useState('email'); // 'email' | 'mobile'
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    // Demo bypass for vendor@resortwala
    const isDemoAccount = identifier.toLowerCase() === 'vendor@resortwala' || identifier === 'vendor@resortwala.com';

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        // Demo bypass
        if (isDemoAccount) {
            setLoading(true);
            try {
                const response = await axios.post(`${API_BASE_URL}/vendor/login-demo`, {
                    email: 'vendor@resortwala.com'
                });
                login(response.data.token, response.data.user);
                setTimeout(() => navigate('/dashboard'), 100);
            } catch (err) {
                setError('Demo login failed. Please try again.');
                setLoading(false);
            }
            return;
        }

        // Regular OTP flow
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/vendor/send-otp`, {
                [method]: identifier,
                method
            });
            setStep('otp');
            setTimer(300); // 5 minutes
            startTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) return;

        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/vendor/verify-otp`, {
                [method]: identifier,
                otp,
                method
            });
            login(response.data.token, response.data.user);
            setTimeout(() => navigate('/dashboard'), 100);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            setOtp('');
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/vendor/send-otp`, {
                [method]: identifier,
                method
            });
            setTimer(300);
            startTimer();
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 animate-fade-in">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">R</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vendor Login</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Manage your properties and bookings
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {step === 'input' ? (
                    <>
                        {/* Method Toggle */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setMethod('email')}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${method === 'email'
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <FaEnvelope /> Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('mobile')}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${method === 'mobile'
                                        ? 'bg-white text-blue-600 shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <FaMobileAlt /> Mobile
                            </button>
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {method === 'email' ? 'Email Address' : 'Mobile Number'}
                                </label>
                                <input
                                    type={method === 'email' ? 'email' : 'tel'}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                                    placeholder={method === 'email' ? 'vendor@resortwala.com' : '+91 9876543210'}
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                />
                                {isDemoAccount && (
                                    <p className="mt-2 text-xs text-green-600 font-medium">
                                        ✓ Demo account - No OTP required
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        Processing...
                                    </span>
                                ) : isDemoAccount ? 'Login' : 'Send OTP'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Back Button */}
                        <button
                            onClick={() => { setStep('input'); setOtp(''); setError(''); }}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                        >
                            <FaArrowLeft /> Change {method}
                        </button>

                        {/* OTP Input */}
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-6">
                                    Enter the 6-digit code sent to<br />
                                    <span className="font-bold text-gray-900">{identifier}</span>
                                </p>
                                <OTPInput
                                    length={6}
                                    value={otp}
                                    onChange={setOtp}
                                    onComplete={handleVerifyOTP}
                                    disabled={loading}
                                />
                            </div>

                            {/* Timer & Resend */}
                            <div className="text-center">
                                {timer > 0 ? (
                                    <p className="text-sm text-gray-600">
                                        Resend OTP in <span className="font-bold text-blue-600">{formatTime(timer)}</span>
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="text-center pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
