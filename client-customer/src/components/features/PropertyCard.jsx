import React from 'react';
import { FaStar, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function PropertyCard({ property, searchParams }) {
    // Map API fields (PascalCase) to component props (camelCase)
    // FINAL MAPPING based on api_debug_log.json
    const {
        id = property?.PropertyId || property?.id,
        name = property?.Name || property?.name || "Luxury Villa",
        location = property?.Location || property?.CityName || "India",
        // Handle Price string "14000.00" -> 14000
        price = parseFloat(property?.Price || property?.ResortWalaRate || 0) || 15000,
        rating = property?.Rating || 4.9,
        // Image: API returns empty array currently, so we rely on fallback mostly. 
        // Adding check just in case.
        image = (property?.images && property?.images.length > 0 ? (property.images[0].image_url || property.images[0].image_path) : null) ||
        (property?.primary_image ? (property.primary_image.image_url || property.primary_image.image_path) : null) ||
        property?.ImageUrl || property?.image_url || property?.image_path ||
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop"
    } = property || {};

    const buildQuery = () => {
        if (!searchParams) return "";
        const params = new URLSearchParams();

        if (searchParams.dates?.start) params.set('start', searchParams.dates.start);
        if (searchParams.dates?.end) params.set('end', searchParams.dates.end);

        const guests = searchParams.guests || {};
        if (guests.adults) params.set('adults', guests.adults);
        if (guests.children) params.set('children', guests.children);
        if (guests.infants) params.set('infants', guests.infants);
        if (guests.pets) params.set('pets', guests.pets);

        return params.toString();
    };

    const queryString = buildQuery();

    return (
        <div className="group rounded-xl overflow-hidden shadow-lg border border-white/10 bg-[#1E293B] hover:shadow-2xl transition-all duration-300">
            {/* IMAGE */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 text-white font-bold text-lg drop-shadow-md font-serif tracking-wide">
                    {name}
                </div>
            </div>

            {/* CONTENT */}
            <div className="p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-3 uppercase tracking-wider font-medium">
                    <FaMapMarkerAlt className="text-primary" /> {/* Teal map marker */}
                    <span>{location}</span>
                </div>

                {/* DETAILS COMPACT */}
                <div className="flex items-center justify-between text-gray-300 text-sm mb-4 border-b border-gray-700 pb-3">
                    <div className="flex items-center gap-2">
                        <span>3 Beds</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Pool</span>
                    </div>
                </div>

                {/* PRICE & ACTION */}
                <div className="flex items-center justify-between mt-2">
                    <div>
                        <span className="text-xl font-bold text-white font-serif">₹{price.toLocaleString() || 'On Request'}</span>
                        <span className="text-xs text-gray-500 block">per night</span>
                    </div>

                    <Link to={`/property/${id}`} className="bg-secondary hover:bg-secondary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg transition-colors">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}
