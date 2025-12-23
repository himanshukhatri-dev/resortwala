import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext'; // Import Modal Hook
import {
    FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaBed, FaUtensils,
    FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave, FaStar,
    FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake, FaCouch, FaRestroom, FaDoorOpen, FaUsers,
    FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaConciergeBell, FaHotTub
} from 'react-icons/fa';
import { MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdMusicNote, MdBalcony, MdSportsEsports, MdRestaurant, MdOutlineOutdoorGrill } from 'react-icons/md';
import { STEPS_VILLA, STEPS_WATERPARK, AMENITY_TYPES } from '../constants/propertyConstants';

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
    "Smoking within the premises is allowed",
    "Alcohol consumption is allowed within the property premises",
    "Non-veg food allowed",
    "Allows private parties or events",
    "Property is not accessible to guests who use a wheelchair"
];

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
        case 'crazy_river': return <FaWater className="text-red-500" />;
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

// --- REUSABLE COMPONENTS ---
const InputField = ({ label, name, type = "text", placeholder, className, value, onChange }) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            name={name}
            value={value !== undefined ? value : ''}
            onChange={onChange}
            min={type === 'number' ? 0 : undefined}
            onKeyDown={type === 'number' ? (e) => ["-", "e", "E"].includes(e.key) && e.preventDefault() : undefined}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-gray-800 font-medium focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            placeholder={placeholder}
        />
    </div>
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

const Toggle = ({ active, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!active)}
        className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${active ? 'bg-green-500' : 'bg-gray-300'}`}
    >
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

export default function AddProperty() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const { showSuccess, showError, showConfirm } = useModal(); // Use Modal Hooks
    const fileInputRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [primaryImageIdx, setPrimaryImageIdx] = useState(0); // State for main photo selection

    // Scroll to top when step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const [formData, setFormData] = useState({
        name: '', displayName: '', propertyType: 'Villa',
        location: '', cityName: '', address: '',
        contactPerson: '', mobileNo: '', email: '', website: '',
        description: '', shortDescription: '',
        maxCapacity: '', noofRooms: '', occupancy: '',
        amenities: {}, rules: {}, paymentMethods: { cash: false, upi: false, debit: false, credit: false },
        roomConfig: {
            livingRoom: { bedType: 'Sofa', ac: false, bathroom: false, toiletType: '', balcony: false },
            bedrooms: []
        },
        childCriteria: {
            freeAge: 5, freeHeight: 3,
            chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5,
            price: ''
        },
        waterparkPrices: {
            adult: { week: '', weekend: '' },
            child: { week: '', weekend: '' }
        },
        inclusions: {},
        priceMonThu: '', priceFriSun: '', priceSaturday: '',
        checkInTime: '12:00', checkOutTime: '11:00',
        idProofs: [],
        foodRates: { veg: false, nonVeg: false, jain: false },
        mealPlans: {
            breakfast: { available: false, vegRate: '', nonVegRate: '', includes: [] },
            lunch: { available: false, vegRate: '', nonVegRate: '', includes: [] },
            dinner: { available: false, vegRate: '', nonVegRate: '', includes: [] },
            hiTea: { available: false, rate: '', includes: [] },
        },
        extraGuestLimit: '15',
        extraGuestPriceMonThu: '', extraGuestPriceFriSun: '', extraGuestPriceSaturday: '',
        otherAttractions: '', otherRules: '',
        videoUrl: '', images: []
    });

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNestedChange = (section, key, value) => setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

    // Sync Bedrooms
    useEffect(() => {
        if (formData.propertyType !== 'Villa') return;
        const count = parseInt(formData.noofRooms || 0);
        setFormData(prev => {
            if (prev.roomConfig.bedrooms.length === count) return prev; // No change

            const newRooms = [...prev.roomConfig.bedrooms];
            // If growing
            for (let i = newRooms.length; i < count; i++) {
                newRooms.push({ id: i + 1, bedType: 'Queen', ac: false, bathroom: true, toiletType: 'Western', balcony: false });
            }
            // If shrinking
            if (newRooms.length > count) {
                newRooms.length = count;
            }
            return { ...prev, roomConfig: { ...prev.roomConfig, bedrooms: newRooms } };
        });
    }, [formData.noofRooms, formData.propertyType]);



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
        e.target.value = null; // Reset input to allow re-selection
    };

    const handleDeleteImage = async (idx) => {
        const isConfirmed = await showConfirm('Delete Photo', 'Remove this photo from the list?', 'Remove', 'Cancel');
        if (isConfirmed) {
            setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        if (!formData.name || !formData.location || !formData.priceMonThu || !formData.mobileNo) {
            showError('Missing Details', 'Please fill in all required fields (Name, Location, Price, Mobile).');
            setLoading(false);
            return;
        }

        // Validate Mobile Number
        if (!/^\d{10}$/.test(formData.mobileNo)) {
            showError('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
            setLoading(false);
            return;
        }

        // Validate Minimum Photos
        if (formData.images.length < 5) {
            showError('Photos Required', 'Please upload at least 5 photos to publish your property.');
            setLoading(false);
            return;
        }

        // --- VALIDATION ---
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            // Skip strict validation for quick testing if needed, or keep it. Let's keep it.
        }

        try {
            const apiData = new FormData();
            apiData.append('Name', formData.name);
            apiData.append('ShortName', formData.displayName);
            apiData.append('PropertyType', formData.propertyType);
            apiData.append('Location', formData.location);
            apiData.append('CityName', formData.cityName);
            apiData.append('Address', formData.address);
            apiData.append('ContactPerson', formData.contactPerson);
            apiData.append('MobileNo', formData.mobileNo);
            apiData.append('Email', formData.email);
            apiData.append('Website', formData.website);
            apiData.append('ShortDescription', formData.shortDescription);
            apiData.append('LongDescription', formData.description);
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
                checkInTime: formData.checkInTime, // New
                checkOutTime: formData.checkOutTime, // New
                idProofs: formData.idProofs, // New
                mealPlans: formData.mealPlans, // New
                foodOptions: formData.foodOptions,
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
                }
            };
            apiData.append('onboarding_data', JSON.stringify(onboardingData));
            apiData.append('video_url', formData.videoUrl);

            // Fix Image Upload: Use 'images[]' for array handling in PHP
            // Reorder images: Primary first
            const sortedImages = [...formData.images];
            if (primaryImageIdx > 0 && primaryImageIdx < sortedImages.length) {
                const primary = sortedImages[primaryImageIdx];
                sortedImages.splice(primaryImageIdx, 1);
                sortedImages.unshift(primary);
            }
            sortedImages.forEach((file) => apiData.append('images[]', file));

            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            await axios.post(`${baseURL}/vendor/properties`, apiData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            await showSuccess('Success', 'Property Created Successfully!');
            navigate('/properties');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to create property";
            showError('Submission Failed', msg);
        } finally {
            setLoading(false);
        }
    };



    // --- STEPS ---
    const renderStep0 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, propertyType: 'Villa' })}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.propertyType === 'Villa' ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-105 ring-2 ring-purple-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <FaHome size={32} />
                    <span className="font-bold text-lg">Villa / Resort</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, propertyType: 'Waterpark' })}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${formData.propertyType === 'Waterpark' ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105 ring-2 ring-blue-200' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                    <FaWater size={32} />
                    <span className="font-bold text-lg">Waterpark</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Royal Palms" />
                <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} placeholder="Ex: Royal Palms" />
                <InputField label="City" name="cityName" value={formData.cityName} onChange={handleInputChange} placeholder="Ex: Lonavala" />
                <InputField label="Nearest Station" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Lonavala Station" />
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
                <InputField label="Mobile Number" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} />
                <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" />
                <InputField label="Website URL" name="website" value={formData.website} onChange={handleInputChange} />
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
                    {AMENITY_TYPES.filter(item => {
                        if (formData.propertyType === 'Waterpark') {
                            // Expanded list for Waterpark
                            return ['big_pools', 'small_pools', 'big_slides', 'small_slides', 'wavepool', 'rain_dance', 'lazy_river', 'crazy_river', 'kids_area', 'waterfall', 'ice_bucket', 'parking', 'selfie_point', 'dj_system', 'garden', 'dining', 'laundry', 'cctv', 'wheelchair', 'first_aid', 'security', 'restaurant', 'game_room'].includes(item.key);
                        }
                        // Hide Waterpark specific items for Villas if needed, or keep them if they might have a pool
                        return !['big_slides', 'small_slides', 'wavepool', 'lazy_river', 'crazy_river', 'waterfall', 'ice_bucket'].includes(item.key);
                    }).map(item => (
                        <div key={item.key} className={`bg-white border rounded-xl p-4 flex items-center justify-between transition-all ${formData.amenities[item.key] ? 'border-primary ring-1 ring-primary shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${formData.amenities[item.key] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                    {getAmenityIcon(item.key)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm leading-tight">{item.label}</p>
                                    {item.subtitle && <p className="text-[10px] text-gray-400">{item.subtitle}</p>}
                                </div>
                            </div>
                            {item.type === 'number' ? <Counter value={formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'number', val)} /> : <Toggle active={!!formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'bool', val)} />}
                        </div>
                    ))}
                </div>

                {/* Other Attraction Input */}
                <div className="mt-6">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Add Other Attraction (Optional)</label>
                    <input
                        type="text"
                        value={formData.otherAttractions}
                        onChange={(e) => setFormData(prev => ({ ...prev, otherAttractions: e.target.value }))}
                        placeholder="Enter any other attractions not listed above..."
                        className="w-full p-4 rounded-xl border border-gray-200 focus:border-black outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 italic">* Extra charges may apply and vary depending on property policy.</p>
                </div>
            </div>
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

        const updateLiving = (field, value) => {
            setFormData(prev => ({
                ...prev,
                roomConfig: { ...prev.roomConfig, livingRoom: { ...prev.roomConfig.livingRoom, [field]: value } }
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
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-amber-900"><FaCouch /> Living Room</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Bed Type</label>
                            <select className="w-full p-2 rounded border" value={formData.roomConfig.livingRoom.bedType} onChange={(e) => updateLiving('bedType', e.target.value)}>
                                <option value="Sofa">Sofa</option>
                                <option value="Sofa cum Bed">Sofa cum Bed</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                            <span className="font-bold text-sm">AC</span>
                            <Toggle active={formData.roomConfig.livingRoom.ac} onChange={(v) => updateLiving('ac', v)} />
                        </div>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                            <span className="font-bold text-sm">Bathroom</span>
                            <Toggle active={formData.roomConfig.livingRoom.bathroom} onChange={(v) => updateLiving('bathroom', v)} />
                        </div>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                            <span className="font-bold text-sm">Balcony</span>
                            <Toggle active={formData.roomConfig.livingRoom.balcony} onChange={(v) => updateLiving('balcony', v)} />
                        </div>
                        {formData.roomConfig.livingRoom.bathroom && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Toilet Style</label>
                                <select className="w-full p-2 rounded border" value={formData.roomConfig.livingRoom.toiletType} onChange={(e) => updateLiving('toiletType', e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="Western">Western (English)</option>
                                    <option value="Indian">Indian</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold flex items-center gap-2"><FaBed /> Bedrooms ({formData.noofRooms || 0})</h3>
                    </div>

                    {formData.roomConfig.bedrooms.map((room, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative">
                            <div className="absolute top-4 left-4 bg-gray-900 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">{idx + 1}</div>
                            <div className="ml-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bed Type</label>
                                    <select className="w-full p-2 rounded border text-sm" value={room.bedType} onChange={(e) => updateRoom(idx, 'bedType', e.target.value)}>
                                        <option value="King">King Size</option>
                                        <option value="Queen">Queen Size</option>
                                        <option value="Double">Double Bed</option>
                                        <option value="Single">Single Bed</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="font-bold text-sm">AC</span>
                                        <Toggle active={room.ac} onChange={(v) => updateRoom(idx, 'ac', v)} />
                                    </label>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="font-bold text-sm">Private Bathroom</span>
                                        <Toggle active={room.bathroom} onChange={(v) => updateRoom(idx, 'bathroom', v)} />
                                    </label>
                                    {room.bathroom && (
                                        <select className="mt-2 w-full p-1 text-xs rounded border" value={room.toiletType} onChange={(e) => updateRoom(idx, 'toiletType', e.target.value)}>
                                            <option value="Western">Western</option>
                                            <option value="Indian">Indian</option>
                                        </select>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="font-bold text-sm">Balcony</span>
                                        <Toggle active={room.balcony} onChange={(v) => updateRoom(idx, 'balcony', v)} />
                                    </label>
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
                            <InputField label="Standard Occupancy (Base)" name="occupancy" value={formData.occupancy} onChange={handleInputChange} placeholder="Ex: 10" type="number" className="bg-white" />
                            <InputField label="Max Capacity (Total)" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} placeholder="Ex: 20" type="number" className="bg-white" />
                        </div>
                    </div>

                    <div className="border border-orange-100 p-6 rounded-2xl bg-orange-50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-orange-800">
                            <FaMoneyBillWave /> Base Pricing (Whole Villa/Unit)
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
                                <InputField label="Mon-Fri Rate" name="priceMonThu" value={formData.waterparkPrices?.adult?.week || ''}
                                    onChange={(e) => handleNestedChange('waterparkPrices', 'adult', { ...formData.waterparkPrices.adult, week: e.target.value })} placeholder="₹ 1000" className="bg-white" />
                                <InputField label="Sat-Sun Rate" name="priceFriSun" value={formData.waterparkPrices?.adult?.weekend || ''}
                                    onChange={(e) => handleNestedChange('waterparkPrices', 'adult', { ...formData.waterparkPrices.adult, weekend: e.target.value })} placeholder="₹ 1200" className="bg-white" />
                            </div>
                            <div className="space-y-3">
                                <h5 className="font-bold text-sm">Child Tickets</h5>
                                <InputField label="Mon-Fri Rate" name="childPriceMonFri" value={formData.childCriteria?.monFriPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'monFriPrice', e.target.value)} placeholder="₹ 800" className="bg-white" />
                                <InputField label="Sat-Sun Rate" name="childPriceSatSun" value={formData.childCriteria?.satSunPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'satSunPrice', e.target.value)} placeholder="₹ 1000" className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* Child Criteria & Policy */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChild /> Child Criteria & Policy</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Free Tier */}
                            <div>
                                <h5 className="text-xs font-bold text-green-600 uppercase mb-3">FREE TIER (Below)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs block text-gray-400">Height (FT)</label>
                                        <input type="number" min="0" onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()} value={formData.childCriteria?.freeHeight || ''} onChange={(e) => handleNestedChange('childCriteria', 'freeHeight', e.target.value)} className="w-full font-bold border-b border-gray-200 outline-none py-1" placeholder="3.0" />
                                    </div>
                                    <div>
                                        <label className="text-xs block text-gray-400">Age (Yrs)</label>
                                        <input type="number" min="0" onKeyDown={(e) => ["-", "e", "E"].includes(e.key) && e.preventDefault()} value={formData.childCriteria?.freeAge || ''} onChange={(e) => handleNestedChange('childCriteria', 'freeAge', e.target.value)} className="w-full font-bold border-b border-gray-200 outline-none py-1" placeholder="5" />
                                    </div>
                                </div>
                            </div>

                            {/* Charge Tier */}
                            <div>
                                <h5 className="text-xs font-bold text-blue-600 uppercase mb-3">CHILD RATE APPLIES (Range)</h5>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs block text-gray-400 mb-1">Height (FT)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" className="w-16 border rounded p-1 text-sm" placeholder="From" value={formData.childCriteria?.heightFrom || ''} onChange={(e) => handleNestedChange('childCriteria', 'heightFrom', e.target.value)} />
                                            <span className="text-gray-400">-</span>
                                            <input type="number" className="w-16 border rounded p-1 text-sm" placeholder="To" value={formData.childCriteria?.heightTo || ''} onChange={(e) => handleNestedChange('childCriteria', 'heightTo', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs block text-gray-400 mb-1">Age (Yrs)</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" className="w-16 border rounded p-1 text-sm" placeholder="From" value={formData.childCriteria?.ageFrom || ''} onChange={(e) => handleNestedChange('childCriteria', 'ageFrom', e.target.value)} />
                                            <span className="text-gray-400">-</span>
                                            <input type="number" className="w-16 border rounded p-1 text-sm" placeholder="To" value={formData.childCriteria?.ageTo || ''} onChange={(e) => handleNestedChange('childCriteria', 'ageTo', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border p-6 rounded-2xl">
                        <h4 className="font-bold mb-4">Ticket Inclusions (Food)</h4>
                        <div className="space-y-4">
                            {['Breakfast', 'Lunch', 'HiTea'].map(meal => (
                                <div key={meal} className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-gray-50 p-2 rounded">
                                    <span className="font-medium text-gray-700">{meal}</span>
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
            )}

            {/* Payment Methods - Moved to Bottom */}
            <div className="border border-gray-200 p-6 rounded-2xl bg-white mt-8">
                <h4 className="font-bold mb-4 flex items-center gap-2"><FaMoneyBillWave /> Accepted Payment Methods</h4>
                <div className="flex gap-4 flex-wrap">
                    {['Cash', 'UPI', 'Debit', 'Credit'].map(method => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => handleNestedChange('paymentMethods', method.toLowerCase(), !formData.paymentMethods?.[method.toLowerCase()])}
                            className={`px-6 py-3 rounded-lg font-bold border-2 transition-all ${formData.paymentMethods?.[method.toLowerCase()] ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            {formData.paymentMethods?.[method.toLowerCase()] && <FaCheck className="inline mr-2" />}
                            {method}
                        </button>
                    ))}
                </div>
            </div>

            {/* What's Included? - HIDDEN for Villa per user request, only for Waterpark?
                User said "Its not applicable in villa. please remove."
                I will only show it for Waterpark then.
            */}
            {formData.propertyType === 'Waterpark' && (
                <div className="mt-8">
                    <h4 className="font-bold mb-4">What's Included? (Facilities)</h4>
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
            )}
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <InputField
                    label="Property Video URL (YouTube)"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                />
                {formData.videoUrl && !/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/.test(formData.videoUrl) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid YouTube URL (including Shorts).</p>
                )}
            </div>

            <div>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    style={{ display: 'none' }} // Double insurance
                />

                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    className="border-3 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group"
                >
                    <div className="flex flex-col items-center gap-4 transition-transform group-hover:scale-110 duration-300">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-2">
                            <FaCamera />
                        </div>
                        <div>
                            <p className="font-bold text-xl text-gray-800">Drop photos here</p>
                            <p className="text-gray-400">or click to browse</p>
                        </div>
                    </div>
                </div>
            </div>

            {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {formData.images.map((file, idx) => (
                        <div key={idx} className={`relative group rounded-xl overflow-hidden aspect-square shadow-md ${idx === primaryImageIdx ? 'ring-2 ring-yellow-400' : ''}`}>
                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    title="Set as Main Photo"
                                    onClick={() => setPrimaryImageIdx(idx)}
                                    className={`p-2 rounded-full shadow-lg transition-all ${idx === primaryImageIdx ? 'bg-yellow-400 text-white' : 'bg-white text-gray-400 hover:text-yellow-400'}`}
                                >
                                    <FaStar />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleDeleteImage(idx);
                                        if (idx === primaryImageIdx) setPrimaryImageIdx(0); // Reset if deleting primary
                                        if (idx < primaryImageIdx) setPrimaryImageIdx(prev => prev - 1); // Adjust index
                                    }}
                                    className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition shadow-lg"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            {idx === primaryImageIdx && (
                                <div className="absolute top-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    MAIN
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}    </div>
    );
    // --- VALIDATION AND NAVIGATION ---
    const validateStep = (step) => {
        // Step 0: Basic Info
        if (step === 0) {
            if (!formData.name) return { valid: false, msg: 'Property Name is required.' };
            if (!formData.propertyType) return { valid: false, msg: 'Property Type is required.' };
            if (!formData.location) return { valid: false, msg: 'Location (Nearest Station) is required.' };
            if (!formData.cityName) return { valid: false, msg: 'City Name is required.' };
            if (!formData.address) return { valid: false, msg: 'Full Address is required.' };
            if (!formData.mobileNo) return { valid: false, msg: 'Mobile Number is required.' };
            if (!/^\d{10}$/.test(formData.mobileNo)) return { valid: false, msg: 'Invalid Mobile Number (10 digits required).' };
        }

        // Step 1: Amenities (Optional, but good to have one)
        // if (step === 1) { ... }

        // Step 2 (Villa: Rooms / Waterpark: Rules) & Step 3 (Villa: Rules / Waterpark: Prices)
        // This mapping depends on Property Type. Let's trace the 'next' step logic.
        // If Villa: Step 2 is RoomConfig. Step 3 is Rules. Step 4 is Pricing. Step 5 is Images.
        // If Waterpark: Step 2 is Rules. Step 3 is Pricing. Step 4 is Images.

        const isVilla = formData.propertyType === 'Villa';

        // Villa Room Config Check (Step 2)
        if (isVilla && step === 2) {
            const rooms = parseInt(formData.noofRooms || 0);
            if (rooms < 1) return { valid: false, msg: 'Please enter number of rooms.' };
        }

        // Pricing Check (Villa: Step 4 / Waterpark: Step 3)
        const pricingStep = isVilla ? 4 : 3;
        if (step === pricingStep) {
            if (isVilla) {
                if (!formData.priceMonThu) return { valid: false, msg: 'Mon-Thu Price is required.' };
                if (!formData.priceFriSun) return { valid: false, msg: 'Fri-Sun Price is required.' };
                if (!formData.priceSaturday) return { valid: false, msg: 'Saturday Price is required.' };
            } else {
                // Waterpark logic if needed
            }
        }

        // Final Image Check handled before Submit usually, but if there is a 'Next' from images?
        // NO, the last step is Submit. We validate images in handleSubmit.
        // Wait, renderNavigation checks "if currentStep < MAX - 1".
        // If we are at Image Step (Max-1), the button is "Publish".
        // Implementation for "Publish" calls handleSubmit, which validates images.

        return { valid: true };
    };

    const handleNext = () => {
        const { valid, msg } = validateStep(currentStep);
        if (!valid) {
            showError('Missing Details', msg);
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
                    disabled={loading}
                    className="flex items-center gap-2 bg-[#FF385C] text-white px-5 py-2 md:px-8 md:py-2.5 rounded-xl font-bold text-sm md:text-base hover:bg-[#D90B3E] transition shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 disabled:opacity-70"
                >
                    {loading ? 'Publishing...' : 'Publish'} <FaSave />
                </button>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-24 pt-4 px-2 md:pb-12 md:pt-8 md:px-4">
            {/* Header */}
            <div className="text-center mb-4 md:mb-8">
                <h1 className="text-xl md:text-3xl font-extrabold mb-1 tracking-tight text-gray-900">Create Listing</h1>
                <p className="text-gray-500 font-medium text-xs md:text-sm">Step {currentStep + 1}: {formData.propertyType === 'Villa' ? STEPS_VILLA[currentStep] : STEPS_WATERPARK[currentStep]}</p>
                <div className="flex justify-center mt-2 gap-1.5">
                    {(formData.propertyType === 'Villa' ? STEPS_VILLA : STEPS_WATERPARK).map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'w-5 md:w-8 bg-black' : 'w-1.5 bg-gray-200'}`} />
                    ))}
                </div>
            </div>


            {/* Top Navigation - Desktop Only */}
            <div className="hidden md:block mb-4">
                {renderNavigation(true)}
            </div>

            {/* Form Container */}
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

            {/* Footer Navigation */}
            {renderNavigation(false)}

            <style>{`
            @keyframes fade-in-up {
                from {opacity: 0; transform: translateY(20px); }
                to {opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.5s ease-out forwards;
            }
            `}</style>
        </div>
    );
}
