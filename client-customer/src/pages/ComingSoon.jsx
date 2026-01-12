import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

const ComingSoon = () => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const launchDate = new Date('2026-01-25T00:00:00').getTime();

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

    return (
        <>
            <Helmet>
                <title>ResortWala - Coming Soon</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 overscroll-none touch-none">
                {/* Animated Background - Soft Light Gradient Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100/60 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-pink-100/40 rounded-full blur-[120px] animate-pulse delay-2000"></div>
                </div>

                {/* Glassmorphism Card (Light Mode) */}
                <div className="relative z-10 p-6 md:p-12 bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-2xl w-[90%] md:w-full mx-auto text-center transform hover:scale-[1.005] transition-transform duration-500 flex flex-col justify-center">

                    {/* Brand Logo */}
                    <div className="mb-6 md:mb-10 animate-fade-in-down flex justify-center">
                        <img
                            src="/resortwala-logo.png"
                            alt="ResortWala"
                            className="h-10 md:h-20 w-auto object-contain drop-shadow-sm"
                        />
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2 md:mb-4 animate-fade-in-up">
                        Something Amazing is Coming
                    </h2>

                    {/* Subtext */}
                    <p className="text-slate-500 text-sm md:text-lg mb-6 md:mb-10 max-w-lg mx-auto leading-relaxed animate-fade-in-up delay-100 font-medium hidden sm:block">
                        We’re crafting the ultimate experience for your perfect getaway.
                        Stay tuned for exclusive deals and premium stays.
                    </p>
                    <p className="text-slate-500 text-xs mb-4 max-w-xs mx-auto animate-fade-in-up delay-100 font-medium sm:hidden">
                        The ultimate getaway experience is coming soon.
                    </p>

                    {/* Countdown Timer */}
                    <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-12 animate-fade-in-up delay-200">
                        {[
                            { label: 'Days', value: timeLeft.days },
                            { label: 'Hours', value: timeLeft.hours },
                            { label: 'Mins', value: timeLeft.minutes },
                            { label: 'Secs', value: timeLeft.seconds }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-2 md:p-4 shadow-sm border border-slate-100 flex flex-col items-center">
                                <span className="text-lg md:text-4xl font-bold text-slate-800 font-mono">
                                    {String(item.value).padStart(2, '0')}
                                </span>
                                <span className="text-[8px] md:text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Launch Date Badge (Premium) */}
                    <div className="mb-6 md:mb-12 animate-fade-in-up delay-300">
                        <div className="inline-block relative group cursor-default scale-90 md:scale-100">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative px-6 py-3 md:px-8 md:py-4 bg-white ring-1 ring-gray-900/5 rounded-lg leading-none flex items-center space-x-3 md:space-x-4 shadow-xl">
                                <span className="text-2xl md:text-3xl">🚀</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] md:text-xs font-bold text-gray-400 tracking-[0.2em] uppercase mb-0.5 md:mb-1">Grand Opening</span>
                                    <span className="text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-purple-600">
                                        25th Jan 2026
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up delay-400">
                        <a
                            href="https://wa.me/919876543210"
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-3 md:px-8 md:py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm md:text-base shadow-lg shadow-slate-300/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Contact Us on WhatsApp
                        </a>
                    </div>

                </div>

                {/* Footer */}
                <div className="absolute bottom-4 w-full text-center text-slate-400 text-xs md:text-sm z-0 font-medium">
                    &copy; 2026 ResortWala.
                </div>
            </div>
        </>
    );
};

export default ComingSoon;
