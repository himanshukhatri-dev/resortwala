import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
    FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaBed, FaUtensils,
    FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave, FaStar,
    FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake, FaCouch, FaRestroom, FaDoorOpen, FaUsers,
    FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaConciergeBell, FaHotTub
} from 'react-icons/fa';
import { MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdMusicNote, MdBalcony, MdSportsEsports, MdRestaurant, MdOutlineOutdoorGrill } from 'react-icons/md';
import { STEPS_VILLA, STEPS_WATERPARK, AMENITY_TYPES } from '../constants/propertyConstants';
import Loader from '../components/Loader';
import { API_BASE_URL } from '../config';

// ICON MAPPING FOR AMENITIES
const getAmenityIcon = (key) => {
    switch (key) {
        case 'big_pools': return <FaSwimmingPool className="text-blue-500" />;
        case 'small_pools': return <FaSwimmingPool className="text-teal-500" />;
        case 'big_slides': return <MdOutlineDeck className="text-orange-500" />;
        case 'small_slides': return <MdOutlineDeck className="text-yellow-500" />;
        case 'wavepool': return <MdWater className="text-blue-600" />;
        case 'rain_dance': return <MdWaterfallChart className="text-purple-500" />;
        case 'dj_system': return <FaMusic className="text-pink-500" />;
        case 'waterfall': return <MdWater className="text-cyan-500" />;
        case 'ice_bucket': return <FaSnowflake className="text-sky-300" />;
        case 'lazy_river': return <FaWater className="text-blue-400" />;
        case 'crazy_river': return <FaWater className="text-indigo-500" />;
        case 'kids_area': return <MdChildCare className="text-green-500" />;
        case 'parking': return <FaParking className="text-gray-600" />;
        case 'selfie_point': return <FaCamera className="text-red-500" />;
        case 'garden': return <FaTree className="text-green-600" />;
        case 'bonfire': return <FaCouch className="text-orange-600" />;
        case 'kitchen': return <FaUtensils className="text-gray-600" />;
        case 'wifi': return <FaWifi className="text-blue-400" />;
        case 'power_backup': return <FaMoneyBillWave className="text-yellow-600" />;
        case 'laundry': return <FaTshirt className="text-blue-400" />;
        case 'dining': return <MdRestaurant className="text-orange-500" />;
        case 'cctv': return <FaVideo className="text-gray-700" />;
        case 'wheelchair': return <FaWheelchair className="text-blue-600" />;
        case 'first_aid': return <FaMedkit className="text-red-500" />;
        case 'pool_towels': return <FaUmbrellaBeach className="text-yellow-500" />;
        case 'seating_area': return <FaChair className="text-brown-500" />;
        case 'security': return <FaUserShield className="text-blue-900" />;
        case 'restaurant': return <FaUtensils className="text-red-600" />;
        case 'steam_sauna': return <FaHotTub className="text-teal-600" />;
        case 'barbeque': return <MdOutlineOutdoorGrill className="text-orange-700" />;
        case 'multilingual': return <FaConciergeBell className="text-purple-600" />;
        case 'game_room': return <MdSportsEsports className="text-indigo-500" />;
        default: return <FaCheck />;
    }
};

const INCLUSIONS = [
    "Waterpark Entry", "All Slides & Pool", "Breakfast",
    "Lunch", "Hi-Tea", "Parking",
    "Private Room", "Locker", "Pickup/Drop"
];

const PROPERTY_RULES = [
    "Primary guest must be 18+",
    "Valid ID proof required",
    "Pets allowed",
    "Outside food allowed",
    "No show no refund",
    "Offers cannot be combined",
    "Smoking allowed",
    "Alcohol allowed",
    "Non-veg food allowed"
];

// --- REUSABLE COMPONENTS ---
const InputField = ({ label, name, type = "text", placeholder, className, value, onChange, required }) => (
    <div className={`space-y-1.5 group ${className}`}>
        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 group-focus-within:text-black transition-colors">
            {label}
            {required && (
                <span className="text-red-500 animate-pulse inline-block" title="Required Field">*</span>
            )}
        </label>
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value !== undefined ? value : ''}
                onChange={onChange}
                min={type === 'number' ? 0 : undefined}
                onKeyDown={type === 'number' ? (e) => ["-", "e", "E", "."].includes(e.key) && e.preventDefault() : undefined}
                className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-gray-800 font-medium focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all peer ${required && !value ? 'border-orange-100' : ''}`}
                placeholder={placeholder}
            />
            {required && !value && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-focus:opacity-100 transition-opacity">
                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold border border-orange-100 uppercase tracking-tighter">Required</span>
                </div>
            )}
        </div>
    </div>
);

const Toggle = ({ active, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!active)}
        className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${active ? 'bg-green-500' : ''}`}
    >
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${active ? 'translate-x-6' : ''}`} />
    </button>
);

const Counter = ({ value = 0, onChange }) => (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
        <button
            type="button"
            onClick={() => onChange(Math.max(0, parseInt(value || 0) - 1))}
            className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black font-bold disabled:opacity-50"
            disabled={value <= 0}
        >
            -
        </button>
        <span className="w-6 text-center font-bold text-lg">{value || 0}</span>
        <button
            type="button"
            onClick={() => onChange(parseInt(value || 0) + 1)}
            className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black font-bold"
        >
            +
        </button>
    </div>
);

export default function EditProperty() {
    const { id } = useParams();
    const { token } = useAuth();
    const { showSuccess, showError, showConfirm } = useModal();
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '', displayName: '', propertyType: 'Villa',
        location: '', cityName: '', address: '',
        contactPerson: '', mobileNo: '', email: '', website: '',
        description: '', shortDescription: '',

        // Excel Fields
        maxCapacity: '', noofRooms: '', occupancy: '',

        amenities: {}, rules: {}, paymentMethods: { cash: false, upi: false, debit: false, credit: false },

        // Room Configuration (Villa Only)
        roomConfig: {
            livingRooms: [{ id: 1, bedType: 'Sofa', ac: false, tv: false, bathroom: false, toiletType: '', balcony: false }],
            bedrooms: []
        },

        childCriteria: { freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5 },
        inclusions: {},

        // Enhanced Pricing Fields
        priceMonThu: '', // Mon-Thu
        priceFriSun: '', // Fri & Sun
        priceSaturday: '', // Sat Only

        // Food Pricing (Villa)
        foodRates: { veg: '', nonVeg: '', jain: '', perPerson: '' },

        // Extra Charges
        extraGuestLimit: '15',
        extraGuestPriceMonThu: '', // New structure
        extraGuestPriceFriSun: '',
        extraGuestPriceSaturday: '',
        extraMattressCharge: '',

        // Waterpark Pricing
        ticketPrices: { adult: '', child: '', includesEntry: false, includesFood: false },

        foodOptions: { breakfast: 'Not Included', lunch: 'Not Included', hiTea: 'Not Included', dinner: 'Not Included' },
        videoUrl: '', images: [], videos: [],
        googleMapLink: '', latitude: '', longitude: '',
        otherAttractions: []
    });

    const [existingImages, setExistingImages] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                // Use imported API_BASE_URL
                const baseURL = API_BASE_URL;
                const res = await axios.get(`${baseURL}/vendor/properties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const p = res.data;
                console.log("Property Data:", p); // Debug log

                // Helper to safely get property values regardless of casing
                const getValue = (obj, keys) => {
                    if (!obj) return '';
                    if (!Array.isArray(keys)) keys = [keys];

                    for (const key of keys) {
                        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
                        // Try snake_case
                        const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
                        if (obj[snake] !== undefined && obj[snake] !== null) return obj[snake];
                        // Try lowercase
                        const lower = key.toLowerCase();
                        if (obj[lower] !== undefined && obj[lower] !== null) return obj[lower];
                    }
                    return '';
                };

                let ob = p.onboarding_data || p.OnboardingData || {}; // Check both casings
                if (typeof ob === 'string') {
                    // Fail-safe if parsing failed earlier
                    try { ob = JSON.parse(ob); } catch (e) { }
                }

                const pricing = ob.pricing || {};

                // Complex Structures and Defaults
                const loadedRoomConfig = ob.roomConfig || {};
                const livingRooms = Array.isArray(loadedRoomConfig.livingRooms)
                    ? loadedRoomConfig.livingRooms
                    : (loadedRoomConfig.livingRoom ? [loadedRoomConfig.livingRoom] : [{ bedType: 'Sofa', ac: false, tv: false, bathroom: false, toiletType: '', balcony: false }]);

                const roomConfig = {
                    livingRooms: livingRooms.map((lr, i) => ({ ...lr, id: lr.id || i + 1, tv: lr.tv || false })),
                    bedrooms: Array.isArray(loadedRoomConfig.bedrooms) ? loadedRoomConfig.bedrooms : []
                };

                const amenities = ob.amenities || {};
                const rules = ob.rules || {};
                const paymentMethods = ob.paymentMethods || {};
                const childCriteria = ob.childCriteria || { freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5 };
                const inclusions = ob.inclusions || {};
                const foodRates = ob.foodRates || { veg: '', nonVeg: '', jain: '', perPerson: '' };
                const ticketPrices = ob.ticketPrices || { adult: '', child: '', includesEntry: false, includesFood: false };
                const foodOptions = ob.foodOptions || { breakfast: 'Not Included', lunch: 'Not Included', hiTea: 'Not Included', dinner: 'Not Included' };

                setFormData({
                    name: getValue(p, 'Name'),
                    displayName: getValue(p, 'ShortName'),
                    propertyType: getValue(p, 'PropertyType') || 'Villa',
                    location: getValue(p, 'Location'),
                    cityName: getValue(p, 'CityName'),
                    address: getValue(p, 'Address'),
                    contactPerson: getValue(p, 'ContactPerson'),
                    mobileNo: getValue(p, ['MobileNo', 'mobile_no']),
                    email: getValue(p, 'Email'),
                    website: getValue(p, 'Website'),
                    description: getValue(p, ['LongDescription', 'long_description', 'description']),
                    shortDescription: getValue(p, ['ShortDescription', 'short_description']),

                    // Excel Fields Mapping
                    maxCapacity: getValue(p, ['MaxCapacity', 'max_capacity']),
                    noofRooms: getValue(p, ['NoofRooms', 'noof_rooms', 'no_of_rooms']),
                    occupancy: getValue(p, ['Occupancy', 'occupancy']),

                    // Pricing Mapping
                    priceMonThu: getValue(p, ['price_mon_thu', 'Price']),
                    priceFriSun: getValue(p, ['price_fri_sun', 'weekend']),
                    priceSaturday: getValue(p, ['price_sat', 'saturday']),

                    amenities,
                    rules,
                    paymentMethods,

                    checkInTime: ob.checkInTime || '14:00',
                    checkOutTime: ob.checkOutTime || '11:00',
                    idProofs: ob.idProofs || [],
                    mealPlans: ob.mealPlans || {
                        breakfast: { available: false, vegRate: '', nonVegRate: '', includes: [] },
                        lunch: { available: false, vegRate: '', nonVegRate: '', includes: [] },
                        dinner: { available: false, vegRate: '', nonVegRate: '', includes: [] },
                        hiTea: { available: false, rate: '', includes: [] },
                    },

                    roomConfig,
                    childCriteria,
                    inclusions,
                    foodRates,
                    ticketPrices,

                    googleMapLink: ob.googleMapLink || '',
                    latitude: ob.latitude || '',
                    longitude: ob.longitude || '',
                    otherAttractions: Array.isArray(ob.otherAttractions) ? ob.otherAttractions : (ob.otherAttractions ? [ob.otherAttractions] : []), // Hydrated Field
                    otherRules: ob.otherRules || '',

                    extraGuestLimit: pricing.extraGuestLimit || '15',

                    // Logic to handle both old (single value) and new (object) structure
                    extraGuestPriceMonThu: (typeof pricing.extraGuestCharge === 'object') ? (pricing.extraGuestCharge.week || '') : (pricing.extraGuestCharge || '1000'),
                    extraGuestPriceFriSun: (typeof pricing.extraGuestCharge === 'object') ? (pricing.extraGuestCharge.weekend || '') : (pricing.extraGuestCharge || '1000'),
                    extraGuestPriceSaturday: (typeof pricing.extraGuestCharge === 'object') ? (pricing.extraGuestCharge.saturday || '') : (pricing.extraGuestCharge || '1000'),
                    extraMattressCharge: pricing.extraMattressCharge || '',

                    foodOptions,
                    videoUrl: p.video_url || '',
                    images: [],
                    videos: []
                });
                setExistingImages(p.images || []);
                setExistingVideos(p.videos || []);
                setLoading(false);
            } catch (err) {
                console.error("Property Load Error:", err.response || err);
                const errorMsg = err.code === 'ECONNABORTED'
                    ? 'Request timed out. Please check your internet connection and try again.'
                    : err.response?.data?.message || err.message || 'Network error. Please try again.';
                setError(`Failed to load property data: ${errorMsg}`);
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id, token]);

    // Sync Room Config with No of Rooms
    useEffect(() => {
        if (loading) return; // Wait for data
        if (formData.propertyType !== 'Villa') return;

        const count = parseInt(formData.noofRooms || 0);

        setFormData(prev => {
            const current = prev.roomConfig?.bedrooms || [];
            if (current.length === count) return prev;

            console.log(`Syncing Bedrooms: Target ${count}, Current ${current.length}`);

            const newRooms = [...current];
            if (count > current.length) {
                for (let i = current.length; i < count; i++) {
                    newRooms.push({
                        id: i + 1,
                        bedType: 'Queen',
                        ac: false,
                        tv: false, // Ensure TV is initialized
                        geyser: false, // Ensure Geyser is initialized
                        bathroom: true,
                        toiletType: 'Western',
                        balcony: false
                    });
                }
            } else {
                newRooms.length = count;
            }

            return {
                ...prev,
                roomConfig: {
                    ...prev.roomConfig,
                    bedrooms: newRooms
                }
            };
        });
    }, [formData.noofRooms, formData.propertyType, loading]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // --- REAL-TIME REGEX MASKING ---
        // Location/City fields (allow letters, spaces, dots, commas, hyphens - NO NUMBERS)
        if (['cityName', 'location'].includes(name)) {
            const filtered = value.replace(/[^a-zA-Z\s.,-]/g, '');
            setFormData(prev => ({ ...prev, [name]: filtered }));
            return;
        }

        // Name/Contact fields (allow letters, numbers, spaces, dots, commas)
        if (['contactPerson', 'name', 'displayName'].includes(name)) {
            const filtered = value.replace(/[^a-zA-Z0-9\s.,]/g, '');
            setFormData(prev => ({ ...prev, [name]: filtered }));
            return;
        }

        // Numeric-only fields (Integers)
        if (['maxCapacity', 'noofRooms', 'occupancy', 'priceMonThu', 'priceFriSun', 'priceSaturday', 'extraGuestPriceMonThu', 'extraGuestPriceFriSun', 'extraGuestPriceSaturday'].includes(name)) {
            const filtered = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: filtered }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Normalize phone number: remove +91, leading 0, spaces, hyphens
    const normalizePhone = (phone) => {
        let normalized = phone.replace(/[^\d+]/g, ''); // Keep only digits and +
        normalized = normalized.replace(/^\+91/, ''); // Remove +91 prefix
        normalized = normalized.replace(/^0/, ''); // Remove leading 0
        return normalized;
    };

    const handlePhoneChange = (e) => {
        // Allow +, spaces, hyphens, and digits
        const value = e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 15);
        setFormData(prev => ({ ...prev, mobileNo: value }));
    };

    const handleNestedChange = (section, key, value) => {
        let filteredValue = value;

        // Numeric restrictions for nested fields
        if (typeof value === 'string') {
            // Integer fields
            if (['veg', 'nonVeg', 'jain', 'rate', 'price', 'adult', 'child', 'week', 'weekend', 'monFriPrice', 'satSunPrice', 'ageFrom', 'ageTo'].includes(key)) {
                filteredValue = value.replace(/[^0-9]/g, '');
            }
            // Float fields (Height)
            else if (['freeHeight', 'heightFrom', 'heightTo'].includes(key)) {
                filteredValue = value.replace(/[^0-9.]/g, '');
                // Allow only one decimal point
                const parts = filteredValue.split('.');
                if (parts.length > 2) {
                    filteredValue = parts[0] + '.' + parts.slice(1).join('');
                }
            }
        }

        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: filteredValue } }));
    };

    const updateRoom = (index, field, value) => {
        // console.log(`Updating Room ${index} ${field}:`, value); // DEBUG
        setFormData(prev => ({
            ...prev,
            roomConfig: {
                ...prev.roomConfig,
                bedrooms: prev.roomConfig.bedrooms.map((room, i) =>
                    i === index ? { ...room, [field]: value } : room
                )
            }
        }));
    };

    const updateLivingRoom = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            roomConfig: {
                ...prev.roomConfig,
                livingRooms: prev.roomConfig.livingRooms.map((room, i) =>
                    i === index ? { ...room, [field]: value } : room
                )
            }
        }));
    };

    const addLivingRoom = () => {
        setFormData(prev => ({
            ...prev,
            roomConfig: {
                ...prev.roomConfig,
                livingRooms: [...prev.roomConfig.livingRooms, { id: Date.now(), bedType: 'Sofa', ac: false, tv: false, bathroom: false, toiletType: '', balcony: false }]
            }
        }));
    };

    const removeLivingRoom = (index) => {
        setFormData(prev => ({
            ...prev,
            roomConfig: {
                ...prev.roomConfig,
                livingRooms: prev.roomConfig.livingRooms.filter((_, i) => i !== index)
            }
        }));
    };

    const handleAmenityChange = (key, type, value) => {
        setFormData(prev => ({
            ...prev,
            amenities: { ...prev.amenities, [key]: value }
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
        e.target.value = null; // Reset input
    };

    const handleVideoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setFormData(prev => ({ ...prev, videos: [...prev.videos, ...files] }));
        e.target.value = null; // Reset input
    };

    const handleDeleteVideo = async (idx) => {
        const isConfirmed = await showConfirm('Remove Video', 'Remove this video from the selection?', 'Remove', 'Cancel');
        if (isConfirmed) {
            setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }));
        }
    };

    const handleDeleteExistingVideo = async (videoId) => {
        const isConfirmed = await showConfirm('Delete Video', 'Permanently delete this video from the property?', 'Delete', 'Cancel');
        if (isConfirmed) {
            try {
                const baseURL = API_BASE_URL;
                await axios.delete(`${baseURL}/vendor/properties/videos/${videoId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExistingVideos(prev => prev.filter(v => (v.id || v.PropertyVideoId) !== videoId));
                showSuccess('Video Deleted');
            } catch (err) {
                showError('Delete Failed', err.response?.data?.message || 'Failed to delete video');
            }
        }
    };

    const handleSubmit = async () => {
        // Collect ALL errors across all steps
        const allSteps = formData.propertyType === 'Villa' ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
        let allErrors = [];

        allSteps.forEach(step => {
            const { msgs } = validateStep(step);
            if (msgs) allErrors = [...allErrors, ...msgs];
        });

        const totalImages = (existingImages?.length || 0) + (formData.images?.length || 0);
        if (totalImages < 5) {
            allErrors.push('Please maintain at least 5 photos for your property.');
        }

        if (allErrors.length > 0) {
            showError('Missing Details', (
                <ul className="list-disc ml-5 text-left space-y-1">
                    {allErrors.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
            ));
            return;
        }

        setSaving(true);
        setError('');
        const normalizedMobile = normalizePhone(formData.mobileNo);

        try {
            // SYNC PRICE FOR WATERPARK
            if (formData.propertyType === 'Waterpark' && formData.waterparkPrices?.adult?.week) {
                formData.priceMonThu = formData.waterparkPrices.adult.week;
            }

            const apiData = new FormData();
            apiData.append('Name', formData.name);
            apiData.append('ShortName', formData.displayName);
            apiData.append('PropertyType', formData.propertyType);
            apiData.append('Location', formData.location);
            apiData.append('CityName', formData.cityName);
            apiData.append('Address', formData.address);
            apiData.append('ContactPerson', formData.contactPerson);
            apiData.append('MobileNo', normalizedMobile);
            apiData.append('Email', formData.email);
            apiData.append('Website', formData.website);
            apiData.append('ShortDescription', formData.shortDescription);
            apiData.append('LongDescription', formData.description);

            // Excel Mapping Logic
            apiData.append('Price', formData.priceMonThu || 0);
            apiData.append('price_mon_thu', formData.priceMonThu);
            apiData.append('price_fri_sun', formData.priceFriSun);
            apiData.append('price_sat', formData.priceSaturday);
            apiData.append('MaxCapacity', formData.maxCapacity);
            apiData.append('NoofRooms', formData.noofRooms);
            apiData.append('Occupancy', formData.occupancy);

            const onboardingData = {
                amenities: formData.amenities,
                rules: formData.rules,
                paymentMethods: formData.paymentMethods,
                childCriteria: formData.childCriteria,
                inclusions: formData.inclusions,
                foodOptions: formData.foodOptions,

                checkInTime: formData.checkInTime, // New
                checkOutTime: formData.checkOutTime, // New
                idProofs: formData.idProofs, // New
                mealPlans: formData.mealPlans, // New

                // New Structures
                roomConfig: formData.roomConfig,
                foodRates: formData.foodRates,
                ticketPrices: formData.ticketPrices,

                pricing: {
                    weekday: formData.priceMonThu,
                    weekend: formData.priceFriSun,
                    saturday: formData.priceSaturday,
                    extraGuestLimit: formData.extraGuestLimit,
                    extraGuestCharge: {
                        week: formData.extraGuestPriceMonThu,
                        weekend: formData.extraGuestPriceFriSun,
                        saturday: formData.extraGuestPriceSaturday
                    },
                    extraMattressCharge: formData.extraMattressCharge
                },
                googleMapLink: formData.googleMapLink,
                latitude: formData.latitude,
                longitude: formData.longitude,
                otherAttractions: formData.otherAttractions // Persisted Field
            };

            console.log("Submitting Onboarding Data:", onboardingData); // DEBUG LOG
            console.log("Submitting Room Config:", onboardingData.roomConfig); // DEBUG LOG

            // ALERT DEBUGGING FOR USER
            // alert(`DEBUG: Sending Room Config: ${JSON.stringify(onboardingData.roomConfig)}`);

            apiData.append('onboarding_data', JSON.stringify(onboardingData));
            apiData.append('video_url', formData.videoUrl);

            // Append New Images
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach((file) => apiData.append('images[]', file));
            }

            // Append New Videos
            if (formData.videos && formData.videos.length > 0) {
                formData.videos.forEach((file) => apiData.append('videos[]', file));
            }

            // Append existing image URLs (for deletion tracking or just to confirm they exist)
            // The backend should handle which images to keep/delete based on what's sent vs what's stored.
            // For simplicity, we'll send a list of existing image URLs that are still present.
            existingImages.forEach(img => apiData.append('existing_images[]', img.image_url));


            apiData.append('_method', 'PUT'); // Needed for Laravel Update

            const baseURL = API_BASE_URL;
            const res = await axios.post(`${baseURL}/vendor/properties/${id}`, apiData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 202 && res.data.status === 'pending_approval') {
                showSuccess('Changes Submitted', 'Your changes have been submitted for admin approval based on property policy.');
            } else {
                showSuccess('Property Updated', 'Your property details have been successfully updated.');
            }
            navigate('/properties');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update property");
        } finally {
            setSaving(false);
        }
    };

    // --- REUSABLE COMPONENTS REMOVED (Now using global ones) ---
    // --- STEPS ---
    const renderStep0 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    type="button"
                    disabled={!!id}
                    onClick={() => setFormData({ ...formData, propertyType: 'Villa' })}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${!!id ? 'opacity-50 cursor-not-allowed' : ''} ${formData.propertyType === 'Villa' ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-105 ring-2 ring-purple-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <FaHome size={32} />
                    <span className="font-bold text-lg">Villa / Resort</span>
                </button>
                <button
                    type="button"
                    disabled={!!id}
                    onClick={() => setFormData({ ...formData, propertyType: 'Waterpark' })}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${!!id ? 'opacity-50 cursor-not-allowed' : ''} ${formData.propertyType === 'Waterpark' ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105 ring-2 ring-blue-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <FaWater size={32} />
                    <span className="font-bold text-lg">Waterpark</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Royal Palms" required />
                <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} placeholder="Ex: Royal Palms" required />
                <InputField label="City" name="cityName" value={formData.cityName} onChange={handleInputChange} placeholder="Ex: Lonavala" />
                <InputField label="Location (Nearest Landmark)" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Near Lonavala Station" />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
                <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-24 resize-none"
                    placeholder="Enter complete address..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
                <div className="space-y-1">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 group-focus-within:text-black transition-colors">
                        Mobile Number
                        <span className="text-red-500 animate-pulse text-lg">*</span>
                    </label>
                    <input
                        type="tel"
                        name="mobileNo"
                        value={formData.mobileNo}
                        onChange={handlePhoneChange}
                        pattern="[0-9\\s\\-\\+]{10,}"
                        title="Please enter a valid 10-digit mobile number"
                        className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-gray-800 font-medium focus:bg-white focus:border-black focus:ring-2 focus:ring-black/5 outline-none transition-all peer ${!formData.mobileNo ? 'border-orange-100' : ''}`}
                        placeholder="9876543210"
                        required
                    />
                </div>
                <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                <InputField label="Website URL" name="website" value={formData.website} onChange={handleInputChange} />
            </div>

            {/* Map Location Section */}
            <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 space-y-4">
                <h4 className="font-bold text-green-900 flex items-center gap-2">
                    <FaHome className="text-green-600" /> Map Location
                </h4>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Google Map Link</label>
                    <input
                        type="text"
                        name="googleMapLink"
                        value={formData.googleMapLink || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, googleMapLink: val }));

                            // Try extract coords from various Google Maps URL formats
                            let lat = '', lng = '';

                            // 1. @lat,lng
                            const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                            const atMatch = val.match(atRegex);
                            if (atMatch) { lat = atMatch[1]; lng = atMatch[2]; }

                            // 2. q=lat,lng
                            if (!lat) {
                                const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;
                                const qMatch = val.match(qRegex);
                                if (qMatch) { lat = qMatch[1]; lng = qMatch[2]; }
                            }

                            // 3. ?ll=lat,lng
                            if (!lat) {
                                const llRegex = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
                                const llMatch = val.match(llRegex);
                                if (llMatch) { lat = llMatch[1]; lng = llMatch[2]; }
                            }

                            // 4. search/lat,lng
                            if (!lat) {
                                const searchRegex = /search\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
                                const searchMatch = val.match(searchRegex);
                                if (searchMatch) { lat = searchMatch[1]; lng = searchMatch[2]; }
                            }

                            if (lat && lng) {
                                console.log("Auto-detected Coords:", lat, lng);
                                setFormData(prev => ({
                                    ...prev,
                                    googleMapLink: val,
                                    latitude: lat,
                                    longitude: lng
                                }));
                            }
                        }}
                        className="w-full bg-white border border-green-200 rounded-lg px-4 py-3 text-sm focus:border-green-500 outline-none"
                        placeholder="Paste Google Maps Link here (e.g. from WhatsApp or Maps)"
                    />
                    <p className="text-[10px] text-green-600 italic">We'll try to auto-detect Latitude & Longitude from the link.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="Latitude"
                        name="latitude"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="Ex: 18.1234"
                        className="bg-white"
                    />
                    <InputField
                        label="Longitude"
                        name="longitude"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="Ex: 73.5678"
                        className="bg-white"
                    />
                </div>

                {/* Other Attractions */}
                <div className="space-y-2 pt-2 border-t border-green-200 mt-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nearby Attractions / Places to Visit</label>
                    <textarea
                        value={formData.nearbyAttractions || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, nearbyAttractions: e.target.value }))}
                        className="w-full bg-white border border-green-200 rounded-lg px-4 py-3 text-sm focus:border-green-500 outline-none h-24 resize-none"
                        placeholder="List nearby tourist spots, distances, etc..."
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Short Description</label>
                <textarea
                    name="shortDescription"
                    value={formData.shortDescription || ''}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-20 resize-none"
                    placeholder="Brief summary for listings..."
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-32 resize-none"
                    placeholder="Tell guests what makes your place special..."
                />
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h3 className="text-xl font-bold mb-4">{formData.propertyType === 'Waterpark' ? 'Waterpark Attractions' : 'Features & Amenities'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {AMENITY_TYPES.filter(item => !item.scope || item.scope.includes(formData.propertyType)).map(item => (
                        <div key={item.key} className={`bg-white border rounded-xl p-4 flex items-center justify-between transition-all ${formData.amenities[item.key] ? 'border-primary ring-1 ring-primary shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${formData.amenities[item.key] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                    {getAmenityIcon(item.key)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm leading-tight pr-2">{item.label}</p>
                                    {item.subtitle && <p className="text-[10px] text-gray-400">{item.subtitle}</p>}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                {item.type === 'number' ? <Counter value={formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'number', val)} /> : <Toggle active={!!formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'bool', val)} />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Add Other Attractions (Optional)</label>
                    <div className="space-y-2">
                        {formData.otherAttractions.map((attr, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={attr}
                                    onChange={(e) => {
                                        const newAttrs = [...formData.otherAttractions];
                                        newAttrs[idx] = e.target.value;
                                        setFormData(prev => ({ ...prev, otherAttractions: newAttrs }));
                                    }}
                                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-black outline-none"
                                    placeholder="Enter attraction..."
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newAttrs = formData.otherAttractions.filter((_, i) => i !== idx);
                                        setFormData(prev => ({ ...prev, otherAttractions: newAttrs }));
                                    }}
                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, otherAttractions: [...prev.otherAttractions, ''] }))}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                            + Add Another Attraction
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">* Extra charges may apply and vary depending on property policy.</p>
                </div>
            </div>

            {/* Payment Methods Moved to Pricing Step */}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold">Rules and Policies</h3>

            {/* Check-in / Out */}
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Check-in Time</label>
                    <input type="time" value={formData.checkInTime} onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} className="w-full p-3 rounded-lg border mt-1" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Check-out Time</label>
                    <input type="time" value={formData.checkOutTime} onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })} className="w-full p-3 rounded-lg border mt-1" />
                </div>
            </div>



            {/* Grouped Rules */}
            <div className="space-y-6">

                {/* Food Policy */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaUtensils className="text-orange-500" /> Food & Dietary Policies</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Outside food allowed?</span>
                            <Toggle active={!!formData.rules[3]} onChange={(val) => {
                                const newRules = { ...formData.rules, [3]: val };
                                if (!val) newRules[8] = false; // Disable non-veg if outside food blocked
                                setFormData({ ...formData, rules: newRules });
                            }} />
                        </div>
                        {formData.rules[3] && (
                            <div className="ml-6 pl-4 border-l-2 border-gray-100 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium text-gray-700 text-sm">Non-veg food allowed?</span>
                                <Toggle active={!!formData.rules[8]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [8]: val } })} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Habits */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaGlassMartiniAlt className="text-purple-500" /> Smoking & Alcohol</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <span className="font-medium text-gray-700">Smoking allowed within premises?</span>
                            <Toggle active={!!formData.rules[6]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [6]: val } })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Alcohol consumption allowed?</span>
                            <Toggle active={!!formData.rules[7]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [7]: val } })} />
                        </div>
                    </div>
                </div>

                {/* General Rules */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4">General House Rules</h4>
                    <div className="space-y-3">
                        {PROPERTY_RULES.map((rule, idx) => {
                            if ([3, 8, 6, 7].includes(idx)) return null; // Skip extracted rules
                            return (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="font-medium text-gray-600 text-sm">{rule}</span>
                                    <Toggle active={!!formData.rules[idx]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [idx]: val } })} />
                                </div>
                            );
                        })}
                    </div>

                    {/* ID Proofs (Moved Here) */}
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Accepted ID Proofs</label>
                        <div className="flex flex-wrap gap-3">
                            {['Passport', 'Driving License', 'PAN Card', 'Aadhar Card'].map(id => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        const newIds = formData.idProofs.includes(id) ? formData.idProofs.filter(i => i !== id) : [...formData.idProofs, id];
                                        setFormData({ ...formData, idProofs: newIds });
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${formData.idProofs.includes(id) ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {formData.idProofs.includes(id) && <FaCheck className="inline mr-2" />} {id}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Safety Features */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><FaUserShield /> Safety & Security</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['Fire Extinguisher', 'Security System', 'First Aid Kit', 'Window Guards'].map(safety => (
                            <label key={safety} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-blue-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.amenities[safety] || false} // Store in amenities
                                    onChange={(e) => handleAmenityChange(safety, 'bool', e.target.checked)}
                                    className="w-5 h-5 accent-blue-600"
                                />
                                <span className="text-sm font-bold text-gray-700">{safety}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Other Rules */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Add Other Rules</label>
                    <textarea
                        value={formData.otherRules}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherRules: e.target.value }))}
                        placeholder="Enter any additional rules or policies..."
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-black outline-none h-24 resize-none"
                    />
                </div>
            </div>
        </div>
    );
    const renderStepRoomConfig = () => {
        const updateRoom = (index, field, value) => {
            const newRooms = [...formData.roomConfig.bedrooms];
            if (!newRooms[index]) newRooms[index] = { id: index + 1 };
            newRooms[index][field] = value;
            setFormData(prev => ({
                ...prev,
                roomConfig: { ...prev.roomConfig, bedrooms: newRooms }
            }));
        };



        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><FaBed /> Room Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formData.propertyType === 'Villa' && (
                            <InputField label="No. of Rooms" name="noofRooms" value={formData.noofRooms} onChange={handleInputChange} placeholder="Ex: 3" type="number" className="bg-white" />
                        )}
                        <div className="flex items-center text-sm text-blue-800 bg-blue-100/50 p-2 rounded-lg">
                            Please set the number of rooms to configure bedroom details below.
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-amber-900"><FaCouch /> Living Room Configuration</h3>
                        <button type="button" onClick={addLivingRoom} className="text-sm bg-white border border-amber-200 text-amber-900 px-3 py-1 rounded-lg font-bold hover:bg-amber-100 transition shadow-sm">+ Add Living Room</button>
                    </div>

                    <div className="space-y-4">
                        {formData.roomConfig.livingRooms.map((room, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm relative">
                                {formData.roomConfig.livingRooms.length > 1 && (
                                    <button type="button" onClick={() => removeLivingRoom(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"><FaTimes /></button>
                                )}
                                <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Living Room {idx + 1}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bed Type</label>
                                        <select className="w-full p-2 text-sm rounded border bg-gray-50" value={room.bedType} onChange={(e) => updateLivingRoom(idx, 'bedType', e.target.value)}>
                                            <option value="Sofa">Sofa</option>
                                            <option value="Sofa cum Bed">Sofa cum Bed</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
                                        <span className="font-bold text-xs">AC</span>
                                        <Toggle active={room.ac} onChange={(v) => updateLivingRoom(idx, 'ac', v)} />
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                        <span className="font-bold text-sm">TV</span>
                                        <Toggle active={room.tv} onChange={(v) => updateLivingRoom(idx, 'tv', v)} />
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
                                        <span className="font-bold text-xs">Bathroom</span>
                                        <Toggle active={room.bathroom} onChange={(v) => updateLivingRoom(idx, 'bathroom', v)} />
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
                                        <span className="font-bold text-xs">Balcony</span>
                                        <Toggle active={room.balcony} onChange={(v) => updateLivingRoom(idx, 'balcony', v)} />
                                    </div>
                                    {room.bathroom && (
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Toilet Style</label>
                                            <select className="w-full p-2 text-sm rounded border bg-gray-50" value={room.toiletType} onChange={(e) => updateLivingRoom(idx, 'toiletType', e.target.value)}>
                                                <option value="">Select</option>
                                                <option value="Western">Western</option>
                                                <option value="Indian">Indian</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold flex items-center gap-2"><FaBed /> Bedrooms ({formData.noofRooms || 0})</h3>
                    </div>

                    {formData.roomConfig.bedrooms.map((room, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md relative group">
                            {/* Bedroom Number Badge */}
                            <div className="absolute -top-3 -left-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg shadow-lg ring-4 ring-white">
                                {idx + 1}
                            </div>

                            <div className="space-y-6 mt-2">
                                {/* Bed Type Selection */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Bed Type</label>
                                    <select
                                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium bg-white"
                                        value={room.bedType}
                                        onChange={(e) => updateRoom(idx, 'bedType', e.target.value)}
                                    >
                                        <option value="King">👑 King Size</option>
                                        <option value="Queen">👸 Queen Size</option>
                                        <option value="Double">🛏️ Double Bed</option>
                                        <option value="Single">🛌 Single Bed</option>
                                    </select>
                                </div>

                                {/* Amenities Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {/* AC Toggle */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">❄️ AC</span>
                                            <Toggle active={room.ac} onChange={(v) => updateRoom(idx, 'ac', v)} />
                                        </label>
                                    </div>

                                    {/* TV Toggle */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">📺 TV</span>
                                            <Toggle active={room.tv} onChange={(v) => updateRoom(idx, 'tv', v)} />
                                        </label>
                                    </div>

                                    {/* Geyser Toggle */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">🚿 Geyser</span>
                                            <Toggle active={room.geyser} onChange={(v) => updateRoom(idx, 'geyser', v)} />
                                        </label>
                                    </div>

                                    {/* Balcony Toggle */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">🌅 Balcony</span>
                                            <Toggle active={room.balcony} onChange={(v) => updateRoom(idx, 'balcony', v)} />
                                        </label>
                                    </div>

                                    {/* Private Bathroom Toggle */}
                                    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all col-span-2 md:col-span-1">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">🚽 Private Bath</span>
                                            <Toggle active={room.bathroom} onChange={(v) => updateRoom(idx, 'bathroom', v)} />
                                        </label>
                                        {room.bathroom && (
                                            <select
                                                className="mt-3 w-full p-2 text-xs rounded-lg border-2 border-blue-200 focus:border-blue-500 outline-none bg-blue-50 font-medium"
                                                value={room.toiletType}
                                                onChange={(e) => updateRoom(idx, 'toiletType', e.target.value)}
                                            >
                                                <option value="Western">Western</option>
                                                <option value="Indian">Indian</option>
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderStep3 = () => (
        <div className="space-y-8 animate-fade-in-up">

            {formData.propertyType === 'Villa' && (
                <>
                    {/* Capacity Section Moved Here */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><FaUsers /> Capacity & Usage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Standard Occupancy (Base)" name="occupancy" value={formData.occupancy} onChange={handleInputChange} placeholder="Ex: 10" type="number" className="bg-white" required />
                            <InputField label="Max Capacity (Total)" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} placeholder="Ex: 20" type="number" className="bg-white" required />
                        </div>
                    </div>

                    <div className="border border-orange-100 p-6 rounded-2xl bg-orange-50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-orange-800">
                            <FaMoneyBillWave /> Base Pricing
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Mon-Thu (Per Night)" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} placeholder="₹ Rate" className="bg-white" />
                            <InputField label="Fri & Sun (Per Night)" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} placeholder="₹ Rate" className="bg-white" />
                            <InputField label="Saturday (Per Night)" name="priceSaturday" value={formData.priceSaturday} onChange={handleInputChange} placeholder="₹ Rate" className="bg-white" />
                        </div>
                    </div>

                    {/* Extra Person Policy */}
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                        <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2"><FaChild /> Extra Person Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Mon-Thu (Per Person)" name="extraGuestPriceMonThu" value={formData.extraGuestPriceMonThu} onChange={handleInputChange} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Fri & Sun (Per Person)" name="extraGuestPriceFriSun" value={formData.extraGuestPriceFriSun} onChange={handleInputChange} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Saturday (Per Person)" name="extraGuestPriceSaturday" value={formData.extraGuestPriceSaturday} onChange={handleInputChange} placeholder="₹ Rate" type="number" className="bg-white" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                            * Charge applicable for guests exceeding Standard Occupancy (includes extra mattress).
                        </p>
                    </div>

                    {/* Meal Configuration - Simplified Package Style */}
                    <div className="border border-green-100 p-6 rounded-2xl bg-green-50/50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-green-800"><FaUtensils /> Meal Configuration</h4>

                        <div className="bg-white p-4 rounded-xl border border-green-100 mb-4">
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                Veg, Non veg, Jain food. Meal Includes lunch, evening snacks, dinner and Next morning break fast. Meal Price Per person
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Veg Package (Per Person)" name="foodRateVeg" value={formData.foodRates?.veg || ''} onChange={(e) => handleNestedChange('foodRates', 'veg', e.target.value)} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Non-Veg Package (Per Person)" name="foodRateNonVeg" value={formData.foodRates?.nonVeg || ''} onChange={(e) => handleNestedChange('foodRates', 'nonVeg', e.target.value)} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Jain Package (Per Person)" name="foodRateJain" value={formData.foodRates?.jain || ''} onChange={(e) => handleNestedChange('foodRates', 'jain', e.target.value)} placeholder="₹ Rate" type="number" className="bg-white" />
                        </div>
                    </div>
                </>
            )}

            {formData.propertyType === 'Waterpark' && (
                <>
                    <div className="border border-blue-100 p-6 rounded-2xl bg-blue-50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-blue-800">
                            <FaMoneyBillWave /> Ticket Pricing
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                                <h5 className="font-bold text-sm">Adult Tickets</h5>
                                <InputField label="Mon-Fri Rate" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} placeholder="₹ 1000" className="bg-white" required />
                                <InputField label="Sat-Sun Rate" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} placeholder="₹ 1200" className="bg-white" required />
                            </div>
                            <div className="space-y-3">
                                <h5 className="font-bold text-sm">Child Tickets</h5>
                                <InputField label="Mon-Fri Rate" name="childPriceMonFri" value={formData.childCriteria?.monFriPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'monFriPrice', e.target.value)} placeholder="₹ 800" className="bg-white" required />
                                <InputField label="Sat-Sun Rate" name="childPriceSatSun" value={formData.childCriteria?.satSunPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'satSunPrice', e.target.value)} placeholder="₹ 1000" className="bg-white" required />
                            </div>
                        </div>
                    </div>

                    {/* Child Criteria & Policy - Standard Waterpark Format */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaChild className="text-blue-500" /> Child Pricing Policy
                            <span className="text-red-500 animate-pulse">*</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Free Tier */}
                            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                <h5 className="text-[10px] font-bold text-green-600 uppercase mb-3 tracking-widest">FREE ENTRY (Infants)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] block text-gray-400 uppercase font-bold mb-1">Max Height (FT)</label>
                                        <input type="number" step="0.1" min="0" onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()} value={formData.childCriteria?.freeHeight || ''} onChange={(e) => handleNestedChange('childCriteria', 'freeHeight', e.target.value)} className="w-full font-bold border-b-2 border-green-200 bg-transparent outline-none py-1 focus:border-green-500 transition-colors" placeholder="3.0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] block text-gray-400 uppercase font-bold mb-1">Max Age (Yrs)</label>
                                        <input type="number" min="0" onKeyDown={(e) => ["-", "e", "E", "."].includes(e.key) && e.preventDefault()} value={formData.childCriteria?.freeAge || ''} onChange={(e) => handleNestedChange('childCriteria', 'freeAge', e.target.value)} className="w-full font-bold border-b-2 border-green-200 bg-transparent outline-none py-1 focus:border-green-500 transition-colors" placeholder="3" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-green-600 mt-2 italic">Entry is free for guests below these limits.</p>
                            </div>

                            {/* Charge Tier */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <h5 className="text-[10px] font-bold text-blue-600 uppercase mb-3 tracking-widest">CHILD RATE APPLICABLE</h5>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] block text-gray-400 uppercase font-bold mb-1">Height Range (FT)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500" placeholder="3.0" value={formData.childCriteria?.heightFrom || ''} onChange={(e) => handleNestedChange('childCriteria', 'heightFrom', e.target.value)} />
                                            <span className="text-gray-400">to</span>
                                            <input type="number" step="0.1" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500" placeholder="4.5" value={formData.childCriteria?.heightTo || ''} onChange={(e) => handleNestedChange('childCriteria', 'heightTo', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] block text-gray-400 uppercase font-bold mb-1">Age Range (Yrs)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500" onKeyDown={(e) => ["-", "e", "E", "."].includes(e.key) && e.preventDefault()} placeholder="3" value={formData.childCriteria?.ageFrom || ''} onChange={(e) => handleNestedChange('childCriteria', 'ageFrom', e.target.value)} />
                                            <span className="text-gray-400">to</span>
                                            <input type="number" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500" onKeyDown={(e) => ["-", "e", "E", "."].includes(e.key) && e.preventDefault()} placeholder="12" value={formData.childCriteria?.ageTo || ''} onChange={(e) => handleNestedChange('childCriteria', 'ageTo', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-600 mt-2 italic">Standard adult rates apply above these limits.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border p-6 rounded-2xl">
                        <h4 className="font-bold mb-4">Ticket Inclusions (Food)</h4>
                        <div className="space-y-4">
                            {['Breakfast', 'Lunch', 'Tea and coffee'].map(meal => (
                                <div key={meal} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded">
                                    <span className="font-medium text-gray-700">{meal === 'Tea and coffee' ? 'Tea & Coffee' : meal}</span>
                                    <div className="flex gap-2">
                                        {['Not Included', 'Veg', 'Non-Veg', 'Both'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => handleNestedChange('inclusions', meal.toLowerCase(), opt)}
                                                className={`px-3 py-1 text-xs rounded-full border ${formData.inclusions?.[meal.toLowerCase()] === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )
            }

            {/* Payment Methods - Moved to Bottom */}
            <div className="border border-gray-200 p-6 rounded-2xl bg-white mt-8 group transition-colors">
                <h4 className="font-bold mb-4 flex items-center gap-2 group-focus-within:text-black">
                    <FaMoneyBillWave className="text-green-600" /> Accepted Payment Methods
                    <span className="text-red-500 animate-pulse">*</span>
                </h4>
                <div className="flex gap-4 flex-wrap">
                    {['Cash', 'UPI', 'Debit Card', 'Credit Card'].map(method => {
                        const key = method.toLowerCase().replace(' card', ''); // 'debit card' -> 'debit'
                        return (
                            <button
                                key={method}
                                type="button"
                                onClick={() => handleNestedChange('paymentMethods', key, !formData.paymentMethods?.[key])}
                                className={`px-6 py-3 rounded-lg font-bold border-2 transition-all ${formData.paymentMethods?.[key] ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                            >
                                {formData.paymentMethods?.[key] && <FaCheck className="inline mr-2" />}
                                {method}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* What's Included? - HIDDEN for Villa per user request, only for Waterpark */}
            {
                formData.propertyType === 'Waterpark' && (
                    <div className="mt-8">
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                            What's Included? (Facilities)
                            <span className="text-red-500 animate-pulse text-lg">*</span>
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {INCLUSIONS.map(inc => (
                                <button
                                    key={inc}
                                    type="button"
                                    onClick={() => handleNestedChange('inclusions', inc, !formData.inclusions?.[inc])}
                                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${formData.inclusions?.[inc] ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    {formData.inclusions?.[inc] && <FaCheck className="inline mr-2 text-xs" />}
                                    {inc}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );

    const renderStep4 = () => {
        const handleDeleteExisting = async (imageId, e) => {
            e.stopPropagation(); // Prevent bubbling

            const isConfirmed = await showConfirm('Delete Photo', 'Are you sure you want to permanently delete this photo?', 'Delete', 'Cancel');
            if (!isConfirmed) return;

            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                await axios.delete(`${baseURL}/vendor/properties/${id}/images/${imageId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setExistingImages(prev => prev.filter(img => img.id !== imageId));
                showSuccess('Deleted', 'Image removed.');
            } catch (err) {
                console.error(err);
                showError('Error', 'Failed to delete image.');
            }
        };

        const handleMakeCover = (index) => {
            if (index === 0) return;
            setFormData(prev => {
                const images = [...prev.images];
                const [selected] = images.splice(index, 1);
                images.unshift(selected);
                return { ...prev, images };
            });
        };

        const handleSetPrimary = async (imageId, e) => {
            e.stopPropagation();
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                await axios.put(`${baseURL}/vendor/properties/${id}/images/${imageId}/primary`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setExistingImages(prev => prev.map(img => ({ ...img, is_primary: img.id === imageId })));
                showSuccess('Success', 'Main photo updated.');
            } catch (err) {
                console.error(err);
                showError('Error', 'Failed to update main photo.');
            }
        };

        const handleDeleteNewImage = async (idx) => {
            const isConfirmed = await showConfirm('Remove Photo', 'Remove this new photo from the list?', 'Remove', 'Cancel');
            if (isConfirmed) {
                setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
            }
        };

        const handleBulkDelete = async () => {
            if (selectedImages.length === 0) return;

            const isConfirmed = await showConfirm(
                'Delete Photos',
                `Are you sure you want to delete ${selectedImages.length} selected photos?`,
                'Delete All',
                'Cancel'
            );
            if (!isConfirmed) return;

            setSaving(true);
            try {
                const baseURL = API_BASE_URL;
                // Execute deletes in parallel
                await Promise.all(selectedImages.map(imgId =>
                    axios.delete(`${baseURL}/vendor/properties/${id}/images/${imgId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ));

                setExistingImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
                setSelectedImages([]);
                showSuccess('Deleted', `${selectedImages.length} photos removed.`);
            } catch (err) {
                console.error(err);
                showError('Error', 'Failed to delete some photos.');
            } finally {
                setSaving(false);
            }
        };

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaVideo className="text-red-500" /> Property Video</h4>
                    <div className="space-y-4">
                        <InputField
                            label="YouTube URL (Optional)"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleInputChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {formData.videoUrl && !/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/.test(formData.videoUrl) && (
                            <p className="text-red-500 text-xs mt-1">Please enter a valid YouTube URL (including Shorts).</p>
                        )}

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-white transition-colors cursor-pointer"
                            onClick={() => videoInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="video/*"
                                ref={videoInputRef}
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <FaVideo className="mx-auto text-3xl text-gray-400 mb-2" />
                            <p className="text-sm font-bold text-gray-600">Upload New Video</p>
                            <p className="text-xs text-gray-400">MP4, MOV up to 50MB</p>
                        </div>

                        {(existingVideos.length > 0 || formData.videos.length > 0) && (
                            <div className="flex flex-wrap gap-4 mt-4">
                                {existingVideos.map((video, idx) => (
                                    <div key={`existing-${idx}`} className="relative w-32 h-32 bg-black rounded-lg overflow-hidden group border-2 border-blue-400">
                                        <video src={video.video_url} className="w-full h-full object-cover" />
                                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-[8px] px-1 rounded">EXISTING</div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteExistingVideo(video.id || video.PropertyVideoId)}
                                                className="bg-white text-red-500 p-1.5 rounded-full hover:scale-110 transition shadow-lg"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.videos.map((file, idx) => (
                                    <div key={`new-${idx}`} className="relative w-32 h-32 bg-black rounded-lg overflow-hidden group">
                                        <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                        <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] px-1 rounded">NEW</div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteVideo(idx)}
                                                className="bg-white text-red-500 p-1.5 rounded-full hover:scale-110 transition shadow-lg"
                                            >
                                                <FaTimes size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-blue-900 flex items-center gap-2"><FaCamera className="text-blue-500" /> Property Photos (Min 5)</h4>
                        {selectedImages.length > 0 && (
                            <button
                                type="button"
                                onClick={handleBulkDelete}
                                className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition"
                            >
                                Delete Selected ({selectedImages.length})
                            </button>
                        )}
                    </div>

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        style={{ display: 'none' }}
                    />

                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        className="border-3 border-dashed border-blue-200 rounded-3xl p-12 text-center hover:bg-white transition-colors cursor-pointer relative group"
                    >
                        <div className="flex flex-col items-center gap-4 transition-transform group-hover:scale-110 duration-300">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-2">
                                <FaCamera />
                            </div>
                            <div>
                                <p className="font-bold text-xl text-gray-800">Add Property Photos</p>
                                <p className="text-gray-400">Click to browse or drop photos</p>
                            </div>
                        </div>
                    </div>

                    {(existingImages.length > 0 || formData.images.length > 0) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            {existingImages.map((img) => (
                                <div
                                    key={img.id}
                                    onClick={() => setSelectedImages(prev => prev.includes(img.id) ? prev.filter(x => x !== img.id) : [...prev, img.id])}
                                    className={`relative group rounded-xl overflow-hidden aspect-square shadow-md cursor-pointer border-2 ${selectedImages.includes(img.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'} ${img.is_primary ? 'ring-4 ring-yellow-400 bg-yellow-400' : 'bg-white'}`}
                                >
                                    <img src={img.image_url} alt="Property" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                                    {selectedImages.includes(img.id) && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                            <FaCheck size={10} />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => handleSetPrimary(img.id, e)}
                                            className={`p-2 rounded-full shadow-lg transition-all ${img.is_primary ? 'bg-yellow-400 text-white' : 'bg-white text-gray-400 hover:text-yellow-400'}`}
                                        >
                                            <FaStar />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteExisting(img.id, e)}
                                            className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                    {img.is_primary && (
                                        <div className="absolute top-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            MAIN
                                        </div>
                                    )}
                                </div>
                            ))}

                            {formData.images.map((file, idx) => (
                                <div key={`new-${idx}`} className={`relative group rounded-xl overflow-hidden aspect-square shadow-md bg-white ${idx === 0 ? 'ring-4 ring-yellow-400' : ''}`}>
                                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                    {idx === 0 ? (
                                        <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                            <FaStar /> Cover
                                        </div>
                                    ) : (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                            NEW
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        {idx !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleMakeCover(idx)}
                                                className="bg-white text-yellow-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                                title="Set as Cover"
                                            >
                                                <FaStar />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteNewImage(idx)}
                                            className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Video Upload Section */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border-2 border-purple-100">
                    <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-6">
                        <FaVideo className="text-purple-500" /> Property Videos (Optional)
                    </h4>

                    <input
                        type="file"
                        multiple
                        accept="video/*"
                        ref={videoInputRef}
                        onChange={handleVideoUpload}
                        className="hidden"
                        style={{ display: 'none' }}
                    />

                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            videoInputRef.current?.click();
                        }}
                        className="border-3 border-dashed border-purple-200 rounded-3xl p-12 text-center hover:bg-white transition-colors cursor-pointer relative group"
                    >
                        <div className="flex flex-col items-center gap-4 transition-transform group-hover:scale-110 duration-300">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-2">
                                <FaVideo />
                            </div>
                            <div>
                                <p className="font-bold text-xl text-gray-800">Add Property Videos</p>
                                <p className="text-gray-400">Click to browse or drop videos (Max 50MB each)</p>
                            </div>
                        </div>
                    </div>

                    {(existingVideos.length > 0 || formData.videos.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            {existingVideos.map((vid) => (
                                <div key={vid.id} className="relative group rounded-xl overflow-hidden aspect-video shadow-md bg-black">
                                    <video src={vid.video_url} className="w-full h-full object-cover" controls />
                                    <div className="absolute top-2 right-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteExistingVideo(vid.id)}
                                            className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {formData.videos.map((file, idx) => (
                                <div key={`new-video-${idx}`} className="relative group rounded-xl overflow-hidden aspect-video shadow-md bg-black">
                                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" controls />
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                        NEW
                                    </div>
                                    <div className="absolute top-2 right-2">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteVideo(idx)}
                                            className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- VALIDATION AND NAVIGATION ---
    const validateStep = (step) => {
        const isVilla = formData.propertyType === 'Villa';
        const errors = [];

        // Step 0: Basic Info
        if (step === 0) {
            if (!formData.name?.trim()) errors.push('Property Name is required.');
            if (!formData.propertyType) errors.push('Property Type is required.');
            if (!formData.location?.trim()) errors.push('Nearest Station is required.');
            if (!formData.cityName?.trim()) errors.push('City Name is required.');
            if (!formData.address?.trim()) errors.push('Full Address is required.');
            if (!formData.contactPerson?.trim()) errors.push('Contact Person is required.');
            if (!formData.mobileNo) errors.push('Mobile Number is required.');
            if (formData.mobileNo) {
                const normalized = normalizePhone(formData.mobileNo);
                if (normalized.length !== 10) {
                    errors.push('Mobile Number must be 10 digits.');
                }
            }
        }

        // Room Config Check (Step 2)
        if (isVilla && step === 2) {
            const rooms = parseInt(formData.noofRooms || 0);
            if (rooms < 1) errors.push('Please enter number of rooms.');
        }

        // Policies Step (Villa: 3 / Waterpark: 2)
        const policiesStep = isVilla ? 3 : 2;
        if (step === policiesStep) {
            // Mandate at least one ID proof
            if (!formData.idProofs || formData.idProofs.length === 0) {
                errors.push('Please select at least one accepted ID proof.');
            }
        }

        // Pricing & Capacity Check (Villa: 4 / Waterpark: 3)
        const pricingStep = isVilla ? 4 : 3;
        if (step === pricingStep) {
            if (isVilla) {
                if (!formData.priceMonThu) errors.push('Mon-Thu Price is required.');
                if (!formData.priceFriSun) errors.push('Fri-Sun Price is required.');
                if (!formData.priceSaturday) errors.push('Saturday Price is required.');

                // Extra Person Pricing
                if (!formData.extraGuestPriceMonThu) errors.push('Extra Person Mon-Thu Rate is required.');
                if (!formData.extraGuestPriceFriSun) errors.push('Extra Person Fri-Sun Rate is required.');
                if (!formData.extraGuestPriceSaturday) errors.push('Extra Person Saturday Rate is required.');

                // Capacity Validation
                if (!formData.occupancy) errors.push('Standard Occupancy is required.');
                if (!formData.maxCapacity) errors.push('Max Capacity is required.');
                if (formData.occupancy && formData.maxCapacity && parseInt(formData.maxCapacity) < parseInt(formData.occupancy)) {
                    errors.push('Max Capacity cannot be less than Standard Occupancy.');
                }

            } else {
                // Waterpark Validation
                if (!formData.priceMonThu) errors.push('Adult Mon-Fri Price is required.');
                if (!formData.priceFriSun) errors.push('Adult Sat-Sun Price is required.');
                if (!formData.childCriteria?.monFriPrice) errors.push('Child Mon-Fri Price is required.');

                // Facilities Check for Waterpark
                const hasFacility = INCLUSIONS.some(inc => formData.inclusions?.[inc]);
                if (!hasFacility) errors.push('Please select at least one facility (What\'s Included).');
            }

            // Payment Methods Check
            const hasPayment = Object.values(formData.paymentMethods || {}).some(v => v === true);
            if (!hasPayment) errors.push('Please select at least one Accepted Payment Method.');
        }
        return { valid: errors.length === 0, msgs: errors };
    };

    const handleNext = () => {
        const { valid, msgs } = validateStep(currentStep);
        if (!valid) {
            showError('Missing Details', (
                <ul className="list-disc ml-5 text-left space-y-1">
                    {msgs.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
            ));
            return;
        }
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderNavigation = (isTop = false) => (
        <div className={`flex justify-between items-center ${isTop ? 'mb-4 border-b pb-4 border-gray-100' : 'fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 p-3 md:p-4 z-50 md:static md:bg-transparent md:border-0 md:p-0'}`}>
            <button
                onClick={() => {
                    setCurrentStep(prev => prev - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm md:text-base text-gray-500 hover:bg-gray-100 transition disabled:opacity-30 disabled:hover:bg-transparent"
            >
                <FaArrowLeft /> Back
            </button>

            {currentStep < (formData.propertyType === 'Villa' ? STEPS_VILLA.length : STEPS_WATERPARK.length) - 1 ? (
                <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-black text-white px-5 py-2 md:px-8 md:py-2.5 rounded-xl font-bold text-sm md:text-base hover:bg-gray-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    Next <FaArrowRight />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#FF385C] text-white px-5 py-2 md:px-8 md:py-2.5 rounded-xl font-bold text-sm md:text-base hover:bg-[#D90B3E] transition shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 disabled:opacity-70"
                >
                    {saving ? 'Updating...' : 'Update'} <FaSave />
                </button>
            )}
        </div>
    );


    if (loading) return <Loader />;

    return (
        <div className="max-w-4xl mx-auto pb-24 pt-4 px-2 md:pb-12 md:pt-8 md:px-4">
            <div className="text-center mb-4 md:mb-8">
                <h1 className="text-xl md:text-3xl font-extrabold mb-1 tracking-tight text-gray-900">Edit Listing</h1>
                <p className="text-gray-500 font-medium text-xs md:text-sm">Step {currentStep + 1}: {formData.propertyType === 'Villa' ? STEPS_VILLA[currentStep] : STEPS_WATERPARK[currentStep]}</p>
                <div className="flex justify-center mt-2 gap-1.5">
                    {(formData.propertyType === 'Villa' ? STEPS_VILLA : STEPS_WATERPARK).map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'w-5 md:w-8 bg-black' : 'w-1.5 bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 font-medium text-center text-sm">{error}</div>}

            {/* Top Navigation - Desktop Only */}
            <div className="hidden md:block mb-4">
                {renderNavigation(true)}
            </div>

            <div className="bg-white mb-6 min-h-[350px] md:min-h-[450px] p-3 md:p-6 rounded-xl shadow-sm border border-gray-100">
                {(() => {
                    if (currentStep === 0) return renderStep0();
                    if (currentStep === 1) return renderStep1();
                    if (currentStep === 2) {
                        return formData.propertyType === 'Villa' ? renderStepRoomConfig() : renderStep2();
                    }
                    if (currentStep === 3) {
                        return formData.propertyType === 'Villa' ? renderStep2() : renderStep3();
                    }
                    if (currentStep === 4) {
                        return formData.propertyType === 'Villa' ? renderStep3() : renderStep4();
                    }
                    if (currentStep === 5 && formData.propertyType === 'Villa') return renderStep4();
                    return null;
                })()}
            </div>

            {/* Bottom Navigation */}
            {renderNavigation(false)}

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}


