import React from 'react';
import { motion } from 'framer-motion';

const RepublicLogo = ({ src, alt, className }) => {
    return (
        <div className={`relative flex items-center ${className}`}>
            {/* The Base Logo */}
            <img src={src} alt={alt} className="h-full w-auto object-contain relative z-10" />

            {/* Saffron/Green Decorative Accents (Subtle) */}
            <div className="absolute -inset-1 z-0 flex pointer-events-none">
                <div className="w-1/3 h-full bg-[#FF9933]/10 blur-sm rounded-l-full" />
                <div className="w-1/3 h-full bg-white/10 blur-sm" />
                <div className="w-1/3 h-full bg-[#138808]/10 blur-sm rounded-r-full" />
            </div>

            {/* Ashoka Chakra - Subtle Rotating Layer */}
            <motion.div
                className="absolute right-[-8px] top-[-4px] md:right-[-12px] md:top-[-6px] z-20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <svg width="20" height="20" viewBox="0 0 100 100" className="opacity-40 md:w-6 md:h-6">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#000080" strokeWidth="2" />
                    <circle cx="50" cy="50" r="8" fill="#000080" />
                    {[...Array(24)].map((_, i) => (
                        <line
                            key={i}
                            x1="50" y1="50"
                            x2={50 + 40 * Math.cos((i * 15 * Math.PI) / 180)}
                            y2={50 + 40 * Math.sin((i * 15 * Math.PI) / 180)}
                            stroke="#000080"
                            strokeWidth="1.5"
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Small Floating Flag 🇮🇳 - Very subtle wave */}
            <motion.div
                className="absolute left-[-10px] bottom-[-2px] text-[10px] md:text-sm z-20"
                animate={{ y: [0, -2, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                🇮🇳
            </motion.div>
        </div>
    );
};

export default RepublicLogo;
