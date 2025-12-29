import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import OTPInput from '../components/OTPInput';
import { FaEnvelope, FaMobileAlt, FaArrowLeft, FaCheck } from 'react-icons/fa';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState('details'); // 'details' | 'otp' | 'complete'
    const [method, setMethod] = useState('email'); // 'email' | 'mobile'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        business_name: ''
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.business_name) {
            setError('Please fill all required fields');
            return;
        }

        if (method === 'email' && !formData.email) {
            setError('Please enter your email address');
            return;
        }

        if (method === 'mobile' && !formData.phone) {
            setError('Please enter your mobile number');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/vendor/register-send-otp`, {
                ...formData,
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
            const response = await axios.post(`${API_BASE_URL}/vendor/register-verify-otp`, {
                ...formData,
                otp,
                method
            });
            login(response.data.token, response.data.user);
            setStep('complete');
            setTimeout(() => navigate('/dashboard'), 2000);
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
            await axios.post(`${API_BASE_URL}/vendor/register-send-otp`, {
                ...formData,
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-8 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 animate-fade-in">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-white">R</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Vendor Account</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Join ResortWala to list and manage your properties
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'details' ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
                        }`}>
                        {step === 'details' ? '1' : <FaCheck />}
                    </div>
                    <div className={`h-1 w-16 ${step !== 'details' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'otp' ? 'bg-blue-600 text-white' : step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                        {step === 'complete' ? <FaCheck /> : '2'}
                    </div>
                    <div className={`h-1 w-16 ${step === 'complete' ? 'bg-green-500' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                        {step === 'complete' ? <FaCheck /> : '3'}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {step === 'details' ? (
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

                        {/* Registration Form */}
                        <form onSubmit={handleSendOTP} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Business Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.business_name}
                                        onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Royal Resorts Pvt Ltd"
                                    />
                                </div>

                                {method === 'email' ? (
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="vendor@example.com"
                                        />
                                    </div>
                                ) : (
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Mobile Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? 'Sending OTP...' : 'Continue'}
                            </button>
                        </form>
                    </>
                ) : step === 'otp' ? (
                    <>
                        {/* Back Button */}
                        <button
                            onClick={() => { setStep('details'); setOtp(''); setError(''); }}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                        >
                            <FaArrowLeft /> Back to details
                        </button>

                        {/* OTP Input */}
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-6">
                                    Enter the 6-digit code sent to<br />
                                    <span className="font-bold text-gray-900">
                                        {method === 'email' ? formData.email : formData.phone}
                                    </span>
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
                ) : (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                            <FaCheck className="text-4xl text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
                        <p className="text-gray-600">
                            Welcome to ResortWala. Redirecting to dashboard...
                        </p>
                        <div className="flex justify-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    </div>
                )}

                {/* Footer */}
                {step !== 'complete' && (
                    <div className="text-center pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                Login here
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
