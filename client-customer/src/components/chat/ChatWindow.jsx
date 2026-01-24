import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
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

    const [activeLocations, setActiveLocations] = useState([]);

    // Fetch Active Locations on Mount
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/properties/locations`);
                if (res.ok) {
                    const data = await res.json();
                    // Take top 5 locations with count > 0
                    const locs = data.filter(l => l.count > 0).slice(0, 5).map(l => l.name);
                    if (locs.length > 0) setActiveLocations(locs);
                    else setActiveLocations(['Lonavala', 'Igatpuri', 'Karjat', 'Alibaug']); // Fallback
                }
            } catch (e) {
                setActiveLocations(['Lonavala', 'Igatpuri', 'Karjat', 'Alibaug']); // Fallback
            }
        };
        fetchLocations();
    }, []);

    // Scroll effect - Handle general message flow and property results visibility
    useEffect(() => {
        if (!scrollRef.current) return;

        const lastMsg = messages[messages.length - 1];

        // Custom scrolling for property results (Issue 1 request: scroll to results start)
        if (lastMsg?.isPropertyGrid) {
            // Find the property grid element and scroll it to the top of the container
            setTimeout(() => {
                const gridElements = scrollRef.current.querySelectorAll('.property-grid-container');
                const lastGrid = gridElements[gridElements.length - 1];
                if (lastGrid) {
                    lastGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            // General scroll to bottom
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

    const handleFreeSearch = async (query) => {
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: query }]);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_BASE_URL}/chatbot/search?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            setIsTyping(false);

            if (data.success && data.data && data.data.length > 0) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: data.answer || "I found something for you:",
                    action: data.action_type,
                    payload: data.action_payload
                }]);
            } else if (data.show_escalation_form) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: data.message || "I couldn't find an exact answer. Would you like to talk to our team?",
                }]);
                setShowEscalationForm(true);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: data.message || "I'm not sure about that. Try asking something else or talk to our live support."
                }]);
            }
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
        }
    };

    const handleEscalationSubmit = async (e) => {
        e.preventDefault();
        setIsTyping(true);
        try {
            await fetch(`${API_BASE_URL}/chatbot/escalate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...userData, question: messages[messages.length - 1]?.text })
            });
            setIsTyping(false);
            setShowEscalationForm(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: `Thanks **${userData.name}**! Our team will contact you on **${userData.mobile}** shortly.`
            }]);
        } catch (e) {
            setIsTyping(false);
            alert("Error sending request. Please try again.");
        }
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

    const handleMiniSearch = async (location, typeContext) => {
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `Searching for ${typeContext} in ${location}` }]);
        setIsTyping(true);

        const showResults = (props) => {
            setIsTyping(false);
            if (props && props.length > 0) {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: `Excellent choice! I found ${props.length} premium ${typeContext} for you in ${location}:`,
                    isPropertyGrid: true,
                    properties: props
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'bot',
                    text: `I couldn't find any specific ${typeContext} in ${location} right now. Would you like to view all our handpicked ${typeContext}?`,
                    action: 'link',
                    payload: JSON.stringify({ url: typeContext === 'waterpark' ? '/waterpark' : '/' })
                }]);
            }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/chatbot/search?location=${location}&type=${typeContext}`);
            const data = await res.json();

            if (data.success && data.data) {
                showResults(data.data);
            } else {
                showResults([]);
            }
        } catch (e) {
            console.error("API error", e);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: "I'm having trouble connecting to our property database right now. Please try again or browse our main list.",
                action: 'link',
                payload: JSON.stringify({ url: '/' })
            }]);
        }
    };

    const handlePropertySearch = async (searchLocation = '') => {
        // If no location provided (e.g., Main Menu click), prompt user first or show default
        if (!searchLocation) {
            setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: "🔍 Find available villas" }]);
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                const typeContext = window.location.pathname.includes('waterpark') ? 'waterpark' : 'villas';
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: "Great! Where are you planning to visit?",
                    isMiniSearch: true,
                    searchContext: { type: typeContext }
                }]);
            }, 500);
            return;
        }

        setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `Search in ${searchLocation}` }]);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_BASE_URL}/chatbot/search?location=${encodeURIComponent(searchLocation)}`);
            setIsTyping(false);

            if (res.ok) {
                const data = await res.json();
                if (data.type === 'action_trigger' && data.action === 'FORM_SEARCH') {
                    // Fallback to Mini Search if API suggests
                    const typeContext = window.location.pathname.includes('waterpark') ? 'waterpark' : 'villas';
                    setMessages(prev => [...prev, {
                        id: Date.now() + 2,
                        type: 'bot',
                        text: data.message || "Where are you looking to stay?",
                        isMiniSearch: true,
                        searchContext: { type: typeContext }
                    }]);
                } else if (data.success && data.data && data.data.length > 0) {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        type: 'bot',
                        text: `Excellent choice! I found ${data.data.length} premium properties for you in ${searchLocation}:`,
                        isPropertyGrid: true,
                        properties: data.data
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        type: 'bot',
                        text: `I currently don't have available villas in ${searchLocation}. Would you like to check Lonavala?`,
                        isMiniSearch: true, // Re-prompt
                        searchContext: { type: 'villas' }
                    }]);
                }
            } else {
                throw new Error("API Login Failed");
            }
        } catch (e) {
            console.error(e);
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: "I'm having trouble searching right now. Browse our top picks directly!",
                action: 'link',
                payload: JSON.stringify({ url: '/' })
            }]);
        }
    };

    // --- Renders ---

    const renderMainMenu = () => {
        const categories = config?.faqs_by_category ? Object.keys(config.faqs_by_category) : [];
        return (
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1 pb-1">
                {/* Search Villas Primary Action - Compact */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePropertySearch()}
                    className="w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-200 text-white flex items-center justify-between group overflow-hidden relative ring-1 ring-white/20"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md shadow-inner text-white">
                            <FaSearch size={14} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold tracking-wide">Find Best Villas</p>
                            <p className="text-[10px] opacity-90 font-medium">Lonavala, Karjat...</p>
                        </div>
                    </div>
                    <div className="bg-white/20 p-1 rounded-full">
                        <FaArrowRight size={10} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </motion.button>

                <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={cat}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.02, backgroundColor: '#eff6ff' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCategorySelect(cat)}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-1.5 group text-center"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                {React.cloneElement(CATEGORY_ICONS[cat] || <FaQuestionCircle />, { size: 14 })}
                            </div>
                            <span className="text-xs font-bold text-slate-700 capitalize group-hover:text-blue-800">{cat.replace('_', ' ')}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        );
    };

    const renderQuestionsList = (category) => {
        const questions = config?.faqs_by_category?.[category] || [];
        return (
            <div className="flex flex-col gap-2 mt-3">
                {questions.map((q, idx) => (
                    <motion.button
                        key={q.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleQuestionSelect(q)}
                        className="p-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 text-left hover:bg-blue-50 hover:border-blue-300 transition-all flex justify-between items-center group shadow-sm hover:shadow-md"
                    >
                        <span className="pr-2 leading-snug">{q.question}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <FaArrowRight size={10} className="text-slate-400 group-hover:text-blue-700 transition-colors" />
                        </div>
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
            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-3 right-3 md:bottom-24 md:right-8 md:left-auto md:w-[380px] h-[75vh] md:h-auto md:max-h-[min(650px,calc(100vh-140px))] bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden border border-white/40 z-[999] ring-1 ring-black/5"
        >
            {/* Header Redesign */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 p-0.5 shadow-xl ring-2 ring-white/10">
                            <div className="w-full h-full rounded-[0.9rem] bg-slate-900 flex items-center justify-center">
                                <FaRobot size={22} className="text-white drop-shadow-lg" />
                            </div>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-slate-900 animate-pulse shadow-md"></span>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg leading-tight tracking-tight text-white font-sans">{config?.title || "ResortWala Assistant"}</h3>
                        <div className="flex items-center gap-1.5 opacity-90 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-300">AI Enabled</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition active:scale-95 text-white backdrop-blur-md border border-white/10 relative z-10 shadow-lg">
                    <FaTimes size={14} />
                </button>
            </div>

            {/* Messages Area - Solid Clean Background for Visibility */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 px-5 pt-5 pb-4 space-y-6 custom-scrollbar" ref={scrollRef}>

                {/* Intro Text */}
                {messages.length === 0 && !isTyping && (
                    <div className="flex flex-col items-center justify-center h-40 opacity-50">
                        <FaRobot size={30} className="text-gray-300 mb-2" />
                        <p className="text-sm font-bold text-gray-400">How can I help you today?</p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            key={msg.id}
                            data-type={msg.type}
                            className={`flex flex-col relative z-10 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            {/* Standard Message Bubble */}
                            {!msg.isQuestionList && !msg.isPropertyGrid && !msg.isMiniSearch && (
                                <div className={`
                                    px-5 py-4 text-[14px] leading-relaxed shadow-sm break-words whitespace-pre-wrap max-w-[85%] font-medium
                                    ${msg.type === 'user'
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-blue-200'
                                        : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm'}
                                `}>
                                    {msg.text ? <div dangerouslySetInnerHTML={{ __html: msg.text }} /> : "..."}

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
                                            onClick={() => {
                                                const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload || '{}') : (msg.payload || {});
                                                const url = payload.url || msg.payload;
                                                if (url) window.location.href = url;
                                            }}
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
                                    <div className="flex items-center gap-2 mb-2 ml-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Suggested Questions</p>
                                    </div>
                                    {renderQuestionsList(msg.category)}
                                </div>
                            )}

                            {/* Mini Search Location Buttons */}
                            {msg.isMiniSearch && (
                                <div className="w-full max-w-[95%]">
                                    <div className={`
                                        px-5 py-4 text-[14px] leading-relaxed shadow-sm break-words whitespace-pre-wrap max-w-[85%] font-medium
                                        bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm
                                    `}>
                                        <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                                    </div>
                                    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                        {activeLocations.map(loc => (
                                            <button
                                                key={loc}
                                                onClick={() => handleMiniSearch(loc, msg.searchContext?.type)}
                                                className="whitespace-nowrap bg-white text-blue-700 px-5 py-2.5 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-lg transition-all shadow-sm"
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Property Cards (Grid) */}
                            {msg.isPropertyGrid && (
                                <div className="property-grid-container flex overflow-x-auto gap-4 py-4 px-2 w-full mt-2 custom-scrollbar snap-x relative z-10 pb-8 -mx-3">
                                    {msg.properties.map(p => (
                                        <motion.div
                                            key={p.id}
                                            whileHover={{ y: -5 }}
                                            className="flex-none w-[200px] bg-white rounded-2xl p-3 border border-slate-200 shadow-xl snap-center transform transition hover:scale-[1.02]"
                                            onClick={() => window.open(`/property/${p.id}`, '_blank')}
                                        >
                                            <div className="h-24 rounded-xl bg-slate-100 mb-3 overflow-hidden relative">
                                                <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                                                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
                                                    <FaStar className="text-yellow-400" /> {p.rating}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-sm leading-tight text-slate-900 mb-1 line-clamp-2 h-10">{p.name}</h4>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const city = p.location.split(',').pop().trim();
                                                    navigate(`/?location=${encodeURIComponent(city)}`);
                                                    onClose(); // Close chatbot to show results
                                                }}
                                                className="flex items-center gap-1 text-[11px] text-slate-500 mb-3 hover:text-blue-600 font-bold transition-colors group/loc"
                                            >
                                                <FaMapMarkerAlt size={10} className="group-hover/loc:scale-110 transition-transform" /> {p.location}
                                            </button>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Starting from</span>
                                                    <span className="font-black text-blue-600 text-lg">₹{p.price.toLocaleString()}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); window.location.href = `/property/${p.id}`; }}
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-200"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Escalation Form */}
                {showEscalationForm && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-blue-100 rounded-2xl p-5 shadow-2xl mb-4 relative z-20">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm text-slate-900">Talk to Support</h4>
                            <button onClick={() => setShowEscalationForm(false)} className="p-1 hover:bg-gray-100 rounded-full"><FaTimes size={12} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleEscalationSubmit} className="space-y-4">
                            <input
                                required
                                type="text" placeholder="Your Name"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })}
                            />
                            <input
                                required
                                type="tel" placeholder="Mobile Number"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={userData.mobile} onChange={e => setUserData({ ...userData, mobile: e.target.value })}
                            />
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                                Request Callback
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Loading Indicator */}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start relative z-10 pl-2">
                        <div className="bg-white border border-gray-100 px-5 py-3.5 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center h-12">
                            <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-blue-500 rounded-full" />
                            <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                            <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-violet-500 rounded-full" />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom Actions Area */}
            <div className="bg-white border-t border-gray-100 p-3 shrink-0 relative z-20 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="space-y-2">
                    {/* Free Text Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Type your question..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12 text-gray-800 placeholder:text-gray-400"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    const val = e.target.value;
                                    e.target.value = '';
                                    handleFreeSearch(val);
                                }
                            }}
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition">
                            <FaArrowRight size={16} />
                        </button>
                    </div>

                    <div className="flex gap-2 items-stretch">
                        {viewMode === 'MAIN_MENU' ? (
                            <div className="w-full">
                                <div className="flex items-center justify-center gap-2 mb-3 opacity-50">
                                    <div className="h-px bg-gray-300 w-16"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quick Explore</p>
                                    <div className="h-px bg-gray-300 w-16"></div>
                                </div>
                                {renderMainMenu()}
                            </div>
                        ) : (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleBackToMenu}
                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-100 flex items-center justify-center gap-2 transition-all"
                                >
                                    <FaChevronLeft size={12} /> Menu
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => window.open('https://wa.me/919022510122', '_blank')}
                                    className="flex-[1.5] bg-[#25D366] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-green-100 flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors"
                                >
                                    <FaWhatsapp size={20} /> Talk to Human
                                </motion.button>
                            </>
                        )}
                    </div>
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

