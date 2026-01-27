import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

import { API_BASE_URL } from '../config';
const API_BASE_URL_FOR_PAGE = API_BASE_URL;

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [verifying, setVerifying] = useState(true);
    const [valid, setValid] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid security token.');
            setVerifying(false);
            return;
        }
        verify();
    }, [token]);

    const verify = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/onboard/verify/${token}`);
            if (response.data.valid) {
                setValid(true);
            }
        } catch (err) {
            setError('Account setup link is invalid or expired.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Security requirement: Password must be at least 8 characters.');
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
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Database error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    if (verifying) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-slate-900 rounded-[2rem] p-10 border border-slate-800 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900">
                        <FaShieldAlt className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Admin Console</h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.3em]">Initialize Authority</p>
                </div>

                {error && (
                    <div className="mb-6 p-5 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-center gap-4 text-red-400 text-sm font-bold">
                        <FaExclamationTriangle className="flex-shrink-0" />
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50">
                            <FaCheckCircle className="text-green-500 text-5xl" />
                        </div>
                        <h2 className="text-2xl font-black text-white">Access Granted</h2>
                        <p className="text-slate-400 font-medium">Credential established. Redirecting to console...</p>
                    </div>
                ) : valid ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Critical Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-6 py-5 bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-black text-white placeholder-slate-600"
                                    placeholder="Enter secure password"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Identity</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-6 py-5 bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-black text-white placeholder-slate-600"
                                placeholder="Repeat for verification"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 mt-4 flex items-center justify-center gap-3 ${submitting ? 'opacity-50' : 'hover:bg-blue-500 hover:scale-[1.01]'}`}
                        >
                            {submitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Confirm Credentials'}
                        </button>
                    </form>
                ) : (
                    <button onClick={() => navigate('/login')} className="w-full py-5 text-slate-500 font-black tracking-widest hover:text-white transition-colors">BACK TO LOGIN</button>
                )}
            </motion.div>
        </div>
    );
}
