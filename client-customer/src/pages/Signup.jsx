import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaCheckCircle, FaPaperPlane, FaArrowRight, FaStar, FaArrowLeft } from 'react-icons/fa';
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
        phone: ''
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
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                const errorMessages = Object.values(errors).flat();
                const firstError = errorMessages[0];

                setError(firstError);

                // Smart Redirect for Existing Users
                if (firstError.includes('already been taken')) {
                    const isEmailTaken = errors['email'];
                    const isPhoneTaken = errors['phone'];

                    setTimeout(() => {
                        const targetIdentifier = isPhoneTaken ? formData.phone : formData.email;
                        navigate('/login', {
                            state: {
                                identifier: targetIdentifier,
                                autoTrigger: true,
                                message: `Account already exists for ${targetIdentifier}. Logging you in...`
                            }
                        });
                    }, 2000); // 2s delay to let user read the error
                }
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please check your details.');
            }
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

    // Common Render Wrapper
    const renderContent = (content) => (
        <div className="h-screen w-full flex font-outfit overflow-hidden">
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
                        Start Your Journey <br /> With ResortWala
                    </h1>
                    <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-md">
                        Create an account to unlock exclusive deals, manage your bookings, and experience luxury travel.
                    </p>
                    <div className="mt-12 flex gap-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-600 overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-bold text-sm">Join 10k+ Travelers</span>
                            <div className="flex items-center gap-1 text-xs text-yellow-400">
                                <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 md:p-12 relative h-full overflow-y-auto">
                {/* Mobile Background Elements */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-48 bg-[#1e1e1e] z-0">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] opacity-30 bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                </div>

                <div className="w-full max-w-[420px] relative z-10 pt-10 sm:pt-0">
                    <button onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition font-bold text-sm group">
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-gray-100 transition"><FaArrowLeft size={12} /></div> Back to Home
                    </button>

                    {content}

                    <div id="recaptcha-container-signup"></div>
                </div>
            </div>
        </div>
    );

    // Step 1: Registration Form
    if (step === 1) {
        return renderContent(
            <>
                <div className="mb-8">
                    <div className="lg:hidden mb-6 w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-xl">
                        <img src="/resortwala-logo.png" alt="RW" className="w-8 h-8 object-contain" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Create Account</h2>
                    <p className="text-gray-500 font-medium">Enter your details to get started.</p>
                </div>

                {error && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-lg mb-6 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="Rahul Sharma"
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-black focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder-gray-400"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest pl-1">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-black focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder-gray-400"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                pattern="[0-9+\\s-]{10,}"
                                title="Please enter a valid 10-digit mobile number"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest pl-1">
                                Email Address (Optional)
                            </label>
                            <input
                                type="email"
                                placeholder="rahul@example.com"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-black focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder-gray-400"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
                                title="Please enter a valid email address"
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3 mt-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">!</div>
                        <p className="text-[11px] font-bold text-blue-800 leading-relaxed">
                            No password needed. We'll verify your mobile number via OTP.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#000] hover:bg-[#222] text-white font-bold py-4.5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-gray-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : 'Continue'} <FaArrowRight />
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="px-4 bg-white text-gray-400 font-bold">Already have an account?</span></div>
                    </div>

                    <Link to="/login" className="block w-full text-center py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:border-black hover:text-black transition-all">
                        Login
                    </Link>
                </form>
            </>
        );
    }

    // Step 2: Mobile OTP Verification
    if (step === 2) {
        return renderContent(
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="mb-6 text-center lg:text-left">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Verify Mobile</h2>
                    <p className="text-gray-500 font-medium">We sent a 6-digit code to {formData.phone}</p>
                </div>

                {otpError && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-lg mb-6 text-sm font-bold">
                        {otpError}
                    </div>
                )}

                <form onSubmit={handleVerifyMobile} className="space-y-6">
                    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                        <div className="flex flex-col items-center gap-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                value={mobileOtp}
                                onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full text-center bg-white border-2 border-gray-200 focus:border-black rounded-2xl py-4 text-3xl font-mono font-bold tracking-[0.5em] outline-none transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={otpLoading || mobileOtp.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl shadow-blue-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                        {otpLoading ? 'Verifying...' : 'Verify Mobile'} <FaCheckCircle />
                    </button>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={sendMobileOtp}
                            disabled={otpLoading}
                            className="flex-1 text-gray-500 hover:text-black font-bold py-2 text-xs uppercase tracking-widest hover:underline"
                        >
                            Resend Code
                        </button>
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="flex-1 text-gray-400 hover:text-gray-600 font-bold py-2 text-xs uppercase tracking-widest hover:underline"
                        >
                            Skip Step
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Step 3: Email OTP Verification
    if (step === 3) {
        return renderContent(
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
                <div className="mb-6 text-center lg:text-left">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Verify Email</h2>
                    <p className="text-gray-500 font-medium">We sent a 6-digit code to {formData.email}</p>
                </div>

                {otpError && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-lg mb-6 text-sm font-bold">
                        {otpError}
                    </div>
                )}

                <form onSubmit={handleVerifyEmail} className="space-y-6">
                    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                        <div className="flex flex-col items-center gap-6">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enter 6-Digit Code</label>
                            <input
                                type="text"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="w-full text-center bg-white border-2 border-gray-200 focus:border-black rounded-2xl py-4 text-3xl font-mono font-bold tracking-[0.5em] outline-none transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={otpLoading || emailOtp.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4.5 rounded-2xl transition-all shadow-xl shadow-blue-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                        {otpLoading ? 'Verifying...' : 'Verify Email'} <FaCheckCircle />
                    </button>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={sendEmailOtp}
                            disabled={otpLoading}
                            className="flex-1 text-gray-500 hover:text-black font-bold py-2 text-xs uppercase tracking-widest hover:underline"
                        >
                            Resend Code
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex-1 text-gray-400 hover:text-gray-600 font-bold py-2 text-xs uppercase tracking-widest hover:underline"
                        >
                            Skip Step
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Step 4: Success
    return renderContent(
        <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100">
                <FaCheckCircle className="text-green-600 text-5xl" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">You're All Set!</h3>
            <p className="text-gray-500 mb-10 font-medium">
                Your account has been created successfully.
            </p>
            <button
                onClick={() => navigate('/')}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-4.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200 uppercase text-xs tracking-widest"
            >
                Start Exploring <FaArrowRight />
            </button>
        </div>
    );
}
