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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <FaFilter className="text-primary text-sm" /> Filters
                </h3>
                {(filters.minPrice || filters.maxPrice || filters.amenities.length > 0) && (
                    <button
                        onClick={() => updateFilters({ ...filters, minPrice: '', maxPrice: '', amenities: [] })}
                        className="text-xs text-red-500 hover:underline font-medium"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* SORT */}
            <div className="relative">
                <select
                    value={filters.sortBy}
                    onChange={handleSortChange}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-black cursor-pointer"
                >
                    <option value="all">Recommended</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating_high">Top Rated</option>
                </select>
                <FaChevronDown className="absolute right-3 top-3.5 text-gray-400 text-xs pointer-events-none" />
            </div>

            {/* PRICE RANGE TOGGLE */}
            <div className="border-t border-gray-100 pt-3">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex justify-between items-center w-full text-sm font-medium text-gray-700 mb-2"
                >
                    Price Range <FaChevronDown className={`transform transition-transform ${openSection === 'price' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {openSection === 'price' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-2 pb-2">
                                <div className="relative w-1/2">
                                    <span className="absolute left-2 top-2 text-gray-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        name="minPrice"
                                        value={filters.minPrice}
                                        onChange={handlePriceChange}
                                        placeholder="Min"
                                        className="w-full pl-5 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-black"
                                    />
                                </div>
                                <span className="text-gray-300">-</span>
                                <div className="relative w-1/2">
                                    <span className="absolute left-2 top-2 text-gray-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        value={filters.maxPrice}
                                        onChange={handlePriceChange}
                                        placeholder="Max"
                                        className="w-full pl-5 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:border-black"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AMENITIES TOGGLE */}
            <div className="border-t border-gray-100 pt-3">
                <button
                    onClick={() => toggleSection('amenities')}
                    className="flex justify-between items-center w-full text-sm font-medium text-gray-700 mb-2"
                >
                    Amenities <FaChevronDown className={`transform transition-transform ${openSection === 'amenities' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {openSection === 'amenities' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 pb-2">
                                {amenitiesList.map(item => {
                                    const isActive = filters.amenities.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleAmenity(item.id)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border flex items-center gap-1.5 ${isActive
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                }`}
                                        >
                                            {item.label}
                                            {isActive && <FaCheck className="text-[9px]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
