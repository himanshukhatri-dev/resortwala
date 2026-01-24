import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';
import { FaTimes, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';

export default function VerificationModal({ type, onClose, onSuccess }) {
    const [step, setStep] = useState('send'); // 'send' or 'verify'
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const verifyOtpRef = useRef(null);

    React.useEffect(() => {
        if (step !== 'verify') return;
        if (!('OTPCredential' in window)) return;

        const ac = new AbortController();
        navigator.credentials.get({
            otp: { transport: ['sms'] },
            signal: ac.signal
        }).then(credential => {
            if (credential && credential.code) {
                setOtp(credential.code);
                // Trigger verify manually as we are in a functional component without easy access to verifyCode ref here unless we wrap it
            }
        }).catch(err => {
            console.warn("Web OTP Error:", err);
        });

        return () => ac.abort();
    }, [step]);

    const sendCode = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('customer_token');
            await axios.post(
                `${API_BASE_URL}/customer/send-verification-${type}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`Verification code sent to your ${type === 'email' ? 'email' : 'phone'}!`);
            setStep('verify');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (otp.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('customer_token');
            await axios.post(
                `${API_BASE_URL}/customer/verify-${type}`,
                { otp },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`${type === 'email' ? 'Email' : 'Phone'} verified successfully!`);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <FaTimes size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaPaperPlane className="text-blue-600 text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Verify Your {type === 'email' ? 'Email' : 'Phone'}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {step === 'send'
                            ? `We'll send a verification code to your ${type === 'email' ? 'email' : 'phone'}`
                            : 'Enter the 6-digit code we sent you'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <FaCheckCircle />
                        {success}
                    </div>
                )}

                {/* Send Code Step */}
                {step === 'send' && (
                    <button
                        onClick={sendCode}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                )}

                {/* Verify Code Step */}
                {step === 'verify' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={otp}
                                autoComplete="one-time-code"
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-widest"
                                autoFocus
                            />
                        </div>

                        <button
                            onClick={verifyCode}
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>

                        <button
                            onClick={sendCode}
                            disabled={loading}
                            className="w-full text-blue-600 py-2 text-sm font-medium hover:underline"
                        >
                            Resend Code
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
