import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaCar, FaUtensils,
    FaArrowLeft, FaHeart, FaShare, FaMinus, FaPlus, FaTimes, FaCheck,
    FaWater, FaUser, FaBed, FaBath, FaDoorOpen, FaShieldAlt, FaMedal,
    FaWhatsapp, FaFacebook, FaTwitter, FaEnvelope, FaLink, FaCopy
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
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
                const [propRes, bookedRes, holidayRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/properties/${id}`),
                    axios.get(`${API_BASE_URL}/properties/${id}/booked-dates`),
                    axios.get(`${API_BASE_URL}/holidays?property_id=${id}`)
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

    const handleShare = () => {
        setIsShareModalOpen(true);
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
            {/* 1. HEADER & GALLERY */}
            <div className="container mx-auto px-4 lg:px-8 py-6 max-w-7xl">
                {/* Title Section */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif mb-3 leading-tight">
                        {property.Name || "Luxury Stay"}
                    </h1>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-1.5 font-bold text-black">
                                <FaStar size={14} className="text-secondary" />
                                <span>{property.Rating || 4.8}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-400 mx-1"></span>
                                <span className="underline cursor-pointer">128 reviews</span>
                            </div>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <div className="flex items-center gap-1.5 text-black">
                                <FaMedal size={14} className="text-primary" />
                                <span>Superhost</span>
                            </div>
                            <span className="hidden md:inline text-gray-300">|</span>
                            <span className="underline text-gray-600 hover:text-black cursor-pointer">
                                {property.CityName}, {property.Location}, India
                            </span>
                        </div>
                        <div className="flex gap-2 text-sm font-semibold">
                            <button onClick={handleShare} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300">
                                <FaShare /> Share
                            </button>
                            <button onClick={() => setIsSaved(!isSaved)} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300">
                                <FaHeart className={isSaved ? "text-[#FF385C]" : "text-transparent stroke-black stroke-2"} /> {isSaved ? "Saved" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* GALLERY GRID (1 Large + 4 Small) */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-4 grid-rows-2 h-[300px] md:h-[500px] gap-2 mb-8">
                    <div className="col-span-1 md:col-span-2 row-span-2 relative cursor-pointer group" onClick={() => openLightBox(0)}>
                        <img src={galleryImages[0]} alt="Main" className="w-full h-full object-cover transition duration-500 group-hover:block" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>
                    {galleryImages.slice(1, 5).map((img, idx) => (
                        <div key={idx} className="relative cursor-pointer group hidden md:block" onClick={() => openLightBox(idx + 1)}>
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition duration-500" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        </div>
                    ))}
                    <button
                        onClick={() => openLightBox(0)}
                        className="absolute bottom-6 right-6 bg-white border border-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition flex items-center gap-2"
                    >
                        <FaPlus size={12} /> Show all photos
                    </button>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8 md:gap-12 items-start">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">

                        {/* HOST INFO */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                                    Entire villa hosted by {property.ContactPerson || "ResortWala Host"}
                                </h2>
                                <ol className="flex text-sm text-gray-500 space-x-1">
                                    <li>{property.MaxGuests || 6} guests</li>
                                    <li>• {property.Bedrooms || 3} bedrooms</li>
                                    <li>• {property.Bedrooms || 3} beds</li>
                                    <li>• {property.Bathrooms || 3} baths</li>
                                </ol>
                            </div>
                            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white text-xl font-black border-4 border-white shadow-lg relative">
                                {(property.ContactPerson || "H").charAt(0)}
                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full border-2 border-white">
                                    <FaMedal size={10} />
                                </div>
                            </div>
                        </div>

                        {/* HIGHLIGHTS */}
                        <div className="space-y-6 border-b border-gray-100 pb-6">
                            <div className="flex gap-4">
                                <FaShieldAlt className="text-gray-900 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-gray-900">Secure & Private</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Your stay is protected with 24/7 security and complete privacy for your group.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <FaSwimmingPool className="text-gray-900 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-gray-900">Private Pool</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Enjoy your own private pool with stunning views, maintained daily.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <FaWifi className="text-gray-900 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-gray-900">Fast Wifi</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Stream 4K video and video call with ease (100 Mbps+).</p>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="border-b border-gray-100 pb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 font-serif">About this place</h2>
                            <p className="text-gray-700 leading-relaxed text-lg font-light whitespace-pre-line">
                                {property.LongDescription || "Experience the ultimate luxury getaway..."}
                            </p>
                            <button className="mt-4 font-bold underline flex items-center gap-1">Show more <FaPlus size={10} /></button>
                        </div>

                        {/* AMENITIES */}
                        <div className="border-b border-gray-100 pb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">What this place offers</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                                {/* Explicit Amenities from Onboarding Data */}
                                {property.onboarding_data?.amenities && Object.entries(property.onboarding_data.amenities).map(([key, val]) => {
                                    if (!val) return null;
                                    return (
                                        <div key={key} className="flex items-center gap-4 text-gray-700 group cursor-default">
                                            <FaCheck className="text-gray-900 text-lg group-hover:scale-110 transition" />
                                            <span className="capitalize text-base group-hover:underline decoration-gray-300 underline-offset-4">{key.replace(/_/g, ' ')} {val !== true && typeof val !== 'boolean' ? `(${val})` : ''}</span>
                                        </div>
                                    )
                                })}

                                {/* Fallback Standard Columns */}
                                {(!property.onboarding_data?.amenities) && (
                                    <>
                                        <div className="flex items-center gap-4 text-gray-700"><FaUtensils size={20} className="text-gray-900" /> <span>Kitchen</span></div>
                                        <div className="flex items-center gap-4 text-gray-700"><FaWifi size={20} className="text-gray-900" /> <span>Fast Wifi</span></div>
                                        <div className="flex items-center gap-4 text-gray-700"><FaSwimmingPool size={20} className="text-gray-900" /> <span>Private Pool</span></div>
                                        <div className="flex items-center gap-4 text-gray-700"><FaCar size={20} className="text-gray-900" /> <span>Free parking on premises</span></div>
                                        <div className="flex items-center gap-4 text-gray-700"><FaWater size={20} className="text-gray-900" /> <span>Lake access</span></div>
                                        <div className="flex items-center gap-4 text-gray-700"><FaCheck size={20} className="text-gray-900" /> <span>Air conditioning</span></div>
                                    </>
                                )}
                            </div>
                            <button className="mt-8 border border-black rounded-lg px-6 py-3 font-bold hover:bg-gray-50 transition">
                                Show all amenities
                            </button>
                        </div>

                        {/* MAP */}
                        <div className="pb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-2 font-serif">Where you'll be</h2>
                            <p className="text-gray-600 mb-6">{property.CityName}, {property.Location}, India</p>

                            {googleMapSrc ? (
                                <div className="w-full h-[450px] bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group">
                                    <iframe
                                        src={googleMapSrc}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="grayscale group-hover:grayscale-0 transition duration-700"
                                    ></iframe>
                                </div>
                            ) : (
                                <div className="w-full h-[300px] bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                    Map unavailable
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STICKY BOOKING CARD */}
                    <div className="relative h-full hidden lg:block">
                        <div className="sticky top-28 border border-gray-200 rounded-2xl p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] bg-white">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-2xl font-bold">₹{price.toLocaleString()}</span>
                                    <span className="text-gray-600"> / night</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-bold underline cursor-pointer">
                                    <FaStar size={10} /> {property.Rating || 4.8} · 128 reviews
                                </div>
                            </div>

                            {/* DATE PICKER TRIGGER */}
                            <div className="border border-gray-400 rounded-lg overflow-hidden mb-4 relative" ref={datePickerRef}>
                                <div className="flex border-b border-gray-400 cursor-pointer" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                                    <div className="flex-1 p-3 border-r border-gray-400 hover:bg-gray-50 transition relative">
                                        <label className="block text-[10px] font-bold text-gray-700 tracking-wider">CHECK-IN</label>
                                        <div className="text-sm font-medium text-gray-900">{dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Add date'}</div>
                                    </div>
                                    <div className="flex-1 p-3 hover:bg-gray-50 transition relative">
                                        <label className="block text-[10px] font-bold text-gray-700 tracking-wider">CHECK-OUT</label>
                                        <div className="text-sm font-medium text-gray-900">{dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Add date'}</div>
                                    </div>
                                </div>
                                <div className="p-3 hover:bg-gray-50 cursor-pointer transition">
                                    <label className="block text-[10px] font-bold text-gray-700 tracking-wider">GUESTS</label>
                                    <div className="text-sm font-medium text-gray-900">{guests.adults + guests.children} guests</div>
                                </div>
                            </div>

                            {/* POPUP CALENDAR */}
                            <AnimatePresence>
                                {isDatePickerOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute top-0 right-0 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-gray-100 w-[350px]"
                                    >
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <h4 className="font-bold text-lg">Select Dates</h4>
                                            <button onClick={() => setIsDatePickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><FaTimes /></button>
                                        </div>
                                        <style>{`
                                            .rdp { --rdp-cell-size: 40px; --rdp-accent-color: #0D9488; margin: 0; }
                                            .rdp-day_selected { background-color: #0D9488 !important; color: white !important; font-weight: bold; }
                                            .rdp-day_today { color: #D97706; font-weight: bold; }
                                        `}</style>
                                        <div className="flex justify-center">
                                            <DayPicker
                                                mode="range"
                                                selected={dateRange}
                                                onDayClick={handleDateSelect}
                                                numberOfMonths={1}
                                                defaultMonth={dateRange.from || new Date()}
                                                disabled={[{ before: new Date() }]}
                                            />
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button onClick={() => setIsDatePickerOpen(false)} className="text-sm underline font-bold px-4 py-2 hover:bg-gray-100 rounded-lg">Close</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={handleReserve}
                                disabled={!dateRange.from || !dateRange.to}
                                className={`w-full font-bold py-3.5 rounded-xl transition mb-4 text-white text-lg
                                    ${(!dateRange.from || !dateRange.to) ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' : 'bg-[#FF385C] hover:bg-[#D90B3E] shadow-lg shadow-pink-200 active:scale-95'}`}
                            >
                                Reserve
                            </button>

                            {nights > 0 && (
                                <div className="space-y-4 pt-4 text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="underline">₹{price.toLocaleString()} x {nights} nights</span>
                                        <span>₹{totalBase.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="underline">Cleaning fee</span>
                                        <span>₹{cleaningFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="underline">Service fee</span>
                                        <span>₹0</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-4 border-t border-gray-200 text-gray-900 text-lg">
                                        <span>Total before taxes</span>
                                        <span>₹{total.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                </div>

                {/* MOBILE FIXED FOOTER (Visible only on mobile) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 z-40 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
                    <div>
                        <div className="font-bold text-lg">₹{price.toLocaleString()} <span className="text-sm font-normal text-gray-600">/ night</span></div>
                        <div className="text-xs font-bold underline flex items-center gap-1"><FaStar size={10} /> {property.Rating || 4.8} · 19 reviews</div>
                    </div>
                    <button
                        onClick={handleReserve}
                        className="bg-[#FF385C] text-white px-8 py-3 rounded-lg font-bold shadow-lg"
                    >
                        Reserve
                    </button>
                </div>
            </div>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm">
                        <button onClick={() => setIsGalleryOpen(false)} className="absolute top-6 right-6 text-white p-3 rounded-full bg-white/10 hover:bg-white/20 z-50 transition"><FaTimes size={20} /></button>
                        <button onClick={prevPhoto} className="absolute left-6 text-white p-4 rounded-full bg-white/10 hover:bg-white/20 z-50 transition"><FaArrowLeft size={24} /></button>
                        <button onClick={nextPhoto} className="absolute right-6 text-white p-4 rounded-full bg-white/10 hover:bg-white/20 z-50 transition rotate-180"><FaArrowLeft size={24} /></button>

                        <motion.img
                            key={photoIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            src={galleryImages[photoIndex]}
                            className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"
                        />

                        <div className="absolute bottom-10 flex gap-2">
                            {galleryImages.map((_, i) => (
                                <button key={i} onClick={() => setPhotoIndex(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === photoIndex ? 'bg-white w-6' : 'bg-gray-500 hover:bg-gray-400'}`} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                property={property}
            />
        </div >
    );
}

// -- SHARE MODAL COMPONENT --
function ShareModal({ isOpen, onClose, property }) {
    if (!isOpen) return null;

    const url = window.location.href;
    const title = `Check out ${property?.Name} on ResortWala!`;
    const text = `I found this amazing place to stay: ${property?.Name} in ${property?.CityName}.`;

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: <FaWhatsapp size={24} />,
            color: 'bg-[#25D366]',
            action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        },
        {
            name: 'Facebook',
            icon: <FaFacebook size={24} />,
            color: 'bg-[#1877F2]',
            action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        },
        {
            name: 'Twitter',
            icon: <FaTwitter size={24} />,
            color: 'bg-[#1DA1F2]',
            action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
        },
        {
            name: 'Email',
            icon: <FaEnvelope size={24} />,
            color: 'bg-gray-600',
            action: () => window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`
        },
    ];

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        } catch (err) {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="font-bold text-lg">Share this place</div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><FaTimes /></button>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <img
                                src={property?.ImageUrl || "https://source.unsplash.com/random/100x100/?hotel"}
                                alt={property?.Name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                            <div>
                                <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{property?.Name}</h3>
                                <p className="text-xs text-gray-500">{property?.CityName}, India</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {shareOptions.map((opt) => (
                                <button
                                    key={opt.name}
                                    onClick={opt.action}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition duration-200 group"
                                >
                                    <div className={`${opt.color} text-white p-2 rounded-lg`}>
                                        {opt.icon}
                                    </div>
                                    <span className="font-medium text-sm text-gray-700">{opt.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <FaLink className="text-gray-400" />
                                <input
                                    type="text"
                                    readOnly
                                    value={url}
                                    className="bg-transparent w-full text-xs text-gray-500 outline-none truncate font-medium"
                                />
                                <button
                                    onClick={copyLink}
                                    className="text-xs font-bold text-black whitespace-nowrap hover:underline ml-2"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

