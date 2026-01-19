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
                    onClick={() => onFilterChange({ minPrice: '', maxPrice: '', type: 'all', amenities: [], guests: 1, veg_only: false, location: '', sort: 'newest', distance: { center: null, maxKm: 200 }, page: 1 })}
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
                            value={localFilters.minPrice || ''}
                            onChange={(e) => handleChange('minPrice', e.target.value)}
                            className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-black transition"
                        />
                    </div>
                    <span className="text-gray-300">-</span>
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localFilters.maxPrice || ''}
                            onChange={(e) => handleChange('maxPrice', e.target.value)}
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
                        onClick={() => {
                            if (typeof localFilters.guests === 'object') {
                                handleChange('guests', { ...localFilters.guests, adults: Math.max(1, localFilters.guests.adults - 1) });
                            } else {
                                handleChange('guests', Math.max(1, (localFilters.guests || 1) - 1));
                            }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:text-black hover:shadow-md transition"
                    >
                        -
                    </button>
                    <span className="font-bold text-gray-900">
                        {typeof localFilters.guests === 'object'
                            ? (localFilters.guests.adults + localFilters.guests.children)
                            : (localFilters.guests || 1)
                        } Guests
                    </span>
                    <button
                        onClick={() => {
                            if (typeof localFilters.guests === 'object') {
                                handleChange('guests', { ...localFilters.guests, adults: localFilters.guests.adults + 1 });
                            } else {
                                handleChange('guests', (localFilters.guests || 1) + 1);
                            }
                        }}
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


        </div>
    );
}
