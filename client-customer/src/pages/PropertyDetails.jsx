import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import analytics from '../utils/analytics';
import {
    FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaCar, FaUtensils,
    FaArrowLeft, FaArrowRight, FaHeart, FaShare, FaMinus, FaPlus, FaTimes, FaCheck,
    FaWater, FaUser, FaBed, FaBath, FaDoorOpen, FaShieldAlt, FaMedal, FaUsers,
    FaWhatsapp, FaFacebook, FaTwitter, FaEnvelope, FaLink, FaCopy, FaPhone, FaGlobe,
    FaSnowflake, FaTv, FaCouch, FaRestroom, FaMoneyBillWave, FaChild, FaTicketAlt,
    FaClock, FaBan, FaDog, FaSmoking, FaWineGlass, FaInfoCircle, FaCamera, FaQuoteLeft, FaQuoteRight,
    FaCloudRain, FaMusic, FaTree, FaFire, FaBolt, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaHotTub, FaLanguage, FaGamepad,
    FaSun, FaMoon, FaCoffee
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format, differenceInDays, isWithinInterval, parseISO, parse, startOfDay, addDays, isValid } from 'date-fns';
import toast from 'react-hot-toast';
import RoomCard from '../components/RoomCard';
import SEO from '../components/SEO';
import WaterParkBookingPanel from '../components/ui/WaterParkBookingPanel';
import { getPricing } from '../utils/pricing';

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

    const { slug } = useParams();
    const id = slug; // Backward compatibility for legacy refs
    const [urlParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};

    // -- STATE --
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const [dateRange, setDateRange] = useState(() => {
        const parseDate = (d) => {
            if (!d) return undefined;
            const pd = new Date(d);
            return isValid(pd) ? pd : undefined;
        };

        const sFrom = state.dateRange?.from || urlParams.get('start');
        const sTo = state.dateRange?.to || urlParams.get('end');

        return {
            from: parseDate(sFrom),
            to: parseDate(sTo)
        };
    });

    const [guests, setGuests] = useState(() => {
        const locState = location.state || {};
        const adults = parseInt(urlParams.get('adults'));
        const children = parseInt(urlParams.get('children'));

        if (!isNaN(adults)) {
            return {
                adults: adults,
                children: !isNaN(children) ? children : 0,
                infants: parseInt(urlParams.get('infants')) || 0,
                pets: parseInt(urlParams.get('pets')) || 0
            };
        }
        return locState.guests || { adults: 2, children: 0, infants: 0, pets: 0 };
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // Explicitly FALSE by default
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const [mobileIndex, setMobileIndex] = useState(0); // Dedicated state for mobile swipe
    const datePickerRef = useRef(null);
    const mobileGalleryRef = useRef(null);

    const { isWishlisted, toggleWishlist } = useWishlist();
    const [isSaved, setIsSaved] = useState(false);
    const [availability, setAvailability] = useState({ blocked_dates: [], property_type: 'villa' });
    const [availabilityLoading, setAvailabilityLoading] = useState(true);
    const [showAutoRates, setShowAutoRates] = useState(false);

    // Sync isSaved with WishlistContext
    useEffect(() => {
        if (property?.PropertyId) setIsSaved(isWishlisted(property.PropertyId));
    }, [property?.PropertyId, isWishlisted]);

    const [mealSelection, setMealSelection] = useState(() => {
        return state.mealSelection || parseInt(urlParams.get('meals')) || 0;
    }); // Single counter for meals

    // Sync state when location.state or URL params change (for prefilling on back navigation)
    useEffect(() => {
        const parseDate = (d) => {
            if (!d) return undefined;
            const pd = new Date(d);
            return isValid(pd) ? pd : undefined;
        };

        const locState = location.state || {};

        // Priority: 1. URL Params, 2. Location State
        const sFrom = urlParams.get('start') || locState.dateRange?.from;
        const sTo = urlParams.get('end') || locState.dateRange?.to;
        const adults = parseInt(urlParams.get('adults'));
        const children = parseInt(urlParams.get('children'));
        const meals = parseInt(urlParams.get('meals'));

        if (sFrom && sTo) {
            const from = parseDate(sFrom);
            const to = parseDate(sTo);
            if (from && to) setDateRange({ from, to });
        }

        if (!isNaN(adults)) {
            setGuests(prev => ({ ...prev, adults, children: !isNaN(children) ? children : prev.children }));
        } else if (locState.guests) {
            setGuests(locState.guests);
        }

        if (!isNaN(meals)) {
            setMealSelection(meals);
        } else if (locState.mealSelection !== undefined) {
            setMealSelection(locState.mealSelection);
        }

        if (locState.openDatePicker) {
            setIsDatePickerOpen(true);
        }
    }, [urlParams, location.state]);

    const bookedDates = availability.blocked_dates || [];

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
                const response = await axios.get(`${API_BASE_URL}/properties/${slug}`);
                const propData = response.data;
                const propId = propData.PropertyId || propData.id;

                // Dev Only Check
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                // if (propData.is_developer_only && !isLocal) {
                //     console.log('Access Denied: Developer Only Property');
                //     navigate('/', { replace: true });
                //     return;
                // }

                setProperty(propData);

                // Canonical URL Redirect: If slug exists but URL uses ID, redirect to Slug
                // if (propData.slug && slug === propId.toString()) {
                //     console.log(`[SEO] Redirecting from ID ${propId} to SLUG ${propData.slug}`);
                //     navigate(`/property/${propData.slug}${window.location.search}`, { replace: true });
                //     return;
                // }

                // Fetch Availability separately for real-time accuracy
                const availResponse = await axios.get(`${API_BASE_URL}/properties/${propId}/availability`);
                setAvailability(availResponse.data);
            } catch (error) {
                console.error('Failed to fetch property details/availability:', error);
            } finally {
                setLoading(false);
                setAvailabilityLoading(false);
            }
        };
        fetchData();
    }, [slug, navigate]);

    // Refresh availability periodically or on window focus
    useEffect(() => {
        if (!property?.PropertyId) return;
        const refreshAvail = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/properties/${property.PropertyId}/availability`);
                setAvailability(res.data);
            } catch (e) { }
        };
        window.addEventListener('focus', refreshAvail);
        return () => window.removeEventListener('focus', refreshAvail);
    }, [property?.PropertyId]);

    // -- AVAILABILITY CHECK --
    const isDateUnavailable = (checkDate) => {
        if (!availability?.blocked_dates) return false;
        try {
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            const isBlocked = availability.blocked_dates.includes(dateStr);
            if (isBlocked) {
                console.log(`[DEBUG] Date ${dateStr} is BLOCKED in availability data`);
            }
            return isBlocked;
        } catch (e) { return false; }
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

    // Verify reset on mount to prevent auto-open (Defensive check)
    // Verify reset on mount to prevent auto-open (Defensive check)
    // Only reset if NO explicit instruction to open exists in state
    useEffect(() => {
        if (!location.state?.openDatePicker) {
            setIsDatePickerOpen(false);
        }
    }, [id, location.state]);

    // -- HANDLERS --
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Only trigger click-outside logic if the date picker is open AND it's not the mobile modal
            // (The mobile modal has its own backdrop for closing)
            if (window.innerWidth >= 1024) { // Desktop only for this ref-based closing
                if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                    setIsDatePickerOpen(false);
                }
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
    // Prepare objects for Lightbox (preserve detailed info including category)
    const lightboxImages = property?.images?.length ? property.images : (property?.image_url ? [{ image_url: property.image_url, category: 'All' }] : []);

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

    // Track Mobile Scroll for Index (IntersectionObserver)
    const mobileSlidesRef = useRef([]);

    const getPriceForDate = (date) => {
        if (!date) return 0;
        const w = date.getDay(); // 0 (Sun) - 6 (Sat)
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[w];
        const dStr = format(date, 'yyyy-MM-dd');

        // 1. Holiday Check
        const holiday = property?.holidays?.find(h => {
            const hStart = h.from_date ? h.from_date.substring(0, 10) : '';
            const hEnd = h.to_date ? h.to_date.substring(0, 10) : '';
            return dStr >= hStart && dStr <= hEnd;
        });
        if (holiday) return parseFloat(holiday.base_price);

        // 2. 7-Day Matrix from admin_pricing
        const adminPricing = property?.admin_pricing || {};
        if (adminPricing[dayName]?.villa?.final) {
            return parseFloat(adminPricing[dayName].villa.final);
        }

        // 3. Waterpark Logic
        const isWaterparkLocal = property?.PropertyType?.toLowerCase().includes('water') ||
            property?.Name?.toLowerCase().includes('water');
        if (isWaterparkLocal) {
            const isWeekend = (w === 0 || w === 6 || w === 5);
            const wpKey = isWeekend ? 'adult_weekend' : 'adult_weekday';
            const val = adminPricing[wpKey]?.final || adminPricing[wpKey];
            if (val) return parseFloat(val);
        }

        // 4. Legacy Buckets / Fallback
        const obData = typeof property?.onboarding_data === 'string' ? JSON.parse(property.onboarding_data) : (property?.onboarding_data || {});
        const pricingMeta = obData.pricing || {};
        const baseRate = property?.Price || property?.ResortWalaRate || 0;
        const PRICE_WEEKDAY = parseFloat(property?.price_mon_thu || pricingMeta.weekday || baseRate);
        const PRICE_FRISUN = parseFloat(property?.price_fri_sun || pricingMeta.weekend || baseRate);
        const PRICE_SATURDAY = parseFloat(property?.price_sat || pricingMeta.saturday || baseRate);

        if (w === 6) return PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY;
        if (w === 0 || w === 5) return PRICE_FRISUN || PRICE_WEEKDAY;
        return PRICE_WEEKDAY;
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = Number(entry.target.getAttribute('data-index'));
                    if (!isNaN(index)) setMobileIndex(index);
                }
            });
        }, { threshold: 0.5, root: mobileGalleryRef.current });

        if (mobileSlidesRef.current) {
            mobileSlidesRef.current.forEach(slide => {
                if (slide) observer.observe(slide);
            });
        }

        return () => observer.disconnect();
    }, [galleryImages]); // Re-run when images load


    const handleDateSelect = (day) => {
        if (!day) return;
        const today = startOfDay(new Date());
        const selectedDay = startOfDay(day);

        if (selectedDay < today) return;

        const isWaterparkProp = checkIsWaterpark(property);

        // Helper to check if a specific day is booked
        const isBooked = isDateUnavailable(selectedDay);

        if (isWaterparkProp) {
            if (isBooked) {
                toast.error("Date is not available.");
                return;
            }
            setDateRange({ from: selectedDay, to: selectedDay });

            // Close automatically ON DESKTOP ONLY. 
            // On Mobile, keep it open so user can proceed or change.
            if (window.innerWidth >= 1024) {
                setTimeout(() => {
                    setIsDatePickerOpen(false);
                }, 50);
            }
            return;
        }

        if (!dateRange.from || (dateRange.from && dateRange.to)) {
            // Selecting Check-In Date (Click 1)
            if (isBooked) {
                toast.error("Selected date is unavailable for Check-In.");
                return;
            }
            setDateRange({ from: selectedDay, to: undefined });
        } else {
            // Selecting Check-Out Date (Click 2)
            if (selectedDay <= dateRange.from) {
                // If user clicks same day or before, treat as new check-in
                if (isBooked) {
                    toast.error("Selected date is unavailable for Check-In.");
                    return;
                }
                setDateRange({ from: selectedDay, to: undefined });
            } else {
                // Check if any date in between is booked
                if (!checkRangeAvailability(dateRange.from, selectedDay)) {
                    toast.error("Some dates in this range are already booked.");
                    return;
                }
                setDateRange({ from: dateRange.from, to: selectedDay });

                // Close automatically on Desktop.
                // Mobile stays open so user can see selection/summary or guest choice.
                if (window.innerWidth >= 1024) {
                    setTimeout(() => setIsDatePickerOpen(false), 50);
                }
            }
        }
    };

    const { user } = useAuth();

    // -- DERIVED & CALCULATED DATA (Must be above early returns for Hook consistency) --
    const ob = property ? (typeof property.onboarding_data === 'string' ? JSON.parse(property.onboarding_data) : (property.onboarding_data || {})) : {};

    // Ensure array fields are parsed correctly if stored as strings
    if (ob.otherAttractions && typeof ob.otherAttractions === 'string') {
        ob.otherAttractions = ob.otherAttractions.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    }
    if (ob.otherRules && typeof ob.otherRules === 'string') {
        ob.otherRules = ob.otherRules.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    }

    const obPricing = ob.pricing || {};
    const roomConfig = ob.roomConfig || { livingRoom: {}, bedrooms: [] };

    const checkIsWaterpark = (p) => {
        if (!p) return false;
        const type = (p.PropertyType || p.property_type || p.display_type || '').toLowerCase();
        const name = (p.Name || '').toLowerCase();
        return type.includes('water') || name.includes('water');
    };

    const isWaterpark = checkIsWaterpark(property);

    const handleReserve = () => {
        // Waterparks only need 'from' date (single day visit). Villas need range.
        if (!dateRange.from || (!isWaterpark && !dateRange.to)) {
            setIsDatePickerOpen(true);
            return;
        }

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

    const adminPricing = property?.admin_pricing || {};
    const onboardingPricing = obPricing || {};

    const getPrice = (path) => {
        const val = path?.villa?.final || path;
        return (val && parseFloat(val) > 0) ? parseFloat(val) : 0;
    };

    const PRICE_WEEKDAY = property ? (property.display_price || getPrice(adminPricing?.mon_thu) || parseFloat(property.price_mon_thu) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0) : 0;
    const PRICE_FRISUN = property ? (property.display_price || getPrice(adminPricing?.fri_sun) || parseFloat(property.price_fri_sun) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0) : 0;
    const PRICE_SATURDAY = property ? (property.display_price || getPrice(adminPricing?.sat) || parseFloat(property.price_sat) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0) : 0;
    const EXTRA_GUEST_CHARGE = safeFloat(property?.extra_guest_charge ?? onboardingPricing?.extraGuestCharge ?? onboardingPricing?.extraMattressCharge ?? property?.ExtraGuestCharge, 1000);
    const FOOD_CHARGE = safeFloat(ob.foodRates?.perPerson ?? ob.foodRates?.veg, 1000);
    const GST_PERCENTAGE = safeFloat(property?.gst_percentage, 18);
    const pricing = property ? getPricing(property) : null;

    const calculateBreakdown = () => {
        if (!property || !dateRange.from) return null;
        if (!isWaterpark && !dateRange.to) return null;

        const effectiveTo = dateRange.to || dateRange.from;
        let nights = differenceInDays(effectiveTo, dateRange.from);
        if (isWaterpark && nights === 0) nights = 1;
        if (nights <= 0) return null;

        let totalVillaRate = 0;
        let totalMarketRate = 0;
        let totalAdultTicket = 0;
        let totalChildTicket = 0;
        let nightDetails = [];

        // For Waterpark reference rates
        let adultTicketRate = 0;
        let adultMarketRate = 0;
        let childTicketRate = 0;
        let childMarketRate = 0;

        const baseGuestLimit = parseInt(property?.Occupancy || onboardingPricing?.extraGuestLimit || 12);
        const extraGuests = Math.max(0, (guests.adults + guests.children) - baseGuestLimit);
        let totalExtra = 0;
        let totalFood = 0;

        // Base Meal Rates
        const VEG_RATE = safeFloat(ob.foodRates?.veg ?? FOOD_CHARGE, 1000);
        const NONVEG_RATE = safeFloat(ob.foodRates?.nonVeg ?? ob.foodRates?.nonveg ?? FOOD_CHARGE, 1200);
        const JAIN_RATE = safeFloat(ob.foodRates?.jain ?? VEG_RATE, 1000);
        const MAX_MEAL_RATE = Math.max(VEG_RATE, NONVEG_RATE, JAIN_RATE);

        for (let i = 0; i < nights; i++) {
            const d = new Date(dateRange.from); d.setDate(d.getDate() + i);
            const w = d.getDay();
            const isW = (w === 0 || w === 6 || w === 5);

            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            // 1. Check for Holiday Override
            const holiday = property.holidays?.find(h => {
                const dStr = format(d, 'yyyy-MM-dd');
                const hStart = h.from_date ? h.from_date.substring(0, 10) : '';
                const hEnd = h.to_date ? h.to_date.substring(0, 10) : '';
                return dStr >= hStart && dStr <= hEnd;
            });

            let rate = 0;
            let marketDayRate = 0;

            if (holiday) {
                rate = parseFloat(holiday.base_price);
                marketDayRate = rate;
            } else {
                const dayKey = dayNames[w];
                const dayPricing = adminPricing?.[dayKey];

                if (dayPricing?.villa?.final) {
                    rate = parseFloat(dayPricing.villa.final);
                    marketDayRate = parseFloat(dayPricing.villa.current || rate);
                } else {
                    if (w === 6) { // Saturday
                        rate = parseFloat(PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY);
                        marketDayRate = parseFloat(adminPricing.sat?.villa?.current || adminPricing.fri_sun?.villa?.current || property.Price || rate);
                    } else if (w === 0 || w === 5) { // Fri/Sun
                        rate = parseFloat(PRICE_FRISUN || PRICE_WEEKDAY);
                        marketDayRate = parseFloat(adminPricing.fri_sun?.villa?.current || property.Price || rate);
                    } else { // Mon-Thu
                        rate = parseFloat(PRICE_WEEKDAY);
                        marketDayRate = parseFloat(adminPricing.mon_thu?.villa?.current || property.Price || rate);
                    }
                }
            }

            if (isNaN(rate)) rate = 0;
            if (isNaN(marketDayRate)) marketDayRate = rate;

            // Daily Extra Guest Logic
            let dailyExtraRate = EXTRA_GUEST_CHARGE;
            if (!holiday && adminPricing?.[dayNames[w]]?.extra_person?.final !== undefined) {
                dailyExtraRate = parseFloat(adminPricing[dayNames[w]].extra_person.final);
            }
            const dailyExtraTotal = extraGuests * dailyExtraRate;
            totalExtra += dailyExtraTotal;

            // Daily Food Logic
            let dailyVeg = VEG_RATE;
            let dailyJain = JAIN_RATE;

            if (!holiday && adminPricing?.[dayNames[w]]) {
                if (adminPricing[dayNames[w]].meal_person?.final !== undefined) dailyVeg = parseFloat(adminPricing[dayNames[w]].meal_person.final);
                if (adminPricing[dayNames[w]].jain_meal_person?.final !== undefined) dailyJain = parseFloat(adminPricing[dayNames[w]].jain_meal_person.final);
            }
            const dailyMaxMeal = Math.max(dailyVeg, NONVEG_RATE, dailyJain);
            const dailyFoodTotal = mealSelection * dailyMaxMeal;
            totalFood += dailyFoodTotal;

            totalVillaRate += rate;
            totalMarketRate += marketDayRate;
            nightDetails.push({
                date: format(d, 'MMM dd'),
                rate,
                extraRate: dailyExtraRate,
                dailyExtraTotal,
                foodRate: dailyMaxMeal,
                dailyFoodTotal
            });

            if (isWaterpark) {
                const suffix = isW ? 'weekend' : 'weekday';
                const wpKey = `adult_${suffix}`;
                const wpKeyChild = `child_${suffix}`;
                let aRate = parseFloat(adminPricing[wpKey]?.final || adminPricing[wpKey] || (isW ? (PRICE_SATURDAY || PRICE_FRISUN) : PRICE_WEEKDAY));
                let cRate = parseFloat(adminPricing[wpKeyChild]?.final || adminPricing[wpKeyChild] || 500);

                totalAdultTicket += (aRate * guests.adults);
                totalChildTicket += (cRate * guests.children);

                // For reference display (use the first night's rates as representative)
                if (i === 0) {
                    adultTicketRate = aRate;
                    adultMarketRate = parseFloat(adminPricing[`adult_${suffix}`]?.current || aRate);
                    childTicketRate = cRate;
                    childMarketRate = parseFloat(adminPricing[`child_${suffix}`]?.current || cRate);
                }
            }
        }

        if (isWaterpark) {
            let totalMarketTickets = 0;
            for (let j = 0; j < nights; j++) {
                const dj = new Date(dateRange.from); dj.setDate(dj.getDate() + j);
                const wj = dj.getDay();
                const isWj = (wj === 0 || wj === 6 || wj === 5);
                const suffix = isWj ? 'weekend' : 'weekday';
                let ma = parseFloat(adminPricing[`adult_${suffix}`]?.current || adminPricing[`adult_${suffix}`]?.final || adminPricing[`adult_${suffix}`] || (isWj ? (PRICE_SATURDAY || PRICE_FRISUN) : PRICE_WEEKDAY));
                let mc = parseFloat(adminPricing[`child_${suffix}`]?.current || adminPricing[`child_${suffix}`]?.final || adminPricing[`child_${suffix}`] || 500);
                totalMarketTickets += (ma * guests.adults) + (mc * guests.children);
            }

            const grantTotal = totalAdultTicket + totalChildTicket;
            const savings = totalMarketTickets - grantTotal;
            const totalG = guests.adults + guests.children;

            return {
                nights,
                totalAdultTicket,
                totalChildTicket,
                adultTicketRate,
                adultMarketRate,
                childTicketRate,
                childMarketRate,
                grantTotal,
                totalSavings: savings > 0 ? savings : 0,
                tokenAmount: (totalG * 50),
                gstAmount: 0,
                isWaterpark: true,
                nightDetails
            };
        }

        // Villa Logic - Final Summation
        const taxableAmount = totalVillaRate + totalExtra + totalFood;
        const gstAmount = (taxableAmount * GST_PERCENTAGE) / 100;
        const tokenAmount = Math.ceil(taxableAmount * 0.10);
        const totalSavings = (totalMarketRate > totalVillaRate) ? Math.round(totalMarketRate - totalVillaRate) : 0;

        return {
            nights,
            totalVillaRate,
            extraGuests,
            totalExtra,
            totalFood,
            gstAmount,
            subtotal: taxableAmount,
            grantTotal: taxableAmount + gstAmount,
            rates: { veg: VEG_RATE, nonVeg: NONVEG_RATE, jain: JAIN_RATE, max: MAX_MEAL_RATE },
            totalSavings,
            tokenAmount,
            isWaterpark: false,
            nightDetails
        };
    };
    const priceBreakdown = calculateBreakdown();

    const getMinPrice = () => {
        if (!property) return 0;
        const prices = [];

        // 1. Check admin_pricing 7-day matrix
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach(d => {
            const val = property.admin_pricing?.[d]?.villa?.final || property.admin_pricing?.[d]?.adult_rate?.discounted || property.admin_pricing?.[d]?.adult?.discounted;
            if (val) prices.push(parseFloat(val));
        });

        // 2. Waterpark pricing check
        if (isWaterpark) {
            const wpKeys = ['adult_weekday', 'adult_weekend'];
            wpKeys.forEach(k => {
                const val = adminPricing[k]?.final || adminPricing[k];
                if (val) prices.push(parseFloat(val));
            });
        }

        // 3. Fallbacks
        if (property.display_price) prices.push(parseFloat(property.display_price));
        if (property.lowest_price_next_30) prices.push(parseFloat(property.lowest_price_next_30));
        if (property.ResortWalaRate) prices.push(parseFloat(property.ResortWalaRate));
        if (property.Price) prices.push(parseFloat(property.Price));
        if (PRICE_WEEKDAY) prices.push(PRICE_WEEKDAY);

        const validPrices = prices.filter(p => !isNaN(p) && p > 0);
        return validPrices.length > 0 ? Math.min(...validPrices) : 0;
    };

    const minPrice = getMinPrice();

    // Defensive Check: Price Parity (Hook must be at top level)
    useEffect(() => {
        if (!priceBreakdown && property?.display_price && pricing) {
            const desktopPrice = pricing.sellingPrice;
            const mobilePrice = PRICE_WEEKDAY;
            if (Math.abs(desktopPrice - mobilePrice) > 1) {
                console.warn(`[PriceParity] Mismatch detected: Desktop=${desktopPrice}, Mobile=${mobilePrice}. Synchronized fallback uses backend display_price: ${property.display_price}`);
            }
        }
    }, [property, pricing, priceBreakdown]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;

    if (!property) {
        // Redirect to home if property not found
        setTimeout(() => navigate('/', { replace: true }), 0);
        return null;
    }

    // Market Price (Vendor Ask - Strikethrough)
    const originalPrice = parseFloat(
        adminPricing?.mon_thu?.villa?.current ||
        property?.Price ||
        property?.PerCost ||
        onboardingPricing?.weekday ||
        0
    );

    // Selling Price (Customer Rate - Display)
    const rwRate = parseFloat(
        adminPricing?.mon_thu?.villa?.final ||
        property?.ResortWalaRate ||
        property?.price_mon_thu ||
        originalPrice ||
        0
    );

    const dealPrice = parseFloat(property?.DealPrice || property?.deal_price || 0);

    // Improved Google Map Link Handling
    let googleMapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(property.Location || property.Address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    // Priority 1: DB Coordinates (Latitude, Longitude)
    if (property.Latitude && property.Longitude) {
        googleMapSrc = `https://maps.google.com/maps?q=${property.Latitude},${property.Longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    // Priority 2: GoogleMapLink (if valid embed/iframe)
    else if (property.GoogleMapLink) {
        if (property.GoogleMapLink.includes('iframe')) {
            googleMapSrc = property.GoogleMapLink.match(/src="([^"]+)"/)?.[1] || googleMapSrc;
        } else if (property.GoogleMapLink.includes('embed')) {
            googleMapSrc = property.GoogleMapLink;
        }
    }
    // Priority 3: Fuzzy fallback (Already set)
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
                    bookingState: {
                        propertyId: property.PropertyId,
                        propertyName: property.Name,
                        dateRange,
                        guests,
                        mealSelection,
                        breakdown: priceBreakdown
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
                mealSelection,
                breakdown: priceBreakdown
            }
        });
    };

    // -- SCHEMA GENERATION --
    const generatePropertySchema = () => {
        if (!property) return null;

        const isWaterpark = checkIsWaterpark(property);
        const schemaType = isWaterpark ? "AmusementPark" : (property.PropertyType === 'Villa' ? 'Hotel' : 'LodgingBusiness');
        const images = property.images?.map(img => img.image_url) || [property.image_url];
        const rating = property.rating_display?.total || property.Rating || 4.5;
        const reviewCount = property.rating_display?.count || 1;

        return {
            "@context": "https://schema.org",
            "@type": schemaType,
            "name": property.display_name || property.Name,
            "description": property.LongDescription || property.ShortDescription,
            "image": images,
            "url": window.location.href,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": property.City || property.CityName,
                "addressRegion": property.State || "Maharashtra",
                "addressCountry": "IN"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": property.Latitude,
                "longitude": property.Longitude
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": rating,
                "bestRating": "5",
                "worstRating": "1",
                "reviewCount": reviewCount
            },
            "offers": {
                "@type": "Offer",
                "priceCurrency": "INR",
                "price": property.Price || property.ResortWalaRate || 5000,
                "priceValidUntil": format(addDays(new Date(property.updated_at || new Date()), 30), 'yyyy-MM-dd'),
                "availability": "https://schema.org/InStock",
                "url": window.location.href
            }
        };
    };

    return (
        <div className="bg-white min-h-screen pb-20 pt-[110px]">
            {property && (
                <SEO
                    title={property.display_name || property.Name}
                    description={`Book ${property.display_name || property.Name} in ${property.City || property.Location}. ${ob.shortDescription || 'Luxury stay with modern amenities.'}`}
                    image={property.images?.[0]?.image_url || property.image_url}
                    url={window.location.href}
                    type="place"
                    schema={generatePropertySchema()}
                />
            )}
            {/* 1. HERO GALLERY */}
            <div className="container mx-auto px-4 lg:px-8 py-6 max-w-7xl">
                <Header property={property} isSaved={isSaved} setIsSaved={setIsSaved} setIsShareModalOpen={setIsShareModalOpen} user={user} navigate={navigate} location={window.location} toggleWishlist={toggleWishlist} id={property?.PropertyId || property?.id} />

                {galleryImages.length > 0 ? (
                    /* DESKTOP GRID GALLERY */
                    <div className="hidden md:grid rounded-2xl overflow-hidden shadow-sm h-[350px] md:h-[500px] mb-8 grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 relative">
                        {/* Main Image */}
                        <div className="col-span-1 md:col-span-2 row-span-2 relative cursor-pointer group overflow-hidden" onClick={() => handleGalleryOpen(0)}>
                            <img src={galleryImages[0]} alt={`${property.Name} - Main Image`} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                        </div>

                        {/* Side Images */}
                        {[1, 2, 3, 4].map((idx) => (
                            <div key={idx} className={`hidden md:block col-span-1 row-span-1 relative cursor-pointer group overflow-hidden ${idx === 2 ? 'rounded-tr-2xl' : ''} ${idx === 4 ? 'rounded-br-2xl' : ''}`} onClick={() => handleGalleryOpen(idx)}>
                                <img src={galleryImages[idx] || galleryImages[0]} alt={`${property.Name} - View ${idx}`} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
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

                {/* MOBILE GALLERY (Swipeable) */}
                {galleryImages.length > 0 && (
                    <div className="md:hidden -mx-4 mb-6 relative group">
                        <div
                            ref={mobileGalleryRef}
                            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-[320px] scroll-smooth"
                        >
                            {galleryImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    data-index={idx}
                                    ref={el => mobileSlidesRef.current[idx] = el}
                                    className="flex-none w-full snap-center px-1"
                                    onClick={() => handleGalleryOpen(idx)}
                                >
                                    <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-sm">
                                        <img src={img} alt={`${property.Name} - Slide ${idx}`} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Dots & Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                            <div className="flex gap-1.5">
                                {galleryImages.slice(0, 5).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`transition-all duration-300 rounded-full shadow-sm ${(i === mobileIndex || (i === 4 && mobileIndex > 4))
                                            ? 'w-4 h-1.5 bg-white'
                                            : 'w-1.5 h-1.5 bg-white/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md pointer-events-none border border-white/10">
                            {mobileIndex + 1} / {galleryImages.length}
                        </div>
                    </div>
                )}

                {/* 2. STICKY TABS */}
                <div className="sticky top-[72px] z-40 bg-white/70 backdrop-blur-md border-b border-gray-100 mb-8 -mx-4 px-4 md:mx-0 md:px-0">
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
                            <div className="pb-6 border-b border-gray-100">
                                <div className="mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{property.display_name || property.Name}</h2>
                                    {ob.shortDescription && (
                                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-2xl mb-2 font-medium">{ob.shortDescription}</p>
                                    )}
                                    <p className="text-gray-500 text-sm font-medium">
                                        {property.PropertyType} · {property.Occupancy || property.MaxCapacity} - {property.MaxCapacity} guests
                                        {!isWaterpark && <> · {roomConfig.bedrooms?.length || property.NoofRooms} bedrooms · {roomConfig.bedrooms?.filter(r => r.bathroom).length || 0} bathrooms</>}
                                    </p>
                                </div>
                            </div>

                            <div className="py-10 border-b border-gray-100">
                                <h3 className="text-3xl font-bold text-gray-900 mb-6 font-serif relative inline-block">
                                    About this property
                                    <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full"></span>
                                </h3>
                                {property.LongDescription ? (
                                    <div className="text-gray-600 text-lg leading-9 font-serif tracking-wide whitespace-pre-line text-justify">
                                        {property.LongDescription}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 italic">No description provided for this property.</div>
                                )}
                            </div>
                            {isWaterpark && (
                                <div className="py-4 border-b border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-2"><FaMedal className="text-[#FF385C]" /> What's Included</h3>
                                    {ob.inclusions && Object.keys(ob.inclusions).length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(() => {
                                                const processed = {};
                                                // Priority: 1. Strings (Detailed), 2. Booleans (Simple)
                                                Object.entries(ob.inclusions).forEach(([key, val]) => {
                                                    const norm = key.toLowerCase().trim();
                                                    if (typeof val === 'string' && val !== 'Not Included' && val.trim() !== '') {
                                                        processed[norm] = { key, val, isString: true };
                                                    } else if (val === true) {
                                                        if (!processed[norm] || !processed[norm].isString) {
                                                            processed[norm] = { key, val, isString: false };
                                                        }
                                                    }
                                                });

                                                return Object.values(processed).sort((a, b) => (b.isString ? 1 : 0) - (a.isString ? 1 : 0)).map(({ key, val, isString }) => (
                                                    <div key={key} className={`flex items-start gap-3 p-4 rounded-xl ${isString ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                                                        <div className={`bg-white p-2 rounded-full ${isString ? 'text-blue-600' : 'text-green-600'}`}>
                                                            {isString ? <FaUtensils size={12} /> : <FaCheck size={12} />}
                                                        </div>
                                                        <div>
                                                            <span className={`font-semibold text-sm ${isString ? 'text-blue-900 block capitalize' : 'text-gray-900 uppercase mt-0.5'}`}>
                                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                                            </span>
                                                            {isString && <span className="text-xs text-blue-600 block">{val}</span>}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
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
                            {/* Additional Amenities */}
                            {((Array.isArray(ob.otherAmenities) && ob.otherAmenities.length > 0) || (typeof ob.otherAmenities === 'string' && ob.otherAmenities.trim().length > 0)) && (
                                <div className="mt-8">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="bg-purple-100 p-1.5 rounded-lg text-purple-600"><FaStar size={14} /></div>
                                        Exclusive Amenities
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(ob.otherAmenities) ? ob.otherAmenities : ob.otherAmenities.split(',')).map((amenity, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                                {amenity.trim()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Other Attractions */}
                            {(() => {
                                const genericAttractions = ['bhushi dam', 'tiger point', 'lonavala lake', 'karla caves', 'lohagad fort', 'lions point', 'narayani dham'];
                                const city = property.City?.toLowerCase() || '';
                                const isLonavala = city.includes('lonavala') || city.includes('khandala');

                                const filteredAttractions = (Array.isArray(ob.otherAttractions) ? ob.otherAttractions : [])
                                    .filter(attr => {
                                        if (isLonavala) return true;
                                        return !genericAttractions.some(g => attr.toLowerCase().includes(g));
                                    });

                                if (filteredAttractions.length === 0) return null;

                                return (
                                    <div className="mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 font-serif text-lg">
                                            <FaMapMarkerAlt className="text-blue-600" /> Nearby Attractions
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {filteredAttractions.map((attr, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-50 shadow-sm hover:shadow-md transition cursor-default">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 ml-1"></div>
                                                    <span className="text-gray-800 font-medium text-sm">{attr}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </section>











                        {!isWaterpark && (
                            <section ref={sections.rooms} className="scroll-mt-32 pb-8 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Room Details</h2>
                                {roomConfig.bedrooms?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(roomConfig.livingRooms || (roomConfig.livingRoom ? [roomConfig.livingRoom] : [])).map((room, idx) => (
                                            <RoomCard
                                                key={`living-${idx}`}
                                                name={(roomConfig.livingRooms?.length > 1) ? `Living Room ${idx + 1}` : "Living Room"}
                                                details={room}
                                                icon={<FaCouch />}
                                            />
                                        ))}
                                        {roomConfig.bedrooms?.map((room, idx) => <RoomCard key={idx} name={`Bedroom ${idx + 1}`} details={room} icon={<FaBed />} />)}
                                    </div>
                                ) : <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">Room configuration not specified.</div>}
                            </section>
                        )}

                        {!isWaterpark && ((ob.mealPlans && Object.values(ob.mealPlans).some(m => m.available)) || (ob.foodRates && (ob.foodRates.veg || ob.foodRates.nonVeg))) && (
                            <section className="scroll-mt-32 space-y-6 pb-8 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif flex items-center gap-3">
                                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><FaUtensils size={18} /></div>
                                    Food & Dining
                                </h3>

                                <div className="bg-orange-50/50 rounded-xl p-6 border border-orange-100 mb-6">
                                    <h4 className="font-bold text-gray-900 mb-2 text-lg">🍴 Dining Made Just for You ❤️</h4>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        Indulge in freshly prepared meals made with care and local flavours 😋. From comforting home-style dishes to regional specialties, enjoy delicious food without stepping out of your villa.
                                    </p>
                                    <div className="mb-4">
                                        <p className="font-bold text-gray-800 mb-2">What to expect:</p>
                                        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-1">
                                            <li>Fresh, seasonal ingredients</li>
                                            <li>Authentic local recipes</li>
                                            <li>Customisable menu on request</li>
                                            <li>Flexible meal timings</li>
                                        </ul>
                                    </div>
                                    <p className="text-xs text-gray-400 italic mb-4">Prices may vary based on season and availability.</p>

                                    {/* Fallback Rates Display Merged Here */}
                                    {(!ob.mealPlans || !Object.values(ob.mealPlans).some(m => m.available)) && (
                                        <div className="pt-4 border-t border-orange-200/50">
                                            <h4 className="font-bold text-gray-900 mb-2 text-sm">Dining Packages Available</h4>
                                            <p className="text-sm text-gray-600 mb-3">We offer delicious home-style meals. Detailed menu available on request.</p>
                                            <div className="flex flex-wrap gap-2 text-sm">
                                                {ob.foodRates?.veg && (
                                                    <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-center">
                                                        <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Veg</div>
                                                    </div>
                                                )}
                                                {(ob.foodRates?.nonVeg || ob.foodRates?.nonveg) && (
                                                    <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-center">
                                                        <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Non-Veg</div>
                                                    </div>
                                                )}
                                                {ob.foodRates?.jain && (
                                                    <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100 text-center">
                                                        <div className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Jain</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Individual Meal Plans */}
                                {ob.mealPlans && Object.values(ob.mealPlans).some(m => m.available) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { name: 'Breakfast', key: 'breakfast', icon: <FaSun className="text-yellow-500" />, bg: 'bg-yellow-50/50', border: 'border-yellow-100' },
                                            { name: 'Lunch', key: 'lunch', icon: <FaUtensils className="text-orange-500" />, bg: 'bg-orange-50/50', border: 'border-orange-100' },
                                            { name: 'High Tea', key: 'hitea', icon: <FaCoffee className="text-brown-500" />, bg: 'bg-stone-50/50', border: 'border-stone-100' },
                                            { name: 'Dinner', key: 'dinner', icon: <FaMoon className="text-indigo-500" />, bg: 'bg-indigo-50/50', border: 'border-indigo-100' }
                                        ].map(meal => {
                                            const mData = ob.mealPlans?.[meal.key.toLowerCase()] || ob.mealPlans?.[meal.key]; // Handle case sensitivity
                                            if (!mData?.available) return null;
                                            return (
                                                <div key={meal.key} className={`relative overflow-hidden rounded-2xl border ${meal.border} ${meal.bg} p-5 transition hover:shadow-md group`}>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 text-lg group-hover:scale-110 transition">{meal.icon}</div>
                                                            <h4 className="font-bold text-gray-900 text-lg">{meal.name}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        {mData.vegRate && (
                                                            <div className="flex justify-between items-center bg-white/60 p-2 px-3 rounded-lg border border-white/50 backdrop-blur-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-green-200"></span>
                                                                    <span className="text-sm font-medium text-gray-700">Vegetarian</span>
                                                                </div>
                                                                <span className="font-bold text-gray-900">₹{mData.vegRate}</span>
                                                            </div>
                                                        )}
                                                        {mData.nonVegRate && (
                                                            <div className="flex justify-between items-center bg-white/60 p-2 px-3 rounded-lg border border-white/50 backdrop-blur-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200"></span>
                                                                    <span className="text-sm font-medium text-gray-700">Non-Veg</span>
                                                                </div>
                                                                <span className="font-bold text-gray-900">₹{mData.nonVegRate}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
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
                                    <h3 className="font-bold text-gray-900">Important Information</h3>
                                    <ul className="list-disc list-outside ml-5 text-gray-700 space-y-2">
                                        {ob.otherRules && ob.otherRules.map((rule, idx) => (
                                            <li key={idx} className="pl-1">{rule}</li>
                                        ))}
                                        {(!ob.otherRules || ob.otherRules.length === 0) && property.PropertyRules && (
                                            <li className="pl-1">{property.PropertyRules}</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Property Map */}
                        {(property.GoogleMapLink || property.Location || property.Address) && (
                            <section ref={sections.location} className="scroll-mt-32 pb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Location</h2>
                                <div className="rounded-3xl overflow-hidden shadow-md border border-gray-100 h-[400px] bg-gray-100 relative group">
                                    <iframe
                                        src={googleMapSrc}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="transition duration-700 opacity-90 group-hover:opacity-100"
                                    ></iframe>
                                    <a
                                        href={property.GoogleMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.Location || property.Address)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute bottom-4 right-4 bg-white px-5 py-2.5 rounded-xl shadow-lg text-sm font-bold text-gray-900 flex items-center gap-2 hover:bg-black hover:text-white transition transform hover:scale-105"
                                    >
                                        <FaMapMarkerAlt /> Open in Maps
                                    </a>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="relative h-full hidden lg:block">
                        <div className="sticky top-28 border border-gray-200 rounded-3xl p-6 shadow-xl bg-white/95 backdrop-blur-md z-30">
                            {isWaterpark ? (
                                <WaterParkBookingPanel
                                    property={property}
                                    guests={guests}
                                    setGuests={setGuests}
                                    dateRange={dateRange}
                                    priceBreakdown={priceBreakdown}
                                    isDatePickerOpen={isDatePickerOpen}
                                    setIsDatePickerOpen={setIsDatePickerOpen}
                                    handleDateSelect={handleDateSelect}
                                    datePickerRef={datePickerRef}
                                    bookedDates={bookedDates}
                                    pricing={pricing}
                                    getPriceForDate={getPriceForDate}
                                    handleReserve={handleReserve}
                                    isWaterpark={true}
                                    minPrice={minPrice}
                                />
                            ) : (
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
                                    mealSelection={mealSelection}
                                    setMealSelection={setMealSelection}
                                    isWaterpark={isWaterpark}
                                    bookedDates={bookedDates}
                                    getPriceForDate={getPriceForDate}
                                    pricing={pricing}
                                    minPrice={minPrice}
                                    showAutoRates={showAutoRates}
                                    setShowAutoRates={setShowAutoRates}
                                />
                            )}
                        </div>
                        <div className="mt-6 text-center text-gray-400 text-xs flex items-center justify-center gap-1"><FaShieldAlt /> Secure Booking via ResortWala</div>
                    </div>
                </div>

                <MobileFooter
                    price={priceBreakdown || minPrice || property.display_price || PRICE_WEEKDAY}
                    unit={isWaterpark ? '/ person' : '/ night'}
                    buttonText={(!dateRange.from || (!isWaterpark && !dateRange.to)) ? 'Check Availability' : 'Reserve Now'}
                    dateRange={dateRange}
                    guests={guests}
                    mealSelection={mealSelection}
                    isWaterpark={isWaterpark}
                    onDateClick={() => {
                        setIsDatePickerOpen(true);
                        setTimeout(() => {
                            if (datePickerRef.current) datePickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }}
                    onReserve={() => {
                        if (!dateRange.from || (!isWaterpark && !dateRange.to)) {
                            setIsDatePickerOpen(true);
                            // Defensive scroll for desktop
                            if (window.innerWidth >= 1024 && datePickerRef.current) {
                                datePickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } else {
                            handleReserve();
                        }
                    }}
                />

                {/* Mobile Date Picker Modal */}
                <AnimatePresence>
                    {isDatePickerOpen && (
                        <MobileDateSelector
                            isOpen={isDatePickerOpen}
                            onClose={() => setIsDatePickerOpen(false)}
                            dateRange={dateRange}
                            onDateSelect={handleDateSelect}
                            bookedDates={bookedDates}
                            property={property}
                            pricing={pricing}
                            isWaterpark={isWaterpark}
                            guests={guests}
                            setGuests={setGuests}
                            maxCapacity={parseInt(property?.MaxCapacity || property?.Occupancy || 20)}
                            priceBreakdown={priceBreakdown}
                            defaultPrice={Number(property?.Price) || 0}
                            onReserve={handleReserve}
                            mealSelection={mealSelection}
                            setMealSelection={setMealSelection}
                            showAutoRates={showAutoRates}
                            setShowAutoRates={setShowAutoRates}
                        />
                    )}
                </AnimatePresence>



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

                {
                    (property.video_url || property.VideoUrl || property.videos?.length > 0) && (
                        <motion.button initial={{ scale: 0, y: 100 }} animate={{ scale: 1, y: 0 }} whileHover={{ scale: 1.1 }} onClick={() => setIsVideoOpen(true)} className="fixed bottom-24 right-6 z-[100] bg-red-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition group border-4 border-white" title="Watch Video Tour">
                            <FaVideo size={24} className="group-hover:animate-pulse" />
                            <span className="absolute right-full mr-3 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Watch Video Tour</span>
                        </motion.button>
                    )
                }
            </div>
        </div>
    );
}

const Header = ({ property, isSaved, setIsSaved, setIsShareModalOpen, user, navigate, location, toggleWishlist, id }) => (
    <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif mb-3 leading-tight">{property.Name || "Luxury Stay"}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
                {property.rating_display?.total > 0 ? (
                    <div className="flex items-center gap-1.5 font-bold text-black"><FaStar size={14} className="text-yellow-400" /><span>{Number(property.rating_display.total || 0).toFixed(1)}</span></div>
                ) : (
                    <div className="flex items-center gap-1.5 font-bold text-black"><span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">NEW</span></div>
                )}
                <span className="hidden md:inline text-gray-300">|</span>
                <Link to={`/locations/${(property.CityName || property.City || '').toLowerCase()}`} className="underline text-gray-600 hover:text-black cursor-pointer">
                    {property.CityName || property.City}, {property.Location}
                </Link>
            </div>
            <div className="flex gap-2 text-sm font-semibold">
                <button onClick={() => {
                    const text = `Check out this amazing property: ${property.Name} in ${property.Location}! ${window.location.href}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank');
                }} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300"><FaWhatsapp className="text-green-500 text-lg" /> Share</button>
                <button onClick={async () => {
                    if (!user) {
                        navigate('/login', {
                            state: {
                                returnTo: location.pathname + location.search,
                                bookingState: { action: 'wishlist', propertyId: id }
                            }
                        });
                        return;
                    }
                    const result = await toggleWishlist(id);
                    if (result.success) {
                        toast.success(result.message);
                        setIsSaved(!isSaved);
                    } else {
                        toast.error(result.message);
                    }
                }} className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition underline decoration-gray-300">
                    <FaHeart className={isSaved ? "text-[#FF385C] fill-current" : "text-gray-400"} />
                    {isSaved ? "Saved" : "Save"}
                </button>
            </div>
        </div>
    </div>
);





const VillaBooking = ({ price, rating, dateRange, setDateRange, isDatePickerOpen, setIsDatePickerOpen, handleDateSelect, handleReserve, priceBreakdown, datePickerRef, property, guests, setGuests, mealSelection, setMealSelection, isWaterpark, bookedDates = [], getPriceForDate, pricing, showAutoRates, setShowAutoRates }) => {
    const ob = property?.onboarding_data || {};
    const maxCapacity = parseInt(property?.MaxCapacity || ob.pricing?.maxCapacity || 20);
    const baseCapacity = parseInt(property?.Occupancy || ob.pricing?.extraGuestLimit || 12);
    const totalGuests = guests.adults + guests.children;
    const rates = priceBreakdown?.rates || ob.foodRates || {};


    // Use pricing from props
    // const [showAutoRates, setShowAutoRates] = useState(false);



    const MealCounter = ({ label, rate, count, type }) => (
        <div className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-lg p-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label} <span className="text-gray-900">(₹{rate})</span></span>
            <div className="flex items-center gap-2 bg-white px-1.5 py-0.5 rounded-md border border-gray-200 shadow-sm">
                <button onClick={() => setMealSelection(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }))} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black transition"><FaMinus size={8} /></button>
                <span className="text-xs font-bold w-3 text-center">{count}</span>
                <button onClick={() => setMealSelection(p => ({ ...p, [type]: p[type] + 1 }))} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black transition"><FaPlus size={8} /></button>
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl ring-1 ring-black/5">
            <div className="p-3 space-y-2">
                {/* HEADER */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <div className="flex flex-col">
                        {pricing.percentage > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium line-through decoration-red-400">₹{Math.round(pricing.marketPrice).toLocaleString()}</span>
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">{pricing.percentage}% OFF</span>
                            </div>
                        )}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold font-serif text-gray-900">₹{(priceBreakdown?.minNightlyRate || property.display_price || pricing.sellingPrice).toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">/ night</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold bg-gray-50 px-2 py-1 rounded-lg">
                        <FaStar className="text-yellow-400" />
                        {Number(property?.rating_display?.total || rating || 4.8).toFixed(1)}
                        {property?.rating_display?.count > 0 && <span className="text-gray-400 font-normal ml-0.5">({property.rating_display.count})</span>}
                        <span className="text-gray-300">|</span>
                        <span className="underline decoration-dotted text-gray-400 cursor-pointer" onClick={() => scrollToSection('reviews')}>Reviews</span>
                    </div>
                </div>

                {/* DATES */}
                <div className="border border-gray-200 rounded-lg relative hover:border-black transition-colors group cursor-pointer bg-white" ref={datePickerRef} onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                    <div className="flex divide-x divide-gray-200">
                        <div className="flex-1 p-1.5 px-2">
                            <label className="block text-[8px] uppercase font-bold text-gray-400">Check-In</label>
                            <div className="text-xs font-bold text-gray-900 truncate">{dateRange.from ? format(dateRange.from, 'dd MMM') : 'Select'}</div>
                        </div>
                        <div className="flex-1 p-1.5 px-2">
                            <label className="block text-[8px] uppercase font-bold text-gray-400">Check-Out</label>
                            <div className="text-xs font-bold text-gray-900 truncate">{dateRange.to ? format(dateRange.to, 'dd MMM') : 'Select'}</div>
                        </div>
                    </div>
                    <AnimatePresence>
                        {isDatePickerOpen && window.innerWidth >= 1024 && (
                            <motion.div onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl p-3 z-50 border border-gray-100 ring-1 ring-black/5 w-[300px]">
                                <DayPicker
                                    mode="range"
                                    selected={dateRange}
                                    onDayClick={handleDateSelect}
                                    numberOfMonths={1}
                                    modifiers={{ booked: (date) => bookedDates.includes(format(date, 'yyyy-MM-dd')) }}
                                    disabled={[
                                        { before: startOfDay(new Date()) },
                                        ...bookedDates.map(d => parse(d, 'yyyy-MM-dd', new Date()))
                                    ]}
                                    classNames={{
                                        day_button: "h-14 w-14 !p-0.5 font-normal aria-selected:opacity-100 bg-transparent hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 disabled:line-through",
                                        selected: "!bg-black !text-white hover:!bg-black hover:!text-white",
                                        day_selected: "!bg-black !text-white"
                                    }}
                                    components={{
                                        DayButton: (props) => {
                                            const { day, children, className, modifiers, ...buttonProps } = props;
                                            const date = day?.date;

                                            if (!date) return <button className={className} {...buttonProps}>{children}</button>;

                                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                            const isPastDate = buttonProps.disabled; // Only past dates are truly disabled
                                            const isBooked = modifiers.booked;

                                            let price = getPriceForDate(date);
                                            // Fallback to base rate if specific date price is 0/missing
                                            if (!price || isNaN(price)) price = pricing.sellingPrice || property.Price || 0;
                                            price = parseFloat(price);

                                            // Base class for the day button
                                            let combinedClassName = `${className || ''} flex flex-col items-center justify-center gap-0.5 h-full w-full py-1 transition-all duration-200`.trim();

                                            // Add "scratch out" check for disabled/booked
                                            if (isPastDate) {
                                                combinedClassName += " opacity-70 cursor-not-allowed bg-gray-50 text-gray-300 line-through";
                                            } else if (isBooked) {
                                                // Booked: Visual indication but CLICKABLE (to show toast)
                                                // Removed pointer-events-none and cursor-not-allowed to allow click
                                                combinedClassName += " relative overflow-hidden bg-red-50/50 text-red-300 decoration-red-300 line-through hover:bg-red-50";
                                            }

                                            // console.log(`[DEBUG] Villa Rendering date ${dateStr}: isPast=${isPastDate}, isBooked=${isBooked}`);

                                            return (
                                                <button
                                                    className={combinedClassName}
                                                    {...buttonProps}
                                                    disabled={buttonProps.disabled} // Use the consolidated disabled state
                                                    style={{ pointerEvents: buttonProps.disabled ? 'none' : 'auto' }}
                                                    onClick={(e) => {
                                                        if (isBooked) {
                                                            console.log(`[DEBUG] Villa Clicked on BOOKED date: ${dateStr}`);
                                                            toast.error("This date is already booked.");
                                                            return;
                                                        }
                                                        buttonProps.onClick?.(e);
                                                    }}
                                                >
                                                    <span className={`text-sm font-medium leading-tight ${isWeekend && !isBooked ? 'text-red-600 font-bold' : ''}`}>
                                                        {children}
                                                    </span>
                                                    {!isPastDate && !isBooked && (
                                                        <span className="text-[9px] font-bold leading-tight text-green-600 group-hover:text-green-700 group-aria-selected:text-white">
                                                            {price >= 1000 ? `₹${(price / 1000).toFixed(1)}k` : `₹${price}`}
                                                        </span>
                                                    )}
                                                    {isBooked && (
                                                        <span className="text-[8px] font-bold leading-tight text-red-400">Sold</span>
                                                    )}
                                                </button>
                                            );
                                        }
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* GUESTS */}
                <div className="bg-gray-50/50 rounded-xl p-2 border border-gray-100">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500">{isWaterpark ? 'Tickets' : 'Guests'} ({totalGuests}/{maxCapacity})</span>
                        {/* Capacity Bar Inline */}
                        <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden flex relative">
                            <div className="h-full bg-green-500" style={{ width: `${Math.min(totalGuests, baseCapacity) / maxCapacity * 100}%` }} />
                            {totalGuests > baseCapacity && <div className="h-full bg-orange-500 striped-bar" style={{ width: `${(Math.min(totalGuests, maxCapacity) - baseCapacity) / maxCapacity * 100}%` }} />}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Adults Row */}
                        <div className="bg-white border border-gray-100 rounded-lg p-2 shadow-sm flex items-center justify-between">
                            <div className="flex flex-col leading-tight">
                                <span className="text-[10px] font-black text-gray-900">Adults</span>
                                <span className="text-[8px] font-bold text-gray-400 font-outfit">(8y+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })}
                                    className="w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white transition"
                                    disabled={guests.adults <= 1}
                                >
                                    <FaMinus size={8} />
                                </button>
                                <span className="text-sm font-black text-gray-900 w-3 text-center">{guests.adults}</span>
                                <button
                                    onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })}
                                    className="w-6 h-6 rounded bg-black text-white flex items-center justify-center transition"
                                    disabled={totalGuests >= maxCapacity}
                                >
                                    <FaPlus size={8} />
                                </button>
                            </div>
                        </div>

                        {/* Children Row */}
                        <div className="bg-white border border-gray-100 rounded-lg p-2 shadow-sm flex items-center justify-between">
                            <div className="flex flex-col leading-tight">
                                <span className="text-[10px] font-black text-gray-900">Child</span>
                                <span className="text-[8px] font-bold text-gray-400 font-outfit">(3-8y)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })}
                                    className="w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white transition"
                                    disabled={guests.children <= 0}
                                >
                                    <FaMinus size={8} />
                                </button>
                                <span className="text-sm font-black text-gray-900 w-3 text-center">{guests.children}</span>
                                <button
                                    onClick={() => setGuests({ ...guests, children: guests.children + 1 })}
                                    className="w-6 h-6 rounded bg-black text-white flex items-center justify-center transition"
                                    disabled={totalGuests >= maxCapacity}
                                >
                                    <FaPlus size={8} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MEALS - Single Counter (Only for Villas usually, or if configured) */}
                {!isWaterpark && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-1.5 mt-1.5">
                        <div className="flex items-center justify-between mb-1 px-0.5">
                            <span className="text-[9px] uppercase font-bold text-gray-500 flex items-center gap-1"><FaUtensils className="text-orange-400" size={9} /> Meals (All-Inclusive)</span>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-1.5 flex justify-between items-center shadow-sm">
                            <span className="text-[11px] font-bold text-gray-700">Add Meal Package</span>
                            <div className="flex items-center gap-2 bg-gray-50 px-1 py-0.5 rounded-md border border-gray-200">
                                <button onClick={() => setMealSelection(Math.max(0, mealSelection - 1))} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded transition"><FaMinus size={8} /></button>
                                <span className="text-xs font-bold w-3 text-center">{mealSelection}</span>
                                <button onClick={() => setMealSelection(mealSelection + 1)} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-black hover:bg-white rounded transition"><FaPlus size={8} /></button>
                            </div>
                        </div>
                    </div>
                )}

                {/* BREAKDOWN - Simplified & Compact */}
                {priceBreakdown && (
                    <div className="bg-gray-50/50 rounded-lg p-1.5 border border-gray-100 space-y-1 mt-1">
                        {isWaterpark ? (
                            <div className="space-y-1.5 w-full">

                                <div className="space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-gray-900">Adult ({guests.adults})</span>
                                            <span className="text-[9px] text-gray-400">₹{priceBreakdown.adultTicketRate.toLocaleString()} × {guests.adults}</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-900">₹{priceBreakdown.totalAdultTicket?.toLocaleString()}</span>
                                    </div>
                                    {guests.children > 0 && (
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-900">Child ({guests.children})</span>
                                                <span className="text-[9px] text-gray-400">₹{priceBreakdown.childTicketRate.toLocaleString()} × {guests.children}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">₹{priceBreakdown.totalChildTicket?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-gray-200/40 my-1"></div>
                                    <div className="flex justify-between items-center bg-gray-900 text-white p-1.5 rounded-lg px-2.5">
                                        <span className="text-[9px] font-black uppercase tracking-wider">Total Amount</span>
                                        <span className="text-sm font-black">₹{priceBreakdown.grantTotal?.toLocaleString()}</span>
                                    </div>

                                    {/* Pay Now */}
                                    <div className="bg-blue-50/80 p-1.5 rounded-lg border border-blue-100 flex justify-between items-center mt-1">
                                        <span className="text-xs font-black text-blue-600">Pay Now</span>
                                        <span className="text-base font-black text-blue-700">₹{priceBreakdown.tokenAmount?.toLocaleString()}</span>
                                    </div>

                                    {/* Pay at Park */}
                                    <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-700">Pay at Park</span>
                                        <span className="text-base font-black text-gray-900">₹{(priceBreakdown.grantTotal - priceBreakdown.tokenAmount).toLocaleString()}</span>
                                    </div>

                                    {/* You Saved - STYLISH */}
                                    {priceBreakdown.totalSavings > 0 && (
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-1.5 rounded-lg border-2 border-green-200 flex justify-between items-center shadow-sm">
                                            <span className="text-xs font-black text-green-700 flex items-center gap-1">
                                                <span className="text-base">🎉</span> You Saved
                                            </span>
                                            <span className="text-base font-black text-green-700">₹{priceBreakdown.totalSavings.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Villa Breakdown */}
                                {priceBreakdown.nightDetails?.length > 1 && (
                                    <div className="mb-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowAutoRates(!showAutoRates); }}
                                            className="text-[8px] text-blue-600 font-bold underline mb-1 flex items-center gap-1 hover:text-blue-800 transition"
                                        >
                                            View Nightly Rates ({priceBreakdown.nightDetails.length} nights)
                                        </button>

                                        {/* Localized Popup within Payment Section */}
                                        {showAutoRates && (
                                            <>
                                                {/* Backdrop */}
                                                <div
                                                    className="fixed inset-0 bg-black/30 z-[9998] backdrop-blur-sm"
                                                    onClick={(e) => { e.stopPropagation(); setShowAutoRates(false); }}
                                                />

                                                {/* Popup - Fixed and Centered */}
                                                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-xl shadow-2xl border-2 border-blue-500 z-[9999] max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                                                    <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                                                        <h4 className="text-sm font-bold text-gray-900">Nightly Breakdown</h4>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowAutoRates(false); }}
                                                            className="p-1.5 hover:bg-gray-200 rounded-full transition"
                                                        >
                                                            <FaTimes size={14} className="text-gray-500" />
                                                        </button>
                                                    </div>

                                                    <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5 nav-scroll">
                                                        {priceBreakdown.nightDetails.map((night, idx) => (
                                                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className="text-xs font-bold text-gray-700">{night.date}</span>
                                                                    <span className="text-sm font-black text-gray-900">₹{night.rate?.toLocaleString()}</span>
                                                                </div>
                                                                {night.dailyExtraTotal > 0 && (
                                                                    <div className="flex justify-between items-center text-[10px] text-orange-600 border-t border-gray-200 pt-1.5 mt-1.5">
                                                                        <span>+ Extra Guests ({priceBreakdown.extraGuests})</span>
                                                                        <span className="font-bold">₹{night.dailyExtraTotal?.toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                                {night.dailyFoodTotal > 0 && (
                                                                    <div className="flex justify-between items-center text-[10px] text-blue-600 border-t border-gray-200 pt-1.5 mt-1.5">
                                                                        <span>+ Meals ({mealSelection})</span>
                                                                        <span className="font-bold">₹{night.dailyFoodTotal?.toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex justify-between items-center">
                                                        <span className="text-xs font-bold text-gray-600">Subtotal (Excl. Tax)</span>
                                                        <span className="text-lg font-black text-gray-900">₹{priceBreakdown.subtotal?.toLocaleString()}</span>
                                                    </div>

                                                    <div className="px-4 pb-3 text-center text-[10px] text-gray-500">
                                                        Base rate varies by day of week and season
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600 px-0.5 text-[11px]">
                                    <span>Villa Rental ({priceBreakdown.nights} Nights)</span>
                                    <span>₹{priceBreakdown.totalVillaRate.toLocaleString()}</span>
                                </div>
                                {priceBreakdown.totalExtra > 0 && (
                                    <div className="flex justify-between text-gray-600 px-0.5 text-[10px]">
                                        <span>Extra Mattress ({priceBreakdown.nights} Nights)</span>
                                        <span>+₹{priceBreakdown.totalExtra.toLocaleString()}</span>
                                    </div>
                                )}
                                {priceBreakdown.totalFood > 0 && (
                                    <div className="flex justify-between text-gray-600 px-0.5 text-[10px]">
                                        <span>Meals & Dining ({priceBreakdown.nights} Nights)</span>
                                        <span>+₹{priceBreakdown.totalFood.toLocaleString()}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Summary Section */}
                        <div className="mt-1 pt-1 border-t border-gray-200 space-y-1">
                            <div className="flex justify-between items-baseline px-0.5">
                                <span className="text-base font-black text-gray-900">Total Amount</span>
                                <span className="text-base font-black text-gray-900">₹{priceBreakdown.subtotal.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">+GST</span></span>
                            </div>

                            <div className="bg-blue-50/80 p-1.5 rounded-xl border border-blue-100 flex justify-between items-center">
                                <span className="text-base font-black text-blue-600">Reserve Now</span>
                                <span className="text-lg font-black text-blue-700">₹{priceBreakdown.tokenAmount?.toLocaleString()}</span>
                            </div>

                            <div className="bg-gray-50 p-1.5 rounded-xl border border-gray-100 flex justify-between items-center">
                                <span className="text-base font-black text-gray-700">Pay Later</span>
                                <span className="text-lg font-black text-gray-900">₹{(priceBreakdown.subtotal - (priceBreakdown.tokenAmount || 0)).toLocaleString()} <span className="text-[10px] font-normal text-gray-400">+GST</span></span>
                            </div>

                            {/* You Saved - STYLISH */}
                            {priceBreakdown.totalSavings > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-1.5 rounded-xl border-2 border-green-200 flex justify-between items-center shadow-sm">
                                    <span className="text-base font-black text-green-700 flex items-center gap-1">
                                        <span className="text-lg">🎉</span> You Saved
                                    </span>
                                    <span className="text-lg font-black text-green-700">₹{priceBreakdown.totalSavings.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MAIN ACTION BUTTON */}
                <div className="mt-3">
                    <button
                        onClick={handleReserve}
                        className="w-full bg-[#FF385C] hover:bg-[#E00B41] text-white py-3 rounded-xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        <span>{(!dateRange.from || (!isWaterpark && !dateRange.to)) ? 'Check Availability' : (priceBreakdown ? `Reserve Now ₹${priceBreakdown.tokenAmount?.toLocaleString()}` : 'Reserve Now')}</span>
                        <FaTicketAlt className="text-xs text-white/90 group-hover:rotate-12 transition-transform" />
                    </button>
                    {!priceBreakdown && (
                        <p className="text-[8px] text-gray-400 text-center font-bold uppercase tracking-widest mt-2">
                            Instant Confirmation • Best Price Guarantee
                        </p>
                    )}
                </div>
            </div>
            {/* Removed Booking Fees Text as per request */}


        </div>
    );
};

const MobileDateSelector = ({ isOpen, onClose, dateRange, onDateSelect, bookedDates, property, pricing, isWaterpark, guests, setGuests, maxCapacity = 20, priceBreakdown, defaultPrice, onReserve, mealSelection, setMealSelection, showAutoRates, setShowAutoRates }) => {

    // Helper to format price explanation text
    const totalGuests = (Number(guests?.adults) || 0) + (Number(guests?.children) || 0);

    const getPriceText = () => {
        if (!priceBreakdown) return null;
        if (isWaterpark) {
            return `Adults (${guests.adults}) + Child (${guests.children})`;
        }
        if (priceBreakdown.nights > 0) {
            return `₹${defaultPrice.toLocaleString()} x ${priceBreakdown.nights} Nights`;
        }
        return '';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden flex items-end justify-center"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white w-full rounded-t-3xl shadow-2xl h-[75vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Compact Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold font-serif text-gray-900 leading-tight">
                                    {dateRange.from ? 'Review Selection' : 'Select Dates'}
                                </h3>
                                {dateRange.from ? (
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight truncate">
                                        {`${format(dateRange.from, 'MMM dd')}${!isWaterpark && dateRange.to ? ` - ${format(dateRange.to, 'MMM dd')}` : ''} • ${(Number(guests.adults) || 0) + (Number(guests.children) || 0)} Guests${mealSelection > 0 ? ` • ${mealSelection} Meals` : ''}`}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-gray-500 font-medium">Pick check-in & check-out</p>
                                )}
                            </div>
                            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition text-gray-500">
                                <FaTimes size={14} />
                            </button>
                        </div>

                        {/* Scrollable Content - Compact */}
                        <div id="mobile-scroll-container" className="flex-1 overflow-y-auto px-2 pt-0">
                            <div className="flex justify-center border-b border-gray-50 pb-2 mb-2 scale-95 origin-top">
                                <DayPicker
                                    mode={isWaterpark ? "single" : "range"}
                                    selected={isWaterpark ? dateRange.from : dateRange}
                                    onDayClick={(day) => {
                                        onDateSelect(day);
                                        // Auto-close on single click for Waterparks
                                        // REMOVED as per user request to keep picker open on mobile
                                        // if (isWaterpark) {
                                        //     onClose();
                                        // }
                                    }}
                                    numberOfMonths={1}
                                    pagedNavigation
                                    disabled={[
                                        { before: startOfDay(new Date()) },
                                        ...(bookedDates || []).map(d => parse(d, 'yyyy-MM-dd', new Date()))
                                    ]}
                                    classNames={{
                                        caption: "flex justify-center pt-0 relative items-center mb-1",
                                        caption_label: "text-xs font-bold text-gray-900",
                                        nav: "flex items-center",
                                        nav_button: "h-6 w-6 bg-transparent hover:bg-gray-50 p-1 rounded-md transition-colors text-gray-400",
                                        head_cell: "text-gray-400 font-medium text-[9px] w-8",
                                        cell: "text-center text-xs p-0 m-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                                        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-50 rounded-md",
                                        day_selected: "text-white hover:bg-[#FF385C] hover:text-white bg-[#FF385C]",
                                        day_today: "bg-gray-50 text-gray-900 font-bold",
                                        day_outside: "text-gray-300 opacity-50",
                                        day_disabled: "text-gray-300 opacity-50 line-through",
                                        day_range_middle: "aria-selected:bg-red-50 aria-selected:text-red-900",
                                        day_hidden: "invisible",

                                        day_button: "h-8 w-8 !p-0 font-normal aria-selected:opacity-100 bg-transparent hover:bg-gray-100 border border-transparent rounded-lg transition-all flex flex-col items-center justify-center gap-0 disabled:opacity-30",
                                        selected: "!bg-[#FF385C] !text-white",
                                        range_middle: "!bg-[#FF385C]/5 !text-[#FF385C] !rounded-none",
                                        range_start: "!bg-[#FF385C] !text-white rounded-l-lg rounded-r-none",
                                        range_end: "!bg-[#FF385C] !text-white rounded-r-lg rounded-l-none"
                                    }}
                                    components={{
                                        DayButton: (props) => {
                                            const { day, children, className, modifiers, ...buttonProps } = props;
                                            const date = day?.date;
                                            if (!date) return <button className={className} {...buttonProps}>{children}</button>;

                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const isPastDate = buttonProps.disabled;
                                            const isBooked = (bookedDates || []).includes(dateStr);

                                            let combinedClassName = className;
                                            if (isPastDate) {
                                                combinedClassName += " line-through opacity-50 cursor-not-allowed text-gray-300 pointer-events-none";
                                            } else if (isBooked) {
                                                combinedClassName += " relative overflow-hidden bg-red-50 text-red-300 decoration-red-300 line-through hover:bg-red-50";
                                            }

                                            return (
                                                <button
                                                    className={combinedClassName}
                                                    {...buttonProps}
                                                    disabled={isPastDate || isBooked}
                                                    onClick={(e) => {
                                                        if (isBooked) {
                                                            console.log(`[DEBUG] Mobile Clicked on BOOKED date: ${dateStr}`);
                                                            toast.error("This date is already booked.");
                                                            return;
                                                        }
                                                        buttonProps.onClick?.(e);
                                                    }}
                                                >
                                                    {children}
                                                </button>
                                            );
                                        }
                                    }}
                                />
                            </div>
                            {/* Guest Sections (Compact) */}
                            {
                                !isWaterpark && (
                                    <div className="pb-4 px-2">
                                        <h4 className="font-bold text-sm font-serif mb-2 text-gray-900 flex items-center gap-2"> Guests </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center justify-between p-2 border border-gray-100 rounded-lg shadow-sm bg-white">
                                                <div>
                                                    <p className="font-bold text-[10px] text-gray-900">Adults</p>
                                                    <p className="text-[8px] text-gray-500">12y+</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-600 rounded-md border border-gray-200 disabled:opacity-50" disabled={guests.adults <= 1}><FaMinus size={8} /></button>
                                                    <span className="w-3 text-center font-bold text-xs">{guests.adults}</span>
                                                    <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-600 rounded-md border border-gray-200 disabled:opacity-50" disabled={totalGuests >= maxCapacity}><FaPlus size={8} /></button>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-2 border border-gray-100 rounded-lg shadow-sm bg-white">
                                                <div>
                                                    <p className="font-bold text-[10px] text-gray-900">Child</p>
                                                    <p className="text-[8px] text-gray-500">5-12y</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })} className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-600 rounded-md border border-gray-200 disabled:opacity-50" disabled={guests.children <= 0}><FaMinus size={8} /></button>
                                                    <span className="w-3 text-center font-bold text-sm">{guests.children}</span>
                                                    <button onClick={() => setGuests({ ...guests, children: guests.children + 1 })} className="w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-600 rounded-md border border-gray-200 disabled:opacity-50" disabled={totalGuests >= maxCapacity}><FaPlus size={8} /></button>
                                                </div>
                                            </div>
                                        </div>
                                        {totalGuests >= maxCapacity && (
                                            <div className="text-[10px] text-orange-600 font-bold text-center bg-orange-50 py-1 rounded border border-orange-100 mt-2">
                                                Max capacity of {maxCapacity} guests reached
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                            {
                                isWaterpark && (
                                    <div className="pb-4 px-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Adult Ticket Selector */}
                                            <div className="flex items-center justify-between p-2 border border-blue-100 bg-blue-50/30 rounded-lg shadow-sm">
                                                <div>
                                                    <p className="font-bold text-[10px] text-gray-900">Adult (+8 yrs)</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setGuests({ ...guests, adults: Math.max(1, guests.adults - 1) })} className="w-5 h-5 flex items-center justify-center bg-white text-blue-600 rounded border border-blue-100"><FaMinus size={6} /></button>
                                                    <span className="w-3 text-center font-bold text-xs">{guests.adults}</span>
                                                    <button onClick={() => setGuests({ ...guests, adults: guests.adults + 1 })} className="w-5 h-5 flex items-center justify-center bg-white text-blue-600 rounded border border-blue-100"><FaPlus size={6} /></button>
                                                </div>
                                            </div>
                                            {/* Child Ticket Selector */}
                                            <div className="flex items-center justify-between p-2 border border-orange-100 bg-orange-50/30 rounded-lg shadow-sm">
                                                <div>
                                                    <p className="font-bold text-[10px] text-gray-900">Child (3-8 yrs)</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setGuests({ ...guests, children: Math.max(0, guests.children - 1) })} className="w-5 h-5 flex items-center justify-center bg-white text-orange-600 rounded border border-orange-100"><FaMinus size={6} /></button>
                                                    <span className="w-3 text-center font-bold text-xs">{guests.children}</span>
                                                    <button onClick={() => setGuests({ ...guests, children: guests.children + 1 })} className="w-5 h-5 flex items-center justify-center bg-white text-orange-600 rounded border border-orange-100"><FaPlus size={6} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {/* MEALS SELECTION - Only for Villa */}
                            {
                                !isWaterpark && (
                                    <div className="pb-4 px-2">
                                        <h4 className="font-bold text-sm font-serif mb-2 text-gray-900 flex items-center gap-2"> <FaUtensils className="text-orange-500" size={12} /> Meals (Optional) </h4>
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-bold text-xs text-gray-900">All-Inclusive Meal Pack</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-orange-200 shadow-sm">
                                                <button onClick={() => setMealSelection && setMealSelection(Math.max(0, (mealSelection || 0) - 1))} className="w-6 h-6 flex items-center justify-center bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition"><FaMinus size={8} /></button>
                                                <span className="w-4 text-center font-bold text-sm">{mealSelection || 0}</span>
                                                <button onClick={() => setMealSelection && setMealSelection((mealSelection || 0) + 1)} className="w-6 h-6 flex items-center justify-center bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition"><FaPlus size={8} /></button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {/* DETAILED PRICE BREAKDOWN - Always Visible when dates selected */}
                            {priceBreakdown && (
                                <div className="mx-2 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">




                                    {/* Line Items */}
                                    {isWaterpark ? (
                                        /* Waterpark Breakdown - NO HEADER */
                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between text-[11px]">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold">Adult ({guests.adults})</span>
                                                    <span className="text-gray-400">₹{priceBreakdown.adultTicketRate?.toLocaleString()} × {guests.adults}</span>
                                                </div>
                                                <span className="font-bold text-gray-900">₹{priceBreakdown.totalAdultTicket?.toLocaleString()}</span>
                                            </div>
                                            {guests.children > 0 && (
                                                <div className="flex justify-between text-[11px]">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 font-bold">Child ({guests.children})</span>
                                                        <span className="text-gray-400">₹{priceBreakdown.childTicketRate?.toLocaleString()} × {guests.children}</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900">₹{priceBreakdown.totalChildTicket?.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Villa Breakdown */}
                                            {priceBreakdown.nightDetails?.length > 1 && (
                                                <div className="mb-1 relative z-[50]" style={{ pointerEvents: 'auto' }}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowAutoRates(!showAutoRates);
                                                        }}
                                                        className="text-[9px] text-blue-600 font-bold underline mb-1 flex items-center gap-1 cursor-pointer hover:text-blue-800"
                                                    >
                                                        View Nightly Rates ({priceBreakdown.nightDetails.length} nights)
                                                    </button>

                                                </div>
                                            )}

                                            {/* Nightly Rates Popup Modal - MOBILE */}
                                            {showAutoRates && priceBreakdown.nightDetails?.length > 1 && (
                                                <>
                                                    {/* Backdrop */}
                                                    <div
                                                        className="fixed inset-0 bg-black/50 z-[9998]"
                                                        onClick={(e) => { e.stopPropagation(); setShowAutoRates(false); }}
                                                    ></div>

                                                    {/* Popup - Fixed and Centered */}
                                                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-xl shadow-2xl border-2 border-blue-500 z-[9999] max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                                                        <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                                                            <h4 className="text-sm font-bold text-gray-900">Nightly Breakdown</h4>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setShowAutoRates(false); }}
                                                                className="p-1.5 hover:bg-gray-200 rounded-full transition"
                                                            >
                                                                <FaTimes size={14} className="text-gray-500" />
                                                            </button>
                                                        </div>

                                                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5 nav-scroll">
                                                            {priceBreakdown.nightDetails.map((night, idx) => (
                                                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                                    <div className="flex justify-between items-center mb-1.5">
                                                                        <span className="text-xs font-bold text-gray-700">{night.date}</span>
                                                                        <span className="text-sm font-black text-gray-900">₹{night.rate?.toLocaleString()}</span>
                                                                    </div>
                                                                    {night.dailyExtraTotal > 0 && (
                                                                        <div className="flex justify-between items-center text-[10px] text-orange-600 border-t border-gray-200 pt-1.5 mt-1.5">
                                                                            <span>+ Extra Mattress</span>
                                                                            <span className="font-bold">₹{night.dailyExtraTotal?.toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                    {night.dailyFoodTotal > 0 && (
                                                                        <div className="flex justify-between items-center text-[10px] text-blue-600 border-t border-gray-200 pt-1.5 mt-1.5">
                                                                            <span>+ Meals ({mealSelection})</span>
                                                                            <span className="font-bold">₹{night.dailyFoodTotal?.toLocaleString()}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 flex justify-between items-center">
                                                            <span className="text-xs font-bold text-gray-600">Subtotal (Excl. Tax)</span>
                                                            <span className="text-lg font-black text-gray-900">₹{priceBreakdown.subtotal?.toLocaleString()}</span>
                                                        </div>

                                                        <div className="px-4 pb-3 text-center text-[10px] text-gray-500">
                                                            Base rate varies by day of week and season
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className="flex justify-between text-gray-600 px-0.5 text-[11px]">
                                                <span>Villa Rental ({priceBreakdown.nights} Nights)</span>
                                                <span>₹{priceBreakdown.totalVillaRate?.toLocaleString()}</span>
                                            </div>
                                            {priceBreakdown.totalExtra > 0 && (
                                                <div className="flex justify-between text-gray-600 px-0.5 text-[10px]">
                                                    <span>Extra Mattress ({priceBreakdown.nights} Nights)</span>
                                                    <span>+₹{priceBreakdown.totalExtra?.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {priceBreakdown.totalFood > 0 && (
                                                <div className="flex justify-between text-gray-600 px-0.5 text-[10px]">
                                                    <span>Meals & Dining ({priceBreakdown.nights} Nights)</span>
                                                    <span>+₹{priceBreakdown.totalFood?.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Payment Summary - MOBILE */}
                                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                        {/* Total Amount - All Properties */}
                                        <div className="flex justify-between items-center px-2 py-2">
                                            <span className="text-xs font-black text-gray-900">Total Amount</span>
                                            <span className="text-base font-black text-gray-900">₹{(isWaterpark ? priceBreakdown.grantTotal : priceBreakdown.subtotal)?.toLocaleString()} {!isWaterpark && <span className="text-[10px] font-normal text-gray-400">+GST</span>}</span>
                                        </div>

                                        {/* Pay Now */}
                                        <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                                            <span className="text-xs font-black text-blue-600">{isWaterpark ? 'Pay Now' : 'Reserve Now'}</span>
                                            <span className="text-lg font-black text-blue-700">₹{priceBreakdown.tokenAmount?.toLocaleString()}</span>
                                        </div>

                                        {/* Pay at Park / Pay Later */}
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                                            <span className="text-xs font-black text-gray-700">{isWaterpark ? 'Pay at Park' : 'Pay Later'}</span>
                                            <span className="text-lg font-black text-gray-900">₹{((isWaterpark ? priceBreakdown.grantTotal : priceBreakdown.subtotal) - (priceBreakdown.tokenAmount || 0))?.toLocaleString()} {!isWaterpark && <span className="text-[10px] font-normal text-gray-400">+GST</span>}</span>
                                        </div>

                                        {/* You Saved - STYLISH */}
                                        {priceBreakdown.totalSavings > 0 && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border-2 border-green-200 flex justify-between items-center shadow-sm">
                                                <span className="text-xs font-black text-green-700 flex items-center gap-1">
                                                    <span className="text-lg">🎉</span> You Saved
                                                </span>
                                                <span className="text-lg font-black text-green-700">₹{priceBreakdown.totalSavings?.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Fixed Bottom Action Bar - MOBILE ONLY, NO LEFT INFO FOR WATERPARK */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] flex items-center justify-between gap-3 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] flex-shrink-0">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReserve(); }}
                                className="w-full bg-gradient-to-r from-[#FF385C] to-[#E00B41] text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition cursor-pointer z-50 pointer-events-auto"
                            >
                                {(!dateRange.from) ? 'Select Date' : (priceBreakdown ? `Reserve Now ₹${priceBreakdown.tokenAmount?.toLocaleString()}` : 'Check Availability')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};

function MobileFooter({ price, unit, onReserve, buttonText, dateRange, onDateClick, guests, mealSelection, isWaterpark }) {
    const isBreakdown = typeof price === 'object' && price !== null;
    const totalAmount = isBreakdown ? (isWaterpark ? price.grantTotal : price.subtotal) : price;

    const hasDates = dateRange.from;
    const dateStr = hasDates ? (isWaterpark ? format(dateRange.from, 'MMM dd') : `${format(dateRange.from, 'MMM dd')} - ${dateRange.to ? format(dateRange.to, 'MMM dd') : '...'}`) : 'Dates';

    // Summary line for Mobile
    const guestCount = (Number(guests?.adults) || 0) + (Number(guests?.children) || 0);
    const summary = `${dateStr} • ${guestCount} Guests${mealSelection > 0 ? ` • ${mealSelection} Meals` : ''}`;

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 px-4 z-40 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-col cursor-pointer max-w-[50%]" onClick={onDateClick}>
                {hasDates ? (
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter truncate flex items-center gap-1">
                            {summary} <span className="text-[8px] bg-blue-50 px-1 rounded border border-blue-100 uppercase ml-1">Edit</span>
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-bold text-lg text-gray-900">₹{totalAmount?.toLocaleString()}</span>
                            {isBreakdown && price.totalSavings > 0 && (
                                <span className="text-[9px] text-green-600 font-bold ml-1 bg-green-50 px-1 rounded animate-pulse">Save ₹{price.totalSavings?.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="font-bold text-xl text-gray-900">₹{price?.toLocaleString()}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight ml-1">{unit}</span>
                        </div>
                    </div>
                )}
            </div>
            <button
                onClick={onReserve}
                className="bg-[#FF385C] hover:bg-[#d9324e] text-white px-5 py-3.5 rounded-xl font-black text-sm shadow-lg shadow-red-100 transition active:scale-95 disabled:opacity-50"
            >
                {isBreakdown && price.tokenAmount ? `Reserve Now (₹${price.tokenAmount?.toLocaleString()})` : buttonText}
            </button>
        </div>
    );
}

const Lightbox = ({ isOpen, onClose, images, currentIndex, setIndex }) => {
    const [activeTab, setActiveTab] = useState('All');

    // Derived state: categories and filtered images
    const { categories, filteredImages, globalIndices } = React.useMemo(() => {
        if (!images || images.length === 0) return { categories: ['All'], filteredImages: [], globalIndices: [] };

        // Extract categories
        const cats = new Set(images.map(img => img.category || 'General'));
        const categoryList = ['All', ...Array.from(cats).filter(c => c !== 'General').sort(), 'General']; // 'General' last

        // Filter
        let filtered = [];
        let indices = [];

        if (activeTab === 'All') {
            filtered = images;
            indices = images.map((_, i) => i);
        } else {
            filtered = images.filter(img => (img.category || 'General') === activeTab);
            indices = images.map((img, i) => (img.category || 'General') === activeTab ? i : -1).filter(i => i !== -1);
        }

        return { categories: categoryList.filter(c => c !== 'General' || cats.has('General')), filteredImages: filtered, globalIndices: indices };
    }, [images, activeTab]);

    // Map global currentIndex to local index in filtered list
    const localIndex = activeTab === 'All'
        ? currentIndex
        : filteredImages.findIndex(img => img === images[currentIndex]);

    // Handle Tab Switch
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Find first image of this category and jump to it
        if (tab !== 'All') {
            const firstIdx = images.findIndex(img => (img.category || 'General') === tab);
            if (firstIdx !== -1) setIndex(firstIdx);
        }
    };

    if (!isOpen) return null;

    const next = (e) => {
        e?.stopPropagation();
        if (activeTab === 'All') {
            setIndex((prev) => (prev + 1) % images.length);
        } else {
            // Cyclical in filtered list
            const newLocal = (localIndex + 1) % filteredImages.length;
            setIndex(globalIndices[newLocal]);
        }
    };

    const prev = (e) => {
        e?.stopPropagation();
        if (activeTab === 'All') {
            setIndex((prev) => (prev - 1 + images.length) % images.length);
        } else {
            const newLocal = (localIndex - 1 + filteredImages.length) % filteredImages.length;
            setIndex(globalIndices[newLocal]);
        }
    };

    // Helper to render image source (handle object vs string)
    const getSrc = (img) => typeof img === 'string' ? img : (img?.image_url || '');

    // Swipe Threshold
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    const currentImageSrc = getSrc(images[currentIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[2000] bg-black/95 flex flex-col items-center justify-center py-4 md:py-6 overflow-hidden touch-none"
                    onClick={onClose}
                >
                    {/* Categories Header */}
                    <div className="absolute top-0 left-0 right-0 z-50 p-4 flex flex-col gap-4 pointer-events-none">
                        <div className="flex justify-between items-start w-full">
                            <span className="font-mono font-bold bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs md:text-sm tracking-widest border border-white/20 shadow-sm pointer-events-auto">
                                {activeTab === 'All' ? `${currentIndex + 1} / ${images.length}` : `${localIndex + 1} / ${filteredImages.length}`}
                            </span>
                            <button
                                onClick={onClose}
                                className="p-3 bg-black/50 hover:bg-black/80 text-white backdrop-blur-md rounded-full transition-all border border-white/20 shadow-sm pointer-events-auto"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        {categories.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto max-w-2xl mx-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={(e) => { e.stopPropagation(); handleTabChange(cat); }}
                                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === cat
                                            ? 'bg-white text-black border-white'
                                            : 'bg-black/40 text-white border-white/30 hover:bg-black/60'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Blurred Background */}
                    <motion.div
                        key={`bg-${currentIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        className="absolute inset-0 z-0"
                    >
                        <img
                            src={currentImageSrc}
                            alt=""
                            className="w-full h-full object-cover blur-3xl scale-110"
                        />
                    </motion.div>

                    <div className="flex-1 w-full flex items-center justify-center relative px-2 md:px-20 z-10" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={prev}
                            className="hidden md:block absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-4 text-white bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-lg group hover:scale-110"
                        >
                            <FaArrowLeft size={24} className="md:w-8 md:h-8" />
                        </button>

                        <button
                            onClick={next}
                            className="hidden md:block absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-4 text-white bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-lg group hover:scale-110"
                        >
                            <FaArrowRight size={24} className="md:w-8 md:h-8" />
                        </button>

                        {/* Image Container */}
                        <div className="relative inline-block w-full h-full max-h-[75vh] md:max-h-[85vh] flex items-center justify-center mt-12 md:mt-0">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.img
                                    key={currentIndex}
                                    src={currentImageSrc}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={1}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = swipePower(offset.x, velocity.x);
                                        if (swipe < -swipeConfidenceThreshold) {
                                            next();
                                        } else if (swipe > swipeConfidenceThreshold) {
                                            prev();
                                        }
                                    }}
                                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="max-h-full max-w-full object-contain shadow-2xl rounded-lg cursor-grab active:cursor-grabbing"
                                    alt={`Gallery ${currentIndex}`}
                                    draggable="false"
                                />
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ShareModal = ({ isOpen, onClose, property }) => {
    const url = window.location.href;
    const handleShare = () => {
        const text = `Check out this amazing property: ${property.Name} in ${property.Location}! ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    // Auto-redirect to WhatsApp on open if requested
    React.useEffect(() => {
        if (isOpen) handleShare();
    }, [isOpen]);

    return null; // Logic is handled via side-effect or direct call, no UI needed for now as per user request "directly share via whatsapp"
};

