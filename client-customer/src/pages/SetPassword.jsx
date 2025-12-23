import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(true);
    const [valid, setValid] = useState(false);
    const [role, setRole] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing security token.');
            setVerifying(false);
            return;
        }
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/onboard/verify/${token}`);
            if (response.data.valid) {
                setValid(true);
                setRole(response.data.role);
            }
        } catch (err) {
            setError('This password setup link has expired or is invalid.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/onboard/set-password`, {
                token,
                password,
                password_confirmation: confirmPassword
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to set password. please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-100/50 p-8 md:p-10 border border-white"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <FaLock className="text-white text-2xl" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Secure Your Account</h1>
                    <p className="text-gray-500 font-medium mt-2">
                        {success ? 'Account verified successfully!' : `Set a password for your ${role} account`}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                        <FaExclamationTriangle className="flex-shrink-0" />
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaCheckCircle className="text-green-600 text-4xl" />
                        </div>
                        <p className="text-gray-700 font-bold text-lg">Password Updated!</p>
                        <p className="text-gray-500">Redirecting you to the login page...</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-100 mt-4"
                        >
                            Log In Now
                        </button>
                    </div>
                ) : valid ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-4 bg-blue-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-200 mt-4 flex items-center justify-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Finalize Account'}
                        </button>

                        <p className="text-center text-xs text-gray-400 font-medium mt-6">
                            Make sure your password is at least 8 characters long and includes numbers and symbols for better security.
                        </p>
                    </form>
                ) : (
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black transition-all mt-4"
                        >
                            Return to Login
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
