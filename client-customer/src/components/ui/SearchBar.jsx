import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaMinus, FaPlus, FaMapMarkerAlt, FaHotel } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useSearch } from '../../context/SearchContext';
import { API_BASE_URL } from '../../config';

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

    // Auto-search suggestions (Debounced API Call)
    const handleLocationChange = (e) => {
        const val = e.target.value;
        setLocation(val);
    };

    // Debounced Fetch for Suggestions
    useEffect(() => {
        if (!location || location.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                // Use API_BASE_URL from config
                const res = await fetch(`${API_BASE_URL}/properties?location=${encodeURIComponent(location)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    const rawSuggestions = (data.data || []).map(p => ({
                        id: p.PropertyId,
                        label: p.Name,
                        subLabel: `${p.CityName || ''} • ${p.Location || ''}`, // Show context
                        // Add type for icon differentiation if needed
                        type: p.PropertyType
                    }));
                    setSuggestions(rawSuggestions);
                }
            } catch (err) {
                console.error("Suggestion fetch failed", err);
            }
        }, 300); // 300ms Debounce

        return () => clearTimeout(timer);
    }, [location]);

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

    // Auto-Scroll to center when popup opens (Standard visibility fix)
    useEffect(() => {
        if (activeTab && !isSticky && searchRef.current) {
            setTimeout(() => {
                searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [activeTab, isSticky]);

    // Helper to get current filters for live updates
    const getFilters = (overrideLocation) => ({
        location: overrideLocation !== undefined ? overrideLocation : location,
        dateRange: dateRange,
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (day < today) return;

        // If we have both or none, start a new range (Click 1)
        if ((dateRange.from && dateRange.to) || !dateRange.from) {
            setDateRange({ from: day, to: undefined });
            return;
        }

        // If we have 'from' but no 'to' (Click 2)
        if (dateRange.from && !dateRange.to) {
            if (day < dateRange.from) {
                // If user clicks before 'from', move 'from' to this new day
                setDateRange({ from: day, to: undefined });
            } else if (day.getTime() === dateRange.from.getTime()) {
                // Reset if same day clicked
                setDateRange({ from: undefined, to: undefined });
            } else {
                // Set 'to'
                setDateRange({ from: dateRange.from, to: day });

                setTimeout(() => {
                    const filters = {
                        location,
                        dateRange: { from: dateRange.from, to: day },
                        guests
                    };
                    if (onSearch) onSearch(filters);
                    setActiveTab(null);
                }, 200);
            }
        }
    };

    const totalGuests = guests.adults + guests.children;

    return (
        <div
            ref={searchRef}
            className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${activeTab ? 'z-[1001]' : 'z-[50]'} ${isSticky
                ? 'w-full max-w-2xl mx-auto relative'
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
                                if (onSearch) onSearch({ location, dateRange: { from: undefined, to: undefined }, guests });
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
                    ? 'rounded-full border border-gray-200 shadow-sm hover:shadow-md flex items-center h-[40px] pl-3 pr-1 mx-auto max-w-[500px]'
                    : `rounded-2xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-gray-100/50 flex flex-col md:flex-row items-stretch md:items-center p-2 md:h-[72px] ring-1 ring-black/5 gap-2 md:gap-0 ${compact ? 'md:gap-0' : ''}`}`
            }>

                {/* 1. WHERE */}
                <div
                    onClick={() => setActiveTab('location')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-4 md:py-0
                        ${isSticky
                            ? 'flex-1 hover:bg-gray-100/50 rounded-full'
                            : `w-full md:flex-[1.2] hover:bg-gray-100/50 md:hover:bg-gray-100/50 rounded-xl md:rounded-full ${compact ? 'h-[44px] md:h-full' : 'h-[60px] md:h-full'} flex flex-col justify-center items-start text-left px-4 md:pl-8 border md:border-none border-gray-100 bg-white/50 md:bg-transparent`}
                        ${activeTab === 'location' && !isSticky ? 'bg-white shadow-lg scale-100 z-20 ring-1 ring-black/5' : ''}`
                    }
                >
                    <label className={`text-[9px] md:text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0 ${isSticky || (compact && window.innerWidth < 768) ? 'hidden' : ''}`}>Where</label>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Anywhere"
                        value={location}
                        onChange={handleLocationChange}
                        onFocus={() => setActiveTab('location')}
                        onClick={(e) => { e.stopPropagation(); setActiveTab('location'); }}
                        className={`w-full bg-transparent border-none outline-none text-black placeholder-gray-500 font-bold ${isSticky ? 'text-sm' : 'text-sm md:text-base'} placeholder:opacity-50`}
                        style={{ colorScheme: 'light' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    />

                    {/* EXPANDED DROPDOWNS: LOCATION */}
                    <AnimatePresence>
                        {activeTab === 'location' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full left-0 mt-3 w-full md:w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1002]"
                            >
                                <div className="p-2 md:p-0 max-h-[300px] overflow-y-auto">
                                    <h3 className="hidden md:block px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {suggestions.length > 0 ? 'Destinations' : 'Popular'}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-1 p-2">
                                        {suggestions.length > 0 ? (
                                            suggestions.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => {
                                                        setLocation(s.label);
                                                        if (onSearch) onSearch({ ...getFilters(s.label), }, false);
                                                        setActiveTab('dates');
                                                    }}
                                                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition group"
                                                >
                                                    <div className="bg-gray-100 group-hover:bg-white border border-transparent group-hover:border-gray-200 p-1.5 rounded-md transition text-gray-500 text-xs"><FaMapMarkerAlt /></div>
                                                    <div>
                                                        <div className="text-gray-900 font-bold text-sm">{s.label}</div>
                                                        <div className="text-[10px] text-gray-400">{s.subLabel}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-gray-400 text-[10px] bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                Start typing...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* DIVIDER */}
                {!isSticky && <div className="hidden md:block w-px h-10 bg-gray-200/60 mx-1"></div>}

                {/* 2. WHEN */}
                <div
                    onClick={() => setActiveTab('dates')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-4 md:py-0
                        ${isSticky
                            ? 'flex-none w-[120px] border-l border-gray-200 hover:bg-gray-100/50 flex items-center justify-center text-center'
                            : `w-full md:flex-1 hover:bg-gray-100/50 md:hover:bg-gray-100/50 rounded-xl md:rounded-full ${compact ? 'h-[44px] md:h-full' : 'h-[60px] md:h-full'} flex flex-col justify-center items-start text-left px-4 md:pl-8 border md:border-none border-gray-100 bg-white/50 md:bg-transparent`}
                        ${activeTab === 'dates' && !isSticky ? 'bg-white shadow-lg scale-100 z-20 ring-1 ring-black/5' : ''}`
                    }
                >
                    <label className={`text-[9px] md:text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0 ${isSticky || (compact && window.innerWidth < 768) ? 'hidden' : ''}`}>Check in - out</label>
                    <div className={`font-semibold ${isSticky ? 'truncate text-sm' : 'whitespace-normal md:truncate text-sm md:text-base'} ${dateRange.from ? 'text-gray-900' : 'text-gray-500'}`}>
                        {dateRange.from ? (
                            <>{format(dateRange.from, 'MMM d')}{dateRange.to ? ` - ${format(dateRange.to, 'MMM d')}` : ''}</>
                        ) : 'Any Week'}
                    </div>

                    {/* EXPANDED DROPDOWNS: DATES */}
                    <AnimatePresence>
                        {activeTab === 'dates' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full left-0 md:left-1/2 md:-translate-x-1/2 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1002] p-4 min-w-[300px] md:min-w-fit"
                            >
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onDayClick={(day) => handleDateSelect(day)}
                                    disabled={dateRange.from && !dateRange.to ? [{ before: dateRange.from }] : [{ before: new Date() }]}
                                    numberOfMonths={window.innerWidth < 768 ? 1 : 2}
                                    pagedNavigation={window.innerWidth >= 768}
                                    classNames={{
                                        day_button: "h-12 w-12 md:h-10 md:w-10 !p-0.5 font-normal aria-selected:opacity-100 bg-transparent hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:line-through",
                                        selected: "!bg-black !text-white hover:!bg-black hover:!text-white",
                                        day_selected: "!bg-black !text-white",
                                        head_cell: "text-gray-400 font-bold uppercase text-xs py-2",
                                        caption_label: "text-lg md:text-base font-bold text-gray-900 pb-2"
                                    }}
                                    components={{
                                        DayButton: (props) => {
                                            const { day, children, className, ...buttonProps } = props;
                                            const date = day?.date;
                                            if (!date) return <button className={className} {...buttonProps}>{children}</button>;

                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            return (
                                                <button className={`${className} flex flex-col items-center justify-center h-full w-full`} {...buttonProps}>
                                                    <span className={`text-sm md:text-xs font-medium ${isWeekend ? 'text-red-500 font-bold' : 'text-gray-900'}`}>
                                                        {children}
                                                    </span>
                                                </button>
                                            );
                                        }
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* DIVIDER */}
                {!isSticky && <div className="hidden md:block w-px h-10 bg-gray-200/60 mx-1"></div>}

                {/* 3. WHO */}
                <div
                    onClick={() => setActiveTab('guests')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-4 md:py-0
                        ${isSticky
                            ? 'flex-none w-[100px] border-l border-gray-200 hover:bg-gray-100/50 flex items-center justify-center'
                            : `w-full md:flex-1 hover:bg-gray-100/50 md:hover:bg-gray-100/50 rounded-xl md:rounded-full ${compact ? 'h-[44px] md:h-full' : 'h-[60px] md:h-full'} flex flex-row items-center justify-between px-4 md:pl-8 pr-2 border md:border-none border-gray-100 bg-white/50 md:bg-transparent`}
                        ${activeTab === 'guests' && !isSticky ? 'bg-white shadow-lg scale-100 z-20 ring-1 ring-black/5' : ''}`
                    }
                >
                    <div className={`${isSticky ? 'text-center' : ''}`}>
                        <label className={`text-[9px] md:text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0 ${isSticky || (compact && window.innerWidth < 768) ? 'hidden' : ''}`}>Who</label>
                        <div className={`font-semibold truncate ${totalGuests > 0 ? 'text-gray-900' : 'text-gray-500'} ${isSticky ? 'text-sm' : 'text-sm md:text-base'}`}>
                            {totalGuests > 0 ? `${totalGuests} Guests` : 'Add guests'}
                        </div>
                    </div>

                    {/* EXPANDED DROPDOWNS: GUESTS */}
                    <AnimatePresence>
                        {activeTab === 'guests' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-full right-0 mt-3 w-full md:w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[1002] p-4"
                            >
                                <div className="space-y-2">
                                    {['adults', 'children', 'rooms'].map((type) => (
                                        <div key={type} className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div>
                                                <div className="capitalize font-bold text-gray-800 text-sm">{type}</div>
                                                <div className="text-[10px] text-gray-400">{type === 'adults' ? 'Age 13+' : type === 'children' ? 'Age 2-12' : 'Count'}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateGuest(type, -1)}
                                                    disabled={guests[type] <= 0}
                                                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-gray-50 transition disabled:opacity-30"
                                                >
                                                    <FaMinus size={8} />
                                                </button>
                                                <span className="w-4 text-center font-bold text-sm">{guests[type]}</span>
                                                <button
                                                    onClick={() => updateGuest(type, 1)}
                                                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-gray-50 transition"
                                                >
                                                    <FaPlus size={8} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Mobile-only done/close button could go here, but clicking outside works on desktop */}
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                <div className={`md:hidden ${compact ? 'mt-2' : 'mt-4'} px-2`}>
                    <button
                        onClick={handleSearchClick}
                        className={`w-full bg-gradient-to-r from-[#FF385C] to-[#E00B41] text-white rounded-xl ${compact ? 'py-2.5 shadow-md text-base' : 'py-3.5 shadow-lg text-lg'} shadow-rose-500/20 font-bold flex items-center justify-center gap-2 active:scale-95 transition`}
                    >
                        <FaSearch size={compact ? 14 : 16} /> Search
                    </button>
                </div>
            )}





        </div>
    );
}
