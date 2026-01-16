import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRobot, FaWhatsapp, FaArrowRight, FaTimes, FaMapMarkerAlt, FaStar,
    FaPhoneAlt, FaChevronLeft, FaListUl, FaCalendarCheck, FaCreditCard,
    FaClipboardList, FaQuestionCircle, FaSearch, FaHome
} from 'react-icons/fa';
import { API_BASE_URL } from '../../config';

// Icon mapping for categories
const CATEGORY_ICONS = {
    'booking': <FaCalendarCheck />,
    'payment': <FaCreditCard />,
    'rules': <FaClipboardList />,
    'location': <FaMapMarkerAlt />,
    'general': <FaQuestionCircle />,
    'amenities': <FaListUl />,
    'security': <FaStar />
};

export default function ChatWindow({ config, onClose, isOpen }) {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    // Menu State
    const [viewMode, setViewMode] = useState('MAIN_MENU'); // MAIN_MENU, CATEGORY_VIEW
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [showEscalationForm, setShowEscalationForm] = useState(false);
    const [userData, setUserData] = useState({ name: '', mobile: '' });

    const scrollRef = useRef(null);
    const containerRef = useRef(null);

    // Initial Greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setIsTyping(true);
            setTimeout(() => {
                setMessages([
                    {
                        id: 'welcome',
                        type: 'bot',
                        text: config?.welcome_message || "Hi! I'm your ResortWala assistant. How can I help you today?",
                        timestamp: new Date()
                    }
                ]);
                setIsTyping(false);
            }, 500);
        }
    }, [isOpen, config, messages.length]);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(event.target)) {
                const toggleBtn = document.getElementById('chatbot-toggle-btn');
                if (toggleBtn && toggleBtn.contains(event.target)) return;
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, viewMode, selectedCategory]);

    // --- Core Actions ---

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setViewMode('CATEGORY_VIEW');

        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            text: `Explore ${cat.charAt(0).toUpperCase() + cat.slice(1)}`
        }]);

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: `Sure! Here are some common questions about **${cat}**. Click one to see the answer:`,
                isQuestionList: true,
                category: cat
            }]);
        }, 600);
    };

    const handleQuestionSelect = (faq) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            text: faq.question
        }]);

        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: faq.answer,
                action: faq.action_type,
                payload: faq.action_payload
            };
            setMessages(prev => [...prev, botMsg]);
        }, 800);
    };

    const handleBackToMenu = () => {
        setViewMode('MAIN_MENU');
        setSelectedCategory(null);
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            text: "Back to menu"
        }]);
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                text: "What else would you like to explore?"
            }]);
        }, 300);
    };

    const handlePropertySearch = async (location = '') => {
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: "🔍 Find available villas" }]);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_BASE_URL}/chatbot/search?location=${location}`);
            const data = await res.json();
            setIsTyping(false);

            if (data.success && data.data && data.data.length > 0) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: `Excellent choice! I found ${data.data.length} premium properties for you:`,
                    isPropertyCard: true,
                    payload: data.data
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'bot',
                    text: "I couldn't find any specific matches right now. Would you like to view all our handpicked villas?",
                    action: 'link',
                    payload: JSON.stringify({ url: '/' })
                }]);
            }
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: "Searching... Please wait a moment."
            }]);
            // Fallback: Just show home
            window.location.href = '/';
        }
    };

    // --- Renders ---

    const renderMainMenu = () => {
        const categories = config?.faqs_by_category ? Object.keys(config.faqs_by_category) : [];
        return (
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {/* Search Villas Primary Action */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePropertySearch()}
                    className="w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-200 text-white flex items-center justify-between group overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-2.5 relative z-10">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                            <FaSearch size={14} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-bold">Find Best Villas</p>
                            <p className="text-[9px] opacity-80 font-medium">Lonavala, Karjat, Alibaug...</p>
                        </div>
                    </div>
                    <FaArrowRight size={12} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={cat}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleCategorySelect(cat)}
                            className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col items-center justify-center gap-1.5 group text-center"
                        >
                            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                {React.cloneElement(CATEGORY_ICONS[cat.toLowerCase()] || <FaQuestionCircle />, { size: 14 })}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 capitalize">{cat}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        );
    };

    const renderQuestionsList = (category) => {
        const questions = config?.faqs_by_category?.[category] || [];
        return (
            <div className="flex flex-col gap-2 mt-2">
                {questions.map((q, idx) => (
                    <motion.button
                        key={q.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleQuestionSelect(q)}
                        className="p-3.5 bg-white border border-gray-100 rounded-xl text-[13px] font-semibold text-slate-700 text-left hover:bg-slate-50 hover:border-blue-200 transition-all flex justify-between items-center group shadow-sm"
                    >
                        <span className="pr-2">{q.question}</span>
                        <FaArrowRight size={10} className="text-blue-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all flex-shrink-0" />
                    </motion.button>
                ))}
            </div>
        );
    };

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-[80px] left-3 right-3 md:bottom-20 md:right-6 md:left-auto md:w-[380px] h-[72vh] md:h-[620px] bg-white/95 backdrop-blur-2xl rounded-[1.8rem] shadow-[0_15px_50px_-10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-white/40 z-[9999] ring-1 ring-black/5"
        >
            {/* Header Redesign */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 p-0.5 shadow-lg">
                            <div className="w-full h-full rounded-[0.7rem] bg-slate-900 flex items-center justify-center">
                                <FaRobot size={20} className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse shadow-md"></span>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-base leading-tight tracking-tight text-white">{config?.title || "ResortWala Assistant"}</h3>
                        <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-blue-400">AI Concierge</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition active:scale-90 text-white backdrop-blur-md border border-white/10 relative z-10">
                    <FaTimes size={14} />
                </button>
            </div>

            {/* Messages Area - Glassmorphism effects */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f8fafc] p-4 space-y-4" ref={scrollRef}>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" />

                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg.id}
                            className={`flex flex-col relative z-10 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            {/* Standard Message Bubble */}
                            {!msg.isQuestionList && !msg.isPropertyCard && (
                                <div className={`
                                    px-4 py-3 text-[13px] leading-[1.5] shadow-sm break-words whitespace-pre-wrap max-w-[90%]
                                    ${msg.type === 'user'
                                        ? 'bg-gradient-to-br from-slate-800 to-black text-white rounded-2xl rounded-br-sm'
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-sm'}
                                `}>
                                    <div dangerouslySetInnerHTML={{ __html: msg.text }} />

                                    {msg.action === 'whatsapp' && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => window.open(JSON.parse(msg.payload || '{}')?.url, '_blank')}
                                            className="mt-4 flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-xl text-xs font-bold w-full justify-center transition-all shadow-md"
                                        >
                                            <FaWhatsapp size={18} /> Chat on WhatsApp
                                        </motion.button>
                                    )}
                                    {msg.action === 'link' && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => window.location.href = JSON.parse(msg.payload || '{}')?.url}
                                            className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-bold w-full justify-center transition-all shadow-md"
                                        >
                                            <FaHome size={16} /> Visit Page
                                        </motion.button>
                                    )}
                                </div>
                            )}

                            {/* List Renderers */}
                            {msg.isQuestionList && (
                                <div className="w-full max-w-[95%]">
                                    <p className="text-slate-400 text-[10px] font-black mb-2 ml-1 uppercase tracking-widest">Select Question</p>
                                    {renderQuestionsList(msg.category)}
                                </div>
                            )}

                            {/* Property Cards */}
                            {msg.isPropertyCard && (
                                <div className="flex overflow-x-auto gap-4 py-4 px-1 w-full mt-2 custom-scrollbar snap-x relative z-10 pb-6">
                                    {msg.payload.map(p => (
                                        <motion.div
                                            key={p.id}
                                            whileHover={{ y: -5 }}
                                            className="min-w-[310px] w-[310px] bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 shrink-0 cursor-pointer snap-center group"
                                            onClick={() => window.open(`/property/${p.id}`, '_blank')}
                                        >
                                            <div className="h-44 bg-slate-200 relative overflow-hidden">
                                                <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                                    <FaStar size={12} className="text-yellow-500" />
                                                    <span className="text-[12px] font-bold text-slate-800">{p.rating}</span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h4 className="font-extrabold text-[16px] text-slate-800 truncate mb-1">{p.name}</h4>
                                                <p className="text-[12px] text-slate-500 flex items-center gap-1 mb-3">
                                                    <FaMapMarkerAlt size={12} /> {p.location}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block font-bold uppercase leading-none mb-1">Starting from</span>
                                                        <span className="text-blue-600 font-extrabold text-xl">₹{p.price}</span>
                                                    </div>
                                                    <button className="bg-slate-900 text-white text-[12px] font-bold px-6 py-3 rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200">View Villa</button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10 pl-2">
                        <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl rounded-bl-none shadow-md flex gap-1.5 items-center h-12">
                            <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom Actions Area */}
            <div className="bg-white border-t border-slate-100 p-4 shrink-0 relative z-20">
                <div className="flex gap-2 items-stretch">
                    {viewMode === 'MAIN_MENU' ? (
                        <div className="w-full">
                            <p className="text-[9px] font-black text-slate-400 text-center mb-2 uppercase tracking-[0.2em]">Explore Topics</p>
                            {renderMainMenu()}
                        </div>
                    ) : (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBackToMenu}
                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-100 flex items-center justify-center gap-2 transition-all"
                            >
                                <FaChevronLeft size={12} /> Menu
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.open('https://wa.me/919022510122', '_blank')}
                                className="flex-[1.5] bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                            >
                                <FaWhatsapp size={20} /> Talk to Human
                            </motion.button>
                        </>
                    )}
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </motion.div>
    );
}

