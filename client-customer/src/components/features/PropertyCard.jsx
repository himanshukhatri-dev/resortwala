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

    if (property?.variant === 'horizontal' || true) { // Forcing horizontal for now as per "1 by 1" request
        return (
            <Link
                to={`/property/${id}?${queryString}`}
                className="group flex flex-col sm:flex-row gap-4 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 p-3"
            >
                {/* IMAGE (Left Side, Larger) */}
                <div className="relative w-full sm:w-[280px] h-[220px] sm:h-auto flex-shrink-0 rounded-xl overflow-hidden">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                        <FaStar className="text-yellow-400" /> {rating}
                    </div>
                </div>

                {/* CONTENT (Right Side, Detailed) */}
                <div className="flex-1 flex flex-col justify-between py-2 pr-2">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-serif leading-tight group-hover:text-primary transition-colors">
                                    {name}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mt-1">
                                    <FaMapMarkerAlt className="text-secondary" />
                                    {location}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                                <FaHeart />
                            </div>
                        </div>

                        {/* Description / Details */}
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                            {property?.LongDescription || property?.long_description || "Experience luxury living in this beautiful property featuring modern amenities and stunning views."}
                        </p>

                        {/* Amenities / Tabs Preview */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['Wifi', 'Pool', 'Parking', 'AC'].map((amenity, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                    {amenity}
                                </span>
                            ))}
                            <span className="px-3 py-1 bg-gray-50 text-gray-400 text-xs rounded-full cursor-pointer hover:bg-gray-100">+ more</span>
                        </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-gray-100 pt-4">
                        <div>
                            <span className="text-2xl font-bold text-gray-900 font-serif">₹{price.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs ml-1">/ night</span>
                        </div>
                        <button className="px-6 py-2.5 bg-black text-white rounded-xl font-medium shadow-lg hover:bg-gray-800 hover:scale-105 transition-all active:scale-95">
                            View Details
                        </button>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={`/property/${id}`}
            className="group block rounded-xl overflow-hidden shadow-md border border-gray-100 bg-white hover:shadow-xl transition-all duration-300 relative"
        >
            {/* ... Classic Card (Fallback if needed) ... */}
            <div className="relative aspect-[16/9] md:aspect-[4/3] overflow-hidden">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* ... same as before ... */}
            </div>
            {/* ... content ... */}
        </Link>
    );
}
