import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaBell } from 'react-icons/fa';

const ComingSoon = ({ content, logo }) => {
    const data = content || {
        title: "Something amazing is coming ✨",
        description: "We're building the future of premium resort bookings. Experience luxury like never before.",
        allow_email_capture: true,
        launch_date: '2026-02-15T00:00:00'
    };

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        const launchDate = new Date(data.launch_date || '2026-02-15T00:00:00').getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            if (distance < 0) {
                clearInterval(timer);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [data.launch_date]);

    const handleSubscribe = (e) => {
        e.preventDefault();
        setSubscribed(true);
    };

    const CountdownCard = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-16 h-16 md:w-24 md:h-24 flex items-center justify-center mb-3 shadow-xl">
                <span className="text-2xl md:text-5xl font-black text-white font-mono leading-none">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-black">
                {label}
            </span>
        </div>
    );

    return (
        <>
            <Helmet>
                <title>Coming Soon - ResortWala</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#050505] selection:bg-blue-500/30">
                {/* Background Video or Image Overlay */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000"
                        alt="Background"
                        className="w-full h-full object-cover opacity-50 blur-[4px] scale-105"
                    />
                </div>

                {/* Animated Light Trails */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative z-20 max-w-4xl w-[92%] text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8 flex justify-center"
                    >
                        <img src={logo || "/resortwala-logo-white.png"} alt="ResortWala" className="h-12 md:h-20 w-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter"
                    >
                        {data.title}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-gray-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium opacity-80"
                    >
                        {data.description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-center gap-4 md:gap-8 mb-16"
                    >
                        <CountdownCard value={timeLeft.days} label="Days" />
                        <CountdownCard value={timeLeft.hours} label="Hours" />
                        <CountdownCard value={timeLeft.minutes} label="Minutes" />
                        <CountdownCard value={timeLeft.seconds} label="Seconds" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="max-w-md mx-auto"
                    >
                        <AnimatePresence mode="wait">
                            {!subscribed ? (
                                <motion.form
                                    key="form"
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onSubmit={handleSubscribe}
                                    className="relative flex items-center p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.2rem] shadow-2xl focus-within:border-white/20 transition-all"
                                >
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full bg-transparent px-5 py-3 text-white placeholder:text-gray-500 focus:outline-none text-base font-medium"
                                    />
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 whitespace-nowrap bg-white text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)]"
                                    >
                                        <FaBell className="text-xs" /> Join Waitlist
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-5 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-blue-400 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/5 animate-pulse"
                                >
                                    ✨ Welcome to the elite circle.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="mt-12 flex justify-center gap-6"
                    >
                        <a href="https://wa.me/919136276555" className="text-gray-400 hover:text-white transition-colors text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <FaWhatsapp size={18} /> WhatsApp
                        </a>
                        <span className="w-1 h-1 bg-gray-800 rounded-full my-auto"></span>
                        <a href="mailto:support@resortwala.com" className="text-gray-400 hover:text-white transition-colors text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <FaEnvelope size={18} /> Email
                        </a>
                    </motion.div>
                </motion.div>

                <div className="absolute bottom-8 text-gray-600 text-[10px] font-black tracking-[0.3em] uppercase opacity-40">
                    &copy; 2026 ResortWala. The Future of Booking.
                </div>
            </div>
        </>
    );
};

export default ComingSoon;
