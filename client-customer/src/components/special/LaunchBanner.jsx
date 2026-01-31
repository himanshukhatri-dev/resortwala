import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaArrowRight } from 'react-icons/fa';

const LaunchBanner = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check local storage to see if user dismissed it
        const dismissed = localStorage.getItem('launch_banner_dismissed');
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('launch_banner_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative z-[1002] bg-white border-b border-gray-100 shadow-sm"
                >
                    <div className="px-4 py-2 md:py-1.5 flex items-center justify-between container mx-auto">
                        <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 overflow-hidden">
                            <span className="text-[10px] md:text-xs font-bold text-gray-900 tracking-tight whitespace-nowrap hidden sm:inline">
                                {text}
                            </span>
                            <span className="text-[10px] md:text-xs font-bold text-gray-900 tracking-tight whitespace-nowrap sm:hidden">
                                Launch Celebration
                            </span>

                            <div className="h-4 w-[1px] bg-gray-200 hidden sm:block mx-2" />

                            <button
                                onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
                                className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-yellow-600 transition-colors shrink-0"
                            >
                                Explore Stays <FaArrowRight className="text-[8px]" />
                            </button>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="text-gray-400 hover:text-gray-600 p-1 transition-colors ml-2"
                        >
                            <FaTimes size={12} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LaunchBanner;
