import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import analytics from '../utils/analytics';
import {
    FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaCar, FaUtensils,
    FaArrowLeft, FaArrowRight, FaHeart, FaShare, FaMinus, FaPlus, FaTimes, FaCheck,
    FaWater, FaUser, FaBed, FaBath, FaDoorOpen, FaShieldAlt, FaMedal, FaUsers,
    FaWhatsapp, FaFacebook, FaTwitter, FaEnvelope, FaLink, FaCopy, FaPhone, FaGlobe,
    FaSnowflake, FaTv, FaCouch, FaRestroom, FaMoneyBillWave, FaChild, FaTicketAlt,
    FaClock, FaBan, FaDog, FaSmoking, FaWineGlass, FaInfoCircle, FaCamera, FaQuoteLeft,
    FaCloudRain, FaMusic, FaTree, FaFire, FaBolt, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaHotTub, FaLanguage, FaGamepad
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, differenceInDays, isWithinInterval, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const PROPERTY_RULES = [
    "Primary guest must be 18+",
    "Valid ID proof required",
    "Pets allowed",
    "Outside food allowed",
    "No show no refund",
    "Offers cannot be combined",
    "Smoking within the premises is allowed",
    "Alcohol consumption is allowed within the property premises",
    "Non-veg food allowed",
    "Allows private parties or events",
    "Property is not accessible to guests who use a wheelchair"
];

const AMENITY_METADATA = {
    big_pools: { label: 'Big Pools', icon: <FaSwimmingPool className="text-blue-500" /> },
    small_pools: { label: 'Small Pools', icon: <FaSwimmingPool className="text-teal-500" /> },
    big_slides: { label: 'Big Slides', icon: <FaWater className="text-orange-500" /> },
    small_slides: { label: 'Small Slides', icon: <FaWater className="text-yellow-500" /> },
    wavepool: { label: 'Wavepool', icon: <FaWater className="text-blue-600" /> },
    rain_dance: { label: 'Rain Dance', icon: <FaCloudRain className="text-purple-500" /> },
    dj_system: { label: 'DJ System', icon: <FaMusic className="text-pink-500" /> },
    lazy_river: { label: 'Lazy River', icon: <FaWater className="text-blue-400" /> },
    crazy_river: { label: 'Crazy River', icon: <FaWater className="text-red-500" /> },
    kids_area: { label: 'Kids Area', icon: <FaChild className="text-green-500" /> },
    waterfall: { label: 'Waterfall', icon: <FaWater className="text-cyan-500" /> },
    ice_bucket: { label: 'Ice Bucket', icon: <FaSnowflake className="text-sky-300" /> },
    parking: { label: 'Free Parking', icon: <FaCar className="text-gray-600" /> },
    selfie_point: { label: 'Selfie Point', icon: <FaCamera className="text-red-500" /> },
    garden: { label: 'Garden/Lawn', icon: <FaTree className="text-green-600" /> },
    bonfire: { label: 'Bonfire', icon: <FaFire className="text-orange-600" /> },
    kitchen: { label: 'Kitchen Access', icon: <FaUtensils className="text-gray-500" /> },
    wifi: { label: 'Free Wi-Fi', icon: <FaWifi className="text-blue-500" /> },
    power_backup: { label: 'Power Backup', icon: <FaBolt className="text-yellow-500" /> },
    laundry: { label: 'Laundry', icon: <FaTshirt className="text-blue-400" /> },
    dining: { label: 'Dining Area', icon: <FaUtensils className="text-orange-500" /> },
    cctv: { label: 'CCTV', icon: <FaVideo className="text-gray-700" /> },
    wheelchair: { label: 'Wheelchair Access', icon: <FaWheelchair className="text-blue-600" /> },
    first_aid: { label: 'First Aid', icon: <FaMedkit className="text-red-500" /> },
    pool_towels: { label: 'Pool Towels', icon: <FaUmbrellaBeach className="text-yellow-500" /> },
    seating_area: { label: 'Seating Area', icon: <FaChair className="text-brown-500" /> },
    security: { label: 'Security Guard', icon: <FaUserShield className="text-blue-900" /> },
    restaurant: { label: 'Restaurant', icon: <FaUtensils className="text-red-600" /> },
    steam_sauna: { label: 'Steam & Sauna', icon: <FaHotTub className="text-gray-500" /> },
    barbeque: { label: 'Barbeque', icon: <FaFire className="text-orange-600" /> },
    multilingual: { label: 'Multilingual Staff', icon: <FaLanguage className="text-blue-400" /> },
    game_room: { label: 'Game Room', icon: <FaGamepad className="text-purple-600" /> }
};

export default function PropertyDetails() {
    const { id } = useParams();
    const [urlParams] = useSearchParams();
    const navigate = useNavigate();

    // -- STATE --
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

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
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const datePickerRef = useRef(null);
    const [isSaved, setIsSaved] = useState(false);
    const [mealSelection, setMealSelection] = useState({ veg: 0, nonVeg: 0, jain: 0 });

    // -- REFS FOR SCROLLING --
    const sections = {
        overview: useRef(null),
        amenities: useRef(null),
        rooms: useRef(null),
        policies: useRef(null),
        reviews: useRef(null),
        location: useRef(null)
    };

    const scrollToSection = (key) => {
        setActiveTab(key);
        const element = sections[key].current;
        if (element) {
            const yOffset = -180; // Adjusted for sticky header + tabs
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // -- FETCH DATA --
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/properties/${id}`);
                setProperty(response.data);
            } catch (error) {
                console.error('Failed to fetch property:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // -- AVAILABILITY CHECK --
    const isDateUnavailable = (checkDate) => {
        if (!property?.booked_dates) return false;
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        return property.booked_dates.includes(dateStr);
    };

    const checkRangeAvailability = (from, to) => {
        if (!from) return true;

        // Single day check (from)
        if (isDateUnavailable(from)) return false;

        // If 'to' is also selected, check range
        if (to) {
            const days = differenceInDays(to, from);
            for (let i = 0; i < days; i++) { // Check nights (excluding checkout day)
                const d = new Date(from);
                d.setDate(d.getDate() + i);
                if (isDateUnavailable(d)) return false;
            }
        }
        return true;
    };

    // Validate URL Params on Load / Update
    useEffect(() => {
        if (property && dateRange.from) {
            const available = checkRangeAvailability(dateRange.from, dateRange.to);
            if (!available) {
                toast.error("Selected dates are unavailable.", { id: 'avail-error' });
                setDateRange({ from: undefined, to: undefined });
                // Clean URL
                navigate(`./`, { replace: true });
            }
        }
    }, [property, dateRange.from, dateRange.to]);

    // Track page view when property loads
    useEffect(() => {
        if (property) {
            analytics.propertyView(property.PropertyId, property.Name, {
                category: property.PropertyType,
                location: property.City
            });
        }
    }, [property]);

    // -- HANDLERS --
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // -- SCROLL SPY --
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200;
            for (const key in sections) {
                const element = sections[key].current;
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveTab(key);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const rawImages = property?.images?.length ? property.images.map(img => img.image_url) : (property?.image_url ? [property.image_url] : []);
    const galleryImages = rawImages;

    const handleGalleryOpen = (index = 0) => {
        setPhotoIndex(index);
        setIsGalleryOpen(true);

        analytics.track('gallery_open', 'engagement', {
            property_id: property.PropertyId,
            initial_image: index
        });
    };
    const nextPhoto = (e) => { e?.stopPropagation(); setPhotoIndex((prev) => (prev + 1) % galleryImages.length); };
    const prevPhoto = (e) => { e?.stopPropagation(); setPhotoIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length); };

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
            if (day < dateRange.from) { setDateRange({ from: day, to: undefined }); }
            else { setDateRange({ from: dateRange.from, to: day }); setIsDatePickerOpen(false); }
        }
    };

    const { user } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;

    if (!property) {
        // Redirect to home if property not found
        setTimeout(() => navigate('/', { replace: true }), 0);
        return null;
    }

    const ob = typeof property.onboarding_data === 'string' ? JSON.parse(property.onboarding_data) : (property.onboarding_data || {});
    const pricing = ob.pricing || {};
    const roomConfig = ob.roomConfig || { livingRoom: {}, bedrooms: [] };
    const isWaterpark = property.PropertyType === 'Waterpark';

    const handleReserve = () => {
        if (!dateRange.from || (!isWaterpark && !dateRange.to)) { setIsDatePickerOpen(true); return; }

        // Final Availability Check
        if (!checkRangeAvailability(dateRange.from, dateRange.to)) {
            toast.error("One or more selected dates are already booked.");
            return;
        }

        handleCheckout();
    };

    const safeFloat = (val, def = 0) => {
        const n = parseFloat(val);
        return isNaN(n) ? def : n;
    };

    const PRICE_WEEKDAY = safeFloat(property.price_mon_thu || pricing.weekday || property.Price, 0);
    const PRICE_FRISUN = safeFloat(property.price_fri_sun || pricing.weekend || property.Price, 0);
    const PRICE_SATURDAY = safeFloat(property.price_sat || pricing.saturday || property.Price, 0);
    const EXTRA_GUEST_CHARGE = safeFloat(pricing.extraGuestCharge, 1000);
    const FOOD_CHARGE = safeFloat(ob.foodRates?.perPerson || pricing.foodPricePerPerson, 1000);
    const GST_PERCENTAGE = safeFloat(property.gst_percentage, 18);

    const calculateBreakdown = () => {
        if (!dateRange.from) return null;
        if (!isWaterpark && !dateRange.to) return null;

        const effectiveTo = dateRange.to || dateRange.from;
        let nights = differenceInDays(effectiveTo, dateRange.from);
        if (isWaterpark && nights === 0) nights = 1;
        if (nights <= 0) return null;

        let totalVillaRate = 0;
        let totalAdultTicket = 0;
        let totalChildTicket = 0;

        for (let i = 0; i < nights; i++) {
            const d = new Date(dateRange.from); d.setDate(d.getDate() + i);
            const w = d.getDay();
            const isWeekend = (w === 0 || w === 6 || w === 5);

            let rate = PRICE_WEEKDAY;
            if (w === 6) rate = PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
            else if (w === 0 || w === 5) rate = PRICE_FRISUN || PRICE_WEEKDAY;
            totalVillaRate += rate;

            if (isWaterpark) {
                let aRate = PRICE_WEEKDAY;
                if (w === 6) aRate = PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
                else if (w === 0 || w === 5) aRate = PRICE_FRISUN || PRICE_WEEKDAY;

                let cRate = parseFloat(ob.childCriteria?.monFriPrice || ob.childCriteria?.price || 500);
                if (isWeekend && ob.childCriteria?.satSunPrice) {
                    cRate = parseFloat(ob.childCriteria.satSunPrice);
                }

                totalAdultTicket += (aRate * guests.adults);
                totalChildTicket += (cRate * guests.children);
            }
        }

        if (isWaterpark) {
            const taxableAmount = totalAdultTicket + totalChildTicket;
            const gstAmount = (taxableAmount * GST_PERCENTAGE) / 100;
            return { nights, totalAdultTicket, totalChildTicket, gstAmount, grantTotal: taxableAmount + gstAmount };
        }

        const totalGuests = guests.adults + guests.children;
        const extraGuests = Math.max(0, totalGuests - (parseInt(pricing.extraGuestLimit) || 12));
        const totalExtra = extraGuests * EXTRA_GUEST_CHARGE * nights;

        // Food Calculation
        const VEG_RATE = safeFloat(ob.foodRates?.veg || FOOD_CHARGE, 1000);
        const NONVEG_RATE = safeFloat(ob.foodRates?.nonVeg || ob.foodRates?.nonveg || FOOD_CHARGE, 1200); // Fallback logic
        const JAIN_RATE = safeFloat(ob.foodRates?.jain || VEG_RATE, 1000);

        const totalFood = ((mealSelection.veg * VEG_RATE) + (mealSelection.nonVeg * NONVEG_RATE) + (mealSelection.jain * JAIN_RATE)) * nights;

        const taxableAmount = totalVillaRate + totalExtra + totalFood;
        const gstAmount = (taxableAmount * GST_PERCENTAGE) / 100;

        return {
            nights,
            totalVillaRate,
            extraGuests,
            totalExtra,
            totalFood,
            gstAmount,
            grantTotal: taxableAmount + gstAmount,
            rates: { veg: VEG_RATE, nonVeg: NONVEG_RATE, jain: JAIN_RATE } // Pass rates for UI
        };
    };
    const priceBreakdown = calculateBreakdown();
    const googleMapSrc = property.GoogleMapLink?.match(/src="([^"]+)"/)?.[1] || property.GoogleMapLink;

    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleCheckout = () => {
        if (!property) return;

        analytics.bookingAttempt(property.PropertyId, dateRange, guests);

        if (!user) {
            navigate('/login', {
                state: {
                    returnTo: `/book/${property.PropertyId}`,
                    checkoutData: {
                        propertyId: property.PropertyId,
                        propertyName: property.Name,
                        dateRange,
                        guests,
                        totalCost: priceBreakdown?.grantTotal
                    }
                }
            });
            return;
        }

        navigate(`/book/${property.PropertyId}`, {
            state: {
                property,
                dateRange,
                guests,
                breakdown: priceBreakdown
            }
        });
    };

    return (
        <div className="bg-white min-h-screen pb-20 pt-[80px]">
            {/* 1. HERO GALLERY */}
            <div className="container mx-auto px-4 lg:px-8 py-6 max-w-7xl">
                <Header property={property} isSaved={isSaved} setIsSaved={setIsSaved} setIsShareModalOpen={setIsShareModalOpen} user={user} navigate={navigate} location={window.location} />

                {galleryImages.length > 0 ? (
                    <div className="rounded-2xl overflow-hidden shadow-sm h-[350px] md:h-[500px] mb-8 grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 relative">
                        {/* Main Image */}
                        <div className="col-span-1 md:col-span-2 row-span-2 relative cursor-pointer group overflow-hidden" onClick={() => handleGalleryOpen(0)}>
                            <img src={galleryImages[0]} alt="Main" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>

                        {/* Side Images */}
                        {[1, 2, 3, 4].map((idx) => (
                            <div key={idx} className={`hidden md:block col-span-1 row-span-1 relative cursor-pointer group overflow-hidden ${idx === 2 ? 'rounded-tr-2xl' : ''} ${idx === 4 ? 'rounded-br-2xl' : ''}`} onClick={() => handleGalleryOpen(idx)}>
                                <img src={galleryImages[idx] || galleryImages[0]} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                                {idx === 4 && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition">
                                        <div className="flex flex-col gap-2 scale-90 md:scale-100">
                                            <span className="text-white font-bold text-xs md:text-sm border border-white/50 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
                                                <FaCamera /> {galleryImages.length} Photos
                                            </span>
                                            {(property.video_url || property.VideoUrl || property.videos?.length > 0) && (
                                                <span onClick={(e) => { e.stopPropagation(); setIsVideoOpen(true); }} className="text-white font-bold text-xs md:text-sm border border-white/50 bg-red-600/40 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 hover:bg-red-600/60 transition">
                                                    <FaVideo /> Video Tour
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Mobile Badge */}
                        <div className="absolute bottom-4 right-4 md:hidden flex gap-2">
                            {(property.video_url || property.VideoUrl || property.videos?.length > 0) && (
                                <button onClick={(e) => { e.stopPropagation(); setIsVideoOpen(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2">
                                    <FaVideo /> Video
                                </button>
                            )}
                            <button onClick={() => handleGalleryOpen(0)} className="bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-lg text-xs font-bold shadow-lg border border-gray-200 flex items-center gap-2">
                                <FaCamera /> {galleryImages.length}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-[300px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-8 border-2 border-dashed">
                        <div className="text-center">
                            <FaCamera size={40} className="mx-auto mb-2 opacity-20" />
                            <p>No photos available for this property.</p>
                        </div>
                    </div>
                )}

                {/* 2. STICKY TABS */}
                <div className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 mb-8 -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex gap-8 overflow-x-auto no-scrollbar py-4 font-medium text-gray-500 text-sm md:text-base">
                        {['Overview', 'Amenities', !isWaterpark && 'Rooms', 'Policies', property.reviews?.length > 0 && 'Reviews', 'Location'].filter(Boolean).map((tab) => (
                            <button key={tab} onClick={() => scrollToSection(tab.toLowerCase())} className={`whitespace-nowrap pb-1 border-b-2 transition ${activeTab === tab.toLowerCase() ? 'border-black text-black font-bold' : 'border-transparent hover:text-gray-800'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8 md:gap-12 items-start">
                    <div className="space-y-8">
                        {/* OVERVIEW */}
                        <section ref={sections.overview} className="scroll-mt-32">
                            <div className="flex items-start justify-between pb-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{property.display_name || property.Name}</h2>
                                    <p className="text-gray-500 text-sm">
                                        {property.PropertyType} · {property.Occupancy || property.MaxCapacity} - {property.MaxCapacity} guests
                                        {!isWaterpark && <> · {roomConfig.bedrooms?.length || property.NoofRooms} bedrooms · {roomConfig.bedrooms?.filter(r => r.bathroom).length || 0} bathrooms</>}
                                    </p>
                                </div>
                            </div>
                            {ob.shortDescription && (
                                <div className="py-6 border-b border-gray-100">
                                    <p className="text-gray-700 italic text-lg leading-relaxed">{ob.shortDescription}</p>
                                </div>
                            )}
                            <div className="py-8 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 font-serif flex items-center gap-2">
                                    <FaInfoCircle className="text-gray-400" /> About this property
                                </h3>
                                {property.LongDescription ? (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                        <div className="relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                            <FaQuoteLeft className="text-gray-200 text-4xl mb-4 absolute top-6 left-6 -z-0 opacity-50" />
                                            <p className="text-gray-700 leading-loose whitespace-pre-line text-lg font-light relative z-10 font-sans">
                                                {property.LongDescription}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">Description not provided.</div>
                                )}
                            </div>
                            {isWaterpark && (
                                <div className="py-4 border-b border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-2"><FaMedal className="text-[#FF385C]" /> What's Included</h3>
                                    {ob.inclusions && Object.keys(ob.inclusions).length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(ob.inclusions).map(([key, val]) => (val === true) && (
                                                <div key={key} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                                                    <div className="bg-white p-2 rounded-full text-green-600"><FaCheck size={12} /></div>
                                                    <span className="font-semibold text-gray-900 uppercase text-sm mt-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                </div>
                                            ))}
                                            {Object.entries(ob.inclusions).map(([key, val]) => (typeof val === 'string' && val !== 'Not Included') && (
                                                <div key={key} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                    <div className="bg-white p-2 rounded-full text-blue-600"><FaUtensils size={12} /></div>
                                                    <div>
                                                        <span className="font-semibold text-blue-900 block capitalize">{key}</span>
                                                        <span className="text-xs text-blue-600">{val}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="text-gray-400 italic">No specific inclusions listed.</div>}
                                </div>
                            )}
                        </section>

                        {/* AMENITIES */}


                        {/* AMENITIES */}
                        <section ref={sections.amenities} className="scroll-mt-32 pb-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">What this place offers</h2>
                            {ob.amenities && Object.keys(ob.amenities).length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 mb-6">
                                    {Object.entries(ob.amenities).map(([key, val]) => {
                                        if (!val) return null;
                                        const meta = AMENITY_METADATA[key];
                                        return (
                                            <div key={key} className="flex items-center gap-3 text-gray-700 capitalize group">
                                                <div className="text-xl group-hover:scale-110 transition">{meta ? meta.icon : <FaCheck className="text-gray-400" />}</div>
                                                <span className="group-hover:font-medium transition">{meta ? meta.label : key.replace(/_/g, ' ')} {Number.isInteger(val) && val > 1 ? `(${val})` : ''}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                            {/* Other Attractions */}
                            {Array.isArray(ob.otherAttractions) && ob.otherAttractions.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="font-bold text-gray-900 mb-3">Other Attractions</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                                        {ob.otherAttractions.map((attr, idx) => (
                                            <li key={idx}>{attr}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>





                        <section ref={sections.policies} className="scroll-mt-32 pb-8 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">House Rules & Policies</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm"><FaClock /></div>
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">Check-in</p><p className="font-bold text-lg">{ob.checkInTime ? format(new Date(`2000-01-01T${ob.checkInTime}`), 'h:mm a') : '2:00 PM'}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm"><FaClock /></div>
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">Check-out</p><p className="font-bold text-lg">{ob.checkOutTime ? format(new Date(`2000-01-01T${ob.checkOutTime}`), 'h:mm a') : '11:00 AM'}</p></div>
                                </div>
                            </div>

                            {/* Other Rules */}
                            {((ob.otherRules && ob.otherRules.length > 0) || property.PropertyRules) && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-900">Additional Rules</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                                        {ob.otherRules && ob.otherRules.map((rule, idx) => (
                                            <li key={idx}>{rule}</li>
                                        ))}
                                        {/* Fallback to legacy PropertyRules string if array is empty */}
                                        {(!ob.otherRules || ob.otherRules.length === 0) && property.PropertyRules && (
                                            <li>{property.PropertyRules}</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </section>



                        {!isWaterpark && (
                            <section ref={sections.rooms} className="scroll-mt-32 pb-8 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Room Details</h2>
                                {roomConfig.bedrooms?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <RoomCard name="Living Room" details={roomConfig.livingRoom} icon={<FaCouch />} />
                                        {roomConfig.bedrooms?.map((room, idx) => <RoomCard key={idx} name={`Bedroom ${idx + 1}`} details={room} icon={<FaBed />} />)}
                                    </div>
                                ) : <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">Room configuration not specified.</div>}
                            </section>
                        )}

                        {((ob.mealPlans && Object.values(ob.mealPlans).some(m => m.available)) || (ob.foodRates && (ob.foodRates.veg || ob.foodRates.nonVeg))) && (
                            <section className="scroll-mt-32 space-y-8 pb-8 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-2"><FaUtensils className="text-orange-500" /> Food & Dining</h3>

                                {/* Individual Meal Plans */}
                                {ob.mealPlans && Object.values(ob.mealPlans).some(m => m.available) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {['Breakfast', 'Lunch', 'Dinner', 'Tea and coffee'].map(meal => {
                                            const mKey = meal === 'Tea and coffee' ? 'hitea' : meal.toLowerCase();
                                            const mData = ob.mealPlans?.[mKey];
                                            if (!mData?.available) return null;
                                            return (
                                                <div key={meal} className="bg-white border rounded-xl p-4 shadow-sm">
                                                    <h4 className="font-bold text-gray-800 mb-2 border-b pb-2">{meal}</h4>
                                                    <div className="text-sm space-y-1">
                                                        {mData.vegRate && <div className="flex justify-between"><span>Veg:</span> <span className="font-bold">₹{mData.vegRate}</span></div>}
                                                        {mData.nonVegRate && <div className="flex justify-between"><span>Non-Veg:</span> <span className="font-bold">₹{mData.nonVegRate}</span></div>}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    /* Fallback to Global Food Rates */
                                    <div className="bg-white border rounded-xl p-6 shadow-sm mb-6">
                                        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">All Meals (Per Person)</h4>
                                        <div className="space-y-2 text-base">
                                            {ob.foodRates?.veg && <div className="flex justify-between max-w-xs"><span>Veg / Day:</span> <span className="font-bold">₹{ob.foodRates.veg}</span></div>}
                                            {ob.foodRates?.nonVeg && <div className="flex justify-between max-w-xs"><span>Non-Veg / Day:</span> <span className="font-bold">₹{ob.foodRates.nonVeg}</span></div>}
                                            {ob.foodRates?.jain && <div className="flex justify-between max-w-xs"><span>Jain / Day:</span> <span className="font-bold">₹{ob.foodRates.jain}</span></div>}
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        <section ref={sections.policies} className="scroll-mt-32 pb-8 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">House Rules & Policies</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm"><FaClock /></div>
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">{isWaterpark ? 'Opening Time' : 'Check-in'}</p><p className="font-bold text-lg">{ob.checkInTime ? format(new Date(`2000-01-01T${ob.checkInTime}`), 'h:mm a') : '2:00 PM'}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm"><FaClock /></div>
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">{isWaterpark ? 'Closing Time' : 'Check-out'}</p><p className="font-bold text-lg">{ob.checkOutTime ? format(new Date(`2000-01-01T${ob.checkOutTime}`), 'h:mm a') : '11:00 AM'}</p></div>
                                </div>
                            </div>

                            {/* Other Rules */}
                            {((ob.otherRules && ob.otherRules.length > 0) || property.PropertyRules) && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-900">Additional Rules</h3>
                                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                                        {ob.otherRules && ob.otherRules.map((rule, idx) => (
                                            <li key={idx}>{rule}</li>
                                        ))}
                                        {(!ob.otherRules || ob.otherRules.length === 0) && property.PropertyRules && (
                                            <li>{property.PropertyRules}</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </section>

                        <section ref={sections.location} className="scroll-mt-32 pb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Location</h2>
                            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start gap-4">
                                <FaMapMarkerAlt className="text-red-500 mt-1" />
                                <div><p className="font-bold text-gray-900">{property.Address}</p><p className="text-sm text-gray-500">{property.CityName}, {property.Location}</p></div>
                            </div>
                            {googleMapSrc ? <iframe src={googleMapSrc} className="w-full h-[400px] rounded-2xl bg-gray-100 shadow-inner" style={{ border: 0 }} loading="lazy"></iframe> : <div className="h-[300px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">Map unavailable</div>}
                        </section>
                    </div>

                    <div className="relative h-full hidden lg:block">
                        <div className="sticky top-28 border border-gray-200 rounded-3xl p-6 shadow-xl bg-white/95 backdrop-blur-md">
                            {isWaterpark ? (
                                <WaterparkBooking property={property} ob={ob} handleReserve={handleReserve} guests={guests} setGuests={setGuests} dateRange={dateRange} priceBreakdown={priceBreakdown} isDatePickerOpen={isDatePickerOpen} setIsDatePickerOpen={setIsDatePickerOpen} handleDateSelect={handleDateSelect} datePickerRef={datePickerRef} bookedDates={property.booked_dates || []} isWaterpark={isWaterpark} />
                            ) : (
                                <VillaBooking price={PRICE_WEEKDAY} rating={property.Rating} dateRange={dateRange} setDateRange={setDateRange} isDatePickerOpen={isDatePickerOpen} setIsDatePickerOpen={setIsDatePickerOpen} handleDateSelect={handleDateSelect} handleReserve={handleReserve} priceBreakdown={priceBreakdown} datePickerRef={datePickerRef} property={property} guests={guests} setGuests={setGuests} mealSelection={mealSelection} setMealSelection={setMealSelection} isWaterpark={isWaterpark} bookedDates={property.booked_dates || []} />
                            )}
                        </div>
                        <div className="mt-6 text-center text-gray-400 text-xs flex items-center justify-center gap-1"><FaShieldAlt /> Secure Booking via ResortWala</div>
                    </div>
                </div>

                <MobileFooter
                    price={isWaterpark ? (priceBreakdown?.totalAdultTicket || PRICE_WEEKDAY) : PRICE_WEEKDAY}
                    unit={isWaterpark ? '/ person' : '/ night'}
                    buttonText={(!dateRange.from || !dateRange.to) ? 'Select Dates' : 'Reserve'}
                    onReserve={() => {
                        if (!dateRange.from || !dateRange.to) {
                            setIsDatePickerOpen(true);
                            if (datePickerRef.current) datePickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            handleReserve();
                        }
                    }}
                />
            </div>

            <Lightbox isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} images={galleryImages} currentIndex={photoIndex} setIndex={setPhotoIndex} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} property={property} />

            <AnimatePresence>
                {isVideoOpen && (
                    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                        <button onClick={() => setIsVideoOpen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white transition group bg-white/10 p-3 rounded-full"><FaTimes size={24} className="group-hover:rotate-90 transition-transform duration-300" /></button>
                        <div className="w-full max-w-5xl aspect-video relative group">
                            {(property.videos?.length > 1 || (property.videos?.length > 0 && (property.video_url || property.VideoUrl))) && (
                                <>
                                    <button onClick={() => setVideoIndex(prev => (prev - 1 + (property.videos?.length + (property.video_url ? 1 : 0))) % (property.videos?.length + (property.video_url ? 1 : 0)))} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition-all border border-white/10"><FaArrowLeft size={20} /></button>
                                    <button onClick={() => setVideoIndex(prev => (prev + 1) % (property.videos?.length + (property.video_url ? 1 : 0)))} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition-all border border-white/10"><FaArrowRight size={20} /></button>
                                </>
                            )}
                            <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
                                {property.videos?.length > 0 && videoIndex < property.videos.length ? (
                                    <video key={property.videos[videoIndex].video_url} src={property.videos[videoIndex].video_url} controls autoPlay className="w-full h-full object-contain" />
                                ) : (property.video_url || property.VideoUrl) ? (
                                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYouTubeId(property.video_url || property.VideoUrl)}?autoplay=1`} title="Property Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {(property.video_url || property.VideoUrl || property.videos?.length > 0) && (
                <motion.button initial={{ scale: 0, y: 100 }} animate={{ scale: 1, y: 0 }} whileHover={{ scale: 1.1 }} onClick={() => setIsVideoOpen(true)} className="fixed bottom-24 right-6 z-[100] bg-red-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition group border-4 border-white" title="Watch Video Tour">
                    <FaVideo size={24} className="group-hover:animate-pulse" />
                    <span className="absolute right-full mr-3 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Watch Video Tour</span>
                </motion.button>
            )}
        </div>
    );
}

const Header = ({ property, isSaved, setIsSaved, setIsShareModalOpen, user, navigate, location }) => (
    <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif mb-3 leading-tight">{property.Name || "Luxury Stay"}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
                {property.Rating && <div className="flex items-center gap-1.5 font-bold text-black"><FaStar size={14} className="text-secondary" /><span>{property.Rating}</span></div>}
                {!property.Rating && <div className="flex items-center gap-1.5 font-bold text-black"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">NEW</span></div>}
                <span className="hidden md:inline text-gray-300">|</span>
                <span className="underline text-gray-600 hover:text-black cursor-pointer">{property.CityName}, {property.Location}</span>
            </div>
            <div className="flex gap-2 text-sm font-semibold">
                <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300"><FaShare /> Share</button>
                <button onClick={() => { if (!user) { navigate('/login', { state: { returnTo: location.pathname + location.search } }); } else { setIsSaved(!isSaved); } }} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300"><FaHeart className={isSaved ? "text-[#FF385C]" : "text-transparent stroke-black stroke-2"} /> {isSaved ? "Saved" : "Save"}</button>
            </div>
        </div>
    </div>
);

const RoomCard = ({ name, details, icon }) => (
    <div className="p-5 border border-gray-100 rounded-2xl hover:shadow-lg transition bg-white group">
        <div className="flex items-center gap-3 mb-3 text-gray-900 group-hover:text-black transition">{icon}<h3 className="font-bold text-base">{name}</h3></div>
        <ul className="text-sm text-gray-600 space-y-2.5 font-medium">
            <li className="flex items-center gap-2.5"><FaBed className="text-gray-400" size={14} /> {details?.bedType || 'Sofa/Standard'}</li>
            {details?.ac && <li className="flex items-center gap-2.5"><FaSnowflake className="text-gray-400" size={14} /> AC Available</li>}
            {details?.bathroom && <li className="flex items-center gap-2.5"><FaRestroom className="text-gray-400" size={14} /> Ensuite ({details?.toiletType})</li>}
        </ul>
    </div>
);

const WaterparkBooking = ({ property, ob, handleReserve, guests, setGuests, dateRange, priceBreakdown, isDatePickerOpen, setIsDatePickerOpen, handleDateSelect, datePickerRef, bookedDates = [], isWaterpark }) => {
    const getPriceForDate = (date) => {
        const w = date.getDay();
        const p = ob?.pricing || {};
        const PRICE_WEEKDAY = parseFloat(property?.price_mon_thu || p.weekday || property?.Price || 0);
        const PRICE_FRISUN = parseFloat(property?.price_fri_sun || p.weekend || property?.Price || 0);
        const PRICE_SATURDAY = parseFloat(property?.price_sat || p.saturday || property?.Price || 0);
        if (w === 6) return PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
        if (w === 0 || w === 5) return PRICE_FRISUN || PRICE_WEEKDAY;
        return PRICE_WEEKDAY;
    };
    const effectiveDate = dateRange?.from ? new Date(dateRange.from) : new Date();
    const adultRate = getPriceForDate(effectiveDate);
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end mb-4 border-b pb-4">
                <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center w-full">
                        <div><span className="text-xl font-bold">₹{Math.round(adultRate).toLocaleString()}</span><span className="text-xs text-gray-500 ml-1">/ person</span></div>
                    </div>
                </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 mb-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Adults</span>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded shadow-sm">
                        <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold">-</button>
                        <span className="text-sm font-bold w-4 text-center">{guests.adults}</span>
                        <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold">+</button>
                    </div>
                </div>
            </div>
            <div className="border border-gray-300 rounded-lg mb-4 relative hover:border-black transition" ref={datePickerRef}>
                <div className="flex border-b border-gray-300 cursor-pointer" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                    <div className="flex-1 p-3 border-r border-gray-300 hover:bg-gray-50"><label className="block text-[10px] font-bold text-gray-800">{isWaterpark ? 'VISIT DATE' : 'CHECK-IN'}</label><div className="text-sm">{dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Select Date'}</div></div>
                    {!isWaterpark && <div className="flex-1 p-3 hover:bg-gray-50"><label className="block text-[10px] font-bold text-gray-800">CHECK-OUT</label><div className="text-sm">{dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Select Date'}</div></div>}
                </div>
                <AnimatePresence>
                    {isDatePickerOpen && (
                        <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl p-4 z-50 border border-gray-100" style={{ width: '320px' }}>
                            <DayPicker
                                mode="range"
                                selected={dateRange}
                                onDayClick={handleDateSelect}
                                numberOfMonths={1}
                                disabled={[{ before: new Date() }, ...bookedDates.map(d => new Date(d))]}
                                components={{
                                    DayContent: (props) => {
                                        const { date } = props;
                                        const price = getPriceForDate(date);
                                        return (
                                            <div className="flex flex-col items-center justify-center py-1">
                                                <span className="text-sm font-medium">{format(date, 'd')}</span>
                                                <span className="text-[8px] text-gray-500 font-bold">₹{(price / 1000).toFixed(1)}k</span>
                                            </div>
                                        );
                                    }
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button
                onClick={() => {
                    if (!dateRange.from) {
                        setIsDatePickerOpen(true);
                        return;
                    }
                    handleReserve();
                }}
                className="w-full font-bold py-3.5 rounded-xl transition mb-4 text-white text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
                {!dateRange.from ? 'Select Visit Date' : 'Book Tickets'}
            </button>
        </div>
    );
};

const VillaBooking = ({ price, rating, dateRange, setDateRange, isDatePickerOpen, setIsDatePickerOpen, handleDateSelect, handleReserve, priceBreakdown, datePickerRef, property, guests, setGuests, mealSelection, setMealSelection, isWaterpark, bookedDates = [] }) => {
    const ob = property?.onboarding_data || {};
    const maxCapacity = parseInt(property?.MaxCapacity || ob.pricing?.maxCapacity || 20);
    const baseCapacity = parseInt(ob.pricing?.extraGuestLimit || 12);
    const totalGuests = guests.adults + guests.children;
    const rates = priceBreakdown?.rates || {};

    const getPriceForDate = (date) => {
        const w = date.getDay();
        const p = ob?.pricing || {};
        const PRICE_WEEKDAY = parseFloat(property?.price_mon_thu || p.weekday || property?.Price || 0);
        const PRICE_FRISUN = parseFloat(property?.price_fri_sun || p.weekend || property?.Price || 0);
        const PRICE_SATURDAY = parseFloat(property?.price_sat || p.saturday || property?.Price || 0);
        if (w === 6) return PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
        if (w === 0 || w === 5) return PRICE_FRISUN || PRICE_WEEKDAY;
        return PRICE_WEEKDAY;
    };

    const MealCounter = ({ label, rate, count, type }) => (
        <div className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-lg p-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label} <span className="text-gray-900">₹{rate}</span></span>
            <div className="flex items-center gap-2 bg-white px-1.5 py-0.5 rounded-md border border-gray-200 shadow-sm">
                <button onClick={() => setMealSelection(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }))} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black transition"><FaMinus size={8} /></button>
                <span className="text-xs font-bold w-3 text-center">{count}</span>
                <button onClick={() => setMealSelection(p => ({ ...p, [type]: p[type] + 1 }))} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black transition"><FaPlus size={8} /></button>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl ring-1 ring-black/5">
            <div className="p-4 space-y-3">
                {/* HEADER */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold font-serif text-gray-900">₹{Math.round(price).toLocaleString()}</span>
                        {priceBreakdown?.nights > 0 && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">/ night</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold bg-gray-50 px-2 py-1 rounded-lg"><FaStar className="text-yellow-400" /> {rating || 4.8} <span className="text-gray-300">|</span> <span className="underline decoration-dotted text-gray-400 cursor-pointer">Reviews</span></div>
                </div>

                {/* DATES */}
                <div className="border border-gray-200 rounded-xl relative hover:border-black transition-colors group cursor-pointer bg-white" ref={datePickerRef} onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                    <div className="flex divide-x divide-gray-200">
                        <div className="flex-1 p-2 px-3">
                            <label className="block text-[9px] uppercase font-bold text-gray-400">Check-In</label>
                            <div className="text-sm font-bold text-gray-900 truncate">{dateRange.from ? format(dateRange.from, 'dd MMM') : 'Select'}</div>
                        </div>
                        <div className="flex-1 p-2 px-3">
                            <label className="block text-[9px] uppercase font-bold text-gray-400">Check-Out</label>
                            <div className="text-sm font-bold text-gray-900 truncate">{dateRange.to ? format(dateRange.to, 'dd MMM') : 'Select'}</div>
                        </div>
                    </div>
                    <AnimatePresence>
                        {isDatePickerOpen && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl p-3 z-50 border border-gray-100 ring-1 ring-black/5 w-[300px]">
                                <DayPicker mode="range" selected={dateRange} onDayClick={handleDateSelect} numberOfMonths={1} disabled={[{ before: new Date() }, ...bookedDates.map(d => new Date(d))]} modifiersStyles={{ selected: { backgroundColor: 'black', color: 'white' } }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* GUESTS */}
                <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Guests ({totalGuests}/{maxCapacity})</span>
                        {/* Capacity Bar Inline */}
                        <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden flex relative">
                            <div className="h-full bg-green-500" style={{ width: `${Math.min(totalGuests, baseCapacity) / maxCapacity * 100}%` }} />
                            {totalGuests > baseCapacity && <div className="h-full bg-orange-500 striped-bar" style={{ width: `${(Math.min(totalGuests, maxCapacity) - baseCapacity) / maxCapacity * 100}%` }} />}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white border border-gray-200 rounded-lg p-1.5 px-2 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-bold text-gray-700">Adults</span>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="text-gray-400 hover:text-black w-5 h-5 flex items-center justify-center bg-gray-50 rounded" disabled={guests.adults <= 1}><FaMinus size={8} /></button>
                                <span className="w-4 text-center">{guests.adults}</span>
                                <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="text-gray-400 hover:text-black w-5 h-5 flex items-center justify-center bg-gray-50 rounded" disabled={totalGuests >= maxCapacity}><FaPlus size={8} /></button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-1.5 px-2 flex justify-between items-center shadow-sm">
                            <span className="text-xs font-bold text-gray-700">Kids</span>
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <button onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })} className="text-gray-400 hover:text-black w-5 h-5 flex items-center justify-center bg-gray-50 rounded" disabled={guests.children <= 0}><FaMinus size={8} /></button>
                                <span className="w-4 text-center">{guests.children}</span>
                                <button onClick={() => setGuests({ ...guests, children: guests.children + 1 })} className="text-gray-400 hover:text-black w-5 h-5 flex items-center justify-center bg-gray-50 rounded" disabled={totalGuests >= maxCapacity}><FaPlus size={8} /></button>
                            </div>
                        </div>
                    </div>
                    {totalGuests > baseCapacity && <div className="text-[9px] text-orange-600 font-bold text-right mt-1 px-1">Extra guest charges apply</div>}
                </div>

                {/* MEALS */}
                <div>
                    <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1"><FaUtensils className="text-orange-400" size={10} /> Meals / Day</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <MealCounter label="Veg" rate={rates.veg} count={mealSelection.veg} type="veg" />
                        <MealCounter label="N.Veg" rate={rates.nonVeg} count={mealSelection.nonVeg} type="nonVeg" />
                        <MealCounter label="Jain" rate={rates.jain} count={mealSelection.jain} type="jain" />
                    </div>
                </div>

                {/* BREAKDOWN */}
                {priceBreakdown && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1 text-xs">
                        <div className="flex justify-between text-gray-600"><span>Base Price</span><span>₹{priceBreakdown.totalVillaRate.toLocaleString()}</span></div>
                        {priceBreakdown.totalExtra > 0 && <div className="flex justify-between text-orange-600 font-bold"><span>Extra Guests</span><span>+₹{priceBreakdown.totalExtra.toLocaleString()}</span></div>}
                        {priceBreakdown.totalFood > 0 && <div className="flex justify-between text-blue-600 font-bold"><span>Meals</span><span>+₹{priceBreakdown.totalFood.toLocaleString()}</span></div>}
                        <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>₹{priceBreakdown.gstAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-200 mt-2"><span>Total Amount</span><span>₹{priceBreakdown.grantTotal.toLocaleString()}</span></div>
                    </div>
                )}

                <button onClick={() => { if (!dateRange.from || !dateRange.to) { setIsDatePickerOpen(true); return; } handleReserve(); }}
                    className="w-full font-bold py-3.5 rounded-xl transition text-white text-base bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:shadow-lg hover:shadow-red-200 active:scale-[0.98]">
                    {(!dateRange.from || !dateRange.to) ? 'Check Availability' : (priceBreakdown ? 'Reserve Now' : 'Calculate Total')}
                </button>
            </div>
            <div className="bg-gray-50 py-2 text-center text-[10px] text-gray-400 font-bold border-t border-gray-100">
                No booking fees · Free cancellation before 7 days
            </div>
        </div>
    );
};

const MobileFooter = ({ price, unit, onReserve, buttonText }) => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 z-40 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div><div className="font-bold text-lg">₹{Math.round(price).toLocaleString()} <span className="text-sm font-normal text-gray-600">{unit}</span></div></div>
        <button onClick={onReserve} className="bg-[#FF385C] text-white px-8 py-3 rounded-lg font-bold shadow-lg">{buttonText || 'Reserve'}</button>
    </div>
);

const Lightbox = ({ isOpen, onClose, images, currentIndex, setIndex }) => {
    if (!isOpen) return null;
    const next = (e) => { e?.stopPropagation(); setIndex((prev) => (prev + 1) % images.length); };
    const prev = (e) => { e?.stopPropagation(); setIndex((prev) => (prev - 1 + images.length) % images.length); };
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-md flex flex-col items-center justify-center py-4 md:py-6" onClick={onClose}>
                    <div className="flex-1 w-full flex items-center justify-center relative px-4 md:px-20" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block max-w-[95vw] max-h-[85vh] group">
                            <div className="absolute top-4 left-4 z-20"><span className="font-mono font-bold bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs md:text-sm tracking-widest border border-white/20 shadow-sm">{currentIndex + 1} / {images.length}</span></div>
                            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2.5 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md rounded-full transition-all border border-white/20 shadow-sm group-hover:scale-110"><FaTimes size={18} /></button>
                            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100"><FaArrowLeft size={20} className="md:w-6 md:h-6" /></button>
                            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100"><FaArrowRight size={20} className="md:w-6 md:h-6" /></button>
                            <AnimatePresence mode="wait"><motion.img key={currentIndex} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} src={images[currentIndex]} className="max-h-[75vh] md:max-h-[80vh] max-w-full object-contain shadow-2xl rounded-lg bg-black" alt={`Gallery ${currentIndex}`} /></AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ShareModal = ({ isOpen, onClose, property }) => {
    const [copied, setCopied] = React.useState(false);
    if (!isOpen) return null;
    const url = window.location.href;
    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); }
        catch (err) { const textArea = document.createElement("textarea"); textArea.value = url; document.body.appendChild(textArea); textArea.select(); try { document.execCommand('copy'); setCopied(true); } catch (e) { console.error("Copy failed", e); } document.body.removeChild(textArea); }
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between mb-6"><h3 className="font-bold">Share</h3><button onClick={onClose}><FaTimes /></button></div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleCopy} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 bg-gray-50 font-medium">{copied ? <FaCheck className="text-green-600" /> : <FaLink />} {copied ? "Copied!" : "Copy Link"}</button>
                </div>
            </div>
        </div>
    );
};
