import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaMinus, FaPlus, FaMapMarkerAlt, FaHotel } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

export default function SearchBar({ compact = false, isSticky = false, onSearch, properties = [], categories = [], activeCategory, onCategoryChange }) {
    const [activeTab, setActiveTab] = useState(null); // 'location', 'dates', 'guests'
    const [location, setLocation] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0, pets: 0, rooms: 1 });
    const [isExpanded, setIsExpanded] = useState(!compact);
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    const handleLocationChange = (e) => {
        const val = e.target.value;
        setLocation(val);

        // Guard against missing properties
        if (!properties || !Array.isArray(properties)) {
            setSuggestions([]);
            return;
        }

        if (val.length >= 3) { // Threshold raised to 3 chars per user request
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
                    label: safeP.Name || safeP.name || "Unknown Property",
                    subLabel: safeP.Location || safeP.location || safeP.CityName || safeP.city_name || "Unknown Location",
                    type: 'property'
                };
            });

            setSuggestions(rawSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    // Click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeTab && searchRef.current && !searchRef.current.contains(event.target)) {
                setActiveTab(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeTab]);

    const handleSearch = () => {
        const dates = {
            start: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
            end: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null
        };
        console.log("Search", { location, dates, guests });
        if (onSearch) {
            onSearch({ location, dates, guests });
        }
        setActiveTab(null);
    };

    const updateGuest = (type, val) => {
        setGuests(prev => ({ ...prev, [type]: Math.max(0, prev[type] + val) }));
    };

    const handleDateSelect = (day, modifiers) => {
        // Guard against disabled dates
        if (day < new Date().setHours(0, 0, 0, 0)) return;

        // Logic:
        // Case 1: Range is Full (Start + End) OR No Range
        // -> Reset and start new range with this date as Start.
        if ((dateRange.from && dateRange.to) || !dateRange.from) {
            setDateRange({ from: day, to: undefined });
            return;
        }

        // Case 2: Only Start exists (In Progress)
        if (dateRange.from && !dateRange.to) {
            // Sub-case: Clicked date is BEFORE current Start
            // -> Treat as Correction: New Start Date
            if (day < dateRange.from) {
                setDateRange({ from: day, to: undefined });
            }
            // Sub-case: Clicked date is AFTER current Start
            // -> Treat as Completion: End Date
            else {
                // Ensure we don't just set 'to', but keep 'from'
                setDateRange({ from: dateRange.from, to: day });
                setTimeout(() => setActiveTab(null), 200); // Close faster
            }
        }
    };

    // ... inside render:
    <DayPicker
        mode="range"
        selected={dateRange}
        onDayClick={handleDateSelect}
        disabled={{ before: new Date() }}
        numberOfMonths={2}
    />

    // STICKY STYLES: Use `visible` and `opacity` explicitly to prevent disappearance issues
    const containerClasses = isSticky
        ? "fixed top-0 left-1/2 transform -translate-x-1/2 w-[95%] md:w-[50%] z-[10000] transition-all duration-300 ease-in-out origin-top opacity-100 visible"
        : "relative w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out opacity-100 visible";

    return (
        <div className={containerClasses} ref={searchRef}>
            {/* STICKY CATEGORIES ROW (Only when Sticky) */}
            {isSticky && categories.length > 0 && (
                <div className="flex justify-center flex-wrap gap-2 mb-0 animate-fade-down overflow-hidden">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onCategoryChange && onCategoryChange(cat.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all backdrop-blur-md border ${activeCategory === cat.id
                                ? 'bg-brand-dark text-white border-white/20 shadow-md'
                                : 'bg-white/80 text-gray-700 hover:bg-white border-transparent'
                                }`}
                        >
                            {cat.icon}
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* SEARCH BAR CONTAINER */}
            <div className={`bg-white transition-all duration-300 ${isSticky ? 'md:rounded-full rounded-2xl p-2' : 'md:rounded-full rounded-3xl p-4 md:p-2'} shadow-2xl flex flex-col md:flex-row md:items-center relative z-40 border border-gray-100 w-full`}>

                {/* 1. LOCATION */}
                <div
                    onClick={() => setActiveTab('location')}
                    className={`flex-1 relative w-full md:w-auto ${isSticky ? 'px-4 py-3 md:py-2' : 'px-4 py-3 md:px-8 md:py-3.5'} rounded-xl md:rounded-full cursor-pointer hover:bg-gray-100 transition ${activeTab === 'location' ? 'bg-gray-50 md:bg-white md:shadow-lg' : ''} border-b md:border-b-0 border-gray-100`}
                >
                    <label className="block text-xs font-bold text-gray-800 tracking-wider mb-1 md:mb-0">WHERE</label>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search destinations"
                        value={location}
                        onChange={(e) => {
                            handleLocationChange(e);
                            if (activeTab !== 'location') setActiveTab('location');
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('location');
                        }}
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500 p-0 relative z-10 font-medium truncate"
                    />
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                {/* 2. DATES */}
                <div
                    onClick={() => setActiveTab('dates')}
                    className={`flex-1 relative w-full md:w-auto ${isSticky ? 'px-4 py-3 md:py-1.5' : 'px-4 py-3 md:px-8 md:py-3.5'} rounded-xl md:rounded-full cursor-pointer hover:bg-gray-100 transition ${activeTab === 'dates' ? 'bg-gray-50 md:bg-white md:shadow-lg' : ''} border-b md:border-b-0 border-gray-100`}
                >
                    <label className="block text-xs font-bold text-gray-800 tracking-wider mb-1 md:mb-0">WHEN</label>
                    <div className={`text-sm ${dateRange.from ? 'text-gray-900 font-medium' : 'text-gray-500'} truncate`}>
                        {dateRange.from ? (
                            <>
                                {format(dateRange.from, 'MMM d')}
                                {dateRange.to ? ` - ${format(dateRange.to, 'MMM d')}` : ''}
                            </>
                        ) : 'Add dates'}
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                {/* 3. WHO */}
                <div
                    onClick={() => setActiveTab('guests')}
                    className={`flex-[1.2] relative w-full md:w-auto ${isSticky ? 'px-4 py-3 md:pl-4 md:pr-1 md:py-1' : 'px-4 py-3 md:pl-8 md:pr-2 md:py-2'} rounded-xl md:rounded-full cursor-pointer hover:bg-gray-100 transition flex items-center justify-between ${activeTab === 'guests' ? 'bg-gray-50 md:bg-white md:shadow-lg' : ''}`}
                >
                    <div>
                        <label className="block text-xs font-bold text-gray-800 tracking-wider mb-1 md:mb-0">WHO</label>
                        <div className="text-sm text-gray-900 font-medium truncate">
                            {guests.adults + guests.children} guests
                        </div>
                    </div>

                    {/* SEARCH BUTTON - DESKTOP */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                        className={`hidden md:flex bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-full ${isSticky ? 'p-3' : 'p-4'} shadow-md transition-all duration-300 items-center justify-center gap-2 group`}
                    >
                        <FaSearch size={isSticky ? 12 : 16} />
                        <span className={`max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ${isSticky ? 'text-xs' : 'text-sm'} font-bold`}>
                            Search
                        </span>
                    </button>
                </div>

                {/* SEARCH BUTTON - MOBILE */}
                <div className="md:hidden w-full p-2 mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSearch(); }}
                        className="w-full bg-[#FF385C] text-white rounded-xl py-3 shadow-md font-bold text-lg flex items-center justify-center gap-2"
                    >
                        <FaSearch /> Search
                    </button>
                </div>
            </div>

            {/* EXPANDED DROPDOWNS (AnimatePresence) */}
            <AnimatePresence>
                {activeTab && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/25 z-40"
                            onClick={() => setActiveTab(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-24 left-0 w-full bg-white rounded-3xl shadow-2xl p-6 z-[100]"
                        >
                            {activeTab === 'location' && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 mb-4">
                                        {suggestions.length > 0 ? 'MATCHING RESULTS' : 'SUGGESTED DESTINATIONS'}
                                    </h3>
                                    <div className="space-y-4">
                                        {suggestions.length > 0 ? (
                                            suggestions.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => { setLocation(s.label); setActiveTab('dates'); }}
                                                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                                                >
                                                    <div className="bg-gray-100 p-3 rounded-lg"><FaHotel /></div>
                                                    <div>
                                                        <div className="text-gray-700 font-medium">{s.label}</div>
                                                        <div className="text-xs text-gray-400">{s.subLabel}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            ['Lonavala, India', 'Goa, India', 'Mahabaleshwar, India'].map(place => (
                                                <div key={place} onClick={() => { setLocation(place); setActiveTab('dates'); }} className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                                                    <div className="bg-gray-100 p-3 rounded-lg"><FaMapMarkerAlt /></div>
                                                    <span className="text-gray-700 font-medium">{place}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'dates' && (
                                <div className="flex flex-col items-center justify-center w-full">
                                    <style>{`
                                        .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #000; --rdp-background-color: #f7f7f7; }
                                        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f0f0f0; }
                                        .rdp-day_selected { background-color: black !important; color: white !important; }
                                        .rdp-day_today { font-weight: bold; color: #FF385C; }
                                        .rdp-caption_label { font-size: 1rem; font-weight: 600; }
                                    `}</style>
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onDayClick={handleDateSelect}
                                        disabled={{ before: new Date() }}
                                        numberOfMonths={2}
                                    />
                                </div>
                            )}

                            {activeTab === 'guests' && (
                                <div className="grid grid-cols-2 gap-8">
                                    {['adults', 'children', 'rooms'].map((type) => (
                                        <div key={type} className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <div className="capitalize font-medium text-gray-700">{type}</div>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => updateGuest(type, -1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-black"><FaMinus size={10} /></button>
                                                <span className="w-4 text-center">{guests[type]}</span>
                                                <button onClick={() => updateGuest(type, 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-black"><FaPlus size={10} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
