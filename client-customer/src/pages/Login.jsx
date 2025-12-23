import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AuthCard from '../components/auth/AuthCard';
import OtpInput from '../components/auth/OtpInput';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();

    // States
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/otp/send`, {
                email,
                type: 'login'
            });
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (code) => {
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/customer/login-email-otp`, {
                email,
                code: code || otp
            });

            loginWithToken(res.data.token);

            // Redirect logic
            const state = location.state;
            if (state?.returnTo) {
                navigate(state.returnTo, { state: state.bookingState });
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard
            title={step === 'identifier' ? "Welcome back" : "Check your email"}
            subtitle={step === 'identifier' ? "Enter your email to receive a secure login code" : `We sent a 6-digit code to ${email}`}
        >
            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100 animate-in fade-in zoom-in duration-300">
                    {error}
                </div>
            )}

            {step === 'identifier' ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. rahul@example.com"
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#1e1e1e] hover:bg-black text-white font-black py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-xl shadow-gray-200 uppercase text-xs tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Sending Code...' : 'Get Login Code'}
                    </button>
                </form>
            ) : (
                <div className="space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <OtpInput length={6} onComplete={handleVerifyOtp} />
                        <button
                            onClick={() => setStep('identifier')}
                            className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                            Change Email
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleVerifyOtp()}
                            disabled={loading}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-xl shadow-blue-100 uppercase text-xs tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>

                        <p className="text-center text-gray-400 text-xs font-bold leading-relaxed">
                            Didn't receive the email? <button onClick={handleSendOtp} className="text-blue-600 hover:underline">Resend Code</button>
                        </p>
                    </div>
                </div>
            )}

            <div className="pt-6 border-t border-gray-100 mt-6 text-center">
                <p className="text-sm font-bold text-gray-400">
                    New to ResortWala? {' '}
                    <Link to="/signup" className="text-black hover:underline underline-offset-4">
                        Create an account
                    </Link>
                </p>
            </div>
        </AuthCard>
    );
}
