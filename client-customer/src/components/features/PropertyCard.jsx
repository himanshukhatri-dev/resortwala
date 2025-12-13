import React from 'react';
import { FaStar, FaHeart } from 'react-icons/fa';
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
        image = (property?.images && property?.images.length > 0 ? property.images[0].image_url : null) ||
        (property?.primary_image ? property.primary_image.image_url : null) ||
        property?.ImageUrl ||
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
        <Link to={`/property/${id}?${queryString}`} className="block group cursor-pointer w-full">
            <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200 mb-3">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/20 transition">
                    <FaHeart className="text-black/50 hover:text-primary transition-colors drop-shadow-md stroke-white stroke-2" size={24} />
                </button>
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-gray-800 shadow-sm">
                    Guest Favorite
                </div>
            </div>

            <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900 truncate pr-2 text-base">{name}</h3>
                <div className="flex items-center gap-1 text-sm shrink-0">
                    <FaStar size={12} />
                    <span>{rating}</span>
                </div>
            </div>

            <p className="text-gray-500 text-sm truncate">{location}</p>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="font-bold text-gray-900 text-base">₹{price.toLocaleString()}</span>
                <span className="text-gray-900 font-normal">night</span>
            </div>
        </Link>
    );
}
