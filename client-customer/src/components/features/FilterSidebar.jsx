import React, { useState, useEffect } from 'react';
import { FaSwimmingPool, FaHome, FaHotel, FaLeaf, FaUsers, FaDog, FaFilter, FaTimes } from 'react-icons/fa';

const AMENITIES_LIST = [
    { id: 'wifi', label: 'Wi-Fi' },
    { id: 'ac', label: 'AC' },
    { id: 'pool', label: 'Pool' },
    { id: 'tv', label: 'TV' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'parking', label: 'Parking' },
    { id: 'caretaker', label: 'Caretaker' },
    { id: 'speaker', label: 'Music System' },
    { id: 'gen_set', label: 'Power Backup' },
    { id: 'balcony', label: 'Balcony' },
    { id: 'mountain_view', label: 'View' },
    { id: 'bonfire', label: 'Bonfire' },
    { id: 'barbeque', label: 'BBQ' }
];

const PROPERTY_TYPES = [
    { id: 'all', label: 'All Stays', icon: <FaHome /> },
    { id: 'villas', label: 'Villas', icon: <FaHotel /> },
    { id: 'resorts', label: 'Resorts', icon: <FaSwimmingPool /> },
    { id: 'apartments', label: 'Apartments', icon: <FaHotel /> },
    { id: 'farmhouse', label: 'Farmhouse', icon: <FaLeaf /> },
    { id: 'waterpark', label: 'Water Park', icon: <FaSwimmingPool /> }
];

export default function FilterSidebar({ filters, onFilterChange }) {
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        // Debounce only for text/slider if needed, but for now direct update is fine for sidebar
        onFilterChange(newFilters);
    };

    const toggleAmenity = (amenityId) => {
        const current = localFilters.amenities || [];
        const updated = current.includes(amenityId)
            ? current.filter(a => a !== amenityId)
            : [...current, amenityId];
        handleChange('amenities', updated);
    };

    return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-8 sticky top-24">

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                    <FaFilter className="text-gray-400 text-sm" /> Filters
                </div>
                <button
                    onClick={() => onFilterChange({ min_price: '', max_price: '', type: 'all', amenities: [], guests: 1, veg_only: false })}
                    className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest transition"
                >
                    Clear All
                </button>
            </div>

            {/* Property Type */}
            <div>
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Property Type</h4>
                <div className="space-y-2">
                    {PROPERTY_TYPES.map(type => (
                        <label key={type.id} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-lg transition-colors -ml-2">
                            <input
                                type="radio"
                                name="property_type"
                                checked={localFilters.type === type.id || (!localFilters.type && type.id === 'all')}
                                onChange={() => handleChange('type', type.id)}
                                className="w-5 h-5 text-black border-gray-300 focus:ring-black rounded-md cursor-pointer"
                            />
                            <span className={`text-sm font-bold ${localFilters.type === type.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={localFilters.min_price || ''}
                            onChange={(e) => handleChange('min_price', e.target.value)}
                            className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-black transition"
                        />
                    </div>
                    <span className="text-gray-300">-</span>
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.max_price || ''}
                            onChange={(e) => handleChange('max_price', e.target.value)}
                            className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-black transition"
                        />
                    </div>
                </div>
            </div>

            {/* Guest Count */}
            <div>
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Guests</h4>
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                    <button
                        onClick={() => handleChange('guests', Math.max(1, (localFilters.guests || 1) - 1))}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-black hover:shadow-md transition"
                    >
                        -
                    </button>
                    <span className="font-bold text-gray-900">{localFilters.guests || 1} Guests</span>
                    <button
                        onClick={() => handleChange('guests', (localFilters.guests || 1) + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-black hover:shadow-md transition"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Amenities */}
            <div>
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Amenities</h4>
                <div className="grid grid-cols-2 gap-2">
                    {AMENITIES_LIST.map(item => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer p-1">
                            <input
                                type="checkbox"
                                checked={(localFilters.amenities || []).includes(item.id)}
                                onChange={() => toggleAmenity(item.id)}
                                className="w-4 h-4 rounded text-black focus:ring-black border-gray-300"
                            />
                            <span className="text-xs font-medium text-gray-600">{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Toggles */}
            <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <FaLeaf className="text-green-500" /> Veg Only
                    </span>
                    <div className={`w-10 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ease-in-out ${localFilters.veg_only ? 'bg-green-500' : ''}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${localFilters.veg_only ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={localFilters.veg_only || false}
                        onChange={(e) => handleChange('veg_only', e.target.checked)}
                    />
                </label>
            </div>
        </div>
    );
}
