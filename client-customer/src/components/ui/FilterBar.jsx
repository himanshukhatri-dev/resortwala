import React, { useState, useEffect, useRef } from 'react';
import { FaFilter, FaCheck, FaTimes, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilterBar(props) {
    const { onFilterChange, compact } = props;
    const [openSection, setOpenSection] = useState(null); // 'price' | 'amenities' | null
    const [filters, setFilters] = useState({
        sortBy: 'all',
        minPrice: '',
        maxPrice: '',
        amenities: []
    });

    const amenitiesList = [
        { id: 'pool', label: 'Swimming Pool' },
        { id: 'wifi', label: 'Free Wi-Fi' },
        { id: 'ac', label: 'Air Conditioning' },
        { id: 'parking', label: 'Secure Parking' },
        { id: 'kitchen', label: 'Full Kitchen' },
        { id: 'jacuzzi', label: 'Jacuzzi' },
        { id: 'caretaker', label: 'Caretaker' }
    ];

    const updateFilters = (newFilters) => {
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleSortChange = (e) => updateFilters({ ...filters, sortBy: e.target.value });
    const handlePriceChange = (e) => updateFilters({ ...filters, [e.target.name]: e.target.value });
    const toggleAmenity = (id) => {
        const updated = filters.amenities.includes(id)
            ? filters.amenities.filter(item => item !== id)
            : [...filters.amenities, id];
        updateFilters({ ...filters, amenities: updated });
    };

    const toggleSection = (sec) => setOpenSection(openSection === sec ? null : sec);


    // --- DUAL SLIDER LOGIC ---
    // Constants for slider range
    const MIN_RANGE = 0;
    const MAX_RANGE = 50000; // Adjust based on your max property price

    // Derived state for slider display (defaults to full range if empty)
    const currentMin = filters.minPrice === '' ? MIN_RANGE : Number(filters.minPrice);
    const currentMax = filters.maxPrice === '' ? MAX_RANGE : Number(filters.maxPrice);

    const handleSliderChange = (e, type) => {
        const val = Number(e.target.value);
        if (type === 'min') {
            // Prevent crossover
            if (val > currentMax) return;
            updateFilters({ ...filters, minPrice: val });
        } else {
            if (val < currentMin) return;
            updateFilters({ ...filters, maxPrice: val });
        }
    };
    // -------------------------

    // Compact Mode (Sidebar)
    if (compact) {
        // Main collapse state for the entire sidebar block
        const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed to show map

        return (
            <div className="w-full relative z-20 flex flex-col gap-2">
                {/* 0. MAIN TOGGLE BUTTON */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl shadow-sm border transition-all ${isSidebarOpen ? 'bg-[#EAB308] text-white border-[#EAB308]' : 'bg-white text-gray-900 border-gray-100 hover:shadow-md'}`}
                >
                    <div className="flex items-center gap-2">
                        <FaFilter className={isSidebarOpen ? "text-white" : "text-[#EAB308]"} />
                        <span className="text-xs font-black uppercase tracking-widest">Filters & Sort</span>
                    </div>
                    <FaChevronDown className={`text-xs transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden flex flex-col gap-4"
                        >
                            {/* 1. SORT CONTROL */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Sort By</label>
                                <div className="relative group">
                                    <select
                                        value={filters.sortBy}
                                        onChange={handleSortChange}
                                        className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-transparent focus:border-[#EAB308] text-gray-900 text-xs font-bold rounded-lg px-3 py-2.5 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="all">Featured & Recommended</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                        <option value="rating_high">Highest Rated</option>
                                    </select>
                                    <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                                </div>
                            </div>

                            {/* 2. PRICE CONTROL with SLIDER */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Price Range</label>
                                    <div className="text-[10px] font-bold text-gray-900">
                                        ₹{currentMin.toLocaleString()} - ₹{currentMax.toLocaleString()}
                                    </div>
                                </div>

                                {/* Dual Slider Visualization */}
                                <div className="relative h-6 mb-4 select-none">
                                    {/* Track Background */}
                                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2"></div>

                                    {/* Active Range Track */}
                                    <div
                                        className="absolute top-1/2 h-1 bg-[#EAB308] rounded-full -translate-y-1/2"
                                        style={{
                                            left: `${(currentMin / MAX_RANGE) * 100}%`,
                                            right: `${100 - (currentMax / MAX_RANGE) * 100}%`
                                        }}
                                    ></div>

                                    {/* Visible Range Inputs with styled thumbs */}
                                    <input
                                        type="range"
                                        min={MIN_RANGE}
                                        max={MAX_RANGE}
                                        value={currentMin}
                                        onChange={(e) => handleSliderChange(e, 'min')}
                                        className="absolute top-1/2 -translate-y-1/2 w-full h-6 appearance-none bg-transparent cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#EAB308] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                                    />
                                    <input
                                        type="range"
                                        min={MIN_RANGE}
                                        max={MAX_RANGE}
                                        value={currentMax}
                                        onChange={(e) => handleSliderChange(e, 'max')}
                                        className="absolute top-1/2 -translate-y-1/2 w-full h-6 appearance-none bg-transparent cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#EAB308] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                                    />
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                                        <input
                                            type="number"
                                            name="minPrice"
                                            value={filters.minPrice}
                                            onChange={handlePriceChange}
                                            placeholder="Min"
                                            className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[#EAB308] rounded-lg text-xs font-bold outline-none transition-all placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <span className="text-gray-300 font-bold text-xs">-</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            value={filters.maxPrice}
                                            onChange={handlePriceChange}
                                            placeholder="Max"
                                            className="w-full pl-6 pr-2 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-[#EAB308] rounded-lg text-xs font-bold outline-none transition-all placeholder:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* 3. AMENITIES - EXPANDABLE */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                                <button
                                    onClick={() => toggleSection('amenities')}
                                    className="w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all text-gray-700"
                                >
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amenities</span>
                                        {filters.amenities.length > 0 && <span className="text-[#EAB308]">{filters.amenities.length} Selected</span>}
                                    </div>
                                    <FaChevronDown className={`text-[10px] text-gray-400 transition-transform duration-300 ${openSection === 'amenities' ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {(openSection === 'amenities' || filters.amenities.length > 0) && (
                                        <motion.div
                                            initial={filters.amenities.length > 0 ? false : { height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden px-3 pb-3"
                                        >
                                            <div className="grid grid-cols-1 gap-1.5 mt-2">
                                                {amenitiesList.map(item => {
                                                    const isActive = filters.amenities.includes(item.id);
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => toggleAmenity(item.id)}
                                                            className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive
                                                                ? 'bg-[#EAB308] text-white shadow-md'
                                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            <span>{item.label}</span>
                                                            {isActive && <FaCheck className="text-[8px]" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* RESET BUTTON */}
                            {(filters.minPrice || filters.maxPrice || filters.amenities.length > 0) && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    onClick={() => updateFilters({ sortBy: 'all', minPrice: '', maxPrice: '', amenities: [] })}
                                    className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <FaTimes /> Reset All Filters
                                </motion.button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ACTIVE DROPDOWN STATE for Horizontal Bar
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to toggle active dropdown
    const toggleDropdown = (name) => setActiveDropdown(activeDropdown === name ? null : name);

    // RICH HORIZONTAL BAR (Sticky Header)
    return (
        <div ref={dropdownRef} className="w-full relative z-20 flex flex-nowrap items-center gap-3 overflow-visible">

            {/* 1. FILTER LABEL (Hidden on mobile, visible md+) */}
            <div className="hidden md:flex items-center gap-2 text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 flex-shrink-0">
                <FaFilter className="text-secondary text-xs" />
                <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
            </div>

            {/* 2. PRICE FILTER (Dropdown with Slider) */}
            <div className="relative">
                <button
                    onClick={() => toggleDropdown('price')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap ${activeDropdown === 'price' || filters.minPrice || filters.maxPrice
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                        }`}
                >
                    <span>Price Range</span>
                    {(filters.minPrice || filters.maxPrice) && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                    <FaChevronDown className={`text-[10px] transition-transform ${activeDropdown === 'price' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {activeDropdown === 'price' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-5 z-50"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Range</label>
                                <div className="text-xs font-black text-gray-900">₹{currentMin.toLocaleString()} - ₹{currentMax.toLocaleString()}</div>
                            </div>

                            {/* Dual Slider Visualization */}
                            <div className="relative h-6 mb-6 select-none">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2"></div>
                                <div className="absolute top-1/2 h-1 bg-[#EAB308] rounded-full -translate-y-1/2" style={{ left: `${(currentMin / MAX_RANGE) * 100}%`, right: `${100 - (currentMax / MAX_RANGE) * 100}%` }}></div>
                                <input type="range" min={MIN_RANGE} max={MAX_RANGE} value={currentMin} onChange={(e) => handleSliderChange(e, 'min')} className="absolute top-1/2 -translate-y-1/2 w-full h-6 appearance-none bg-transparent cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#EAB308] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform" />
                                <input type="range" min={MIN_RANGE} max={MAX_RANGE} value={currentMax} onChange={(e) => handleSliderChange(e, 'max')} className="absolute top-1/2 -translate-y-1/2 w-full h-6 appearance-none bg-transparent cursor-pointer pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#EAB308] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform" />
                            </div>

                            <div className="flex gap-2 mb-2">
                                <input type="number" name="minPrice" value={filters.minPrice} onChange={handlePriceChange} placeholder="Min" className="w-full bg-gray-50 rounded px-2 py-1 text-xs font-bold border-transparent focus:bg-white focus:border-yellow-400 border outline-none" />
                                <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handlePriceChange} placeholder="Max" className="w-full bg-gray-50 rounded px-2 py-1 text-xs font-bold border-transparent focus:bg-white focus:border-yellow-400 border outline-none" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. AMENITIES (Dropdown with Checkboxes) */}
            <div className="relative">
                <button
                    onClick={() => toggleDropdown('amenities')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap ${activeDropdown === 'amenities' || filters.amenities.length > 0
                        ? 'bg-black text-white border-black shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                        }`}
                >
                    <span>Amenities</span>
                    {filters.amenities.length > 0 && <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{filters.amenities.length}</span>}
                    <FaChevronDown className={`text-[10px] transition-transform ${activeDropdown === 'amenities' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {activeDropdown === 'amenities' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 overflow-hidden"
                        >
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
                                {amenitiesList.map(item => {
                                    const isActive = filters.amenities.includes(item.id);
                                    return (
                                        <button key={item.id} onClick={() => toggleAmenity(item.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-yellow-50 text-yellow-700 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}>
                                            <span>{item.label}</span>
                                            {isActive && <FaCheck className="text-yellow-600 text-[10px]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 4. SORT (Right Aligned) */}
            <div className="ml-auto relative group hidden sm:block">
                <select
                    value={filters.sortBy}
                    onChange={handleSortChange}
                    className="appearance-none bg-white border border-gray-200 hover:border-black text-gray-700 text-sm font-medium rounded-lg px-4 py-2 pr-8 outline-none transition-all cursor-pointer shadow-sm focus:ring-2 focus:ring-black/5"
                >
                    <option value="all">Sort: Recommended</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating_high">Highest Rated</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
            </div>

            {/* RESET - Only if filters active */}
            {(filters.minPrice || filters.maxPrice || filters.amenities.length > 0) && (
                <button
                    onClick={() => updateFilters({ sortBy: 'all', minPrice: '', maxPrice: '', amenities: [] })}
                    className="ml-2 text-red-500 text-xs font-bold uppercase tracking-wider hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all flex items-center gap-1 flex-shrink-0"
                >
                    <FaTimes /> Clear
                </button>
            )}
        </div>
    );
}
