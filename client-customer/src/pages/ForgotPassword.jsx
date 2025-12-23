import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthCard from '../components/auth/AuthCard';
import OtpInput from '../components/auth/OtpInput';

export default function ForgotPassword() {
    const navigate = useNavigate();

    // States
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');
    const [step, setStep] = useState('email'); // 'email', 'otp', 'reset'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/otp/send`, { email, type: 'reset' });
            setStep('otp');
            setMessage('A verification code has been sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. User may not exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (code) => {
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/otp/verify`, {
                email,
                code: code || otp,
                type: 'reset'
            });
            setStep('reset');
            setMessage('Code verified! Please set your new password.');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== password_confirmation) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/reset-password`, {
                email,
                otp, // The password_reset_tokens logic in backend expects 'otp' as 'token' usually
                password,
                password_confirmation
            });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard
            title={step === 'email' ? "Reset Password" : (step === 'otp' ? "Verify Code" : "New Password")}
            subtitle={step === 'email' ? "Enter your email to receive a password reset code" : (step === 'otp' ? `Enter the 6-digit code sent to ${email}` : "Set a strong password for your account")}
            backLink="/login"
        >
            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100 animate-in fade-in zoom-in duration-300">
                    {error}
                </div>
            )}

            {message && !error && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-emerald-100 animate-in fade-in zoom-in duration-300">
                    {message}
                </div>
            )}

            {step === 'email' && (
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
                        {loading ? 'Sending Code...' : 'Send Reset Code'}
                    </button>
                </form>
            )}

            {step === 'otp' && (
                <div className="space-y-8">
                    <div className="flex flex-col items-center gap-6">
                        <OtpInput length={6} onComplete={(code) => { setOtp(code); handleVerifyOtp(code); }} />
                        <button
                            onClick={() => setStep('email')}
                            className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                            Change Email
                        </button>
                    </div>
                    <button
                        onClick={() => handleVerifyOtp()}
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-xl shadow-blue-100 uppercase text-xs tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </div>
            )}

            {step === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={password_confirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-xl shadow-blue-100 uppercase text-xs tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Resetting...' : 'Reset My Password'}
                    </button>
                </form>
            )}
        </AuthCard>
    );
}
