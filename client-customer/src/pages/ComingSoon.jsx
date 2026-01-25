import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const ComingSoon = ({ content, logo }) => {
    const data = content || {
        title: "Something amazing is coming ✨",
        description: "We're building the future of resort bookings. Stay tuned!",
        allow_email_capture: true
    };

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        // Default to a 7-day countdown if no specific date is provided
        const launchDate = new Date('2026-02-01T00:00:00').getTime();

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
    }, []);

    const handleSubscribe = (e) => {
        e.preventDefault();
        setSubscribed(true);
    };

    return (
        <>
            <Helmet>
                <title>Coming Soon - ResortWala</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 overscroll-none touch-none">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    {data.background_url ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 blur-[2px]"
                            style={{ backgroundImage: `url(${data.background_url})` }}
                        />
                    ) : (
                        <>
                            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100/60 rounded-full blur-[120px] animate-pulse"></div>
                            <div className="absolute -bottom-[10%] right-[10%] w-[60%] h-[60%] bg-pink-100/40 rounded-full blur-[120px] animate-pulse"></div>
                        </>
                    )}
                </div>

                <div className="relative z-10 p-6 md:p-12 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl max-w-2xl w-[90%] text-center">
                    <div className="mb-6 flex justify-center">
                        <img src={logo || "/resortwala-logo.png"} alt="ResortWala" className="h-10 md:h-16 w-auto" />
                    </div>

                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-2">
                        {data.title}
                    </h2>

                    <p className="text-slate-500 text-sm md:text-lg mb-8 max-w-lg mx-auto leading-relaxed font-medium">
                        {data.description}
                    </p>

                    <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
                        {[
                            { label: 'Days', value: timeLeft.days },
                            { label: 'Hrs', value: timeLeft.hours },
                            { label: 'Mins', value: timeLeft.minutes },
                            { label: 'Secs', value: timeLeft.seconds }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-slate-100 flex flex-col items-center">
                                <span className="text-xl md:text-3xl font-black text-slate-800 font-mono">
                                    {String(item.value).padStart(2, '0')}
                                </span>
                                <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {data.allow_email_capture && !subscribed && (
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mb-8 animate-fade-in-up">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all"
                            />
                            <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 hover:bg-black transition-all">
                                Notify Me
                            </button>
                        </form>
                    )}

                    {subscribed && (
                        <div className="mb-8 p-4 bg-green-50 text-green-700 rounded-xl font-bold text-sm animate-fade-in">
                            ✨ You're on the list! We'll notify you.
                        </div>
                    )}

                    <div className="flex justify-center flex-wrap gap-4">
                        <a href="https://wa.me/919136276555" className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-slate-900/10 hover:bg-black transition-all">
                            WhatsApp Us
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-4 text-slate-400 text-xs font-medium">
                    &copy; 2026 ResortWala.
                </div>
            </div>
        </>
    );
};

export default ComingSoon;
