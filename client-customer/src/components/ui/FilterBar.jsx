import React, { useState } from 'react';
import { FaSortAmountDown, FaFilter, FaCheck, FaTimes, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilterBar({ onFilterChange }) {
    const [openSection, setOpenSection] = useState(null); // 'price' | 'amenities' | null
    const [filters, setFilters] = useState({
        sortBy: 'all',
        minPrice: '',
        maxPrice: '',
        amenities: []
    });

    const amenitiesList = [
        { id: 'pool', label: 'Pool' },
        { id: 'wifi', label: 'Wi-Fi' },
        { id: 'ac', label: 'AC' },
        { id: 'parking', label: 'Parking' },
        { id: 'kitchen', label: 'Kitchen' }
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 px-4 flex flex-wrap items-center gap-4 mb-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-2 text-gray-400 border-r border-gray-100 pr-4 py-2">
                <FaFilter className="text-secondary text-xs" />
                <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
            </div>

            {/* SORT */}
            <div className="relative group">
                <select
                    value={filters.sortBy}
                    onChange={handleSortChange}
                    className="appearance-none bg-gray-50/50 hover:bg-gray-100 border border-gray-100 text-gray-900 text-sm rounded-xl pl-4 pr-10 py-2.5 outline-none transition-all cursor-pointer font-medium"
                >
                    <option value="all">Recommended</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating_high">Top Rated</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none group-hover:text-black transition-colors" />
            </div>

            {/* PRICE DROPDOWN */}
            <div className="relative">
                <button
                    onClick={() => toggleSection('price')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${openSection === 'price' ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50/50 hover:bg-gray-100 text-gray-700 border-gray-100'}`}
                >
                    Price Range <FaChevronDown className={`text-[10px] transform transition-transform ${openSection === 'price' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {openSection === 'price' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] w-[280px]"
                        >
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Price per night</h4>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                    <input
                                        type="number"
                                        name="minPrice"
                                        value={filters.minPrice}
                                        onChange={handlePriceChange}
                                        placeholder="Min"
                                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <span className="text-gray-300 font-bold">−</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        value={filters.maxPrice}
                                        onChange={handlePriceChange}
                                        placeholder="Max"
                                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:border-black transition-all"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button onClick={() => setOpenSection(null)} className="text-xs font-bold text-black hover:underline uppercase tracking-wider">Apply</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AMENITIES DROPDOWN */}
            <div className="relative">
                <button
                    onClick={() => toggleSection('amenities')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${openSection === 'amenities' ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50/50 hover:bg-gray-100 text-gray-700 border-gray-100'}`}
                >
                    Amenities {filters.amenities.length > 0 && `(${filters.amenities.length})`} <FaChevronDown className={`text-[10px] transform transition-transform ${openSection === 'amenities' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {openSection === 'amenities' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] w-[320px]"
                        >
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Popular Features</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {amenitiesList.map(item => {
                                    const isActive = filters.amenities.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleAmenity(item.id)}
                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between group ${isActive
                                                ? 'bg-black text-white border-black'
                                                : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                                                }`}
                                        >
                                            {item.label}
                                            {isActive ? <FaCheck className="text-[9px]" /> : <div className="w-2 h-2 rounded-full border border-gray-300 group-hover:border-gray-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <button
                                    onClick={() => updateFilters({ ...filters, amenities: [] })}
                                    className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider"
                                >
                                    Clear all
                                </button>
                                <button onClick={() => setOpenSection(null)} className="text-xs font-bold text-black hover:underline uppercase tracking-wider">Show Results</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* RESET ALL */}
            {(filters.minPrice || filters.maxPrice || filters.amenities.length > 0) && (
                <button
                    onClick={() => updateFilters({ sortBy: 'all', minPrice: '', maxPrice: '', amenities: [] })}
                    className="ml-auto text-xs flex items-center gap-1.5 text-red-500 hover:text-red-600 font-bold uppercase tracking-wider transition-colors"
                >
                    <FaTimes className="text-[10px]" /> Reset
                </button>
            )}
        </div>
    );
}

