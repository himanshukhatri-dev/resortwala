import React, { useState } from 'react';
import { FaStar, FaHeart, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaWifi, FaSwimmingPool, FaParking, FaSnowflake, FaBed, FaBath, FaUserFriends } from 'react-icons/fa';

import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function PropertyCard({ property, searchParams }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const {
        id = property?.PropertyId || property?.id,
        name = property?.Name || property?.name || "Luxury Villa",
        location = property?.Location || property?.CityName || "India",
        price = parseFloat(property?.Price || property?.PricePerNight || property?.ResortWalaRate || 0) || 15000,
        rating = property?.Rating || 4.9,
        description = property?.LongDescription || property?.long_description || "Experience luxury living in this beautiful property featuring modern amenities and stunning views.",
    } = property || {};

    // Collect all available images
    const allImages = [
        ...(property?.images?.map(img => img.image_url || img.image_path) || []),
        property?.primary_image?.image_url || property?.primary_image?.image_path,
        property?.ImageUrl || property?.image_url || property?.image_path,
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000"
    ].filter(Boolean);

    const images = allImages.slice(0, 5); // Limit to 5 for the slider

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const buildQuery = () => {
        if (!searchParams) return "";
        const params = new URLSearchParams();
        if (searchParams.dates?.start) params.set('start', searchParams.dates.start);
        if (searchParams.dates?.end) params.set('end', searchParams.dates.end);
        const guests = searchParams.guests || {};
        if (guests.adults) params.set('adults', guests.adults);
        if (guests.children) params.set('children', guests.children);
        return params.toString();
    };

    const queryString = buildQuery();
    const navigate = useNavigate();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const active = id ? isWishlisted(id) : false;

    const handleCardClick = (e) => {
        window.open(`/property/${id}?${queryString}`, '_blank');
    };


    const handleWishlist = async (e) => {
        e.stopPropagation();
        if (!id) return;
        const result = await toggleWishlist(id);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
    };

    return (
        <div
            onClick={handleCardClick}
            className="group flex flex-col xl:flex-row gap-6 bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border border-gray-100 p-4 cursor-pointer relative"
        >
            {/* IMAGE SLIDER (Left Side) */}
            <div className="relative w-full xl:w-[400px] h-[280px] xl:h-[320px] flex-shrink-0 rounded-[1.5rem] overflow-hidden bg-gray-100">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentImageIndex}
                        src={images[currentImageIndex]}
                        alt={name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>

                {/* HEART BUTTON */}
                <div
                    onClick={handleWishlist}
                    className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${active ? 'bg-red-500 text-white' : 'bg-white/70 text-gray-700 hover:bg-white hover:text-red-500'}`}
                >
                    <FaHeart className={active ? "fill-current" : "text-xl"} />
                </div>

                {/* SLIDER CONTROLS */}
                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={prevImage} className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-800 hover:bg-white transition-all shadow-lg select-none">
                        <FaChevronLeft size={12} />
                    </button>
                    <button onClick={nextImage} className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-800 hover:bg-white transition-all shadow-lg select-none">
                        <FaChevronRight size={12} />
                    </button>
                </div>

                {/* DOTS */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
                        />
                    ))}
                </div>

                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Trending Now
                </div>
            </div>

            {/* CONTENT (Right Side) */}
            <div className="flex-1 flex flex-col justify-between py-2 px-2">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px] font-black text-secondary uppercase tracking-[0.2em]">
                                <FaStar className="mb-0.5" /> {rating} • Superhost Choice
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif leading-tight">
                                {name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                                <FaMapMarkerAlt className="text-secondary/60" size={12} />
                                {location}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price Per Night</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900 font-sans">₹{price.toLocaleString()}</span>
                                <span className="text-gray-400 text-sm font-medium">/ night</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm md:text-base leading-relaxed line-clamp-2 mb-6 max-w-2xl">
                        {description}
                    </p>

                    {/* QUICK STATS & AMENITIES */}
                    <div className="flex flex-col gap-4 mb-6">
                        {/* Quick Stats Row */}
                        <div className="flex items-center gap-6 text-sm text-gray-700 font-medium">
                            <div className="flex items-center gap-2">
                                <FaUserFriends className="text-gray-400" />
                                <span>{property?.MaxGuests || 6} Guests</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaBed className="text-gray-400" />
                                <span>{property?.Bedrooms || 3} Bedroom</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaBath className="text-gray-400" />
                                <span>{property?.Bathrooms || 3} Bath</span>
                            </div>
                        </div>

                        {/* Amenities Tags */}
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                                <FaSwimmingPool size={10} /> Pool
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                                <FaWifi size={10} /> Wi-Fi
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold">
                                <FaSnowflake size={10} /> AC
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex items-center justify-between border-t border-gray-50 pt-6 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2 overflow-hidden">
                            {[1, 2, 3].map(i => (
                                <img
                                    key={i}
                                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                    alt=""
                                />
                            ))}
                        </div>
                        <div className="text-xs font-bold text-gray-600">
                            <span className="text-gray-900 font-extrabold">+12 people</span> booked recently
                        </div>
                    </div>

                    <button className="px-6 py-3 bg-white border-2 border-gray-100 text-gray-900 rounded-xl font-bold text-sm hover:border-black hover:bg-black hover:text-white transition-all shadow-sm active:scale-95">
                        View Details
                    </button>
                </div>
            </div>

        </div>
    );
}

