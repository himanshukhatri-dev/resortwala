import React, { useState } from 'react';
import { FaSortAmountDown, FaSortAmountUp, FaFilter, FaStar, FaMoneyBillWave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function FilterBar({ onFilterChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState({
        sortBy: 'all', // all, price_low, price_high, rating_high
        minPrice: '',
        maxPrice: '',
        amenities: []
    });

    const amenitiesList = [
        { id: 'pool', label: 'Swimming Pool' },
        { id: 'wifi', label: 'Free Wi-Fi' },
        { id: 'ac', label: 'Air Conditioning' },
        { id: 'parking', label: 'Parking' },
        { id: 'kitchen', label: 'Kitchen' }
    ];

    const handleSortChange = (e) => {
        const newVal = e.target.value;
        const newFilters = { ...filters, sortBy: newVal };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const toggleAmenity = (id) => {
        const current = filters.amenities;
        const updated = current.includes(id)
            ? current.filter(item => item !== id)
            : [...current, id];

        const newFilters = { ...filters, amenities: updated };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">

                {/* SORT TOGGLE */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500"><FaSortAmountDown className="inline mr-1" /> Sort:</span>
                    <select
                        value={filters.sortBy}
                        onChange={handleSortChange}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-black focus:border-black block p-2 outline-none cursor-pointer"
                    >
                        <option value="all">Recommended</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="rating_high">Top Rated</option>
                    </select>
                </div>

                {/* FILTERS BUTTON */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isOpen ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <FaFilter /> Filters
                    {(filters.minPrice || filters.maxPrice || filters.amenities.length > 0) && (
                        <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                            {(filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + filters.amenities.length}
                        </span>
                    )}
                </button>
            </div>

            {/* EXPANDABLE FILTER PANEL */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border-t border-gray-100 p-6 rounded-b-xl shadow-lg mt-1 grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* PRICE RANGE */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FaMoneyBillWave /> Price Range</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
                                        <input
                                            type="number"
                                            name="minPrice"
                                            value={filters.minPrice}
                                            onChange={handlePriceChange}
                                            placeholder="₹ 0"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-black outline-none"
                                        />
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            value={filters.maxPrice}
                                            onChange={handlePriceChange}
                                            placeholder="₹ 50000"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-black outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AMENITIES */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FaStar /> Amenities</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {amenitiesList.map(item => (
                                        <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.amenities.includes(item.id) ? 'bg-black border-black' : 'bg-white border-gray-300 group-hover:border-gray-400'
                                                }`}>
                                                {filters.amenities.includes(item.id) && <FaSortAmountDown className="text-white text-[10px]" />}
                                                {/* Using SortIcon as checkmark placeholder */}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={filters.amenities.includes(item.id)}
                                                onChange={() => toggleAmenity(item.id)}
                                            />
                                            <span className={`text-sm ${filters.amenities.includes(item.id) ? 'font-medium text-black' : 'text-gray-600'}`}>
                                                {item.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
