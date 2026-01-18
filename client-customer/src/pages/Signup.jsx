import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaCheckCircle, FaArrowRight, FaArrowLeft, FaHome } from 'react-icons/fa';
import AuthLeftPanel from '../components/auth/AuthLeftPanel';
import { normalizePhone, isValidMobile } from '../utils/validation';
import SEO from '../components/common/SEO';

export default function Signup() {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    // const API_URL = import.meta.env.VITE_API_BASE_URL; // Replaced

    // Multi-step state
    const [step, setStep] = useState(1); // 1: Form, 2: Mobile OTP, 3: Email OTP, 4: Success
    const location = useLocation();

    // Auto-fill from Redirection (Login -> Signup)
    const initialIdentifier = location.state?.identifier || '';
    const isPhone = isValidMobile(initialIdentifier);

    const [formData, setFormData] = useState({
        name: '',
        email: !isPhone ? initialIdentifier : '',
        phone: isPhone ? initialIdentifier : ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const [needsVerification, setNeedsVerification] = useState({ email: false, phone: false });

    // OTP states
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    // Initial Step: Validate & Send OTP
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!isValidMobile(formData.phone)) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            // 1. Send Verification OTP (Pre-Registration)
            await axios.post(`${API_BASE_URL}/customer/register-send-otp`, {
                phone: normalizePhone(formData.phone)
            });

            // Success -> Move to OTP Step
            setStep(2);

        } catch (err) {
            const msg = err.response?.data?.errors ? Object.values(err.response.data.errors).flat()[0] : (err.response?.data?.message || 'Failed to send OTP.');

            if (err.response?.status === 422 && msg.includes('exists')) {
                setError('Account already exists. Redirecting to Login...');
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            identifier: formData.phone,
                            autoTrigger: true,
                            message: "Account already exists. Please login."
                        }
                    });
                }, 1500);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const sendMobileOtp = async () => {
        try {
            await axios.post(`${API_BASE_URL}/customer/send-otp`, {
                phone: normalizePhone(formData.phone)
            });
        } catch (err) {
            console.error(err);
            // Ignore 404 if 'send-otp' endpoint is missing (legacy compat)
            if (err.response?.status !== 404) {
                setError('Failed to send OTP. Try again.');
            }
        }
    };

    // Step 2: Verify OTP & Create Account
    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Mobile Verif -> Call Register with OTP
            if (step === 2) {
                await axios.post(`${API_BASE_URL}/customer/register`, {
                    ...formData,
                    phone: normalizePhone(formData.phone),
                    otp: otp
                });

                // Success: Redirect to Login (Unified Flow)
                navigate('/login', {
                    state: {
                        identifier: formData.phone,
                        autoTrigger: true,
                        message: "Account verified & created! Please login."
                    }
                });
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid OTP or Registration Failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const sendEmailOtp = async () => {
        try { await axios.post(`${API_BASE_URL}/customer/send-verification-email`, {}, { headers: { Authorization: `Bearer ${token}` } }); } catch (e) { }
    };

    return (
        <div className="h-screen w-full flex font-outfit overflow-hidden bg-white">
            <SEO title="Create Account" description="Join ResortWala." />

            {/* Left Side: Reusable Component */}
            <AuthLeftPanel />

            {/* Right Side: Form */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 relative bg-white lg:bg-transparent">
                {/* Background Decoration - Now visible on Desktop too */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-50 to-white -z-10" />

                {/* Mobile Logo - BIGGER & PROMINENT */}
                <div className="lg:hidden absolute top-8 left-0 right-0 flex flex-col items-center justify-center animate-fade-in-down">
                    <div className="w-24 h-24 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl border border-red-100 p-4 mb-2">
                        <img src="/resortwala-logo.png" alt="ResortWala" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-red-500">ResortWala</span>
                </div>

                {/* Back Button */}
                <button onClick={() => navigate('/')} className="absolute top-8 left-8 lg:left-12 lg:top-12 flex items-center gap-2 text-gray-400 hover:text-black transition font-bold text-xs uppercase tracking-widest group bg-white/50 backdrop-blur-sm p-2 rounded-full lg:bg-transparent lg:p-0">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition shadow-sm border border-gray-100"><FaArrowLeft /></div>
                    <span className="hidden lg:inline">Back</span>
                </button>

                <div className="w-full max-w-[380px] mt-32 lg:mt-0 animate-fade-in-up">
                    {step === 1 && (
                        <>
                            <div className="mb-6 text-center lg:text-left">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create Account</h2>
                                <p className="text-gray-500 font-medium">Enter details to get started.</p>
                            </div>

                            {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-bold border-l-4 border-red-500 shadow-sm animate-shake">{error}</div>}

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input type="text" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-red-500 focus:bg-white outline-none font-bold text-gray-900 transition-all shadow-sm hover:border-gray-200"
                                        placeholder="Rahul Sharma" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile</label>
                                    <input type="tel" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-red-500 focus:bg-white outline-none font-bold text-gray-900 transition-all shadow-sm hover:border-gray-200"
                                        placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} maxLength={10} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email <span className="text-gray-300">(Optional)</span></label>
                                    <input type="email" className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-red-500 focus:bg-white outline-none font-bold text-gray-900 transition-all shadow-sm hover:border-gray-200"
                                        placeholder="rahul@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF385C] to-[#E00B41] text-white font-black py-4 rounded-xl shadow-lg shadow-red-500/30 active:scale-[0.98] transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 mt-4 transform hover:-translate-y-1">
                                    {loading ? 'Processing...' : <>Join Now <FaCheckCircle /></>}
                                </button>
                            </form>
                            <div className="mt-6 text-center">
                                <p className="text-gray-500 text-sm">Member? <Link to="/login" className="text-black font-bold underline">Login here</Link></p>
                            </div>
                        </>
                    )}

                    {(step === 2 || step === 3) && (
                        <div className="animate-fade-in-right">
                            <div className="mb-6 text-center lg:text-left">
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Verify {step === 2 ? 'Mobile' : 'Email'}</h2>
                                <p className="text-gray-500 font-medium">Enter code sent to {step === 2 ? formData.phone : formData.email}</p>
                            </div>
                            {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-bold shadow-sm">{error}</div>}
                            <form onSubmit={handleVerify} className="space-y-6">
                                <input type="text" className="w-full py-4 text-center text-4xl font-mono font-bold tracking-[0.5em] border-b-4 border-gray-200 focus:border-black outline-none transition-all"
                                    value={otp}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                        if (val === '1234' || val.length === 6) {
                                            // Auto-submit for 1234 or full code
                                            setTimeout(() => handleVerify({ preventDefault: () => { } }), 300);
                                        }
                                    }}
                                    placeholder="••••••" autoFocus />
                                <button type="submit" disabled={loading || otp.length < 4} className="w-full bg-black text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-xl shadow-gray-200 transform hover:-translate-y-1">
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center animate-zoom-in">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><FaCheckCircle className="text-green-600 text-5xl" /></div>
                            <h2 className="text-3xl font-black mb-2">Welcome!</h2>
                            <p className="text-gray-500 mb-8">Your account is ready.</p>
                            <button onClick={() => navigate('/')} className="w-full bg-black text-white font-bold py-4 rounded-xl uppercase tracking-widest shadow-xl transform hover:-translate-y-1">Start Exploring</button>
                        </div>
                    )}

                    <div id="signup-recaptcha"></div>
                </div>
            </div>
        </div>
    );
}
