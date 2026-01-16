import React, { useState } from 'react';
import { FaStar, FaHeart, FaMapMarkerAlt, FaChevronLeft, FaChevronRight, FaWifi, FaSwimmingPool, FaParking, FaSnowflake, FaBed, FaBath, FaUserFriends, FaExchangeAlt, FaShieldAlt, FaCheck } from 'react-icons/fa';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { getPricing } from '../../utils/pricing';

export default function PropertyCard({ property, searchParams, cardType = 'horizontal' }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const {
        id = property?.PropertyId || property?.id,
        name = property?.Name || property?.name || "Luxury Villa",
        location = property?.Location || property?.CityName || "India",
        // Use Smart Price (Lowest in 30 days) > Deal Price > Standard Price
        price = parseFloat(property?.lowest_price_next_30 || property?.DealPrice || property?.Price || property?.PricePerNight || 0) || 15000,
        // Use Smart Review Logic
        rating = property?.display_rating || property?.Rating || 4.9,
        description = property?.ShortDescription || property?.onboarding_data?.shortDescription || property?.LongDescription || property?.long_description || "Experience luxury living in this beautiful property featuring modern amenities and stunning views.",
        isVerifiedRating = property?.is_verified_rating,
        ratingLabel = property?.display_rating_label
    } = property || {};

    // Re-calculate pricing object with the correct base price
    const pricing = getPricing({ ...property, Price: price });

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
    const locationRoute = useLocation();
    const { user } = useAuth();
    const { isWishlisted, toggleWishlist } = useWishlist();
    const { toggleCompare, compareList } = useCompare();
    const active = id ? isWishlisted(id) : false;

    const handleCardClick = (e) => {
        window.open(`/property/${id}?${queryString}`, '_blank');
    };


    const handleWishlist = async (e) => {
        e.stopPropagation();
        if (!id) return;

        if (!user) {
            navigate('/login', {
                state: {
                    returnTo: locationRoute.pathname + locationRoute.search,
                    bookingState: { action: 'wishlist', propertyId: id }
                }
            });
            return;
        }

        const result = await toggleWishlist(id);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`group flex flex-col ${cardType === 'horizontal' ? 'xl:flex-row' : ''} gap-5 bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 p-3 cursor-pointer relative hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 h-full`}
        >
            {/* IMAGE SLIDER (Left Side) */}
            <div className={`relative w-full ${cardType === 'horizontal' ? 'xl:w-[320px] h-[276px] xl:h-[300px]' : 'h-[250px]'} flex-shrink-0 rounded-[1.2rem] overflow-hidden bg-gray-100`}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentImageIndex}
                        src={images[currentImageIndex]}
                        alt={name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>

                {/* COMPARE BUTTON */}
                <div
                    onClick={(e) => { e.stopPropagation(); toggleCompare(property); }}
                    className={`absolute top-4 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md cursor-pointer shadow-sm ${compareList?.find(p => p.id === id || p.PropertyId === id)
                        ? 'bg-black text-white'
                        : 'bg-white/70 text-gray-700 hover:bg-white hover:text-black'
                        }`}
                    title="Compare"
                >
                    <FaExchangeAlt size={12} />
                </div>

                {/* HEART BUTTON */}
                <div
                    onClick={handleWishlist}
                    className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${active ? 'bg-red-500 text-white' : 'bg-white/70 text-gray-700 hover:bg-white hover:text-red-500'}`}
                >
                    <FaHeart className={active ? "fill-current" : "text-lg"} />
                </div>

                {/* SLIDER CONTROLS */}
                <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={prevImage} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-800 hover:bg-white transition-all shadow-md">
                        <FaChevronLeft size={10} />
                    </button>
                    <button onClick={nextImage} className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-800 hover:bg-white transition-all shadow-md">
                        <FaChevronRight size={10} />
                    </button>
                </div>

                {/* DOTS */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all ${i === currentImageIndex ? 'w-3 bg-white' : 'w-1 bg-white/50'}`}
                        />
                    ))}
                </div>

                {(property?.PropertyType || property?.IsTrending) && (
                    <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                        {/* TRENDING BADGE */}
                        {property?.IsTrending && (
                            <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Popular
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CONTENT (Right Side) */}
            <div className="flex-1 flex flex-col pt-1 pb-1 pr-2">
                <div>
                    {/* ROW 1: Title Only */}
                    <div className="mb-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 font-display leading-[1.3] tracking-normal line-clamp-2" title={name}>
                            {name}
                        </h3>
                    </div>

                    {/* ROW 2: Property Type, Rating, Location & DISTANCE */}
                    <div className="flex flex-wrap items-center gap-3 mb-2 text-sm">

                        {property?.PropertyType && (
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${property.PropertyType === 'Waterpark'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-purple-50 text-purple-700 border-purple-100'
                                }`}>
                                {property.PropertyType}
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            <FaStar className="text-yellow-400 text-xs mb-0.5" />
                            <span>{rating > 0 ? rating : "New"}</span>
                            {ratingLabel && <span className="text-[8px] uppercase tracking-wider text-gray-400 font-normal ml-1 border-l pl-1 border-gray-300">{ratingLabel}</span>}
                            {/* {rating > 0 && <span className="text-[10px] text-gray-400 font-normal ml-0.5">({(id % 50) + 5} Reviews)</span>} */}
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                            <FaMapMarkerAlt className="text-gray-400" size={12} />
                            <span className="truncate max-w-[150px]">{location}</span>

                            {/** DISTANCE DISPLAY **/}
                            {property?.distanceKm !== undefined && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                    {property.distanceKm < 1 ? `${Math.round(property.distanceKm * 1000)}m` : `${property.distanceKm.toFixed(1)} km`}
                                </span>
                            )}

                            {property.GoogleMapLink && (
                                <a
                                    href={property.GoogleMapLink.includes('iframe') ? '#' : property.GoogleMapLink}
                                    onClick={(e) => {
                                        if (property.GoogleMapLink.includes('iframe')) return;
                                        e.stopPropagation();
                                    }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline text-xs hover:text-blue-800 ml-1"
                                    title="View on Map"
                                >
                                    Map
                                </a>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-500 text-xs md:text-sm leading-relaxed line-clamp-2 mb-2 max-w-2xl">
                        {description}
                    </p>

                    {/* QUICK STATS & AMENITIES */}
                    <div className="flex flex-col gap-2 mb-2">
                        {property?.PropertyType !== 'Waterpark' && (
                            <div className="flex items-center gap-6 text-sm text-gray-700 font-medium">
                                <div className="flex items-center gap-2">
                                    <FaUserFriends className="text-gray-400" />
                                    <span>{property?.MaxCapacity || property?.MaxGuests || 0} Guests</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaBed className="text-gray-400" />
                                    <span>{property?.NoofRooms || property?.Bedrooms || 0} Bedroom</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaBath className="text-gray-400" />
                                    <span>{
                                        property?.onboarding_data?.roomConfig?.bedrooms?.filter(r => r.bathroom)?.length
                                        || property?.NoofRooms
                                        || property?.Bathrooms
                                        || 0
                                    } Bath</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                            {(property?.onboarding_data?.amenities?.big_pools || property?.onboarding_data?.amenities?.small_pools) ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                    <FaSwimmingPool size={10} /> Pool
                                </div>
                            ) : null}

                            {property?.onboarding_data?.amenities?.wifi ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                                    <FaWifi size={10} /> Wi-Fi
                                </div>
                            ) : null}

                            {property?.onboarding_data?.roomConfig?.bedrooms?.some(r => r.ac) ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-lg">
                                    <FaSnowflake size={10} /> AC
                                </div>
                            ) : null}

                            {property?.onboarding_data?.amenities?.parking ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 rounded-lg">
                                    <FaParking size={10} /> Parking
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>


                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-gray-50 pt-4 mt-auto gap-3 sm:gap-0">
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg border border-green-100 font-bold text-[10px] uppercase tracking-wider">
                            <FaShieldAlt size={10} /> Instant Confirmation
                        </div>
                        {property.is_verified && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-bold text-[10px] uppercase tracking-wider">
                                <FaCheck size={10} /> Verified Villa
                            </div>
                        )}
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium line-through decoration-red-400">₹{Math.round(pricing.marketPrice).toLocaleString()}</span>
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">{pricing.percentage}% OFF</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl sm:text-2xl font-bold text-gray-900 font-sans">₹{pricing.sellingPrice.toLocaleString()}</span>
                                <span className="text-[10px] font-normal text-gray-400 opacity-60">
                                    {property.PropertyType?.toLowerCase() === 'waterpark' ? '/ person' : '/ night'}
                                </span>
                            </div>
                        </div>
                        <button className="flex-1 sm:flex-none px-6 py-3 bg-white border-2 border-gray-100 text-gray-900 rounded-xl font-bold text-sm hover:border-black hover:bg-black hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2 justify-center">
                            View Details <FaChevronRight size={10} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
