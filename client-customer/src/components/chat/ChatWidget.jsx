import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatWindow from './ChatWindow';
import { API_BASE_URL } from '../../config';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/chatbot/config`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setConfig(data.data);
                    }
                }
            } catch (err) {
                console.error("Chatbot Config Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const trackOpen = async () => {
        if (!isOpen) {
            try {
                await fetch(`${API_BASE_URL}/chatbot/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ interaction_type: 'open', metadata: { url: window.location.href } })
                });
            } catch (e) { /* silent */ }
        }
        setIsOpen(!isOpen);
    };

    if (!config && !loading) return null; // Don't show if config failed
    if (loading) return null;

    return (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-[9999] flex flex-col items-end gap-4 font-sans antialiased text-gray-900 bg-transparent pointer-events-none">

            {/* Window */}
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {isOpen && (
                        <ChatWindow
                            config={config}
                            onClose={() => setIsOpen(false)}
                            isOpen={isOpen}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Toggle Button (Premium Glassmorphism + Gradient) */}
            <motion.button
                id="chatbot-toggle-btn"
                onClick={trackOpen}
                className="pointer-events-auto flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-gray-900 to-black text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group border border-white/10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
            >
                {/* Ping Animation for attention */}
                {!isOpen && <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20 group-hover:opacity-0 duration-1000" />}

                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <FaTimes size={22} className="text-white/90" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            className="relative"
                        >
                            <FaComments size={26} className="text-white" />
                            {/* Unread dot */}
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
