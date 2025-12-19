import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaCar, FaUtensils,
    FaArrowLeft, FaHeart, FaShare, FaMinus, FaPlus, FaTimes, FaCheck,
    FaWater, FaUser, FaBed, FaBath, FaDoorOpen
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, differenceInDays } from 'date-fns';

export default function PropertyDetails() {
    const { id } = useParams();
    const [urlParams] = useSearchParams();
    const navigate = useNavigate();

    // -- STATE --
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookedDates, setBookedDates] = useState([]);
    const [holidays, setHolidays] = useState([]);

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

    // -- CONSTANTS --
    const PLACEHOLDERS = [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-68c894913d3e?q=80&w=1000&auto=format&fit=crop"
    ];

    // -- FETCH DATA --
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch for speed
                // Parallel fetch for speed
                const [propRes, bookedRes, holidayRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/properties/${id}`),
                    axios.get(`${API_BASE_URL}/api/properties/${id}/booked-dates`),
                    axios.get(`${API_BASE_URL}/api/holidays?property_id=${id}`)
                ]);

                setProperty(propRes.data);
                setBookedDates(bookedRes.data.booked_dates || []);
                setHolidays(holidayRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // -- HANDLERS --
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

    const rawImages = property?.images?.length ? property.images.map(img => img.image_url) : (property?.ImageUrl ? [property.ImageUrl] : []);
    const galleryImages = [...rawImages, ...PLACEHOLDERS].slice(0, 5);

    const openLightBox = (index) => { setPhotoIndex(index); setIsGalleryOpen(true); };
    const nextPhoto = (e) => { if (e) e.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % galleryImages.length); };
    const prevPhoto = (e) => { if (e) e.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); };

    // Keyboard Nav for Gallery
    useEffect(() => {
        if (!isGalleryOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'Escape') setIsGalleryOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGalleryOpen]);

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
                setIsDatePickerOpen(false);
            }
        }
    };

    const { user } = useAuth();

    const handleReserve = () => {
        if (!dateRange.from || !dateRange.to) { setIsDatePickerOpen(true); return; }

        const targetPath = `/book/${id}`;
        const bookingState = {
            checkIn: dateRange.from,
            checkOut: dateRange.to,
            guests: guests.adults + guests.children
        };

        if (!user) {
            navigate('/login', { state: { returnTo: targetPath, bookingState } });
            return;
        }
        navigate(targetPath, { state: bookingState });
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({ title: property.Name, text: `Check out ${property.Name}!`, url: window.location.href });
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
        }
    };

    // -- PRICING LOGIC --
    const calculateTotalPrice = () => {
        if (!dateRange.from || !dateRange.to) return 0;
        let total = 0;
        const days = differenceInDays(dateRange.to, dateRange.from);
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(dateRange.from);
            currentDate.setDate(currentDate.getDate() + i);
            const dayOfWeek = currentDate.getDay();

            let nightlyRate = parseFloat(property.Price || property.ResortWalaRate || 0) || 15000;

            // Check Holidays
            const appliedHoliday = holidays.find(h => {
                const check = new Date(currentDate); check.setHours(12, 0, 0, 0);
                const from = new Date(h.from_date); from.setHours(0, 0, 0, 0);
                const to = new Date(h.to_date); to.setHours(23, 59, 59, 999);
                return check >= from && check <= to;
            });

            if (appliedHoliday) {
                nightlyRate = Number(appliedHoliday.base_price);
            } else {
                if (dayOfWeek >= 1 && dayOfWeek <= 4 && property.price_mon_thu) nightlyRate = Number(property.price_mon_thu);
                else if ((dayOfWeek === 5 || dayOfWeek === 0) && property.price_fri_sun) nightlyRate = Number(property.price_fri_sun);
                else if (dayOfWeek === 6 && property.price_sat) nightlyRate = Number(property.price_sat);
            }
            total += nightlyRate;
        }
        return total;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;
    if (!property) return <div className="pt-32 pb-20 text-center">Property not found</div>;

    const price = parseFloat(property.Price || property.ResortWalaRate || 0) || 15000;
    const nights = (dateRange.from && dateRange.to) ? differenceInDays(dateRange.to, dateRange.from) : 0;
    const totalBase = calculateTotalPrice();
    const cleaningFee = 2500;
    const total = totalBase + cleaningFee;

    const googleMapSrc = property.GoogleMapLink?.match(/src="([^"]+)"/)?.[1] || property.GoogleMapLink;

    return (
        <div className="bg-white min-h-screen pb-20 pt-[80px]">
            {/* 1. HEADER */}
            <div className="container mx-auto px-4 py-6">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">{property.Name || "Luxury Stay"}</h1>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1 font-medium text-black">
                            <FaStar size={14} /> <span>{property.Rating || 4.8}</span>
                        </div>
                        <span className="underline font-medium hover:text-black cursor-pointer">{property.CityName}, {property.Location}</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleShare} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline font-medium">
                            <FaShare /> Share
                        </button>
                        <button onClick={() => setIsSaved(!isSaved)} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline font-medium">
                            <FaHeart className={isSaved ? "text-[#FF385C]" : "text-gray-600"} /> {isSaved ? "Saved" : "Save"}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. GALLERY */}
            <div className="container mx-auto px-4 mb-8">
                <div className="relative rounded-xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-4 grid-rows-2 h-[300px] md:h-[500px] gap-2">
                    <div className="col-span-1 md:col-span-2 row-span-2 relative cursor-pointer group" onClick={() => openLightBox(0)}>
                        <img src={galleryImages[0]} alt="Main" className="w-full h-full object-cover transition duration-300 group-hover:brightness-95" />
                    </div>
                    {galleryImages.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="relative cursor-pointer group hidden md:block" onClick={() => openLightBox(idx + 1)}>
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition duration-300 group-hover:brightness-95" />
                        </div>
                    ))}
                    <button onClick={() => openLightBox(0)} className="absolute bottom-4 right-4 bg-white border border-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:scale-105 transition flex items-center gap-2">
                        <FaPlus size={12} /> Show all photos
                    </button>
                </div>
            </div>

            {/* 3. MAIN CONTENT GRID */}
            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-10">

                    {/* QUICK STATS */}
                    <div className="flex items-center justify-between border-b border-gray-200 pb-6">
                        <div className="text-lg font-medium text-gray-900">
                            Entire property hosted by {property.ContactPerson || "ResortWala Host"}
                        </div>
                        <div className="hidden md:block w-12 h-12 bg-gray-200 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                        <div className="flex items-center gap-3 p-3 border rounded-xl hover:shadow-md transition">
                            <FaUser className="text-gray-500" />
                            <span className="font-medium text-sm">{property.MaxCapacity || 2} Guests</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-xl hover:shadow-md transition">
                            <FaDoorOpen className="text-gray-500" />
                            <span className="font-medium text-sm">{property.NoofRooms || 1} Bedrooms</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-xl hover:shadow-md transition">
                            <FaBed className="text-gray-500" />
                            <span className="font-medium text-sm">{property.NoofQueenBeds || 1} Beds</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-xl hover:shadow-md transition">
                            <FaBath className="text-gray-500" />
                            <span className="font-medium text-sm">{property.NoofBathRooms || 1} Baths</span>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                        <h3 className="font-semibold text-yellow-800 mb-1">Great for groups</h3>
                        <p className="text-sm text-yellow-700">This property is spacious and perfectly suited for large gatherings.</p>
                    </div>

                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-xl font-bold mb-4">About this place</h2>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.LongDescription}</p>
                    </div>

                    {/* AMENITIES */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-xl font-bold mb-6">What this place offers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Render explicitAmenities from onboarding_data if present */}
                            {property.onboarding_data?.amenities && Object.entries(property.onboarding_data.amenities).map(([key, val]) => {
                                if (!val) return null;
                                return (
                                    <div key={key} className="flex items-center gap-3 text-gray-700">
                                        <FaCheck className="text-green-500" />
                                        <span className="capitalize">{key.replace(/_/g, ' ')} {val !== true && typeof val !== 'boolean' ? `(${val})` : ''}</span>
                                    </div>
                                )
                            })}

                            {/* Fallback to standard DB columns if no onboarding amenities */}
                            {(!property.onboarding_data?.amenities) && (
                                <>
                                    {property.Breakfast && <div className="flex items-center gap-3"><FaUtensils /> Breakfast Included</div>}
                                    {property.Lunch && <div className="flex items-center gap-3"><FaUtensils /> Lunch Available</div>}
                                    {property.Dinner && <div className="flex items-center gap-3"><FaUtensils /> Dinner Available</div>}
                                    <div className="flex items-center gap-3"><FaSwimmingPool /> Swimming Pool</div>
                                    <div className="flex items-center gap-3"><FaWifi /> WiFi</div>
                                    <div className="flex items-center gap-3"><FaCar /> Parking</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ADDRESS & MAP */}
                    <div className="border-b border-gray-200 pb-8">
                        <h2 className="text-xl font-bold mb-4">Where you'll be</h2>
                        <p className="text-gray-700 mb-4">{property.Address}, {property.CityName}</p>
                        {googleMapSrc && (
                            <div className="w-full h-[300px] bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                                <iframe
                                    src={googleMapSrc}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        )}
                        {!googleMapSrc && <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-500 italic">Map view not available</div>}
                    </div>
                </div>

                {/* RIGHT COLUMN: STICKY BOOKING CARD */}
                <div className="relative">
                    <div className="sticky top-28 border border-gray-200 rounded-xl p-6 shadow-xl bg-white/95 backdrop-blur-md">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-2xl font-bold">₹{price.toLocaleString()}</span>
                                <span className="text-gray-600"> / night</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold">
                                <FaStar size={12} /> {property.Rating || 4.8}
                            </div>
                        </div>

                        {/* DATE PICKER TRIGGER */}
                        <div className="border border-gray-400 rounded-lg overflow-hidden mb-4" ref={datePickerRef}>
                            <div className="flex border-b border-gray-400 cursor-pointer" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                                <div className="flex-1 p-3 border-r border-gray-400 hover:bg-gray-50 transition">
                                    <label className="block text-[10px] font-bold text-gray-700">CHECK-IN</label>
                                    <div className="text-sm font-medium">{dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Add date'}</div>
                                </div>
                                <div className="flex-1 p-3 hover:bg-gray-50 transition">
                                    <label className="block text-[10px] font-bold text-gray-700">CHECK-OUT</label>
                                    <div className="text-sm font-medium">{dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Add date'}</div>
                                </div>
                            </div>
                        </div>

                        {/* POPUP CALENDAR */}
                        <AnimatePresence>
                            {isDatePickerOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-20 right-0 bg-white rounded-xl shadow-2xl p-4 z-50 border border-gray-100"
                                >
                                    <style>{`
                                        .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #FF385C; margin: 0; }
                                        .rdp-day_selected { background-color: #FF385C !important; color: white !important; font-weight: bold; }
                                    `}</style>
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onDayClick={handleDateSelect}
                                        numberOfMonths={1}
                                        defaultMonth={dateRange.from || new Date()}
                                        disabled={[{ before: new Date() }]}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleReserve}
                            disabled={!dateRange.from || !dateRange.to}
                            className={`w-full font-bold py-3.5 rounded-lg transition mb-4 text-white text-lg
                                ${(!dateRange.from || !dateRange.to) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF385C] hover:bg-[#D90B3E] shadow-lg shadow-pink-200'}`}
                        >
                            Reserve
                        </button>

                        {nights > 0 && (
                            <div className="space-y-3 pt-4 border-t border-gray-100 text-gray-600">
                                <div className="flex justify-between">
                                    <span className="underline">₹{price.toLocaleString()} x {nights} nights</span>
                                    <span>₹{totalBase.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="underline">Cleaning fee</span>
                                    <span>₹{cleaningFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-4 border-t border-gray-200 text-gray-900 text-lg">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                        <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 z-50"><FaTimes size={20} /></button>
                        <button onClick={prevPhoto} className="absolute left-6 text-white p-4 rounded-full bg-white/10 hover:bg-white/20 z-50"><FaArrowLeft size={24} /></button>
                        <button onClick={nextPhoto} className="absolute right-6 text-white p-4 rounded-full bg-white/10 hover:bg-white/20 z-50 rotate-180"><FaArrowLeft size={24} /></button>
                        <motion.img
                            key={photoIndex} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            src={galleryImages[photoIndex]} className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
                        />
                        <div className="absolute bottom-6 flex gap-2">
                            {galleryImages.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === photoIndex ? 'bg-white w-4' : 'bg-gray-500'}`}></div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
