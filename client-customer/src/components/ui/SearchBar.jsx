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

        if (val.length >= 1) {
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
                    ? 'rounded-full border border-gray-200 shadow-sm hover:shadow-md flex items-center h-[40px] pl-3 pr-1 mx-auto max-w-[500px]'
                    : 'rounded-2xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] border border-gray-100/50 flex flex-col md:flex-row items-stretch md:items-center p-2 md:h-[72px] ring-1 ring-black/5 gap-2 md:gap-0'}`
            }>

                {/* 1. WHERE */}
                <div
                    onClick={() => setActiveTab('location')}
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-4 md:py-0
                        ${isSticky
                            ? 'flex-1 hover:bg-gray-100/50 rounded-full'
                            : 'w-full md:flex-[1.2] hover:bg-gray-100/50 md:hover:bg-gray-100/50 rounded-xl md:rounded-full h-[60px] md:h-full flex flex-col justify-center items-start text-left px-4 md:pl-8 border md:border-none border-gray-100 bg-white/50 md:bg-transparent'}
                        ${activeTab === 'location' && !isSticky ? 'bg-white shadow-lg scale-100 z-20 ring-1 ring-black/5' : ''}`
                    }
                >
                    <label className={`text-[10px] font-bold tracking-wider text-gray-800 uppercase block mb-0.5 ${isSticky ? 'hidden' : ''}`}>Where</label>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Anywhere"
                        value={location}
                        onChange={handleLocationChange}
                        onFocus={() => setActiveTab('location')}
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
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-4 md:py-0
                        ${isSticky
                            ? 'flex-none w-[120px] border-l border-gray-200 hover:bg-gray-100/50 flex items-center justify-center text-center'
                            : 'w-full md:flex-1 hover:bg-gray-100/50 md:hover:bg-gray-100/50 rounded-xl md:rounded-full h-[60px] md:h-full flex flex-col justify-center items-start text-left px-4 md:pl-8 border md:border-none border-gray-100 bg-white/50 md:bg-transparent'}
                        ${activeTab === 'dates' && !isSticky ? 'bg-white shadow-lg scale-100 z-20 ring-1 ring-black/5' : ''}`
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
                    className={`relative cursor-pointer transition-all duration-300 px-6 py-4 md:py-0
                        ${isSticky
                            ? 'flex-none w-[100px] border-l border-gray-200 hover:bg-gray-100/50 flex items-center justify-center'
                            : 'w-full md:flex-1 hover:bg-gray-100/50 md:hover:bg-gray-100/50 rounded-xl md:rounded-full h-[60px] md:h-full flex flex-row items-center justify-between px-4 md:pl-8 pr-2 border md:border-none border-gray-100 bg-white/50 md:bg-transparent'}
                        ${activeTab === 'guests' && !isSticky ? 'bg-white shadow-lg scale-100 z-20 ring-1 ring-black/5' : ''}`
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
                        {/* Dropdown Card / Mobile Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                                z-[100] bg-white border-gray-100 overflow-hidden
                                fixed inset-0 top-0 left-0 right-0 bottom-0 h-full w-full flex flex-col  /* Mobile: Full Screen Fixed */
                                md:absolute md:inset-auto md:h-auto md:w-auto md:flex-col md:rounded-3xl md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] md:p-8 md:border /* Desktop: Dropdown */
                                ${isSticky
                                    ? 'md:top-full md:mt-2 md:w-full md:origin-top'
                                    : 'md:top-full md:mt-4 md:w-full md:origin-top'}`
                            }
                        >
                            {/* MOBILE HEADER (Visible only on small screens) */}
                            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {activeTab === 'location' ? 'Where to?' : activeTab === 'dates' ? 'Select Dates' : 'Who is coming?'}
                                </h3>
                                <button
                                    onClick={() => setActiveTab(null)}
                                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                                >
                                    <FaMinus className="transform rotate-45 text-gray-500" />
                                </button>
                            </div>

                            {/* CONTENT SCROLLABLE AREA */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-0">
                                {activeTab === 'location' && (
                                    <div>
                                        <h3 className="hidden md:block text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
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
                                                        className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-4 md:p-3 rounded-xl transition group border border-gray-100 md:border-transparent mb-2 md:mb-0"
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
                                                    Type to search...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'dates' && (
                                    <div className="flex justify-center h-full items-start md:items-center">
                                        <style>{`
                                            .rdp { --rdp-cell-size: 44px; --rdp-accent-color: #000; --rdp-background-color: #f3f4f6; margin: 0; width: 100%; }
                                            .rdp-months { justify-content: center; }
                                            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f3f4f6; }
                                            .rdp-day_selected { background-color: #000 !important; color: white !important; font-weight: bold; }
                                            .rdp-caption_label { font-size: 1.1rem; font-weight: 700; color: #1f2937; }
                                            @media (max-width: 768px) {
                                                .rdp-month { width: 100%; }
                                                .rdp-table { width: 100%; max-width: 100%; }
                                                .rdp-cell { height: 50px; width: 14%; } /* Bigger touch targets */
                                            }
                                        `}</style>
                                        <DayPicker
                                            mode="range"
                                            selected={dateRange}
                                            onDayClick={(day) => handleDateSelect(day)}
                                            disabled={{ before: new Date() }}
                                            numberOfMonths={window.innerWidth < 768 ? 12 : 2} // Vertical scroll on mobile
                                            pagedNavigation={window.innerWidth >= 768} // Paged on desktop only
                                        />
                                    </div>
                                )}

                                {activeTab === 'guests' && (
                                    <div className="space-y-6 pt-4 md:pt-0">
                                        {['adults', 'children', 'rooms'].map((type) => (
                                            <div key={type} className="flex justify-between items-center pb-6 md:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                <div>
                                                    <div className="capitalize font-bold text-gray-800 text-lg md:text-base">{type}</div>
                                                    <div className="text-sm md:text-xs text-gray-400">{type === 'adults' ? 'Ages 13 or above' : type === 'children' ? 'Ages 2-12' : 'Number of rooms'}</div>
                                                </div>
                                                <div className="flex items-center gap-6 md:gap-4">
                                                    <button
                                                        onClick={() => updateGuest(type, -1)}
                                                        disabled={guests[type] <= 0}
                                                        className="w-12 h-12 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-gray-50 transition disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                                                    >
                                                        <FaMinus size={12} />
                                                    </button>
                                                    <span className="w-6 text-center font-bold text-xl md:text-lg">{guests[type]}</span>
                                                    <button
                                                        onClick={() => updateGuest(type, 1)}
                                                        className="w-12 h-12 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-black hover:bg-gray-50 transition"
                                                    >
                                                        <FaPlus size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* MOBILE ACTION FOOTER */}
                            <div className="md:hidden p-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex justify-between items-center bg-white/95 backdrop-blur-sm">
                                <button
                                    onClick={() => {
                                        setSuggestions([]);
                                        setDateRange({ from: undefined, to: undefined });
                                        // Reset guests logic if needed
                                    }}
                                    className="text-sm font-semibold text-gray-500 underline"
                                >
                                    Clear all
                                </button>
                                <button
                                    onClick={handleSearchClick}
                                    className="bg-black text-white px-8 py-3 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform flex items-center gap-2"
                                >
                                    <FaSearch size={12} />
                                    Search
                                </button>
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div >
    );
}
