import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatWindow from './ChatWindow';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

// Enhanced Default Config for better UX
const DEFAULT_CONFIG = {
    welcome_message: "Hi! I'm your ResortWala assistant. I can help you with Villas, Waterpark info, or Booking. What would you like to know?",
    faqs_by_category: {
        'booking': [
            { question: "How do I book a villa?", answer: "You can book directly through this website! Select your dates on the property page, add guests, and click 'Book Now'. We accept UPI, Cards, and Netbanking." },
            { question: "What is the cancellation policy?", answer: "Cancellations made 7 days before check-in get a 100% refund (minus processing fees). Within 7 days, it depends on the property policy." },
            { question: "Do you take partial payments?", answer: "Yes! You can pay 30-50% advance to confirm your booking and pay the rest at check-in." }
        ],
        'waterpark': [
            { question: "What are the ticket prices?", answer: "Waterpark tickets start from ₹600 for Adults and ₹400 for Children. Prices may vary on weekends." },
            { question: "What are the timings?", answer: "The Waterpark is open from 10:00 AM to 6:00 PM every day." },
            { question: "Is costume compulsory?", answer: "Yes, Nylon/Lycra swimwear is compulsory. You can rent them at the counter if you don't have your own." }
        ],
        'amenities': [
            { question: "Do villas have private pools?", answer: "Yes! Most of our premium villas come with private pools. Check the 'Amenities' section of the villa page to confirm." },
            { question: "Is food available?", answer: "We provide delicious home-cooked meals (Veg/Non-Veg) packages. You can select your meal plan during booking." },
            { question: "Is parking available?", answer: "Yes, secure parking is available at all our properties free of cost." }
        ],
        'general': [
            { question: "Are unmarried couples allowed?", answer: "Policies vary by property. Please check the 'House Rules' section on the distinct property page." },
            { question: "Can we bring pets?", answer: "Many of our villas are Pet-Friendly! Look for the 'Paw' icon in amenities." }
        ]
    }
};

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(DEFAULT_CONFIG); // Start with Defaults
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/chatbot/config`);
                const data = res.data;
                if (data.success && data.data) {
                    // Merge API data with defaults (API takes precedence if keys exist)
                    setConfig(prev => ({
                        ...prev,
                        ...data.data,
                        faqs_by_category: {
                            ...prev.faqs_by_category,
                            ...(data.data.faqs_by_category || {})
                        }
                    }));
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
                await axios.post(`${API_BASE_URL}/chatbot/track`, {
                    interaction_type: 'open',
                    metadata: { url: window.location.href }
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
                drag
                dragConstraints={{ left: -window.innerWidth + 80, right: 0, top: -window.innerHeight + 100, bottom: 0 }}
                dragElastic={0.1}
                dragMomentum={false}
                onClick={trackOpen}
                className="pointer-events-auto flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-gray-900 to-black text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group border border-white/10"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    x: isOpen ? 0 : undefined,
                    y: isOpen ? 0 : undefined
                }}
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
