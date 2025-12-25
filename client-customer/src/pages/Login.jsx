import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AuthCard from '../components/auth/AuthCard';
import OtpInput from '../components/auth/OtpInput';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithToken } = useAuth();

    // States
    const [identifier, setIdentifier] = useState(''); // Can be email or phone
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

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const type = detectIdentifierType(identifier);
        setIdentifierType(type);

        try {
            if (type === 'email') {
                await axios.post(`${API_URL}/api/otp/send`, {
                    email: identifier,
                    type: 'login'
                });
            } else {
                // Normalize and validate phone
                const normalizedPhone = normalizePhone(identifier);
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
                setDisplayIdentifier(identifier);
            }
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
            let res;
            if (identifierType === 'email') {
                res = await axios.post(`${API_URL}/api/customer/login-email-otp`, {
                    email: identifier,
                    code: code || otp
                });
                loginWithToken(res.data.token);
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

                loginWithToken(res.data.token);
            }

            // Redirect logic
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
                navigate(identifierType === 'phone' ? '/' : '/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard
            title={step === 'identifier' ? "Welcome back" : "Check your " + (identifierType === 'email' ? 'email' : 'phone')}
            subtitle={step === 'identifier' ? "Enter your email or mobile number to login" : `We sent a 6-digit code to ${displayIdentifier}`}
        >
            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100 animate-in fade-in zoom-in duration-300">
                    {error}
                </div>
            )}

            {step === 'identifier' ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email or Mobile Number</label>
                        <input
                            type="text"
                            placeholder="e.g. rahul@example.com or +91 98765 43210"
                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            pattern={identifier.includes('@') ? "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" : "[0-9+\\s-]{10,}"}
                            title={identifier.includes('@') ? "Please enter a valid email address" : "Please enter a valid 10-digit mobile number"}
                            required
                        />
                        <p className="text-xs text-gray-500 ml-1">
                            You can use either your email address or mobile number
                        </p>
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
                            Change {identifierType === 'email' ? 'Email' : 'Mobile Number'}
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
                            Didn't receive the code? <button onClick={handleSendOtp} className="text-blue-600 hover:underline">Resend Code</button>
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

            {/* Firebase Recaptcha Container */}
            <div id="recaptcha-container"></div>
        </AuthCard>
    );
}
