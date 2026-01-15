import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Icons
import {
    FaSearch,
    FaSlidersH,
    FaMapMarkerAlt,
    FaChevronDown,
    FaTimes,
    FaCheck,
    FaHotel,
    FaSwimmingPool,
    FaLeaf,
    FaCar,
    FaLocationArrow
} from 'react-icons/fa';

/**
 * Enhanced Filter Bar 
 * - FLEX WRAP enabled
 * - Guests, Veg Only, Distance, Price, Amenities
 * - Keeps dropdown OPEN when selecting distance location
 * - RESET BUTTON moved to new row below filters
 */
export default function FilterBar({ filters, onFilterChange, compact = false, availableLocations = [] }) {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    // Helpers
    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const setFilter = (key, value) => {
        onFilterChange(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const toggleAmenity = (amenity) => {
        onFilterChange(prev => {
            const current = prev.amenities || [];
            if (current.includes(amenity)) {
                return { ...prev, amenities: current.filter(a => a !== amenity), page: 1 };
            } else {
                return { ...prev, amenities: [...current, amenity], page: 1 };
            }
        });
    };

    // --- Distance Logic ---
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleLocationSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 2) {
            setIsSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=in&limit=5`);
                const data = await res.json();
                setSearchResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const selectLocation = (result) => {
        onFilterChange(prev => ({
            ...prev,
            distance: {
                ...prev.distance,
                center: { lat: parseFloat(result.lat), lon: parseFloat(result.lon), name: result.display_name.split(',')[0] } // Compact name
            },
            location: '',
            page: 1
        }));
        setSearchQuery("");
        setSearchResults([]);
        // KEEP DROPDOWN OPEN so user can adjust slider
        // setActiveDropdown(null); 
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                onFilterChange(prev => ({
                    ...prev,
                    distance: {
                        ...prev.distance,
                        center: {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude,
                            name: "My Location"
                        }
                    },
                    location: '',
                    page: 1
                }));
                // KEEP OPEN
            },
            (error) => {
                alert('Unable to retrieve your location');
                console.error(error);
            }
        );
    };

    const AMENITIES_LIST = ["Pool", "AC", "WiFi", "TV", "Parking", "Kitchen", "Caretaker", "Generator"];
    const GUEST_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 15, 20];

    const hasActiveFilters = filters.location || filters.type !== 'all' || filters.minPrice || filters.maxPrice || filters.guests > 1 || filters.veg_only || filters.amenities?.length > 0 || filters.distance?.center;

    // Local state for smooth slider dragging
    const [localPrice, setLocalPrice] = useState({ min: 0, max: 50000 });

    useEffect(() => {
        if (activeDropdown === 'price') {
            setLocalPrice({
                min: filters.minPrice || 0,
                max: filters.maxPrice || 50000
            });
        }
    }, [activeDropdown, filters.minPrice, filters.maxPrice]);

    const handlePriceChange = (type, value) => {
        setLocalPrice(prev => {
            if (type === 'min') return { ...prev, min: Math.min(value, prev.max - 1000) };
            if (type === 'max') return { ...prev, max: Math.max(value, prev.min + 1000) };
            return prev;
        });
    };

    const commitPrice = () => {
        if (localPrice.min !== (filters.minPrice || 0)) setFilter('minPrice', localPrice.min);
        if (localPrice.max !== (filters.maxPrice || 50000)) setFilter('maxPrice', localPrice.max);
    };

    return (
        <div className="w-full relative" ref={dropdownRef}>
            {/* Sticky/Fixed Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 pb-2 md:pb-0">

                {/* 1. Sort */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('sort')}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold shadow-sm hover:border-gray-300 transition-all ${filters.sort && filters.sort !== 'newest' ? 'border-[#EAB308] text-[#EAB308] ring-1 ring-[#EAB308]/20' : 'border-gray-200 text-gray-700'
                            }`}
                    >
                        <FaSlidersH />
                        <span className="hidden sm:inline">Sort</span>
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'sort' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                            >
                                {['newest', 'price_low', 'price_high'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => { setFilter('sort', opt); setActiveDropdown(null); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filters.sort === opt ? 'bg-[#EAB308]/10 text-[#EAB308]' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {opt === 'newest' && 'Newest First'}
                                        {opt === 'price_low' && 'Price: Low to High'}
                                        {opt === 'price_high' && 'Price: High to Low'}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 1.5 TYPE */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('type')}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold shadow-sm hover:border-gray-300 transition-all ${filters.type !== 'all' ? 'border-[#EAB308] text-[#EAB308] ring-1 ring-[#EAB308]/20' : 'border-gray-200 text-gray-700'
                            }`}
                    >
                        {filters.type === 'villas' && <FaHotel />}
                        {filters.type === 'waterpark' && <FaSwimmingPool />}
                        <span className="capitalize">{filters.type === 'all' ? 'Type' : filters.type}</span>
                        <FaChevronDown className={`text-xs transition-transform ${activeDropdown === 'type' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'type' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                            >
                                {['all', 'villas', 'waterpark'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setFilter('type', t); setActiveDropdown(null); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize ${filters.type === t ? 'bg-[#EAB308]/10 text-[#EAB308]' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {t === 'all' ? 'All Types' : t}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-6 w-[1px] bg-gray-200 hidden sm:block"></div>

                {/* 2. PRICE (Range Slider) */}
                <div className="relative hidden sm:block">
                    <button
                        onClick={() => toggleDropdown('price')}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold shadow-sm hover:border-gray-300 transition-all ${filters.minPrice || filters.maxPrice ? 'border-[#EAB308] text-[#EAB308] ring-1 ring-[#EAB308]/20' : 'border-gray-200 text-gray-700'
                            }`}
                    >
                        <span>Price</span>
                        <FaChevronDown className={`text-xs transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'price' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50"
                            >
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Price Range</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between text-sm font-bold text-gray-700">
                                        <span>₹{localPrice.min.toLocaleString()}</span>
                                        <span>₹{localPrice.max.toLocaleString()}</span>
                                    </div>
                                    <div className="relative h-2 bg-gray-200 rounded-full my-4">
                                        <div
                                            className="absolute h-full bg-[#EAB308] rounded-full pointer-events-none"
                                            style={{
                                                left: `${(localPrice.min / 50000) * 100}%`,
                                                right: `${100 - (localPrice.max / 50000) * 100}%`
                                            }}
                                        />
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                            input[type=range]::-webkit-slider-thumb { pointer-events: auto; width: 20px; height: 20px; -webkit-appearance: none; background: white; border: 2px solid #EAB308; border-radius: 50%; cursor: pointer; }
                                            input[type=range]::-moz-range-thumb { pointer-events: auto; width: 20px; height: 20px; background: white; border: 2px solid #EAB308; border-radius: 50%; cursor: pointer; }
                                        `}} />

                                        <input
                                            type="range"
                                            min="0" max="50000" step="500"
                                            value={localPrice.min}
                                            onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                                            onMouseUp={commitPrice}
                                            onTouchEnd={commitPrice}
                                            className="absolute w-full h-2 opacity-0 z-20 appearance-none pointer-events-none"
                                        />
                                        <input
                                            type="range"
                                            min="0" max="50000" step="500"
                                            value={localPrice.max}
                                            onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                                            onMouseUp={commitPrice}
                                            onTouchEnd={commitPrice}
                                            className="absolute w-full h-2 opacity-0 z-20 appearance-none pointer-events-none"
                                        />

                                        {/* Visual Thumbs */}
                                        <div
                                            className="absolute w-5 h-5 bg-white border-2 border-[#EAB308] rounded-full shadow top-1/2 -translate-y-1/2 pointer-events-none transition-all z-10"
                                            style={{ left: `calc(${(localPrice.min / 50000) * 100}% - 10px)` }}
                                        />
                                        <div
                                            className="absolute w-5 h-5 bg-white border-2 border-[#EAB308] rounded-full shadow top-1/2 -translate-y-1/2 pointer-events-none transition-all z-10"
                                            style={{ left: `calc(${(localPrice.max / 50000) * 100}% - 10px)` }}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                            <span className="text-[10px] text-gray-400 block">Min</span>
                                            <input
                                                type="number"
                                                value={filters.minPrice || 0}
                                                onChange={(e) => setFilter('minPrice', Number(e.target.value))}
                                                className="w-full bg-transparent text-sm font-bold outline-none"
                                            />
                                        </div>
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                            <span className="text-[10px] text-gray-400 block">Max</span>
                                            <input
                                                type="number"
                                                value={filters.maxPrice || 50000}
                                                onChange={(e) => setFilter('maxPrice', Number(e.target.value))}
                                                className="w-full bg-transparent text-sm font-bold outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. GUESTS */}
                <div className="relative">
                    <button
                        onClick={() => toggleDropdown('guests')}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold shadow-sm hover:border-gray-300 transition-all ${filters.guests > 1 ? 'border-[#EAB308] text-[#EAB308] ring-1 ring-[#EAB308]/20' : 'border-gray-200 text-gray-700'
                            }`}
                    >
                        <span>{filters.guests > 1 ? `${filters.guests}+ Guests` : 'Guests'}</span>
                        <FaChevronDown className={`text-xs transition-transform ${activeDropdown === 'guests' ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {activeDropdown === 'guests' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50"
                            >
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Minimum Guests</h4>
                                <div className="grid grid-cols-4 gap-2">
                                    {GUEST_OPTIONS.map(num => (
                                        <button
                                            key={num}
                                            onClick={() => { setFilter('guests', num); setActiveDropdown(null); }}
                                            className={`py-2 rounded-xl text-sm font-bold transition-all ${filters.guests === num
                                                ? 'bg-[#EAB308] text-white shadow-md'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {num}+
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 4. VEG ONLY (COMPACT) */}
                <button
                    onClick={() => setFilter('veg_only', !filters.veg_only)}
                    title="Veg Only"
                    className={`flex items-center gap-1.5 px-3 py-2 border rounded-full text-xs font-bold shadow-sm transition-all shrink-0 ${filters.veg_only
                        ? 'bg-green-600 border-green-600 text-white ring-1 ring-green-600/20'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600'
                        }`}
                >
                    <FaLeaf className={filters.veg_only ? 'text-white' : 'text-green-500'} />
                    <span className="hidden sm:inline">Veg</span>
                </button>

                {/* 5. DISTANCE FILTER - Enhanced */}
                <div className="relative hidden lg:block">
                    <button
                        onClick={() => toggleDropdown('distance')}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold shadow-sm hover:border-gray-300 transition-all ${filters.distance?.center ? 'border-[#EAB308] text-[#EAB308] ring-1 ring-[#EAB308]/20' : 'border-gray-200 text-gray-700'
                            }`}
                    >
                        <FaCar />
                        <span className="truncate max-w-[100px]">{filters.distance?.center ? `${filters.distance.center.name?.substring(0, 12)}...` : 'Distance'}</span>
                        <FaChevronDown className={`text-xs transition-transform ${activeDropdown === 'distance' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'distance' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50"
                            >
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Distance From</h4>

                                <div className="relative mb-3">
                                    <FaSearch className="absolute left-3 top-3 text-gray-400 text-xs" />
                                    <input
                                        type="text"
                                        placeholder="Type a location..."
                                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#EAB308]"
                                        value={searchQuery}
                                        onChange={handleLocationSearch}
                                    />
                                    {isSearching && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-gray-300 border-t-[#EAB308] rounded-full animate-spin"></div>}
                                </div>

                                <button
                                    onClick={handleUseCurrentLocation}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <FaLocationArrow /> Use Current Location
                                </button>

                                {searchResults.length > 0 && (
                                    <div className="mb-4 max-h-40 overflow-y-auto border rounded-xl border-gray-100">
                                        {searchResults.map((res, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => selectLocation(res)}
                                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs border-b last:border-0 truncate"
                                            >
                                                {res.display_name}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Distance Slider - Always visible but disabled if no center */}
                                <div className={`pt-2 border-t border-gray-100 transition-opacity ${filters.distance?.center ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold">From: <span className="text-gray-900">{filters.distance?.center ? filters.distance.center.name?.substring(0, 25) : 'Select Location'}</span></span>
                                            <span className="text-xs font-bold text-[#EAB308]">Within {filters.distance.maxKm} km</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range" min="5" max="500" step="5"
                                        value={filters.distance.maxKm}
                                        onChange={(e) => onFilterChange(prev => ({
                                            ...prev,
                                            distance: { ...prev.distance, maxKm: parseInt(e.target.value) }
                                        }))}
                                        disabled={!filters.distance?.center}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#EAB308]"
                                    />
                                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                                        <span>5km</span>
                                        <span>500km</span>
                                    </div>
                                    {!filters.distance?.center && <p className="text-[10px] text-red-400 mt-1">* Search or select location to enable</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 6. AMENITIES */}
                <div className="relative hidden xl:block">
                    <button
                        onClick={() => toggleDropdown('amenities')}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-white border rounded-full text-xs font-bold shadow-sm hover:border-gray-300 transition-all ${filters.amenities?.length > 0 ? 'border-[#EAB308] text-[#EAB308] ring-1 ring-[#EAB308]/20' : 'border-gray-200 text-gray-700'
                            }`}
                    >
                        <span>Amenities</span>
                        {filters.amenities?.length > 0 && (
                            <span className="flex items-center justify-center w-5 h-5 bg-[#EAB308] text-white text-[10px] rounded-full">
                                {filters.amenities.length}
                            </span>
                        )}
                        <FaChevronDown className={`text-xs transition-transform ${activeDropdown === 'amenities' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {activeDropdown === 'amenities' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50"
                            >
                                <div className="space-y-2">
                                    {AMENITIES_LIST.map(amenity => {
                                        const isSelected = filters.amenities?.includes(amenity);
                                        return (
                                            <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#EAB308] border-[#EAB308]' : 'bg-gray-50 border-gray-300 group-hover:border-gray-400'}`}>
                                                    {isSelected && <FaCheck className="text-white text-[10px]" />}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{amenity}</span>
                                                <input
                                                    type="checkbox" className="hidden"
                                                    checked={isSelected}
                                                    onChange={() => toggleAmenity(amenity)}
                                                />
                                            </label>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* RESET BUTTON - Moved to Bottom Row */}
            {hasActiveFilters && (
                <div className="mt-3 flex justify-start w-full">
                    <button
                        onClick={() => onFilterChange({ location: '', type: 'all', minPrice: '', maxPrice: '', guests: 1, veg_only: false, amenities: [], sort: 'newest', distance: { center: null, maxKm: 50 }, page: 1 })}
                        className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-full transition-colors uppercase tracking-widest border border-red-100 hover:border-red-200"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
}
