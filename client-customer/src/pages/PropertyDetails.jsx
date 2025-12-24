import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import {
    FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaCar, FaUtensils,
    FaArrowLeft, FaArrowRight, FaHeart, FaShare, FaMinus, FaPlus, FaTimes, FaCheck,
    FaWater, FaUser, FaBed, FaBath, FaDoorOpen, FaShieldAlt, FaMedal, FaUsers,
    FaWhatsapp, FaFacebook, FaTwitter, FaEnvelope, FaLink, FaCopy, FaPhone, FaGlobe,
    FaSnowflake, FaTv, FaCouch, FaRestroom, FaMoneyBillWave, FaChild, FaTicketAlt,
    FaClock, FaBan, FaDog, FaSmoking, FaWineGlass, FaInfoCircle, FaCamera,
    FaCloudRain, FaMusic, FaTree, FaFire, FaBolt, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaHotTub, FaLanguage, FaGamepad
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, differenceInDays } from 'date-fns';

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
    const [isVideoOpen, setIsVideoOpen] = useState(true); // Default open
    const [photoIndex, setPhotoIndex] = useState(0);
    const datePickerRef = useRef(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isGalleryPaused, setIsGalleryPaused] = useState(false);
    const [includeFood, setIncludeFood] = useState(false);

    // -- REFS FOR SCROLLING --
    const sections = {
        overview: useRef(null),
        amenities: useRef(null),
        rooms: useRef(null),
        policies: useRef(null),
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
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

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

    const rawImages = property?.images?.length ? property.images.map(img => img.image_url) : (property?.ImageUrl ? [property.ImageUrl] : []);
    const galleryImages = rawImages; // STRICT: Only show if exists

    const openLightBox = (index) => { if (galleryImages.length > 0) { setPhotoIndex(index); setIsGalleryOpen(true); } };
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

    const handleReserve = () => {
        if (!dateRange.from || !dateRange.to) { setIsDatePickerOpen(true); return; }
        const targetPath = `/book/${id}`;
        const bookingState = { checkIn: dateRange.from, checkOut: dateRange.to, guests: guests.adults + guests.children };
        if (!user) { navigate('/login', { state: { returnTo: targetPath, bookingState } }); return; }
        navigate(targetPath, { state: bookingState });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;
    if (!property) return <div className="pt-32 pb-20 text-center">Property not found</div>;

    // --- DATA EXTRACTION ---
    const ob = typeof property.onboarding_data === 'string' ? JSON.parse(property.onboarding_data) : (property.onboarding_data || {});
    const pricing = ob.pricing || {};
    const roomConfig = ob.roomConfig || { livingRoom: {}, bedrooms: [] };
    const isWaterpark = property.PropertyType === 'Waterpark';

    const safeFloat = (val, def = 0) => {
        const n = parseFloat(val);
        return isNaN(n) ? def : n;
    };

    const PRICE_WEEKDAY = safeFloat(property.price_mon_thu || pricing.weekday || property.Price, 0);
    const PRICE_FRISUN = safeFloat(property.price_fri_sun || pricing.weekend || property.Price, 0);
    const PRICE_SATURDAY = safeFloat(property.price_sat || pricing.saturday || property.Price, 0);
    const EXTRA_GUEST_CHARGE = safeFloat(pricing.extraGuestCharge, 1000);
    const FOOD_CHARGE = safeFloat(ob.foodRates?.perPerson || pricing.foodPricePerPerson, 1000);
    const GST_PERCENTAGE = safeFloat(property.gst_percentage, 18); // Default 18% provided by user

    const calculateBreakdown = () => {
        if (!dateRange.from) return null;

        // Villa needs both check-in and check-out. Waterpark can be single date.
        if (!isWaterpark && !dateRange.to) return null;

        const effectiveTo = dateRange.to || dateRange.from;
        let nights = differenceInDays(effectiveTo, dateRange.from);

        // Waterpark: Single day visit (Start=End) counts as 1 day
        if (isWaterpark && nights === 0) nights = 1;

        if (nights <= 0) return null;

        let totalVillaRate = 0;
        let totalAdultTicket = 0;
        let totalChildTicket = 0;

        for (let i = 0; i < nights; i++) {
            const d = new Date(dateRange.from); d.setDate(d.getDate() + i);
            const w = d.getDay();
            const isWeekend = (w === 0 || w === 6 || w === 5); // Fri, Sat, Sun

            // Villa Logic
            let rate = PRICE_WEEKDAY;
            if (w === 6) rate = PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
            else if (w === 0 || w === 5) rate = PRICE_FRISUN || PRICE_WEEKDAY;
            totalVillaRate += rate;

            // Waterpark Logic
            if (isWaterpark) {
                // Adult
                let aRate = PRICE_WEEKDAY;
                if (w === 6) aRate = PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
                else if (w === 0 || w === 5) aRate = PRICE_FRISUN || PRICE_WEEKDAY;

                // Child
                let cRate = parseFloat(ob.childCriteria?.monFriPrice || ob.childCriteria?.price || 500);
                if (isWeekend && ob.childCriteria?.satSunPrice) {
                    cRate = parseFloat(ob.childCriteria.satSunPrice);
                }

                totalAdultTicket += (aRate * guests.adults);
                totalChildTicket += (cRate * guests.children);
            }
        }

        if (isWaterpark) {
            // Waterpark also needs GST
            const taxableAmount = totalAdultTicket + totalChildTicket;
            const gstAmount = (taxableAmount * GST_PERCENTAGE) / 100;
            return { nights, totalAdultTicket, totalChildTicket, gstAmount, grantTotal: taxableAmount + gstAmount };
        }

        const totalGuests = guests.adults + guests.children;
        const extraGuests = Math.max(0, totalGuests - (parseInt(pricing.extraGuestLimit) || 10));
        const totalExtra = extraGuests * EXTRA_GUEST_CHARGE * nights;
        // Food calculation: Only if includeFood is TRUE
        const totalFood = includeFood ? (totalGuests * FOOD_CHARGE * nights) : 0;

        // GST Calculation
        const taxableAmount = totalVillaRate + totalExtra + totalFood;
        const gstAmount = (taxableAmount * GST_PERCENTAGE) / 100;

        return {
            nights,
            totalVillaRate,
            extraGuests,
            totalExtra,
            totalFood,
            gstAmount,
            grantTotal: taxableAmount + gstAmount
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

    return (
        <div className="bg-white min-h-screen pb-20 pt-[80px]">
            {/* 1. HERO GALLERY */}
            <div className="container mx-auto px-4 lg:px-8 py-6 max-w-7xl">
                <Header property={property} isSaved={isSaved} setIsSaved={setIsSaved} setIsShareModalOpen={setIsShareModalOpen} user={user} navigate={navigate} location={window.location} />

                {galleryImages.length > 0 ? (
                    <div className="rounded-2xl overflow-hidden shadow-sm h-[350px] md:h-[500px] mb-8 grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 relative">
                        {/* Main Image (Left Half) */}
                        <div
                            className="col-span-1 md:col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
                            onClick={() => openLightBox(0)}
                        >
                            <img src={galleryImages[0]} alt="Main" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>

                        {/* Top Side Images */}
                        <div className="hidden md:block col-span-1 row-span-1 relative cursor-pointer group overflow-hidden" onClick={() => openLightBox(1)}>
                            <img src={galleryImages[1] || galleryImages[0]} alt="Gallery 1" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>
                        <div className="hidden md:block col-span-1 row-span-1 relative cursor-pointer group overflow-hidden rounded-tr-2xl" onClick={() => openLightBox(2)}>
                            <img src={galleryImages[2] || galleryImages[0]} alt="Gallery 2" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>

                        {/* Bottom Side Images */}
                        <div className="hidden md:block col-span-1 row-span-1 relative cursor-pointer group overflow-hidden" onClick={() => openLightBox(3)}>
                            <img src={galleryImages[3] || galleryImages[0]} alt="Gallery 3" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>
                        <div className="hidden md:block col-span-1 row-span-1 relative cursor-pointer group overflow-hidden rounded-br-2xl" onClick={() => openLightBox(4)}>
                            <img src={galleryImages[4] || galleryImages[0]} alt="Gallery 4" className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />

                            {/* View All Button (Overlay on last image) */}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center hover:bg-black/40 transition">
                                <span className="text-white font-bold text-sm border border-white/50 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
                                    <FaCamera /> View Details
                                </span>
                            </div>
                        </div>

                        {/* Mobile 'View All' Badge */}
                        <div className="absolute bottom-4 right-4 md:hidden">
                            <button onClick={() => openLightBox(0)} className="bg-white/90 backdrop-blur-md text-black px-4 py-2 rounded-lg text-xs font-bold shadow-lg border border-gray-200 flex items-center gap-2">
                                <FaCamera /> {galleryImages.length} Photos
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
                        {['Overview', 'Amenities', !isWaterpark && 'Rooms', 'Policies', 'Location'].filter(Boolean).map((tab) => (
                            <button key={tab} onClick={() => scrollToSection(tab.toLowerCase())} className={`whitespace-nowrap pb-1 border-b-2 transition ${activeTab === tab.toLowerCase() ? 'border-black text-black font-bold' : 'border-transparent hover:text-gray-800'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-12 items-start">
                    {/* LEFT COLUMN */}
                    <div className="space-y-12">

                        {/* OVERVIEW */}
                        <section ref={sections.overview} className="scroll-mt-32">
                            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{property.display_name || property.Name}</h2>
                                    <p className="text-gray-500 text-sm">
                                        {property.PropertyType} · {property.MaxCapacity} guests · {property.NoofRooms} bedrooms
                                    </p>

                                </div>
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold border border-gray-200 uppercase">{(property.ContactPerson || "H").charAt(0)}</div>
                            </div>

                            {/* SHORT DESCRIPTION */}
                            {ob.shortDescription && (
                                <div className="py-6 border-b border-gray-100">
                                    <p className="text-gray-700 italic text-lg leading-relaxed">{ob.shortDescription}</p>
                                </div>
                            )}

                            {/* ABOUT */}
                            <div className="py-8 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 font-serif">About this property</h3>
                                {property.LongDescription ? (
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">{property.LongDescription}</p>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                                        Description not provided.
                                    </div>
                                )}
                            </div>

                            {/* INCLUSIONS & HIGHLIGHTS - Only for Waterpark */}
                            {isWaterpark && (
                                <div className="py-4 border-b border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-2">
                                        <FaMedal className="text-[#FF385C]" /> What's Included
                                    </h3>
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
                                    ) : (
                                        <div className="text-gray-400 italic">No specific inclusions listed.</div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* AMENITIES - MOVED UP */}
                        {/* AMENITIES - MOVED UP */}
                        <section ref={sections.amenities} className="scroll-mt-32 pb-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">What this place offers</h2>
                            {ob.amenities && Object.keys(ob.amenities).length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                                    {Object.entries(ob.amenities).map(([key, val]) => {
                                        if (!val) return null;
                                        const meta = AMENITY_METADATA[key];
                                        const displayLabel = meta ? meta.label : key.replace(/_/g, ' ');
                                        const displayIcon = meta ? meta.icon : <FaCheck className="text-gray-400" />;
                                        return (
                                            <div key={key} className="flex items-center gap-3 text-gray-700 capitalize group">
                                                <div className="text-xl group-hover:scale-110 transition">{displayIcon}</div>
                                                <span className="group-hover:font-medium transition">
                                                    {displayLabel} {Number.isInteger(val) && val > 1 ? `(${val})` : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                            {ob.otherAttractions && (
                                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><FaStar /> Special Attractions</h4>
                                    <p className="text-gray-800 whitespace-pre-line">{ob.otherAttractions}</p>
                                </div>
                            )}
                        </section>

                        {/* ROOM DETAILS - MOVED UP */}
                        {!isWaterpark && (
                            <section ref={sections.rooms} className="scroll-mt-32 pb-8 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Room Details</h2>
                                {roomConfig.bedrooms && roomConfig.bedrooms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <RoomCard name="Living Room" details={roomConfig.livingRoom} icon={<FaCouch />} />
                                        {roomConfig.bedrooms?.map((room, idx) => <RoomCard key={idx} name={`Bedroom ${idx + 1}`} details={room} icon={<FaBed />} />)}
                                    </div>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                                        Room configuration not specified.
                                    </div>
                                )}
                            </section>
                        )}

                        {/* FOOD & DINING */}
                        <section className="scroll-mt-32 space-y-8 pb-8 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-2">
                                <FaUtensils className="text-orange-500" /> Food & Dining
                            </h3>

                            {/* Meal Plans */}
                            {ob.mealPlans && Object.values(ob.mealPlans).some(m => m.available) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {['Breakfast', 'Lunch', 'Dinner', 'HiTea'].map(meal => {
                                        const mKey = meal.toLowerCase().replace('-', '');
                                        const mData = ob.mealPlans?.[mKey];
                                        if (!mData?.available) return null;
                                        return (
                                            <div key={meal} className="bg-white border rounded-xl p-4 shadow-sm">
                                                <h4 className="font-bold text-gray-800 mb-2 border-b pb-2">{meal}</h4>
                                                <div className="text-sm space-y-1 mb-3">
                                                    {mData.vegRate && <div className="flex justify-between"><span>Veg:</span> <span className="font-bold">₹{mData.vegRate}</span></div>}
                                                    {mData.nonVegRate && <div className="flex justify-between"><span>Non-Veg:</span> <span className="font-bold">₹{mData.nonVegRate}</span></div>}
                                                </div>
                                                {mData.includes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded italic">{mData.includes}</p>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Food Options - Standard Writeup */}
                            {ob.foodRates && (Object.keys(ob.foodRates).some(k => ob.foodRates[k] && ob.foodRates[k] !== false)) ? (
                                <div className="bg-gradient-to-br from-orange-50 to-white rounded-3xl p-8 border border-orange-100 shadow-sm">
                                    <p className="text-gray-700 leading-relaxed mb-6">
                                        Delicious meals are available on request. Our kitchen prepares fresh, hygienic food to cater to your preferences.
                                        The meal package includes Lunch, Evening Snacks, Dinner, and Next Morning Breakfast.
                                    </p>

                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FaUtensils className="text-orange-500" /> Available Options
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {ob.foodRates.veg && ob.foodRates.veg !== false && (
                                            <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-green-100 flex flex-col items-center text-center hover:shadow-md transition">
                                                <div className="text-3xl mb-2">🥗</div>
                                                <div className="font-bold text-gray-900 mb-1">Vegetarian</div>
                                                <div className="text-xs text-gray-500 mb-3">Pure veg meals</div>
                                                <div className="font-extrabold text-xl text-green-600">₹{ob.foodRates.veg}</div>
                                                <div className="text-xs text-gray-400 mt-1">per person</div>
                                            </div>
                                        )}

                                        {ob.foodRates.nonVeg && ob.foodRates.nonVeg !== false && (
                                            <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-red-100 flex flex-col items-center text-center hover:shadow-md transition">
                                                <div className="text-3xl mb-2">🍗</div>
                                                <div className="font-bold text-gray-900 mb-1">Non-Vegetarian</div>
                                                <div className="text-xs text-gray-500 mb-3">Chicken, fish, etc.</div>
                                                <div className="font-extrabold text-xl text-red-600">₹{ob.foodRates.nonVeg}</div>
                                                <div className="text-xs text-gray-400 mt-1">per person</div>
                                            </div>
                                        )}

                                        {ob.foodRates.jain && ob.foodRates.jain !== false && (
                                            <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-orange-100 flex flex-col items-center text-center hover:shadow-md transition">
                                                <div className="text-3xl mb-2">🥕</div>
                                                <div className="font-bold text-gray-900 mb-1">Jain Food</div>
                                                <div className="text-xs text-gray-500 mb-3">No onion/garlic</div>
                                                <div className="font-extrabold text-xl text-orange-600">₹{ob.foodRates.jain}</div>
                                                <div className="text-xs text-gray-400 mt-1">per person</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </section>

                        {/* POLICIES */}
                        <section ref={sections.policies} className="scroll-mt-32 pb-8 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">House Rules & Policies</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm"><FaClock /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Check-in</p>
                                        <p className="font-bold text-lg">{ob.checkInTime ? format(new Date(`2000-01-01T${ob.checkInTime}`), 'h:mm a') : '2:00 PM'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm"><FaClock /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Check-out</p>
                                        <p className="font-bold text-lg">{ob.checkOutTime ? format(new Date(`2000-01-01T${ob.checkOutTime}`), 'h:mm a') : '11:00 AM'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                    <FaShieldAlt className="text-blue-600" /> General Rules
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {PROPERTY_RULES.map((rule, idx) => {
                                        const isTrue = ob.rules?.[idx.toString()] || ob.rules?.[idx];
                                        if (!isTrue) return null;
                                        return (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-green-200 transition">
                                                <FaCheck className="text-green-600 flex-shrink-0" size={16} />
                                                <span className="text-gray-700 font-medium text-sm">{rule}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {ob.otherRules && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-gray-700 leading-relaxed border-l-4 border-blue-400">
                                        <span className="font-bold block text-gray-900 mb-2 flex items-center gap-2">
                                            <FaInfoCircle className="text-blue-600" /> Additional Rules:
                                        </span>
                                        {ob.otherRules}
                                    </div>
                                )}
                            </div>

                            {/* Child Policy */}
                            <div className="mt-6 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 font-serif">
                                    <div className="bg-white p-2 rounded-full shadow-sm text-blue-500"><FaChild /></div>
                                    Child Policy
                                </h3>
                                <p className="text-gray-700 mb-6 leading-relaxed">
                                    Children are welcome! We offer special rates for young guests to make your family vacation more affordable.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                        <div><span className="font-bold text-gray-900 block text-lg">Free Entry</span><span className="text-sm text-gray-500">Age below 5 yrs</span></div>
                                        <div className="text-2xl font-bold text-blue-600">Free</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                        <div><span className="font-bold text-gray-900 block text-lg">Chargeable</span><span className="text-sm text-gray-500">Age range</span></div>
                                        <div className="text-2xl font-bold text-blue-600">{ob.childCriteria?.chargeAgeFrom || 6}-{ob.childCriteria?.chargeAgeTo || 12} <span className="text-sm text-gray-400">yrs</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Extra Guest Policy */}
                            {!isWaterpark && pricing?.extraGuestLimit && (
                                <div className="mt-6 bg-purple-50/50 rounded-3xl p-8 border border-purple-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 font-serif">
                                        <div className="bg-white p-2 rounded-full shadow-sm text-purple-500"><FaUsers /></div>
                                        Extra Guest Policy
                                    </h3>
                                    <p className="text-gray-700 mb-4 leading-relaxed">
                                        Additional guests beyond the standard occupancy of {pricing.extraGuestLimit || 10} can be accommodated with extra charges.
                                    </p>
                                    <div className="bg-white p-4 rounded-xl border border-purple-100">
                                        <p className="text-sm text-gray-600">
                                            <strong>Note:</strong> Extra mattresses and bedding will be provided for additional guests.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PAYMENT METHODS */}
                            {ob.paymentMethods && (
                                <div className="mt-8 bg-green-50 rounded-3xl p-8 border border-green-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 font-serif">
                                        <div className="bg-white p-2 rounded-full shadow-sm text-green-500"><FaMoneyBillWave /></div>
                                        Accepted Payment Methods
                                    </h3>
                                    <div className="flex gap-4 flex-wrap">
                                        {Object.entries(ob.paymentMethods).map(([method, allowed]) => allowed && (
                                            <span key={method} className="bg-white border border-green-200 text-green-800 px-6 py-2 rounded-full font-bold uppercase text-sm shadow-sm">{method}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {ob.idProofs?.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <FaShieldAlt className="text-gray-600" /> Required ID Proof (Any one of the following for Prime/Main Guest):
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {ob.idProofs.map(id => (
                                            <span key={id} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-bold border border-gray-200 uppercase">{id}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* LOCATION */}
                        <section ref={sections.location} className="scroll-mt-32 pb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Location</h2>
                            {/* Address Display */}
                            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start gap-4">
                                <FaMapMarkerAlt className="text-red-500 mt-1" />
                                <div>
                                    <p className="font-bold text-gray-900">{property.Address}</p>
                                    <p className="text-sm text-gray-500">{property.CityName}, {property.Location}</p>
                                </div>
                            </div>

                            {googleMapSrc ? <iframe src={googleMapSrc} className="w-full h-[400px] rounded-2xl bg-gray-100 shadow-inner" style={{ border: 0 }} loading="lazy"></iframe> : <div className="h-[300px] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">Map unavailable</div>}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: BOOKING CARD */}
                    <div className="relative h-full hidden lg:block">
                        <div className="sticky top-28 border border-gray-200 rounded-3xl p-6 shadow-xl bg-white/95 backdrop-blur-md">
                            {isWaterpark ?
                                <WaterparkBooking
                                    property={property}
                                    ob={ob}
                                    handleReserve={handleReserve}
                                    guests={guests}
                                    setGuests={setGuests}
                                    dateRange={dateRange}
                                    priceBreakdown={priceBreakdown}
                                    isDatePickerOpen={isDatePickerOpen}
                                    setIsDatePickerOpen={setIsDatePickerOpen}
                                    handleDateSelect={handleDateSelect}
                                    datePickerRef={datePickerRef}
                                />
                                :
                                <VillaBooking
                                    price={PRICE_WEEKDAY}
                                    rating={property.Rating}
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    isDatePickerOpen={isDatePickerOpen}
                                    setIsDatePickerOpen={setIsDatePickerOpen}
                                    handleDateSelect={handleDateSelect}
                                    handleReserve={handleReserve}
                                    priceBreakdown={priceBreakdown}
                                    datePickerRef={datePickerRef}
                                    property={property}
                                    guests={guests}
                                    setGuests={setGuests}
                                    includeFood={includeFood}
                                    setIncludeFood={setIncludeFood}
                                />
                            }
                        </div>
                        <div className="mt-6 text-center text-gray-400 text-xs flex items-center justify-center gap-1"><FaShieldAlt /> Secure Booking via ResortWala</div>
                    </div>
                </div>

                {/* MOBILE FOOTER */}
                <MobileFooter price={isWaterpark ? ob.ticketPrices?.adult : PRICE_WEEKDAY} unit={isWaterpark ? '/ adult' : '/ night'} onReserve={handleReserve} />
            </div>

            {/* LIGHTBOX & SHARE */}
            <Lightbox
                isOpen={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                images={galleryImages}
                currentIndex={photoIndex}
                setIndex={setPhotoIndex}
            />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} property={property} />

            {/* FLOATING VIDEO PLAYER - Only if video_url exists */}
            <AnimatePresence>
                {isVideoOpen && (property.video_url || property.VideoUrl) && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.9, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 100 }}
                        className="fixed bottom-32 right-4 z-50 w-72 md:w-80 bg-black rounded-xl shadow-2xl overflow-hidden cursor-move border border-gray-800"
                        title="Drag me!"
                    >
                        <div className="bg-gray-900 px-3 py-2 flex justify-between items-center border-b border-gray-800">
                            <span className="text-white text-xs font-bold flex items-center gap-2"><FaTv /> Video Tour</span>
                            <button onClick={() => setIsVideoOpen(false)} className="text-gray-400 hover:text-white transition"><FaTimes size={14} /></button>
                        </div>
                        <div className="aspect-video relative">
                            {getYouTubeId(property.video_url || property.VideoUrl) ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${getYouTubeId(property.video_url || property.VideoUrl)}?autoplay=1&mute=1`}
                                    title="Property Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                ></iframe>
                            ) : (
                                <a href={property.video_url || property.VideoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-full w-full bg-gray-900 text-white gap-2 hover:bg-black transition">
                                    <FaLink /> Open External Video
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING TOGGLE BUTTON (if closed and video exists) */}
            {!isVideoOpen && (property.video_url || property.VideoUrl) && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setIsVideoOpen(true)}
                    className="fixed bottom-24 right-4 z-40 bg-black text-white p-4 rounded-full shadow-xl flex items-center justify-center hover:bg-gray-900 transition"
                    title="Watch Video Tour"
                >
                    <FaTv size={20} />
                </motion.button>
            )}
        </div>
    );
}

// --- SUB COMPONENTS ---

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
                <button
                    onClick={() => {
                        if (!user) {
                            navigate('/login', { state: { returnTo: location.pathname + location.search, action: 'save_wishlist' } });
                        } else {
                            setIsSaved(!isSaved);
                        }
                    }}
                    className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300"
                >
                    <FaHeart className={isSaved ? "text-[#FF385C]" : "text-transparent stroke-black stroke-2"} /> {isSaved ? "Saved" : "Save"}
                </button>
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
            {details?.balcony && <li className="flex items-center gap-2.5"><FaDoorOpen className="text-gray-400" size={14} /> Private Balcony</li>}
        </ul>
    </div>
);

const RuleItem = ({ icon: Icon, label, hasError }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${hasError ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
        <Icon /> <span>{label}</span>
    </div>
);

const WaterparkBooking = ({ property, ob, handleReserve, guests, setGuests, dateRange, priceBreakdown, isDatePickerOpen, setIsDatePickerOpen, handleDateSelect, datePickerRef }) => {
    // Helper to get price for a specific date (Duplicated for availability in this component)
    const getPriceForDate = (date) => {
        const w = date.getDay();
        const p = ob?.pricing || {};
        const PRICE_WEEKDAY = parseFloat(property?.price_mon_thu || p.weekday || property?.Price || 0);
        const PRICE_FRISUN = parseFloat(property?.price_fri_sun || p.weekend || property?.Price || 0);
        const PRICE_SATURDAY = parseFloat(property?.price_sat || p.saturday || property?.Price || 0);

        if (w === 6) return PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY; // Saturday
        if (w === 0 || w === 5) return PRICE_FRISUN || PRICE_WEEKDAY; // Fri/Sun
        return PRICE_WEEKDAY; // Mon-Thu
    };

    // Determine Base Rates for Display
    // If a date is selected, use that date's price. Otherwise default to Weekday.
    const effectiveDate = dateRange?.from ? new Date(dateRange.from) : new Date();
    const adultRate = getPriceForDate(effectiveDate) || parseFloat(property.price_mon_thu || property.Price || 500);

    // Child Rate logic similar to calculation
    let childRate = parseFloat(ob.childCriteria?.monFriPrice || ob.childCriteria?.price || 400);
    const dayOfWeek = effectiveDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5);
    if (isWeekend && ob.childCriteria?.satSunPrice) {
        childRate = parseFloat(ob.childCriteria.satSunPrice);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end mb-4 border-b pb-4">
                <div className="flex flex-col gap-2 w-full">
                    {/* Adult Row */}
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <span className="text-xl font-bold">₹{Math.round(adultRate).toLocaleString()}</span>
                            <span className="text-xs text-gray-500 ml-1">/ adult</span>
                        </div>
                        <div className="text-xs text-gray-400 line-through">₹{Math.round(adultRate * 1.25).toLocaleString()}</div>
                    </div>

                    {/* Child Row - Only if child rate exists */}
                    {childRate > 0 && (
                        <div className="flex justify-between items-center w-full">
                            <div>
                                <span className="text-lg font-bold text-blue-600">₹{Math.round(childRate).toLocaleString()}</span>
                                <span className="text-xs text-gray-500 ml-1">/ child</span>
                            </div>
                            <div className="text-xs text-gray-400 line-through">₹{Math.round(childRate * 1.25).toLocaleString()}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* GUEST SELECTOR */}
            <div className="border border-gray-200 rounded-xl p-3 mb-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">Adults</span>
                        <span className="text-[10px] text-gray-400">Above {ob.childCriteria?.chargeAgeTo || 12} yrs</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded shadow-sm">
                        <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold" disabled={guests.adults <= 1}>-</button>
                        <span className="text-sm font-bold w-4 text-center">{guests.adults}</span>
                        <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold">+</button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">Children</span>
                        <span className="text-[10px] text-gray-400">{ob.childCriteria?.chargeAgeFrom || 5}-{ob.childCriteria?.chargeAgeTo || 12} yrs</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded shadow-sm">
                        <button onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold" disabled={guests.children <= 0}>-</button>
                        <span className="text-sm font-bold w-4 text-center">{guests.children}</span>
                        <button onClick={() => setGuests({ ...guests, children: guests.children + 1 })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold">+</button>
                    </div>
                </div>
                {/* Free Entry / Infants */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-green-600">Free Entry</span>
                        <span className="text-[10px] text-gray-400">Age below 5 yrs</span>
                    </div>
                    <div className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded">
                        No Ticket
                    </div>
                </div>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden mb-4 relative hover:border-black transition" ref={datePickerRef}>
                <div className="flex border-b border-gray-300 cursor-pointer" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                    <div className="flex-1 p-3 border-r border-gray-300 hover:bg-gray-50"><label className="block text-[10px] font-bold text-gray-800">VISIT DATE</label><div className="text-sm">{dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Select Date'}</div></div>
                </div>
            </div>
            <AnimatePresence>
                {isDatePickerOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-0 right-0 bg-white rounded-2xl shadow-xl p-4 z-50 border border-gray-100" style={{ width: '320px' }}>
                        <DayPicker
                            mode="range"
                            selected={dateRange}
                            onDayClick={handleDateSelect}
                            numberOfMonths={1}
                            disabled={[{ before: new Date() }]}
                            formatters={{
                                formatDay: (date) => {
                                    const priceForDay = getPriceForDate(date);
                                    const dayNum = format(date, 'd');
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full w-full py-2">
                                            <span className="text-sm font-medium relative z-10">{dayNum}</span>
                                            <span className="text-[10px] font-bold text-emerald-600 mt-1 relative z-10 tracking-tight">
                                                ₹{priceForDay < 1000 ? priceForDay : `${(priceForDay / 1000).toFixed(1)}k`}
                                            </span>
                                        </div>
                                    );
                                }
                            }}
                            modifiersClassNames={{
                                selected: 'bg-blue-600 text-white hover:bg-blue-700 rounded-full',
                                range_middle: 'bg-blue-50 text-blue-900',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>


            <button onClick={handleReserve} disabled={!dateRange.from} className={`w-full font-bold py-3.5 rounded-xl transition mb-4 text-white text-lg ${(!dateRange.from) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}>
                Book Tickets
            </button>

            {priceBreakdown && (
                <div className="space-y-2 mt-4 text-sm text-gray-600 border-t pt-4">
                    <div className="flex justify-between"><span>Adult Tickets ({guests.adults})</span><span>₹{Math.round(priceBreakdown.totalAdultTicket).toLocaleString()}</span></div>
                    {guests.children > 0 && <div className="flex justify-between"><span>Child Tickets ({guests.children})</span><span>₹{Math.round(priceBreakdown.totalChildTicket).toLocaleString()}</span></div>}
                    {priceBreakdown.gstAmount > 0 && <div className="flex justify-between text-gray-500"><span>GST (18%)</span><span>₹{Math.round(priceBreakdown.gstAmount).toLocaleString()}</span></div>}
                    <div className="flex justify-between font-bold text-lg text-black pt-2 border-t mt-2"><span>Total</span><span>₹{Math.round(priceBreakdown.grantTotal).toLocaleString()}</span></div>
                </div>
            )}
        </div>
    );
};

const VillaBooking = ({ price, rating, dateRange, isDatePickerOpen, setIsDatePickerOpen, handleDateSelect, handleReserve, priceBreakdown, datePickerRef, property, guests, setGuests, includeFood, setIncludeFood }) => {

    // Helper to get price for a specific date
    const getPriceForDate = (date) => {
        const w = date.getDay();
        const ob = property?.onboarding_data || {};
        const p = ob.pricing || {};
        const PRICE_WEEKDAY = parseFloat(property?.price_mon_thu || p.weekday || property?.Price || 0);
        const PRICE_FRISUN = parseFloat(property?.price_fri_sun || p.weekend || property?.Price || 0);
        const PRICE_SATURDAY = parseFloat(property?.price_sat || p.saturday || property?.Price || 0);

        if (w === 6) return PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY; // Saturday
        if (w === 0 || w === 5) return PRICE_FRISUN || PRICE_WEEKDAY; // Fri/Sun
        return PRICE_WEEKDAY; // Mon-Thu
    };

    const CustomDayContent = (props) => {
        const { date, activeModifiers } = props;
        const priceForDay = getPriceForDate(date);
        const dayNum = format(date, 'd');
        const isWeekendStr = date.getDay() === 0 || date.getDay() === 6 || date.getDay() === 5;

        return (
            <div className={`flex flex-col items-center justify-center w-full h-full py-1 ${activeModifiers.selected ? 'text-white' : ''}`}>
                <span className={`text-sm font-semibold ${!activeModifiers.selected && isWeekendStr ? 'text-[#FF385C]' : ''}`}>{dayNum}</span>
                <span className={`text-[9px] font-bold leading-none mt-0.5 ${activeModifiers.selected ? 'text-white/90' : 'text-gray-400'}`}>
                    {priceForDay < 1000 ? priceForDay : `${(priceForDay / 1000).toFixed(1)}k`}
                </span>
            </div>
        );
    };

    return (
        <>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">₹{Math.round(price).toLocaleString()}</span>
                        <span className="text-sm text-gray-400 line-through">₹{Math.round(price * 1.35).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-green-600 font-bold ml-1">ResortWala Price</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold underline"><FaStar size={10} /> {rating || 4.8}</div>
            </div>

            {/* GUEST SELECTOR */}
            <div className="border border-gray-200 rounded-xl p-3 mb-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Adults</span>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded shadow-sm">
                        <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold" disabled={guests.adults <= 1}>-</button>
                        <span className="text-sm font-bold w-4 text-center">{guests.adults}</span>
                        <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold">+</button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Children</span>
                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded shadow-sm">
                        <button onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold" disabled={guests.children <= 0}>-</button>
                        <span className="text-sm font-bold w-4 text-center">{guests.children}</span>
                        <button onClick={() => setGuests({ ...guests, children: guests.children + 1 })} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 rounded transition font-bold">+</button>
                    </div>
                </div>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden mb-4 relative" ref={datePickerRef}>
                <div className="flex border-b border-gray-300 cursor-pointer" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                    <div className="flex-1 p-3 border-r border-gray-300 hover:bg-gray-50"><label className="block text-[10px] font-bold text-gray-800">CHECK-IN</label><div className="text-sm">{dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Add date'}</div></div>
                    <div className="flex-1 p-3 hover:bg-gray-50"><label className="block text-[10px] font-bold text-gray-800">CHECK-OUT</label><div className="text-sm">{dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Add date'}</div></div>
                </div>
            </div>
            <AnimatePresence>
                {isDatePickerOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-0 right-0 bg-white rounded-2xl shadow-xl p-4 z-50 border border-gray-100" style={{ width: '360px' }}>
                        <DayPicker
                            mode="range"
                            selected={dateRange}
                            onDayClick={handleDateSelect}
                            numberOfMonths={1}
                            disabled={[{ before: new Date() }]}
                            formatters={{
                                formatDay: (date) => {
                                    const priceForDay = getPriceForDate(date);
                                    const dayNum = format(date, 'd');
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full w-full py-2">
                                            <span className="text-sm font-medium relative z-10">{dayNum}</span>
                                            <span className="text-[10px] font-bold text-emerald-600 mt-1 relative z-10 tracking-tight">
                                                ₹{priceForDay < 1000 ? `${(priceForDay / 1000).toFixed(1)}k` : `${Math.round(priceForDay / 1000)}k`}
                                            </span>
                                        </div>
                                    );
                                }
                            }}
                            modifiersClassNames={{
                                selected: 'bg-rose-400 text-white hover:bg-rose-500 rounded-2xl shadow-md transform scale-100',
                                range_start: 'bg-rose-400 text-white rounded-l-2xl rounded-r-none',
                                range_end: 'bg-rose-400 text-white rounded-r-2xl rounded-l-none',
                                range_middle: 'bg-rose-50 text-rose-900 rounded-none mix-blend-multiply'
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* FOOD TOGGLE */}
            <div className="mb-4">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                    <input
                        type="checkbox"
                        checked={includeFood}
                        onChange={(e) => setIncludeFood(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                        <span className="font-bold text-gray-900 block text-sm">Include All Meals</span>
                        <span className="text-xs text-gray-500">Breakfast, Lunch, Hi-Tea, Dinner</span>
                    </div>
                    <FaUtensils className="text-orange-500" />
                </label>
            </div>

            <button onClick={handleReserve} disabled={!dateRange.from || !dateRange.to} className={`w-full font-bold py-3.5 rounded-xl transition mb-4 text-white text-lg ${(!dateRange.from || !dateRange.to) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF385C] hover:bg-[#D90B3E] shadow-lg shadow-red-200'}`}>Reserve</button>
            {priceBreakdown && (
                <div className="space-y-2 mt-4 text-sm text-gray-600 border-t pt-4">
                    {!isWaterpark ? (
                        <>
                            <div className="flex justify-between"><span>Villa Rate ({priceBreakdown.nights} nights)</span><span>₹{Math.round(priceBreakdown.totalVillaRate).toLocaleString()}</span></div>
                            {priceBreakdown.totalExtra > 0 && <div className="flex justify-between text-orange-600"><span>Extra Guests</span><span>₹{Math.round(priceBreakdown.totalExtra).toLocaleString()}</span></div>}
                            {priceBreakdown.totalFood > 0 && <div className="flex justify-between text-blue-600"><span>Food Package</span><span>₹{Math.round(priceBreakdown.totalFood).toLocaleString()}</span></div>}
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between"><span>Adult Tickets ({guests.adults} x {priceBreakdown.nights} days)</span><span>₹{Math.round(priceBreakdown.totalAdultTicket).toLocaleString()}</span></div>
                            {guests.children > 0 && <div className="flex justify-between"><span>Child Tickets ({guests.children} x {priceBreakdown.nights} days)</span><span>₹{Math.round(priceBreakdown.totalChildTicket).toLocaleString()}</span></div>}
                        </>
                    )}
                    <div className="flex justify-between text-gray-500"><span>GST (18%)</span><span>₹{Math.round(priceBreakdown.gstAmount || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-lg text-black pt-2 border-t mt-2"><span>Total</span><span>₹{Math.round(priceBreakdown.grantTotal).toLocaleString()}</span></div>
                </div>
            )}
        </>
    );
};

const MobileFooter = ({ price, unit, onReserve }) => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 z-40 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div><div className="font-bold text-lg">₹{Math.round(price).toLocaleString()} <span className="text-sm font-normal text-gray-600">{unit}</span></div></div>
        <button onClick={onReserve} className="bg-[#FF385C] text-white px-8 py-3 rounded-lg font-bold shadow-lg">Reserve</button>
    </div>
);

const Lightbox = ({ isOpen, onClose, images, currentIndex, setIndex }) => {
    if (!isOpen) return null;

    const next = (e) => { e?.stopPropagation(); setIndex((prev) => (prev + 1) % images.length); };
    const prev = (e) => { e?.stopPropagation(); setIndex((prev) => (prev - 1 + images.length) % images.length); };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-md flex flex-col items-center justify-center py-4 md:py-6"
                    onClick={onClose}
                >
                    {/* Main Content Area */}
                    <div className="flex-1 w-full flex items-center justify-center relative px-4 md:px-20" onClick={e => e.stopPropagation()}>

                        {/* Image Wrapper - Anchors the controls */}
                        <div className="relative inline-block max-w-[95vw] max-h-[85vh] group">

                            {/* Top Left: Count */}
                            <div className="absolute top-4 left-4 z-20">
                                <span className="font-mono font-bold bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs md:text-sm tracking-widest border border-white/20 shadow-sm">
                                    {currentIndex + 1} / {images.length}
                                </span>
                            </div>

                            {/* Top Right: Close */}
                            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2.5 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md rounded-full transition-all border border-white/20 shadow-sm group-hover:scale-110">
                                <FaTimes size={18} />
                            </button>

                            {/* Left Arrow (Overlay) */}
                            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100">
                                <FaArrowLeft size={20} className="md:w-6 md:h-6" />
                            </button>

                            {/* Right Arrow (Overlay) */}
                            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 md:opacity-100">
                                <FaArrowRight size={20} className="md:w-6 md:h-6" />
                            </button>

                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentIndex}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    src={images[currentIndex]}
                                    className="max-h-[75vh] md:max-h-[80vh] max-w-full object-contain shadow-2xl rounded-lg bg-black"
                                    alt={`Gallery ${currentIndex}`}
                                />
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Bottom Thumbnails Frame */}
                    <div className="flex-shrink-0 h-24 w-full mt-4 flex justify-center items-center gap-2 overflow-x-auto px-4 touch-pan-x bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]" onClick={e => e.stopPropagation()}>
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setIndex(idx)}
                                className={`relative flex-shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-black scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}`}
                            >
                                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
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

    // Create a beautiful message (URL encoded)
    const shareText = `Check out this amazing stay on ResortWala! 🌟\n\n*${property?.Name || 'Luxury Stay'}*\n📍 ${property?.CityName || 'ResortWala'}\n\n👇 Click here to view:\n${url}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
        } catch (err) {
            // Fallback for HTTP / Older Browsers
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
            } catch (e) {
                console.error("Copy failed", e);
                alert("Failed to copy link manually.");
            }
            document.body.removeChild(textArea);
        }
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between mb-6"><h3 className="font-bold">Share</h3><button onClick={onClose}><FaTimes /></button></div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => window.open(whatsappLink, '_blank')} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50"><FaWhatsapp className="text-green-500" /> WhatsApp</button>
                    <button onClick={handleCopy} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 bg-gray-50 font-medium">
                        {copied ? <FaCheck className="text-green-600" /> : <FaLink />}
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>
            </div>
        </div>
    );
};
