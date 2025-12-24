import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaMinus, FaPlus, FaMapMarkerAlt, FaHotel } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useSearch } from '../../context/SearchContext';

export default function SearchBar({ compact = false, isSticky = false, onSearch, properties = [], categories = [] }) {
    // Global State
    const {
        location, setLocation,
        dateRange, setDateRange,
        guests, setGuests,
        activeCategory, setActiveCategory
    } = useSearch();

    const [activeTab, setActiveTab] = useState(null); // 'location', 'dates', 'guests'
    const [suggestions, setSuggestions] = useState([]);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-search suggestions
    const handleLocationChange = (e) => {
        const val = e.target.value;
        setLocation(val);

        if (!properties || !Array.isArray(properties)) {
            setSuggestions([]);
            return;
        }

        if (val.length >= 3) {
            const lowerVal = val.toLowerCase();
            const matches = properties.filter(p => {
                if (!p) return false;
                const name = (p.Name || p.name || "").toLowerCase();
                const loc = (p.Location || p.location || "").toLowerCase();
                const city = (p.CityName || p.city_name || "").toLowerCase();
                return name.includes(lowerVal) || loc.includes(lowerVal) || city.includes(lowerVal);
            });

            const rawSuggestions = matches.slice(0, 5).map(p => {
                const safeP = p || {};
                return {
                    id: safeP.id || safeP.PropertyId || safeP.property_id || Math.random().toString(),
                    label: (safeP.Name || safeP.name || "Unknown Property").replace(', India', ''),
                    subLabel: (safeP.Location || safeP.location || safeP.CityName || safeP.city_name || "Unknown Location").replace(', India', ''),
                };
            });

            setSuggestions(rawSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeTab && searchRef.current && !searchRef.current.contains(event.target)) {
                setActiveTab(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeTab]);

    // Helper to get current filters for live updates
    const getFilters = (overrideLocation) => ({
        location: overrideLocation !== undefined ? overrideLocation : location,
        dates: {
            start: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
            end: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null
        },
        guests
    });

    const handleSearchClick = () => {
        if (onSearch) {
            onSearch(getFilters(), true); // True = Scroll to results
        }
        setActiveTab(null);
    };

    const updateGuest = (type, val) => {
        const newGuests = { ...guests, [type]: Math.max(0, guests[type] + val) };
        setGuests(newGuests);
        // Live update - No scroll
        if (onSearch) {
            onSearch({ ...getFilters(), guests: newGuests }, false);
        }
    };

    const handleDateSelect = (day, modifiers) => {
        if (day < new Date().setHours(0, 0, 0, 0)) return;

        if ((dateRange.from && dateRange.to) || !dateRange.from) {
            setDateRange({ from: day, to: undefined });
            return;
        }

        if (dateRange.from && !dateRange.to) {
            if (day < dateRange.from) {
                setDateRange({ from: day, to: undefined });
            } else {
                setDateRange({ from: dateRange.from, to: day });
                // Slight delay to allow visual confirmation before processing or closing
                setTimeout(() => {
                    const filters = {
                        location,
                        dates: {
                            start: format(dateRange.from, 'yyyy-MM-dd'),
                            end: format(day, 'yyyy-MM-dd')
                        },
                        guests
                    };
                    if (onSearch) onSearch(filters);
                    setActiveTab(null);
                }, 100);
            }
        }
    };

    const totalGuests = guests.adults + guests.children;

    return (
        <div
            ref={searchRef}
            className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-[100] ${isSticky
                ? 'w-full max-w-2xl mx-auto'
                : 'w-full max-w-4xl mx-auto relative'}`}
        >
            {/* CATEGORIES ROW - Display differs based on stickiness */}
            {categories.length > 0 && (
                <div className={`transition-all duration-500 ease-in-out ${isSticky
                    ? 'flex justify-center gap-1 mb-1 scale-75 origin-bottom' // Tighter gap, smaller scale, less margin
                    : 'flex justify-center gap-3 mb-3'}`}> {/* Reduced margin for Hero too */}
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setActiveCategory(cat.id);
                                if (onSearch) onSearch({ location, dates: { start: null, end: null }, guests });
                            }}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 backdrop-blur-sm border whitespace-nowrap 
                                ${activeCategory === cat.id
                                    ? 'bg-white text-black shadow-lg scale-105 border-white'
                                    : isSticky
                                        ? 'bg-transparent text-gray-500 hover:text-gray-900 border-transparent hover:bg-gray-100' // Sticky & Inactive: Dark text, subtle hover
                                        : 'bg-white/10 text-white hover:bg-white/20 border-white/20' // Hero & Inactive: White text, glass hover
                                } 
                                ${isSticky ? 'px-3 py-1.5 text-xs' : ''} 
                            `}
                        >
                            {cat.icon}
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* MAIN SEARCH BAR */}
            <div className={`relative bg-white/90 backdrop-blur-xl transition-all duration-300 group
                ${activeTab ? 'z-[101]' : ''} 
                ${isSticky
                    ? 'rounded-full border border-gray-200 shadow-sm hover:shadow-md flex items-center h-[40px] pl-3 pr-1 mx-auto max-w-[500px]' // Smaller height, width, padding
                    : 'rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-gray-100/50 flex flex-col md:flex-row items-center p-2 md:h-[72px] ring-1 ring-black/5'}`
            }>

                {/* 1. WHERE */}
                <div
                    onClick={() => setActiveTab('location')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-3 md:py-0
                        ${isSticky
                            ? 'flex-1 hover:bg-gray-100/50 rounded-full'
                            : 'w-full md:flex-[1.2] md:hover:bg-gray-100/50 rounded-full h-full flex flex-col justify-center pl-8'}
                        ${activeTab === 'location' && !isSticky ? 'bg-white shadow-lg scale-100 z-20' : ''}`
                    }
                >
                    <label className={`text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0.5 ${isSticky ? 'hidden' : ''}`}>Where</label>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Anywhere"
                        value={location}
                        onChange={handleLocationChange}
                        onClick={(e) => { e.stopPropagation(); setActiveTab('location'); }}
                        className={`w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 font-semibold truncate ${isSticky ? 'text-sm' : 'text-sm md:text-base'}`}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    />
                    {/* Redundant span removed to fix "Anywhere Anywhere" duplication */}
                </div>

                {/* DIVIDER */}
                {!isSticky && <div className="hidden md:block w-px h-10 bg-gray-200/60 mx-1"></div>}

                {/* 2. WHEN */}
                <div
                    onClick={() => setActiveTab('dates')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-3 md:py-0
                        ${isSticky
                            ? 'flex-none w-[120px] border-l border-gray-200 hover:bg-gray-100/50 flex items-center justify-center text-center'
                            : 'w-full md:flex-1 md:hover:bg-gray-100/50 rounded-full h-full flex flex-col justify-center pl-8'}
                        ${activeTab === 'dates' && !isSticky ? 'bg-white shadow-lg scale-100 z-20' : ''}`
                    }
                >
                    <label className={`text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0.5 ${isSticky ? 'hidden' : ''}`}>Check in - out</label>
                    <div className={`font-semibold truncate ${dateRange.from ? 'text-gray-900' : 'text-gray-500'} ${isSticky ? 'text-sm' : 'text-sm md:text-base'}`}>
                        {dateRange.from ? (
                            <>{format(dateRange.from, 'MMM d')}{dateRange.to ? ` - ${format(dateRange.to, 'MMM d')}` : ''}</>
                        ) : 'Any Week'}
                    </div>
                </div>

                {/* DIVIDER */}
                {!isSticky && <div className="hidden md:block w-px h-10 bg-gray-200/60 mx-1"></div>}

                {/* 3. WHO */}
                <div
                    onClick={() => setActiveTab('guests')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-3 md:py-0
                        ${isSticky
                            ? 'flex-none w-[100px] border-l border-gray-200 hover:bg-gray-100/50 flex items-center justify-center'
                            : 'w-full md:flex-1 md:hover:bg-gray-100/50 rounded-full h-full flex flex-row items-center justify-between pl-8 pr-2'}
                        ${activeTab === 'guests' && !isSticky ? 'bg-white shadow-lg scale-100 z-20' : ''}`
                    }
                >
                    <div className={`${isSticky ? 'text-center' : ''}`}>
                        <label className={`text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0.5 ${isSticky ? 'hidden' : ''}`}>Who</label>
                        <div className={`font-semibold truncate ${totalGuests > 0 ? 'text-gray-900' : 'text-gray-500'} ${isSticky ? 'text-sm' : 'text-sm md:text-base'}`}>
                            {totalGuests > 0 ? `${totalGuests} Guests` : 'Add guests'}
                        </div>
                    </div>

                    {/* SEARCH BUTTON (Desktop) */}
                    {!isSticky && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleSearchClick(); }}
                            className="hidden md:flex bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:bg-gradient-to-br hover:scale-105 text-white rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center group"
                        >
                            <FaSearch size={16} />
                        </button>
                    )}
                </div>

                {/* SEARCH BUTTON (Sticky - Included inside the bar) */}
                {isSticky && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSearchClick(); }}
                        className="ml-2 w-9 h-9 bg-[#FF385C] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition hover:shadow-lg"
                    >
                        <FaSearch size={14} />
                    </button>
                )}
            </div>

            {/* MOBILE ONLY SEARCH BUTTON (For Hero Mode) */}
            {!isSticky && (
                <div className="md:hidden mt-4 px-2">
                    <button
                        onClick={handleSearchClick}
                        className="w-full bg-gradient-to-r from-[#FF385C] to-[#E00B41] text-white rounded-xl py-3.5 shadow-lg shadow-rose-500/20 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                        <FaSearch /> Search
                    </button>
                </div>
            )}

            {/* EXPANDED DROPDOWNS */}
            <AnimatePresence>
                {activeTab && (
                    <>
                        {/* Dropdown Card - Removed Backdrop as requested */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute left-0 z-[100] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] p-6 md:p-8 border border-gray-100
                                ${isSticky
                                    ? 'top-full mt-2 w-full origin-top' // Always below, with slight margin
                                    : 'top-full mt-4 w-full origin-top'}` // More margin for Hero to clear shadow
                            }
                        >
                            {activeTab === 'location' && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                        {suggestions.length > 0 ? 'Matching Destinations' : 'Popular Destinations'}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {suggestions.length > 0 ? (
                                            suggestions.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => {
                                                        setLocation(s.label);
                                                        if (onSearch) onSearch({ ...getFilters(s.label), }, false); // Live update, no scroll
                                                        setActiveTab('dates');
                                                    }}
                                                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition group"
                                                >
                                                    <div className="bg-gray-100 group-hover:bg-white border border-transparent group-hover:border-gray-200 p-3 rounded-xl transition text-gray-500"><FaMapMarkerAlt /></div>
                                                    <div>
                                                        <div className="text-gray-900 font-bold">{s.label}</div>
                                                        <div className="text-xs text-gray-500">{s.subLabel}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                Type at least 3 characters to search...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'dates' && (
                                <div className="flex justify-center">
                                    <style>{`
                                        .rdp { --rdp-cell-size: 44px; --rdp-accent-color: #000; --rdp-background-color: #f3f4f6; margin: 0; }
                                        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f3f4f6; }
                                        .rdp-day_selected { background-color: #000 !important; color: white !important; font-weight: bold; }
                                        .rdp-caption_label { font-size: 1.1rem; font-weight: 700; color: #1f2937; }
                                    `}</style>
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onDayClick={(day) => handleDateSelect(day)}
                                        disabled={{ before: new Date() }}
                                        numberOfMonths={2}
                                    />
                                </div>
                            )}

                            {activeTab === 'guests' && (
                                <div className="space-y-6">
                                    {['adults', 'children', 'rooms'].map((type) => (
                                        <div key={type} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                            <div>
                                                <div className="capitalize font-bold text-gray-800 text-base">{type}</div>
                                                <div className="text-xs text-gray-400">{type === 'adults' ? 'Ages 13 or above' : type === 'children' ? 'Ages 2-12' : 'Number of rooms'}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={() => updateGuest(type, -1)}
                                                    disabled={guests[type] <= 0}
                                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-gray-50 transition disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                                                >
                                                    <FaMinus size={12} />
                                                </button>
                                                <span className="w-6 text-center font-bold text-lg">{guests[type]}</span>
                                                <button
                                                    onClick={() => updateGuest(type, 1)}
                                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-gray-50 transition"
                                                >
                                                    <FaPlus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div >
    );
}
