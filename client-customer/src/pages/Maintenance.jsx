import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FaTools, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Maintenance = ({ content, logo }) => {
    const data = content || {
        title: "We’re upgrading your experience 🚀",
        subtitle: "Resortwala is undergoing scheduled maintenance.",
        description: "We are rolling out new features to serve you better. We'll be back shortly!",
        estimated_return: "2 hours",
        contact_email: "support@resortwala.com"
    };

    return (
        <>
            <Helmet>
                <title>Maintenance - ResortWala</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            <div className="h-[100dvh] w-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0a0c] font-sans selection:bg-blue-500/30">
                {/* Dynamic Background Mesh */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[140px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px] animate-pulse delay-700"></div>
                </div>

                {/* Animated Floating Particles */}
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }}
                            animate={{
                                x: [null, Math.random() * window.innerWidth],
                                y: [null, Math.random() * window.innerHeight]
                            }}
                            transition={{
                                duration: 20 + Math.random() * 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute w-1 h-1 bg-white rounded-full"
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 p-10 md:p-16 bg-white/[0.03] backdrop-blur-[30px] border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] max-w-2xl w-[92%] text-center overflow-hidden"
                >
                    {/* Inner Glow */}
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>

                    <div className="mb-10 flex flex-col items-center gap-6">
                        {logo && <img src={logo} alt="ResortWala" className="h-10 w-auto mb-2 opacity-90 drop-shadow-2xl" />}
                        <motion.div
                            animate={{
                                y: [0, -10, 0],
                                rotate: [-6, -4, -6]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-[0_0_40px_-5px_rgba(37,99,235,0.4)]"
                        >
                            <FaTools className="text-white text-4xl" />
                        </motion.div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                        {data.title}
                    </h1>

                    <p className="text-blue-400 font-bold text-lg mb-3 tracking-wide">{data.subtitle}</p>
                    <p className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed max-w-lg mx-auto">
                        {data.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
                        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors group">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-2 group-hover:text-blue-400 transition-colors">Expected Return</p>
                            <p className="text-white text-xl font-bold">{data.estimated_return}</p>
                        </div>
                        <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 mb-2">System Status</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                <span className="text-white font-black uppercase text-sm tracking-widest">Optimizing</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <a
                            href="https://wa.me/919136276555"
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                        >
                            <FaWhatsapp className="text-lg" /> WhatsApp
                        </a>
                        <a
                            href={`mailto:${data.contact_email}`}
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <FaEnvelope className="text-lg" /> Email Support
                        </a>
                    </div>
                </motion.div>

                <div className="mt-12 text-gray-600 text-sm font-bold tracking-widest uppercase opacity-50">
                    &copy; 2026 ResortWala. Premium Stays.
                </div>
            </div>
        </>
    );
};

export default Maintenance;
