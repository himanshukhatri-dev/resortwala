import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

import { API_BASE_URL } from '../config';

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-orange-100/50 p-10 border border-white"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-200 rotate-3">
                        <FaLock className="text-white text-3xl -rotate-3" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vendor Portal</h1>
                    <p className="text-gray-500 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">Secure Registration</p>
                </div>

                {error && (
                    <div className="mb-6 p-5 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-4 text-red-600 text-sm font-black">
                        <FaExclamationTriangle className="flex-shrink-0 text-lg" />
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                            <FaCheckCircle className="text-green-500 text-5xl" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">Registration <br />Complete!</h2>
                        <p className="text-gray-500 font-medium">Your password has been successfully saved. Redirecting you to the portal...</p>
                    </div>
                ) : valid ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-3xl outline-none transition-all font-black text-gray-700 placeholder-gray-300"
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-orange-500 transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Repeat Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-3xl outline-none transition-all font-black text-gray-700 placeholder-gray-300"
                                placeholder="Once more please"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-5 bg-orange-600 text-white rounded-3xl font-black text-lg transition-all shadow-xl shadow-orange-100 mt-4 flex items-center justify-center gap-3 ${submitting ? 'opacity-70' : 'hover:scale-[1.02] active:scale-95'}`}
                        >
                            {submitting ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : 'Activate Account'}
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-5 bg-gray-100 text-gray-400 rounded-3xl font-black transition-all mt-4"
                    >
                        Go Back to Login
                    </button>
                )}
            </motion.div>
        </div>
    );
}
