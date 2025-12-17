import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaCar, FaUtensils, FaArrowLeft, FaHeart, FaShare, FaMinus, FaPlus, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, differenceInDays } from 'date-fns';

export default function PropertyDetails() {
    const { id } = useParams();
    const [urlParams] = useSearchParams(); // Read GET params
    const navigate = useNavigate();

    // Initialize State from URL Query Params (Priority)
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookedDates, setBookedDates] = useState([]);

    const [dateRange, setDateRange] = useState({
        from: urlParams.get('start') ? new Date(urlParams.get('start')) : undefined,
        to: urlParams.get('end') ? new Date(urlParams.get('end')) : undefined
    });

    const [guests, setGuests] = useState({
        adults: parseInt(urlParams.get('adults')) || 1,
        children: parseInt(urlParams.get('children')) || 0,
        infants: parseInt(urlParams.get('infants')) || 0,
        pets: parseInt(urlParams.get('pets')) || 0
    });

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const datePickerRef = useRef(null);
    const [isSaved, setIsSaved] = useState(false);

    // IMAGE LOGIC: Ensure at least 5 images (Defined early for Hooks)
    const PLACEHOLDERS = [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-68c894913d3e?q=80&w=1000&auto=format&fit=crop"
    ];

    const rawImages = property?.images?.length ? property.images.map(img => img.image_url) : (property?.ImageUrl ? [property.ImageUrl] : []);
    const galleryImages = [...rawImages, ...PLACEHOLDERS].slice(0, 5);

    const openLightBox = (index) => {
        setPhotoIndex(index);
        setIsGalleryOpen(true);
    };

    const nextPhoto = (e) => {
        if (e) e.stopPropagation();
        setPhotoIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevPhoto = (e) => {
        if (e) e.stopPropagation();
        setPhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    // Keyboard Navigation
    useEffect(() => {
        if (!isGalleryOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'Escape') setIsGalleryOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGalleryOpen, galleryImages.length]); // Dependencies are safe

    // Fetch Property Logic
    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const response = await axios.get(`${baseURL}/api/properties/${id}`);
                setProperty(response.data);
            } catch (error) {
                console.error("Failed to fetch property details", error);
                setError(error.message + (error.response ? ` (${error.response.status})` : ''));
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    // Fetch Booked Dates separately
    useEffect(() => {
        const fetchBookedDates = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const res = await axios.get(`${baseURL}/api/properties/${id}/booked-dates`);
                setBookedDates(res.data.booked_dates || []);
            } catch (err) {
                console.error("Error fetching booked dates", err);
            }
        };
        if (id) fetchBookedDates();
    }, [id]);

    // Close DatePicker on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Date Selection Logic (Matches SearchBar)
    const handleDateSelect = (day) => {
        if (day < new Date().setHours(0, 0, 0, 0)) return;
        if ((dateRange.from && dateRange.to) || !dateRange.from) {
            setDateRange({ from: day, to: undefined });
            return;
        }
        if (dateRange.from && !dateRange.to) {
            if (day < dateRange.from) {
                setDateRange({ from: day, to: undefined });
            } else {
                setDateRange({ from: dateRange.from, to: day });
                setIsDatePickerOpen(false); // Auto close on selection complete
            }
        }
    };

    const { user } = useAuth(); // Import auth context

    const handleReserve = () => {
        if (!dateRange.from || !dateRange.to) {
            setIsDatePickerOpen(true);
            return;
        }

        const targetPath = `/book/${id}`;
        const bookingState = {
            checkIn: dateRange.from,
            checkOut: dateRange.to,
            guests: guests.adults + guests.children
        };

        if (!user) {
            // Redirect to Login, then to Booking
            navigate('/login', {
                state: {
                    returnTo: targetPath,
                    bookingState: bookingState
                }
            });
            return;
        }

        navigate(targetPath, {
            state: bookingState
        });
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: name,
                    text: `Check out ${name} on ResortWala!`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        // TODO: Implement actual wishlist API call here
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!property && !loading) {
        return (
            <div className="pt-32 pb-20 min-h-screen flex flex-col items-center justify-center">
                <div className="text-2xl font-bold mb-4">Property not found</div>
                {error && <div className="text-red-500 mb-4">Error: {error}</div>}
                <Link to="/" className="text-primary hover:underline">Return Home</Link>
            </div>
        );
    }

    // Calculations
    const price = parseFloat(property.Price || property.ResortWalaRate || 0) || 15000;
    const nights = (dateRange.from && dateRange.to) ? differenceInDays(dateRange.to, dateRange.from) : 0;
    const totalBase = price * nights;
    const cleaningFee = 2500;
    const total = totalBase + cleaningFee;

    // Header & Images...
    const name = property.Name || property.name || "Luxury Stay";
    const locationStr = property.Location || property.CityName || "Unknown Location";
    const description = property.LongDescription || property.description || "Experience a wonderful stay.";

    return (
        <div className="bg-white min-h-screen pb-20 pt-[80px]">
            {/* ... Header & Images omitted for brevity ... */}

            {/* 1. HEADER (Title & Actions) */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{name}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1 font-medium text-black">
                                <FaStar size={14} />
                                <span>{property.Rating || 4.9}</span>
                            </div>
                            <span className="underline font-medium hover:text-black cursor-pointer">12 reviews</span>
                            <span>•</span>
                            <span className="font-medium underline hover:text-black cursor-pointer">{locationStr}</span>
                        </div>
                    </div>

                    {/* Share & Save Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline font-medium"
                        >
                            <FaShare /> Share
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline font-medium"
                        >
                            <FaHeart className={isSaved ? "text-[#FF385C]" : "text-gray-600"} />
                            {isSaved ? "Saved" : "Save"}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. IMAGE GRID (1 + 4 Layout) */}
            <div className="container mx-auto px-4 mb-12">
                <div className="relative rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-4 grid-rows-2 h-[400px] gap-2">

                    {/* Main Large Image (Left Half) */}
                    <div
                        className="col-span-1 md:col-span-2 row-span-2 relative cursor-pointer group"
                        onClick={() => openLightBox(0)}
                    >
                        <img src={galleryImages[0]} alt="Main" className="w-full h-full object-cover transition duration-300 group-hover:opacity-90" />
                    </div>

                    {/* Small Images (Right Half) */}
                    {galleryImages.slice(1, 5).map((img, idx) => (
                        <div
                            key={idx}
                            className="relative cursor-pointer group hidden md:block"
                            onClick={() => openLightBox(idx + 1)}
                        >
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition duration-300 group-hover:opacity-90" />
                        </div>
                    ))}

                    {/* Show All Photos Button */}
                    <button
                        onClick={() => openLightBox(0)}
                        className="absolute bottom-4 right-4 bg-white border border-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:scale-105 transition flex items-center gap-2"
                    >
                        <FaPlus size={12} /> Show all photos
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isGalleryOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black text-white flex flex-col"
                    >
                        {/* Minimalist Lightbox Content */}
                        <div className="relative flex-1 flex flex-col items-center justify-center w-full h-full overflow-hidden" onClick={() => setIsGalleryOpen(false)}>

                            {/* Close Button (Top Right) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(false); }}
                                className="absolute top-6 right-6 z-50 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition backdrop-blur-sm"
                            >
                                <FaTimes size={20} />
                            </button>

                            {/* Main Image Container */}
                            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>

                                {/* Prev Button */}
                                <button
                                    onClick={prevPhoto}
                                    className="absolute left-4 md:left-8 p-3 md:p-4 rounded-full bg-black/50 hover:bg-black/70 text-white transition z-20 backdrop-blur-sm"
                                >
                                    <FaArrowLeft size={20} />
                                </button>

                                {/* Image */}
                                <motion.img
                                    key={photoIndex}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    src={galleryImages[photoIndex]}
                                    alt="Fullscreen"
                                    className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-sm"
                                    onClick={(e) => e.stopPropagation()} // Prevent close on image click
                                />

                                {/* Next Button */}
                                <button
                                    onClick={nextPhoto}
                                    className="absolute right-4 md:right-8 p-3 md:p-4 rounded-full bg-black/50 hover:bg-black/70 text-white transition z-20 backdrop-blur-sm"
                                >
                                    <div className="rotate-180"><FaArrowLeft size={20} /></div>
                                </button>
                            </div>

                            {/* Thumbnails Strip (Overlay at Bottom) */}
                            <div
                                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-[90%] bg-black/60 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 overflow-x-auto z-30 no-scrollbar"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPhotoIndex(idx)}
                                        className={`shrink-0 h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden border-2 transition-all ${photoIndex === idx ? 'border-white scale-105 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. CONTENT GRID */}
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">

                {/* LEFT COLUMN */}
                <div className="md:col-span-2 space-y-8">
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-xl font-bold mb-4">About this place</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
                    </div>
                    {/* Offers */}
                    <div className="pb-8">
                        <h2 className="text-xl font-bold mb-6">What this place offers</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-gray-700"><FaWifi /> Wifi</div>
                            <div className="flex items-center gap-3 text-gray-700"><FaCar /> Free parking on premises</div>
                            <div className="flex items-center gap-3 text-gray-700"><FaSwimmingPool /> Private pool</div>
                            <div className="flex items-center gap-3 text-gray-700"><FaUtensils /> Kitchen</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sticky Booking Card */}
                <div className="relative">
                    <div className="sticky top-28 border border-gray-200 rounded-xl p-6 shadow-xl bg-white">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-2xl font-bold">₹{price.toLocaleString()}</span>
                                <span className="text-gray-600"> / night</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold">
                                <FaStar size={12} /> {property.Rating || 4.9}
                            </div>
                        </div>

                        {/* Date Picker Input */}
                        <div className="relative mb-4" ref={datePickerRef}>
                            <div className="border border-gray-400 rounded-lg overflow-hidden">
                                <div className="flex border-b border-gray-400 cursor-pointer" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                                    <div className="flex-1 p-3 border-r border-gray-400 hover:bg-gray-100">
                                        <label className="block text-[10px] font-bold text-gray-700">CHECK-IN</label>
                                        <div className="text-sm text-gray-900">{dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Add date'}</div>
                                    </div>
                                    <div className="flex-1 p-3 hover:bg-gray-100">
                                        <label className="block text-[10px] font-bold text-gray-700">CHECK-OUT</label>
                                        <div className="text-sm text-gray-900">{dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Add date'}</div>
                                    </div>
                                </div>
                                <div className="p-3 hover:bg-gray-100 cursor-pointer">
                                    <label className="block text-[10px] font-bold text-gray-700">GUESTS</label>
                                    <div className="text-sm text-gray-900">{guests.adults + guests.children} guests</div>
                                </div>
                            </div>

                            {/* POPUP DATE PICKER */}
                            <AnimatePresence>
                                {isDatePickerOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-16 right-0 bg-white rounded-xl shadow-2xl p-4 z-50 border border-gray-100 w-[350px]"
                                    >
                                        <style>{`
                                            .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #000; --rdp-background-color: #f7f7f7; margin: 0; }
                                            .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f0f0f0; }
                                            .rdp-day_selected { background-color: black !important; color: white !important; }
                                            .rdp-day_today { font-weight: bold; color: #FF385C; }
                                        `}</style>
                                        <DayPicker
                                            mode="range"
                                            selected={dateRange}
                                            onDayClick={handleDateSelect}
                                            disabled={[
                                                { before: new Date() },
                                                ...bookedDates.map(date => new Date(date))
                                            ]}
                                            numberOfMonths={1}
                                            defaultMonth={dateRange.from || new Date()}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleReserve}
                            className={`w-full font-bold py-3.5 rounded-lg transition mb-4 text-white ${(!dateRange.from || !dateRange.to) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF385C] hover:bg-[#D90B3E]'}`}
                        >
                            Reserve
                        </button>

                        {nights > 0 && (
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex justify-between">
                                    <span className="underline">₹{price.toLocaleString()} x {nights} nights</span>
                                    <span>₹{totalBase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="underline">Cleaning fee</span>
                                    <span>₹{cleaningFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-4 border-t border-gray-200">
                                    <span>Total before taxes</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
