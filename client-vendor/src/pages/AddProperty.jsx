import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
    FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaBed, FaUtensils,
    FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave, FaStar,
    FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake, FaCouch, FaRestroom, FaDoorOpen, FaUsers,
    FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaConciergeBell, FaHotTub,
    FaTv, FaPlus, FaTrash
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

export default function AddProperty() {
    const { token } = useAuth();
    const { showSuccess, showError, showConfirm } = useModal();
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
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

        // Validation Fixes
        idProofs: [],
        otherAttractions: [],
        checkInTime: '14:00',
        checkOutTime: '11:00',
        otherAmenities: [],
        otherRules: []
    });

    const [existingImages, setExistingImages] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);

    // DRAFT AUTO-SAVE & LOAD
    useEffect(() => {
        const saved = localStorage.getItem('addPropertyDraft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // DATA SANITIZATION for legacy drafts
                if (typeof parsed.otherAmenities === 'string') {
                    parsed.otherAmenities = parsed.otherAmenities ? parsed.otherAmenities.split(',') : [];
                }
                if (typeof parsed.otherAttractions === 'string') {
                    parsed.otherAttractions = parsed.otherAttractions ? parsed.otherAttractions.split(',') : [];
                }
                if (typeof parsed.otherRules === 'string') {
                    parsed.otherRules = parsed.otherRules ? parsed.otherRules.split(',') : [];
                }

                // Merge with default structure to prevent missing field errors
                setFormData(prev => ({ ...prev, ...parsed }));
                console.log("Draft loaded");
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            // Don't save if empty or initial state to avoid overwriting invalidly
            if (formData.name || formData.displayName) {
                const draft = { ...formData, images: [], videos: [] }; // Don't persist files
                localStorage.setItem('addPropertyDraft', JSON.stringify(draft));
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [formData]);

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
        // Not used in AddProperty
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
                otherAttractions: formData.otherAttractions, // Persisted Field
                otherAmenities: formData.otherAmenities || [] // New Field
            };

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

            const baseURL = API_BASE_URL;
            const res = await axios.post(`${baseURL}/vendor/properties`, apiData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            if (res.status === 202 && res.data.status === 'pending_approval') {
                showSuccess('Property Created', 'Your property has been submitted for admin approval.');
            } else {
                showSuccess('Property Created', 'Your property has been successfully listed.');
            }
            localStorage.removeItem('addPropertyDraft'); // Clear draft
            navigate('/properties');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create property");
        } finally {
            setSaving(false);
        }
    };

    // --- STEPS ---
    const renderStep0 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, propertyType: 'Villa' })}
                    className={`p-5 rounded-xl border flex items-center justify-center gap-3 transition-all ${formData.propertyType === 'Villa' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md ring-1 ring-purple-200' : 'bg-white border-gray-200 text-gray-500 hover:border-purple-300 hover:bg-purple-50/50'}`}
                >
                    <FaHome size={24} />
                    <span className="font-bold text-base">Villa / Resort</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, propertyType: 'Waterpark' })}
                    className={`p-5 rounded-xl border flex items-center justify-center gap-3 transition-all ${formData.propertyType === 'Waterpark' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md ring-1 ring-blue-200' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50/50'}`}
                >
                    <FaWater size={24} />
                    <span className="font-bold text-base">Waterpark</span>
                </button>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Basic Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Royal Palms" required />
                    <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} placeholder="Ex: Royal Palms" required />
                    <InputField label="City" name="cityName" value={formData.cityName} onChange={handleInputChange} placeholder="Ex: Lonavala" />
                    <InputField label="Location (Landmark)" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Near Station" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
                    <textarea
                        name="address"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-20 resize-none"
                        placeholder="Enter complete address..."
                    />
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
                    <div className="space-y-1.5">
                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            name="mobileNo"
                            value={formData.mobileNo}
                            onChange={handlePhoneChange}
                            className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:bg-white focus:border-black outline-none transition-all ${!formData.mobileNo ? 'border-orange-100' : ''}`}
                            placeholder="9876543210"
                            required
                        />
                    </div>
                    <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                    <InputField label="Website URL" name="website" value={formData.website} onChange={handleInputChange} />
                </div>
            </div>

            {/* Map Location Section */}
            <div className="bg-green-50/30 p-5 rounded-xl border border-green-100 space-y-4">
                <h4 className="font-bold text-green-800 flex items-center gap-2 text-sm">
                    <FaHome className="text-green-600" /> Map Location
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Google Map Link</label>
                        <input
                            type="url"
                            name="googleMapLink"
                            value={formData.googleMapLink}
                            onChange={handleInputChange}
                            onBlur={handleMapLinkBlur}
                            className="w-full bg-white border border-green-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
                            placeholder="Paste Google Maps Link here"
                        />
                        <p className="text-[10px] text-green-600 italic">Auto-detects Latitude & Longitude.</p>
                    </div>
                    <InputField label="Latitude" name="latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="Ex: 18.1234" className="bg-white" />
                    <InputField label="Longitude" name="longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="Ex: 73.5678" className="bg-white" />
                </div>

                {/* Other Attractions Removed */}
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Description</h4>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Short Description</label>
                        <textarea
                            name="shortDescription"
                            value={formData.shortDescription || ''}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-16 resize-none"
                            placeholder="Brief summary..."
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Long Description</label>
                        <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-24 resize-none"
                            placeholder="Detailed description..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-gray-800">{formData.propertyType === 'Waterpark' ? 'Waterpark Attractions' : 'Features & Amenities'}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {AMENITY_TYPES.filter(item => !item.scope || item.scope.includes(formData.propertyType)).map(item => (
                        <div key={item.key} className={`border rounded-lg p-3 flex flex-col gap-2 transition-all cursor-pointer ${formData.amenities[item.key] ? 'border-black ring-1 ring-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`} onClick={() => handleAmenityChange(item.key, 'bool', !formData.amenities[item.key])}>
                            <div className="flex justify-between items-start">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${formData.amenities[item.key] ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {getAmenityIcon(item.key)}
                                </div>
                                {item.type !== 'number' && (
                                    <div className={`w-4 h-4 rounded-full border ${formData.amenities[item.key] ? 'bg-black border-black' : 'border-gray-300'}`}>
                                        {formData.amenities[item.key] && <FaCheck className="text-white text-[10px] m-auto mt-[1px]" />}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className={`font-bold text-xs ${formData.amenities[item.key] ? 'text-black' : 'text-gray-500'}`}>{item.label}</p>
                                {item.type === 'number' && (
                                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                        <Counter value={formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'number', val)} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Additional Amenities</label>
                        <div className="space-y-2">
                            {formData.otherAmenities.map((amenity, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={amenity}
                                        onChange={(e) => {
                                            const newAmenities = [...formData.otherAmenities];
                                            newAmenities[idx] = e.target.value;
                                            setFormData(prev => ({ ...prev, otherAmenities: newAmenities }));
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-black outline-none"
                                        placeholder="Enter amenity..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newAmenities = formData.otherAmenities.filter((_, i) => i !== idx);
                                            setFormData(prev => ({ ...prev, otherAmenities: newAmenities }));
                                        }}
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, otherAmenities: [...prev.otherAmenities, ''] }))}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                            >
                                <span className="bg-blue-50 p-1 rounded">+</span> Add Amenity
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Other Attractions</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
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
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-black outline-none"
                                        placeholder="Enter attraction..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newAttrs = formData.otherAttractions.filter((_, i) => i !== idx);
                                            setFormData(prev => ({ ...prev, otherAttractions: newAttrs }));
                                        }}
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, otherAttractions: [...prev.otherAttractions, ''] }))}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                            >
                                <span className="bg-blue-50 p-1 rounded">+</span> Add Attraction
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-gray-800">Rules and Policies</h3>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Check-in Time</label>
                    <input type="time" value={formData.checkInTime} onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} className="w-full p-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-black transition-all bg-white" />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Check-out Time</label>
                    <input type="time" value={formData.checkOutTime} onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })} className="w-full p-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-black transition-all bg-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm h-full">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><FaUtensils className="text-orange-500" /> Food & Dietary</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-600 text-sm">Outside food allowed?</span>
                            <Toggle active={!!formData.rules[3]} onChange={(val) => {
                                const newRules = { ...formData.rules, [3]: val };
                                if (!val) newRules[8] = false;
                                setFormData({ ...formData, rules: newRules });
                            }} />
                        </div>
                        {formData.rules[3] && (
                            <div className="flex items-center justify-between pl-3 border-l-2 border-orange-100">
                                <span className="font-medium text-gray-600 text-xs">Non-veg food allowed?</span>
                                <Toggle active={!!formData.rules[8]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [8]: val } })} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm h-full">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><FaGlassMartiniAlt className="text-purple-500" /> Habits</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                            <span className="font-medium text-gray-600 text-sm">Smoking allowed?</span>
                            <Toggle active={!!formData.rules[6]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [6]: val } })} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-600 text-sm">Alcohol allowed?</span>
                            <Toggle active={!!formData.rules[7]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [7]: val } })} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 text-sm">General House Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {PROPERTY_RULES.map((rule, idx) => {
                        if ([3, 8, 6, 7].includes(idx)) return null;
                        return (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded transition-colors">
                                <span className="font-medium text-gray-600 text-xs">{rule}</span>
                                <Toggle active={!!formData.rules[idx]} onChange={(val) => setFormData({ ...formData, rules: { ...formData.rules, [idx]: val } })} />
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Accepted ID Proofs</label>
                    <div className="flex flex-wrap gap-2">
                        {['Passport', 'Driving License', 'PAN Card', 'Aadhar Card'].map(id => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => {
                                    const newIds = formData.idProofs.includes(id) ? formData.idProofs.filter(i => i !== id) : [...formData.idProofs, id];
                                    setFormData({ ...formData, idProofs: newIds });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.idProofs.includes(id) ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                                {formData.idProofs.includes(id) && <FaCheck className="inline mr-1 text-[10px]" />} {id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm"><FaUserShield /> Safety & Security</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {['Fire Extinguisher', 'Security System', 'First Aid Kit', 'Window Guards'].map(safety => (
                        <label key={safety} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-blue-100 cursor-pointer shadow-sm hover:border-blue-300 transition-all">
                            <input
                                type="checkbox"
                                checked={formData.amenities[safety] || false}
                                onChange={(e) => handleAmenityChange(safety, 'bool', e.target.checked)}
                                className="w-4 h-4 accent-blue-600 rounded bg-gray-100 border-gray-300"
                            />
                            <span className="text-xs font-bold text-gray-700">{safety}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Other Rules */}
            <div className="bg-white border rounded-xl p-5 shadow-sm">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Custom Rules</label>
                <div className="space-y-2">
                    {formData.otherRules.map((rule, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                type="text"
                                value={rule}
                                onChange={(e) => {
                                    const newRules = [...formData.otherRules];
                                    newRules[idx] = e.target.value;
                                    setFormData(prev => ({ ...prev, otherRules: newRules }));
                                }}
                                className="w-full bg-gray-50 border-b-2 border-transparent border-gray-100 focus:border-black outline-none py-2 text-sm font-medium transition-colors"
                                placeholder="Enter rule..."
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newRules = formData.otherRules.filter((_, i) => i !== idx);
                                    setFormData(prev => ({ ...prev, otherRules: newRules }));
                                }}
                                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, otherRules: [...formData.otherRules, ''] }))}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-2"
                    >
                        <span className="bg-blue-50 p-1 rounded">+</span> Add Rule
                    </button>
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
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2"><FaBed /> Room Configuration</h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        {formData.propertyType === 'Villa' && (
                            <div className="w-full md:w-1/3">
                                <InputField label="No. of Rooms" name="noofRooms" value={formData.noofRooms} onChange={handleInputChange} placeholder="Ex: 3" type="number" className="bg-white" />
                            </div>
                        )}
                        <div className="flex-1 text-xs text-blue-700 bg-white border border-blue-200 p-3 rounded-lg w-full">
                            <strong>Note:</strong> Setting the number of rooms will automatically generate configuration cards below.
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-amber-900"><FaCouch /> Living Rooms</h3>
                        <button type="button" onClick={addLivingRoom} className="text-xs bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-200 transition shadow-sm border border-amber-200">+ Add</button>
                    </div>

                    <div className="space-y-3">
                        {formData.roomConfig.livingRooms.map((room, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm relative hover:border-amber-300 transition-all">
                                {formData.roomConfig.livingRooms.length > 1 && (
                                    <button type="button" onClick={() => removeLivingRoom(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><FaTimes /></button>
                                )}
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="w-32">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Type</label>
                                        <span className="text-xs font-bold text-amber-800 block mb-1">Living Room {idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-[120px]">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bedding</label>
                                        <select className="w-full p-2 text-xs rounded border border-gray-200 bg-gray-50 outline-none" value={room.bedType} onChange={(e) => updateLivingRoom(idx, 'bedType', e.target.value)}>
                                            <option value="Sofa">Sofa</option>
                                            <option value="Sofa cum Bed">Sofa cum Bed</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>
                                    {/* Toggles Row */}
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'AC', key: 'ac', icon: <FaSnowflake /> },
                                            { label: 'TV', key: 'tv', icon: <FaTv /> }, // Using FaTv assuming it's imported now
                                            { label: 'Bath', key: 'bathroom', icon: <FaRestroom /> },
                                            { label: 'Balcony', key: 'balcony', icon: <MdBalcony /> }
                                        ].map(feat => (
                                            <button
                                                key={feat.key}
                                                type="button"
                                                onClick={() => updateLivingRoom(idx, feat.key, !room[feat.key])}
                                                className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition-all ${room[feat.key] ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-gray-50 border-gray-100 text-gray-400 grayscale'}`}
                                                title={feat.label}
                                            >
                                                <div className="text-sm">{feat.icon}</div>
                                                <span className="text-[8px] font-bold mt-0.5">{feat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {room.bathroom && (
                                        <div className="w-24">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Toilet</label>
                                            <select className="w-full p-2 text-xs rounded border border-gray-200 bg-gray-50 outline-none" value={room.toiletType} onChange={(e) => updateLivingRoom(idx, 'toiletType', e.target.value)}>
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

                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><FaBed /> Bedrooms ({formData.noofRooms || 0})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.roomConfig.bedrooms.map((room, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    Bedroom {idx + 1}
                                </div>

                                <div className="mt-2 mb-4">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bed Type</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm font-medium bg-gray-50"
                                        value={room.bedType}
                                        onChange={(e) => updateRoom(idx, 'bedType', e.target.value)}
                                    >
                                        <option value="King">👑 King Size</option>
                                        <option value="Queen">👸 Queen Size</option>
                                        <option value="Double">🛏️ Double Bed</option>
                                        <option value="Single">🛌 Single Bed</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 justify-between">
                                    {[
                                        { label: 'AC', key: 'ac', icon: <FaSnowflake /> },
                                        { label: 'TV', key: 'tv', icon: <FaTv /> },
                                        { label: 'Geyser', key: 'geyser', icon: <FaHotTub /> },
                                        { label: 'Balcony', key: 'balcony', icon: <MdBalcony /> },
                                        { label: 'Bath', key: 'bathroom', icon: <FaRestroom /> }
                                    ].map(feat => (
                                        <button
                                            key={feat.key}
                                            type="button"
                                            onClick={() => updateRoom(idx, feat.key, !room[feat.key])}
                                            className={`flex flex-col items-center justify-center flex-1 py-2 rounded-lg border transition-all ${room[feat.key] ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-400 grayscale'}`}
                                        >
                                            <div className="text-sm pb-1">{feat.icon}</div>
                                            <span className="text-[8px] font-bold">{feat.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {room.bathroom && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500">Toilet Type:</span>
                                        <select
                                            className="p-1 px-2 text-xs rounded border border-gray-200 outline-none bg-gray-50 font-medium w-1/2"
                                            value={room.toiletType}
                                            onChange={(e) => updateRoom(idx, 'toiletType', e.target.value)}
                                        >
                                            <option value="Western">Western</option>
                                            <option value="Indian">Indian</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderStep3 = () => (
        <div className="space-y-6 animate-fade-in-up">
            {formData.propertyType === 'Villa' && (
                <>
                    <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2 text-sm"><FaUsers /> Capacity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Standard Occupancy" name="occupancy" value={formData.occupancy} onChange={handleInputChange} placeholder="Base" type="number" className="bg-white" required />
                            <InputField label="Max Capacity" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} placeholder="Max" type="number" className="bg-white" required />
                        </div>
                    </div>

                    <div className="border border-green-100 p-5 rounded-xl bg-green-50/30">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-green-800 text-sm">
                            <FaMoneyBillWave /> Base Pricing (Per Night)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Mon-Thu" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} placeholder="₹ Rate" className="bg-white" />
                            <InputField label="Fri & Sun" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} placeholder="₹ Rate" className="bg-white" />
                            <InputField label="Saturday" name="priceSaturday" value={formData.priceSaturday} onChange={handleInputChange} placeholder="₹ Rate" className="bg-white" />
                        </div>
                    </div>

                    <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                        <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-sm"><FaChild /> Extra Person (Per Person)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Mon-Thu" name="extraGuestPriceMonThu" value={formData.extraGuestPriceMonThu} onChange={handleInputChange} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Fri & Sun" name="extraGuestPriceFriSun" value={formData.extraGuestPriceFriSun} onChange={handleInputChange} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Saturday" name="extraGuestPriceSaturday" value={formData.extraGuestPriceSaturday} onChange={handleInputChange} placeholder="₹ Rate" type="number" className="bg-white" />
                        </div>
                        <p className="text-[10px] text-purple-600 mt-2 font-medium">
                            * Applies when count exceeds Standard Occupancy.
                        </p>
                    </div>

                    <div className="border border-orange-100 p-5 rounded-xl bg-orange-50/30">
                        <h4 className="flex items-center gap-2 mb-3 font-bold text-orange-800 text-sm"><FaUtensils /> Meal Configuration (Per Person)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Veg Package" name="foodRateVeg" value={formData.foodRates?.veg || ''} onChange={(e) => handleNestedChange('foodRates', 'veg', e.target.value)} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Non-Veg Package" name="foodRateNonVeg" value={formData.foodRates?.nonVeg || ''} onChange={(e) => handleNestedChange('foodRates', 'nonVeg', e.target.value)} placeholder="₹ Rate" type="number" className="bg-white" />
                            <InputField label="Jain Package" name="foodRateJain" value={formData.foodRates?.jain || ''} onChange={(e) => handleNestedChange('foodRates', 'jain', e.target.value)} placeholder="₹ Rate" type="number" className="bg-white" />
                        </div>
                    </div>
                </>
            )}

            {formData.propertyType === 'Waterpark' && (
                <>
                    <div className="border border-blue-100 p-5 rounded-xl bg-blue-50/50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-blue-800 text-sm">
                            <FaMoneyBillWave /> Ticket Pricing
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-3">
                                <h5 className="font-bold text-xs text-gray-500 uppercase">Adult Tickets</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Mon-Fri" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} placeholder="₹ 1000" className="bg-gray-50" required />
                                    <InputField label="Sat-Sun" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} placeholder="₹ 1200" className="bg-gray-50" required />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-3">
                                <h5 className="font-bold text-xs text-gray-500 uppercase">Child Tickets</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Mon-Fri" name="childPriceMonFri" value={formData.childCriteria?.monFriPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'monFriPrice', e.target.value)} placeholder="₹ 800" className="bg-gray-50" required />
                                    <InputField label="Sat-Sun" name="childPriceSatSun" value={formData.childCriteria?.satSunPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'satSunPrice', e.target.value)} placeholder="₹ 1000" className="bg-gray-50" required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
                            <FaChild className="text-blue-500" /> Child Policy
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <h5 className="text-[10px] font-bold text-blue-600 uppercase mb-3 tracking-widest">CHILD RATE APPLICABLE</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] block text-gray-400 uppercase font-bold mb-1">Height Range (FT)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" step="0.1" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500 text-sm" placeholder="3.0" value={formData.childCriteria?.heightFrom || ''} onChange={(e) => handleNestedChange('childCriteria', 'heightFrom', e.target.value)} />
                                            <span className="text-gray-400 text-xs">to</span>
                                            <input type="number" step="0.1" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500 text-sm" placeholder="4.5" value={formData.childCriteria?.heightTo || ''} onChange={(e) => handleNestedChange('childCriteria', 'heightTo', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] block text-gray-400 uppercase font-bold mb-1">Age Range (Yrs)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500 text-sm" onKeyDown={(e) => ["-", "e", "E", "."].includes(e.key) && e.preventDefault()} placeholder="3" value={formData.childCriteria?.ageFrom || ''} onChange={(e) => handleNestedChange('childCriteria', 'ageFrom', e.target.value)} />
                                            <span className="text-gray-400 text-xs">to</span>
                                            <input type="number" className="w-full border-b-2 border-blue-200 bg-transparent py-1 font-bold outline-none focus:border-blue-500 text-sm" onKeyDown={(e) => ["-", "e", "E", "."].includes(e.key) && e.preventDefault()} placeholder="12" value={formData.childCriteria?.ageTo || ''} onChange={(e) => handleNestedChange('childCriteria', 'ageTo', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-blue-600 mt-2 italic">Standard adult rates apply above these limits.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
                        <h4 className="font-bold mb-4 text-sm text-gray-800">Ticket Inclusions (Food)</h4>
                        <div className="space-y-3">
                            {['Breakfast', 'Lunch', 'Tea and coffee'].map(meal => (
                                <div key={meal} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                                    <span className="font-medium text-xs text-gray-600 uppercase">{meal === 'Tea and coffee' ? 'Tea & Coffee' : meal}</span>
                                    <div className="flex gap-2">
                                        {['Not Included', 'Veg', 'Non-Veg', 'Both'].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => handleNestedChange('inclusions', meal.toLowerCase(), opt)}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all ${formData.inclusions?.[meal.toLowerCase()] === opt ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
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

            <div className="border border-green-100 p-5 rounded-xl bg-green-50/30 table-fixed">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-green-900 text-sm">
                    <FaMoneyBillWave className="text-green-600" /> Accepted Payment Methods
                    <span className="text-red-500 animate-pulse">*</span>
                </h4>
                <div className="flex gap-3 flex-wrap">
                    {['Cash', 'UPI', 'Debit Card', 'Credit Card'].map(method => {
                        const key = method.toLowerCase().replace(' card', '');
                        return (
                            <button
                                key={method}
                                type="button"
                                onClick={() => handleNestedChange('paymentMethods', key, !formData.paymentMethods?.[key])}
                                className={`px-4 py-2 rounded-lg font-bold text-xs border transition-all ${formData.paymentMethods?.[key] ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}
                            >
                                {formData.paymentMethods?.[key] && <FaCheck className="inline mr-1.5" />}
                                {method}
                            </button>
                        )
                    })}
                </div>
            </div>

            {
                formData.propertyType === 'Waterpark' && (
                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <h4 className="font-bold mb-4 flex items-center gap-2 text-sm text-gray-800">
                            What's Included? (Facilities)
                            <span className="text-red-500 animate-pulse text-lg">*</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {INCLUSIONS.map(inc => (
                                <button
                                    key={inc}
                                    type="button"
                                    onClick={() => handleNestedChange('inclusions', inc, !formData.inclusions?.[inc])}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.inclusions?.[inc] ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                >
                                    {formData.inclusions?.[inc] && <FaCheck className="inline mr-1.5 text-[10px]" />}
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
        const handleDeleteNewImage = async (idx) => {
            const isConfirmed = await showConfirm('Remove Photo', 'Remove this new photo from the list?', 'Remove', 'Cancel');
            if (isConfirmed) {
                setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
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

        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm"><FaVideo className="text-red-500" /> Property Video</h4>
                    <div className="space-y-4">
                        <InputField
                            label="YouTube URL (Optional)"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleInputChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="bg-white"
                        />
                        {formData.videoUrl && !/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/.test(formData.videoUrl) && (
                            <p className="text-red-500 text-xs mt-1">Please enter a valid YouTube URL (including Shorts).</p>
                        )}
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-white transition-colors cursor-pointer"
                            onClick={() => videoInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept="video/*"
                                ref={videoInputRef}
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                                <FaVideo size={20} />
                            </div>
                            <p className="text-sm font-bold text-gray-600">Upload New Video</p>
                            <p className="text-[10px] text-gray-400">MP4, MOV up to 50MB</p>
                        </div>
                        {formData.videos.length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-4">
                                {formData.videos.map((file, idx) => (
                                    <div key={`new-${idx}`} className="relative w-32 h-32 bg-black rounded-lg overflow-hidden group shadow-md">
                                        <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                        <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">NEW</div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteVideo(idx)}
                                                className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
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

                <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-blue-900 flex items-center gap-2 text-sm"><FaCamera className="text-blue-500" /> Property Photos (Min 5)</h4>
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
                        className="border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center hover:bg-white transition-colors cursor-pointer relative group bg-blue-50/50"
                    >
                        <div className="flex flex-col items-center gap-3 transition-transform group-hover:scale-105 duration-300">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-1 shadow-sm">
                                <FaCamera />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-gray-800">Add Property Photos</p>
                                <p className="text-gray-400 text-xs">Click to browse or drop photos here</p>
                            </div>
                        </div>
                    </div>

                    {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                            {formData.images.map((file, idx) => (
                                <div key={`new-${idx}`} className={`relative group rounded-xl overflow-hidden aspect-square shadow-sm bg-white border border-gray-100 ${idx === 0 ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
                                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                    {idx === 0 ? (
                                        <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
                                            <FaStar size={10} /> Cover
                                        </div>
                                    ) : (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
                                            NEW
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                                        {idx !== 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleMakeCover(idx)}
                                                className="bg-white text-yellow-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                                title="Set as Cover"
                                            >
                                                <FaStar size={12} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteNewImage(idx)}
                                            className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
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
        );
    };

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

                if (!formData.extraGuestPriceMonThu) errors.push('Extra Person Mon-Thu Rate is required.');
                if (!formData.extraGuestPriceFriSun) errors.push('Extra Person Fri-Sun Rate is required.');
                if (!formData.extraGuestPriceSaturday) errors.push('Extra Person Saturday Rate is required.');

                if (!formData.occupancy) errors.push('Standard Occupancy is required.');
                if (!formData.maxCapacity) errors.push('Max Capacity is required.');
                if (formData.occupancy && formData.maxCapacity && parseInt(formData.maxCapacity) < parseInt(formData.occupancy)) {
                    errors.push('Max Capacity cannot be less than Standard Occupancy.');
                }

            } else {
                if (!formData.priceMonThu) errors.push('Adult Mon-Fri Price is required.');
                if (!formData.priceFriSun) errors.push('Adult Sat-Sun Price is required.');
                if (!formData.childCriteria?.monFriPrice) errors.push('Child Mon-Fri Price is required.');

                const hasFacility = INCLUSIONS.some(inc => formData.inclusions?.[inc]);
                if (!hasFacility) errors.push('Please select at least one facility (What\'s Included).');
            }

            const hasPayment = Object.values(formData.paymentMethods || {}).some(v => v === true);
            if (!hasPayment) errors.push('Please select at least one Accepted Payment Method.');
        }
        return { valid: errors.length === 0, msgs: errors };
    };

    const handleMapLinkBlur = (e) => {
        const url = e.target.value;
        if (!url) return;

        // Regex for @lat,long
        const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        // Regex for search/lat,long
        const searchRegex = /search\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/;

        // Regex for q=lat,long (e.g. shared location)
        const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;

        let match = url.match(atRegex) || url.match(searchRegex) || url.match(qRegex);

        if (match) {
            const [_, lat, long] = match;
            setFormData(prev => ({
                ...prev,
                latitude: lat,
                longitude: long
            }));
        }
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
                    {saving ? 'Creating...' : 'Create Listing'} <FaSave />
                </button>
            )}
        </div>
    );

    if (loading) return <Loader />;

    return (
        <div className="max-w-4xl mx-auto pb-24 pt-4 px-2 md:pb-12 md:pt-8 md:px-4">
            <div className="text-center mb-4 md:mb-8">
                <h1 className="text-xl md:text-3xl font-extrabold mb-1 tracking-tight text-gray-900">Add New Property</h1>
                <p className="text-gray-500 font-medium text-xs md:text-sm">Step {currentStep + 1}: {formData.propertyType === 'Villa' ? STEPS_VILLA[currentStep] : STEPS_WATERPARK[currentStep]}</p>
                <div className="flex justify-center mt-2 gap-1.5">
                    {(formData.propertyType === 'Villa' ? STEPS_VILLA : STEPS_WATERPARK).map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'w-5 md:w-8 bg-black' : 'w-1.5 bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 font-medium text-center text-sm">{error}</div>}

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

            {renderNavigation(false)}

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}


