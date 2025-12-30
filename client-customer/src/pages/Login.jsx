import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaArrowLeft, FaArrowRight, FaStar } from 'react-icons/fa';
import OtpInput from '../components/auth/OtpInput';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();

    // States
    const [identifier, setIdentifier] = useState(location.state?.identifier || ''); // Pre-fill from state
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [identifierType, setIdentifierType] = useState(''); // 'email' or 'phone'
    const [displayIdentifier, setDisplayIdentifier] = useState(''); // For showing normalized version
    const [confirmationResult, setConfirmationResult] = useState(null); // Firebase confirmation

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Detect if input is email or phone
    // Normalize phone number: remove +91, leading 0, spaces, hyphens
    const normalizePhone = (phone) => {
        let normalized = phone.replace(/[\s-]/g, ''); // Remove spaces and hyphens
        normalized = normalized.replace(/^\+91/, ''); // Remove +91 prefix
        normalized = normalized.replace(/^0/, ''); // Remove leading 0
        return normalized;
    };

    const detectIdentifierType = (value) => {
        if (value.includes('@')) {
            return 'email';
        } else if (/^\+?[\d\s-]+$/.test(value)) {
            return 'phone';
        }
        return 'email'; // default
    };

    const triggerSendOtp = async (inputIdentifier) => {
        setError('');
        setLoading(true);

        const type = detectIdentifierType(inputIdentifier);
        setIdentifierType(type);

        try {
            if (type === 'email') {
                await axios.post(`${API_URL}/api/otp/send`, {
                    email: inputIdentifier,
                    type: 'login'
                });
            } else {
                // Normalize and validate phone
                const normalizedPhone = normalizePhone(inputIdentifier);
                if (!/^[0-9]{10}$/.test(normalizedPhone)) {
                    setError('Please enter a valid 10-digit mobile number');
                    setLoading(false);
                    return;
                }

                // Use Firebase for phone OTP
                const phoneNumber = `+91${normalizedPhone}`;

                // Setup reCAPTCHA
                if (!window.recaptchaVerifier) {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                        'size': 'invisible',
                        'callback': (response) => {
                            console.log('Recaptcha verified');
                        }
                    });
                }

                // Send OTP via Firebase
                const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
                setConfirmationResult(confirmation);
                setDisplayIdentifier(normalizedPhone);
            }

            // Store the display identifier (normalized for phone, original for email)
            if (type === 'email') {
                setDisplayIdentifier(inputIdentifier);
            }
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        triggerSendOtp(identifier);
    };

    // Auto-trigger if redirected from Signup
    useEffect(() => {
        if (location.state?.autoTrigger && location.state?.identifier) {
            // Small delay to ensure render
            setTimeout(() => {
                triggerSendOtp(location.state.identifier);
            }, 500);
        }
    }, [location.state]);

    const handleVerifyOtp = async (code) => {
        setError('');
        setLoading(true);
        try {
            let res;
            if (identifierType === 'email') {
                res = await axios.post(`${API_URL}/api/customer/login-email-otp`, {
                    email: identifier,
                    code: code || otp
                });
                loginWithToken(res.data.token, res.data.customer);
            } else {
                // For phone, verify Firebase OTP
                const result = await confirmationResult.confirm(code || otp);
                const firebaseToken = await result.user.getIdToken();

                // Login to backend with Firebase token
                const normalizedPhone = normalizePhone(identifier);
                res = await axios.post(`${API_URL}/api/customer/login-otp`, {
                    phone: normalizedPhone,
                    firebase_token: firebaseToken
                });

                loginWithToken(res.data.token, res.data.customer);
            }

            // Redirect logic
            const state = location.state;
            const isNewUser = res.data.is_new_user;

            if (isNewUser) {
                // New user: Go to profile to complete details, passing the returnTo state
                navigate('/profile', {
                    state: {
                        returnTo: state?.returnTo,
                        bookingState: state?.bookingState,
                        isNew: true
                    }
                });
            } else if (state?.returnTo) {
                // Existing user with pending task: Resume task
                navigate(state.returnTo, { state: state.bookingState });
            } else {
                // Existing user, no task: Default redirect
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex font-outfit">
            {/* Left Side - Hero Image (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 bg-[#0a0a0a] relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                        alt="Luxury Resort"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 p-16 max-w-2xl text-white">
                    <div className="mb-8 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                        <img src="/resortwala-logo.png" alt="RW" className="w-10 h-10 object-contain invert brightness-0" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tight leading-tight">
                        Experience Luxury <br /> Like Never Before
                    </h1>
                    <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-md">
                        Join thousands of travelers enjoying exclusive access to premium resorts, waterparks, and villas at the best prices.
                    </p>
                    <div className="mt-12 flex gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-600 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-bold text-sm">10k+ Happy Travelers</span>
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                                <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 md:p-12 relative">
                {/* Mobile Background Elements */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-48 bg-[#1e1e1e] z-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] opacity-30 bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                </div>

                <div className="w-full max-w-[420px] relative z-10">
                    <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition font-bold text-sm group">
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-gray-100 transition"><FaArrowLeft size={12} /></div> Back to Home
                    </button>

                    <div className="mb-10">
                        <div className="lg:hidden mb-6 w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                            <img src="/resortwala-logo.png" alt="RW" className="w-8 h-8 object-contain" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
                            {step === 'identifier' ? "Welcome Back!" : "Verify Access"}
                        </h2>
                        <p className="text-gray-500 font-medium">
                            {step === 'identifier' ? "Please enter your details to continue." : `We've sent a 6-digit code to ${displayIdentifier}`}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-lg mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {step === 'identifier' ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest pl-1">Email or Mobile Number</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="rahul@example.com or 9876543210"
                                        className="w-full pl-5 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-black focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder-gray-400"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full bg-[#000] hover:bg-[#222] text-white font-bold py-4.5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-gray-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Processing...' : 'Send Login Code'} <FaArrowRight />
                            </button>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-4 bg-white text-gray-400 font-bold">New Here?</span></div>
                            </div>

                            <Link to="/signup" className="block w-full text-center py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:border-black hover:text-black transition-all">
                                Create an Account
                            </Link>
                        </form>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                                <div className="flex flex-col items-center gap-6">
                                    <OtpInput length={6} onComplete={handleVerifyOtp} />
                                    <button onClick={() => setStep('identifier')} className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-black transition underline underline-offset-4">
                                        Change details
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleVerifyOtp()}
                                disabled={loading}
                                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl shadow-blue-200 uppercase text-xs tracking-widest ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>

                            <div className="text-center">
                                <button onClick={handleSendOtp} className="text-gray-400 hover:text-gray-900 text-xs font-bold transition">Resend Code</button>
                            </div>
                        </div>
                    )}

                    <div id="recaptcha-container"></div>
                </div>
            </div>
        </div>
    );
}
