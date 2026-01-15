import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaArrowRight, FaHome } from 'react-icons/fa';
import { auth } from '../firebase'; // Ensure firebase is initialized
import AuthLeftPanel from '../components/auth/AuthLeftPanel';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { normalizePhone, isValidMobile } from '../utils/validation';
import SEO from '../components/common/SEO';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();
    const [loginIdentifier, setLoginIdentifier] = useState(location.state?.identifier || ''); // Email or Phone
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null); // Firebase confirmation result
    const [isPhoneAuth, setIsPhoneAuth] = useState(true); // Toggle between phone/email logic

    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Auto-trigger from Signup redirection
    // Auto-trigger from Signup redirection & Cleanup Recaptcha
    useEffect(() => {
        // Cleanup stale recaptcha from previous renders
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.warn("Recaptcha clear error", e);
            }
            window.recaptchaVerifier = null;
        }

        if (location.state?.autoTrigger && location.state?.identifier) {
            handleLoginSubmit({ preventDefault: () => { } });
        }

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const isMobile = isValidMobile(loginIdentifier);
        setIsPhoneAuth(isMobile);

        // --- BYPASS LOGIC FOR HIMANSHU ---
        const TEST_NUMBERS = ['9034195000', '9896934000', '9999999999', '9870646548']; // Add Himanshu's number here
        const normalizedInput = normalizePhone(loginIdentifier);

        if (isMobile && TEST_NUMBERS.includes(normalizedInput)) {
            try {
                // Direct Login without Firebase
                const response = await axios.post(`${API_URL}/api/customer/login-otp`, {
                    phone: normalizedInput,
                    firebase_token: 'bypass-otp-secret'
                });

                const { token } = response.data;
                await loginWithToken(token);

                if (location.state?.returnTo) {
                    navigate(location.state.returnTo, { state: location.state?.bookingState });
                } else {
                    navigate('/');
                }
                return; // Stop execution
            } catch (err) {
                console.error("Bypass failed", err);
                setError("Bypass login failed");
                setIsLoading(false);
                return;
            }
        }

        try {
            if (isMobile) {
                // --- Mobile: Firebase OTP Flow ---
                const normalized = normalizePhone(loginIdentifier);

                if (!window.recaptchaVerifier) {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha', {
                        'size': 'invisible',
                        'callback': (response) => {
                            // reCAPTCHA solved
                        }
                    });
                }

                const phoneNumber = `+91${normalized}`;
                const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
                setConfirmationResult(confirmation);
                setShowOtpInput(true);
            } else {
                // --- Email: Backend OTP Flow ---
                // FIX: Use Generic OTP Send endpoint
                await axios.post(`${API_URL}/api/otp/send`, {
                    email: loginIdentifier,
                    type: 'login'
                });
                setShowOtpInput(true);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setError('Account not found. Please register properly.');
                setTimeout(() => navigate('/signup'), 2000);
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to send OTP. Try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let response;
            if (isPhoneAuth) {
                // Verify via Firebase
                const result = await confirmationResult.confirm(otp);
                const firebaseToken = await result.user.getIdToken();

                // Exchange Firebase Token for Backend Token
                const normalized = normalizePhone(loginIdentifier);
                response = await axios.post(`${API_URL}/api/customer/login-otp`, {
                    phone: normalized,
                    firebase_token: firebaseToken
                });
            } else {
                // Verify via Backend Email OTP
                // FIX: Use correct Login-with-OTP endpoint
                response = await axios.post(`${API_URL}/api/customer/login-email-otp`, {
                    email: loginIdentifier,
                    code: otp
                });
            }

            const { token, user } = response.data;
            await loginWithToken(token);

            // Redirect Logic
            if (location.state?.returnTo) {
                if (location.state?.bookingState) {
                    // Restore booking flow state if resuming booking
                    navigate(location.state.returnTo, { state: location.state.bookingState });
                } else {
                    navigate(location.state.returnTo);
                }
            } else {
                navigate('/');
            }

        } catch (err) {
            console.error(err);
            setError('Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex font-outfit overflow-hidden bg-white">
            <SEO title="Login" description="Login to your ResortWala account." />

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
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition shadow-sm border border-gray-100"><FaHome /></div>
                    <span className="hidden lg:inline">Home</span>
                </button>

                <div className="w-full max-w-sm mt-32 lg:mt-0 animate-fade-in-up">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-gray-500 font-medium text-lg">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold flex items-center gap-3 animate-shake shadow-sm">
                            <span className="text-xl">!</span> {error}
                        </div>
                    )}

                    {location.state?.message && !error && (
                        <div className="mb-6 p-4 rounded-xl bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm font-bold shadow-sm">
                            {location.state.message}
                        </div>
                    )}

                    {!showOtpInput ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email or Mobile</label>
                                <input
                                    type="text"
                                    placeholder="Enter email or mobile number"
                                    className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none font-bold text-lg text-gray-900 transition-all placeholder:text-gray-400 placeholder:font-medium shadow-sm hover:border-gray-200"
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !loginIdentifier}
                                className="w-full bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:shadow-xl hover:shadow-red-500/30 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] uppercase text-sm tracking-widest flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
                            >
                                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send OTP <FaArrowRight /></>}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in-right">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Enter OTP</label>
                                    <button type="button" onClick={() => setShowOtpInput(false)} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">Change?</button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="• • • • • •"
                                    className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none font-mono font-bold text-4xl text-center tracking-[0.5em] text-gray-900 transition-all shadow-sm hover:border-gray-200"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                        if (val.length === 6) {
                                            // Auto-submit
                                            // We need to bypass the form submit event or create a synthetic one, 
                                            // but calling handleVerifyOtp directly is better if we extract the logic or mock the event.
                                            // Since handleVerifyOtp expects an event with preventDefault, we mock it.
                                            setTimeout(() => handleVerifyOtp({ preventDefault: () => { } }), 0);
                                        }
                                    }}
                                    autoFocus
                                    maxLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length < 4}
                                className="w-full bg-black hover:bg-gray-900 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] uppercase text-sm tracking-widest shadow-xl shadow-gray-200 transform hover:-translate-y-1"
                            >
                                {isLoading ? 'Verifying...' : 'Login Securely'}
                            </button>
                        </form>
                    )}

                    <div id="login-recaptcha"></div>

                    <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-red-600 font-bold hover:underline">
                                Create one now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
