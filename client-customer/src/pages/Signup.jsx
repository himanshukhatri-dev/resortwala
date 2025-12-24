import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import AuthCard from '../components/auth/AuthCard';
import { FaCheckCircle, FaPaperPlane, FaArrowRight } from 'react-icons/fa';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function Signup() {
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Multi-step state
    const [step, setStep] = useState(1); // 1: Form, 2: Mobile OTP, 3: Email OTP, 4: Success
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const [needsVerification, setNeedsVerification] = useState({ email: false, phone: false });

    // OTP states
    const [mobileOtp, setMobileOtp] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null); // Firebase confirmation

    // Normalize phone number: remove +91, leading 0, spaces, hyphens
    const normalizePhone = (phone) => {
        let normalized = phone.replace(/[\s-]/g, ''); // Remove spaces and hyphens
        normalized = normalized.replace(/^\+91/, ''); // Remove +91 prefix
        normalized = normalized.replace(/^0/, ''); // Remove leading 0
        return normalized;
    };

    // Step 1: Registration
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validate at least one: email or phone
        if (!formData.email && !formData.phone) {
            setError('Mobile number is required');
            return;
        }

        // Normalize and validate phone
        const normalizedPhone = normalizePhone(formData.phone);
        if (!/^[0-9]{10}$/.test(normalizedPhone)) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/customer/register`, {
                ...formData,
                phone: normalizedPhone
            });

            setToken(res.data.token);
            setNeedsVerification(res.data.needs_verification);
            loginWithToken(res.data.token);

            // Move to verification steps if needed
            if (res.data.needs_verification.phone) {
                await sendMobileOtp(res.data.token);
                setStep(2);
            } else if (res.data.needs_verification.email) {
                await sendEmailOtp(res.data.token);
                setStep(3);
            } else {
                setStep(4);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    // Send Mobile OTP via Firebase
    const sendMobileOtp = async (authToken) => {
        try {
            const normalizedPhone = normalizePhone(formData.phone);
            const phoneNumber = `+91${normalizedPhone}`;

            // Setup reCAPTCHA
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-signup', {
                    'size': 'invisible',
                    'callback': (response) => {
                        console.log('Recaptcha verified');
                    }
                });
            }

            // Send OTP via Firebase
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
        } catch (err) {
            console.error('Failed to send mobile OTP:', err);
            setOtpError('Failed to send OTP. Please try again.');
        }
    };

    // Send Email OTP
    const sendEmailOtp = async (authToken) => {
        const tokenToUse = authToken || token;
        try {
            await axios.post(
                `${API_URL}/api/customer/send-verification-email`,
                {},
                { headers: { Authorization: `Bearer ${tokenToUse}` } }
            );
        } catch (err) {
            console.error('Failed to send email OTP:', err);
        }
    };

    // Verify Mobile OTP via Firebase
    const handleVerifyMobile = async (e) => {
        e.preventDefault();
        setOtpError('');
        setOtpLoading(true);

        try {
            // Verify Firebase OTP
            const result = await confirmationResult.confirm(mobileOtp);
            const firebaseToken = await result.user.getIdToken();

            // Update backend with Firebase token
            const normalizedPhone = normalizePhone(formData.phone);
            await axios.post(`${API_URL}/api/customer/login-otp`, {
                phone: normalizedPhone,
                firebase_token: firebaseToken
            });

            // Move to next step
            if (needsVerification.email) {
                await sendEmailOtp();
                setStep(3);
            } else {
                setStep(4);
            }
        } catch (err) {
            setOtpError(err.response?.data?.message || err.message || 'Invalid OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    // Verify Email OTP
    const handleVerifyEmail = async (e) => {
        e.preventDefault();
        setOtpError('');
        setOtpLoading(true);

        try {
            await axios.post(
                `${API_URL}/api/customer/verify-email`,
                { otp: emailOtp },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStep(4);
        } catch (err) {
            setOtpError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setOtpLoading(false);
        }
    };

    // Skip verification
    const handleSkip = () => {
        if (step === 2 && needsVerification.email) {
            sendEmailOtp();
            setStep(3);
        } else {
            navigate('/');
        }
    };

    // Step 1: Registration Form
    if (step === 1) {
        return (
            <AuthCard
                title="Create account"
                subtitle="Join ResortWala to find your perfect getaway"
            >
                {error && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="Rahul Sharma"
                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                pattern="[0-9+\\s-]{10,}"
                                title="Please enter a valid 10-digit mobile number"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Email Address (Optional)
                            </label>
                            <input
                                type="email"
                                placeholder="rahul@example.com"
                                className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
                                title="Please enter a valid email address"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Choose Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all placeholder-gray-300"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">!</div>
                        <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                            Mobile number is required. Email is optional but recommended for account recovery.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#1e1e1e] hover:bg-black text-white font-black py-4.5 rounded-[1.5rem] transition-all active:scale-[0.98] shadow-xl shadow-gray-200 uppercase text-xs tracking-widest mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : 'Create My Account'}
                    </button>
                </form>

                <div className="pt-6 border-t border-gray-100 mt-6 text-center">
                    <p className="text-sm font-bold text-gray-400">
                        Already have an account? {' '}
                        <Link to="/login" className="text-black hover:underline underline-offset-4">
                            Login here
                        </Link>
                    </p>
                </div>
            </AuthCard>
        );
    }

    // Step 2: Mobile OTP Verification
    if (step === 2) {
        return (
            <AuthCard
                title="Verify Mobile Number"
                subtitle={`We sent a 6-digit code to ${formData.phone}`}
            >
                {otpError && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100">
                        {otpError}
                    </div>
                )}

                <form onSubmit={handleVerifyMobile} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Enter 6-Digit Code</label>
                        <input
                            type="text"
                            value={mobileOtp}
                            onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all text-center text-2xl tracking-widest font-mono"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={otpLoading || mobileOtp.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {otpLoading ? 'Verifying...' : 'Verify Mobile'} <FaCheckCircle />
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={sendMobileOtp}
                            disabled={otpLoading}
                            className="flex-1 text-blue-600 font-semibold py-2 hover:underline text-sm"
                        >
                            Resend Code
                        </button>
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 text-gray-500 font-semibold py-2 hover:underline text-sm"
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
            </AuthCard>
        );
    }

    // Step 3: Email OTP Verification
    if (step === 3) {
        return (
            <AuthCard
                title="Verify Email"
                subtitle={`We sent a 6-digit code to ${formData.email}`}
            >
                {otpError && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4 text-sm font-bold text-center border border-rose-100">
                        {otpError}
                    </div>
                )}

                <form onSubmit={handleVerifyEmail} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-center block">Enter 6-Digit Code</label>
                        <input
                            type="text"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-600 focus:bg-white outline-none font-bold text-gray-700 transition-all text-center text-2xl tracking-widest font-mono"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={otpLoading || emailOtp.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {otpLoading ? 'Verifying...' : 'Verify Email'} <FaCheckCircle />
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={sendEmailOtp}
                            disabled={otpLoading}
                            className="flex-1 text-blue-600 font-semibold py-2 hover:underline text-sm"
                        >
                            Resend Code
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex-1 text-gray-500 font-semibold py-2 hover:underline text-sm"
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
            </AuthCard>
        );
    }

    // Step 4: Success
    return (
        <AuthCard
            title="Account Created!"
            subtitle="Welcome to ResortWala"
        >
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCheckCircle className="text-green-600 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h3>
                <p className="text-gray-600 mb-8">
                    Your account has been created successfully. Start exploring amazing properties.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 mx-auto"
                >
                    Start Exploring <FaArrowRight />
                </button>
            </div>

            {/* Firebase Recaptcha Container */}
            <div id="recaptcha-container-signup"></div>
        </AuthCard>
    );
}
