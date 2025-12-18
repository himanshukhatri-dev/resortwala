import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaUtensils,
    FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave,
    FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake
} from 'react-icons/fa';
import { MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdMusicNote } from 'react-icons/md';
import Loader from '../components/Loader';
import { useModal } from '../context/ModalContext';

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
        default: return <FaCheck />;
    }
};

const AMENITY_TYPES = [
    { key: 'big_pools', label: 'Big Pools', type: 'number', subtitle: 'Large swimming pools' },
    { key: 'small_pools', label: 'Small Pools', type: 'number', subtitle: 'Kids/Small pools' },
    { key: 'big_slides', label: 'Big Slides', type: 'number', subtitle: 'Water & Tube slides' },
    { key: 'small_slides', label: 'Small Slides', type: 'number', subtitle: 'Smaller slides' },
    { key: 'wavepool', label: 'Wavepool', type: 'bool' },
    { key: 'rain_dance', label: 'Rain Dance', type: 'bool' },
    { key: 'dj_system', label: 'DJ System', type: 'bool' },
    { key: 'waterfall', label: 'Waterfall', type: 'bool' },
    { key: 'ice_bucket', label: 'Ice Bucket', type: 'bool' },
    { key: 'lazy_river', label: 'Lazy River', type: 'bool' },
    { key: 'crazy_river', label: 'Crazy River', type: 'bool' },
    { key: 'kids_area', label: 'Kids Area', type: 'bool' },
    { key: 'parking', label: 'Parking', type: 'bool' },
    { key: 'selfie_point', label: 'Selfie Point', type: 'bool' },
    { key: 'garden', label: 'Garden', type: 'bool' },
];

const PROPERTY_RULES = [
    "Primary guest must be 18+",
    "Valid ID proof required",
    "Pets allowed",
    "Outside food allowed",
    "Extra charges may apply",
    "Deposit required at check-in",
    "Special requests subject to availability",
    "Safety features available",
    "No show no refund",
    "Offers cannot be combined",
    "Smoking allowed",
    "Alcohol allowed"
];

const INCLUSIONS = [
    "Waterpark Entry", "All Slides & Pool", "Breakfast",
    "Lunch", "Hi-Tea", "Parking",
    "Private Room", "Locker", "Pickup/Drop"
];

const STEPS = ["Basic Info", "Amenities", "Rules", "Pricing", "Images"];

// REUSABLE COMPONENTS (Defined outside to prevent re-renders)
const InputField = ({ label, name, value, onChange, type = "text", placeholder, className, error }) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-gray-800 font-medium outline-none transition-all ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black'}`}
            placeholder={placeholder}
        />
        {error && <p className="text-xs text-red-500 font-bold mt-1">{error}</p>}
    </div>
);

const Counter = ({ value = 0, onChange }) => (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
        <button type="button" onClick={() => onChange(Math.max(0, parseInt(value || 0) - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black font-bold disabled:opacity-50" disabled={value <= 0}>-</button>
        <span className="w-6 text-center font-bold text-lg">{value || 0}</span>
        <button type="button" onClick={() => onChange(parseInt(value || 0) + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-black font-bold">+</button>
    </div>
);

const Toggle = ({ active, onChange }) => (
    <button type="button" onClick={() => onChange(!active)} className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${active ? 'bg-green-500' : 'bg-gray-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

// STEPS COMPONENTS (Defined outside for stability)
const Step0 = ({ formData, setFormData, handleInputChange, errors }) => (
    <div className="space-y-6 animate-fade-in-up">
        {/* Compact Property Type Selector */}
        <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-xl inline-flex">
                {['Villa', 'Waterpark'].map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, propertyType: type }))}
                        className={`px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${formData.propertyType === type
                            ? 'bg-white text-black shadow-md'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {type === 'Villa' ? <FaHome /> : <FaWater />}
                        {type === 'Villa' ? 'Villa / Resort' : 'Waterpark'}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Royal Palms" error={errors?.name} />
            <InputField label="Short Name" name="displayName" value={formData.displayName} onChange={handleInputChange} placeholder="Ex: Royal Palms" error={errors?.displayName} />
            <InputField label="City" name="cityName" value={formData.cityName} onChange={handleInputChange} placeholder="Ex: Lonavala" error={errors?.cityName} />
            <InputField label="Nearest Station" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Lonavala Station" error={errors?.location} />
        </div>
        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Address</label>
            <textarea name="address" value={formData.address || ''} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} className={`w-full bg-gray-50 border rounded-lg px-4 py-3 text-gray-800 font-medium outline-none transition-all h-24 resize-none ${errors?.address ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:bg-white focus:border-black'}`} placeholder="Enter complete address..." />
            {errors?.address && <p className="text-xs text-red-500 font-bold mt-1">{errors.address}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} error={errors?.contactPerson} />
            <InputField label="Mobile Number" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} error={errors?.mobileNo} />
            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleInputChange} error={errors?.email} />
            <InputField label="Website URL" name="website" value={formData.website} onChange={handleInputChange} />
        </div>
        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 font-medium focus:bg-white focus:border-black outline-none transition-all h-32 resize-none" placeholder="Tell guests what makes your place special..." />
        </div>
    </div>
);

const Step1 = ({ formData, handleAmenityChange, handleNestedChange }) => (
    <div className="space-y-8 animate-fade-in-up">
        <div>
            <h3 className="text-xl font-bold mb-4">Features & Amenities</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AMENITY_TYPES.map(item => (
                    <div key={item.key} className={`bg-white border rounded-xl p-4 flex items-center justify-between transition-all ${formData.amenities[item.key] ? 'border-primary ring-1 ring-primary shadow-md' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${formData.amenities[item.key] ? 'bg-primary/10' : 'bg-gray-100'}`}>{getAmenityIcon(item.key)}</div>
                            <div><p className="font-bold text-sm leading-tight">{item.label}</p>{item.subtitle && <p className="text-[10px] text-gray-400">{item.subtitle}</p>}</div>
                        </div>
                        {item.type === 'number' ? <Counter value={formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'number', val)} /> : <Toggle active={!!formData.amenities[item.key]} onChange={(val) => handleAmenityChange(item.key, 'bool', val)} />}
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-xl font-bold mb-4">Payment Methods Accepted</h3>
            <div className="flex gap-4 flex-wrap">
                {['Cash', 'UPI', 'Debit', 'Credit'].map(method => (
                    <button key={method} type="button" onClick={() => handleNestedChange('paymentMethods', method.toLowerCase(), !formData.paymentMethods[method.toLowerCase()])} className={`px-6 py-3 rounded-lg font-bold border-2 transition-all ${formData.paymentMethods[method.toLowerCase()] ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{method}</button>
                ))}
            </div>
        </div>
    </div>
);

const Step2 = ({ formData, handleNestedChange }) => (
    <div className="space-y-6 animate-fade-in-up">
        <h3 className="text-xl font-bold">House Rules & Policies</h3>
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            {PROPERTY_RULES.map((rule, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <span className="font-medium text-gray-700">{rule}</span>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${formData.rules[idx] ? 'text-green-600' : 'text-gray-400'}`}>{formData.rules[idx] ? 'ALLOWED' : 'OFF'}</span>
                        <Toggle active={!!formData.rules[idx]} onChange={(val) => handleNestedChange('rules', idx, val)} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Step3 = ({ formData, handleInputChange, handleNestedChange, errors }) => (
    <div className="space-y-8 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><FaMoneyBillWave /> Adult Pricing</h4>
                <div className="space-y-4">
                    <InputField label="Mon - Fri (Capacity)" name="priceMonFri" value={formData.priceMonFri} onChange={handleInputChange} placeholder="₹ Price per night" className="bg-white" error={errors?.priceMonFri} />
                    <InputField label="Sat - Sun (Weekend)" name="priceSatSun" value={formData.priceSatSun} onChange={handleInputChange} placeholder="₹ Price per night" className="bg-white" error={errors?.priceSatSun} />
                </div>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><FaChild /> Child Pricing</h4>
                <div className="space-y-4">
                    <InputField label="Child (Mon-Fri)" name="childPriceMonFri" value={formData.childPriceMonFri} onChange={handleInputChange} placeholder="₹ Price" className="bg-white" error={errors?.childPriceMonFri} />
                    <InputField label="Child (Sat-Sun)" name="childPriceSatSun" value={formData.childPriceSatSun} onChange={handleInputChange} placeholder="₹ Price" className="bg-white" error={errors?.childPriceSatSun} />
                </div>
            </div>
        </div>
        <div>
            <h4 className="font-bold mb-4">What's Included?</h4>
            <div className="flex flex-wrap gap-3">
                {INCLUSIONS.map(inc => (
                    <button key={inc} type="button" onClick={() => handleNestedChange('inclusions', inc, !formData.inclusions[inc])} className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${formData.inclusions[inc] ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{formData.inclusions[inc] && <FaCheck className="inline mr-2 text-xs" />}{inc}</button>
                ))}
            </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl">
            <h4 className="font-bold mb-4 flex items-center gap-2"><FaUtensils /> Meal Plans</h4>
            <div className="space-y-3">
                {Object.keys(formData.foodOptions).map(meal => (
                    <div key={meal} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <span className="capitalize font-bold text-gray-700 w-32">{meal.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <select value={formData.foodOptions[meal]} onChange={(e) => handleNestedChange('foodOptions', meal, e.target.value)} className="bg-transparent font-medium text-right outline-none cursor-pointer">
                            <option value="Not Included">Not Included</option>
                            <option value="Veg">Veg Included</option>
                            <option value="Non Veg">Non Veg Included</option>
                            <option value="Veg & Non Veg">Veg & Non Veg</option>
                            {meal === 'hiTea' && <option value="Tea/Coffee">Tea/Coffee Only</option>}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const Step4 = ({ formData, handleInputChange, handleImageUpload, existingImages, setExistingImages, setFormData }) => (
    <div className="space-y-6 animate-fade-in-up">
        <InputField label="Property Video URL (YouTube)" name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} placeholder="https://..." />

        {existingImages.length > 0 && (
            <div className="mb-6">
                <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">Existing Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((img, idx) => (
                        <div key={img.id || idx} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200 shadow-sm">
                            <img src={img.image_url || img.image_path} className="w-full h-full object-cover" alt="Property" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        <h3 className="font-bold mb-3 text-sm uppercase text-gray-500">Add New Photos</h3>
        <div className="border-3 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="flex flex-col items-center gap-4 transition-transform group-hover:scale-110 duration-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-2"><FaCamera /></div>
                <div><p className="font-bold text-xl text-gray-800">Drop photos here</p><p className="text-gray-400">or click to browse</p></div>
            </div>
        </div>

        {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.images.map((file, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square shadow-md">
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition"><FaTimes /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default function EditProperty() {
    const { id } = useParams();
    const { token } = useAuth();
    const { showSuccess } = useModal();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '', displayName: '', propertyType: 'Villa',
        location: '', cityName: '', address: '',
        contactPerson: '', mobileNo: '', email: '', website: '',
        description: '', shortDescription: '',
        amenities: {}, rules: {}, paymentMethods: { cash: false, upi: false, debit: false, credit: false },
        childCriteria: { freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5 },
        inclusions: {},
        priceMonFri: '', priceSatSun: '', childPriceMonFri: '', childPriceSatSun: '',
        foodOptions: { breakfast: 'Not Included', lunch: 'Not Included', hiTea: 'Not Included' },
        videoUrl: '', images: []
    });

    const [existingImages, setExistingImages] = useState([]);

    const completion = React.useMemo(() => {
        let filled = 0;
        let total = 10;
        if (formData.name) filled++;
        if (formData.location) filled++;
        if (formData.address) filled++;
        if (formData.contactPerson) filled++;
        if (formData.mobileNo) filled++;
        if (formData.priceMonFri) filled++;
        if (Object.values(formData.amenities).some(v => v)) filled++;
        if (Object.values(formData.rules).some(v => v)) filled++;
        if (formData.images.length > 0 || existingImages.length > 0) filled++;
        if (formData.videoUrl) filled++;
        return Math.min(100, Math.round((filled / total) * 100));
    }, [formData, existingImages]);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                const res = await axios.get(`${baseURL}/api/vendor/properties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const p = res.data;
                const ob = p.onboarding_data || {};

                setFormData({
                    name: p.Name,
                    displayName: p.ShortName,
                    propertyType: p.PropertyType || 'Villa',
                    location: p.Location,
                    cityName: p.CityName,
                    address: p.Address,
                    contactPerson: p.ContactPerson,
                    mobileNo: p.MobileNo,
                    email: p.Email,
                    website: p.Website,
                    description: p.LongDescription,
                    shortDescription: p.ShortDescription,
                    priceMonFri: p.price_mon_thu,
                    priceSatSun: p.price_fri_sun || p.price_sat,
                    amenities: ob.amenities || {},
                    rules: ob.rules || {},
                    paymentMethods: ob.paymentMethods || {},
                    childCriteria: ob.childCriteria || { freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5 },
                    inclusions: ob.inclusions || {},
                    childPriceMonFri: ob.childPricing?.monFri || '',
                    childPriceSatSun: ob.childPricing?.satSun || '',
                    foodOptions: ob.foodOptions || { breakfast: 'Not Included', lunch: 'Not Included', hiTea: 'Not Included' },
                    videoUrl: p.video_url || '',
                    images: []
                });
                setExistingImages(p.images || []);
                setLoading(false);
            } catch (err) {
                console.error("Property Load Error:", err.response || err);
                setError(`Failed to load property data: ${err.response?.data?.message || err.message}`);
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id, token]);

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNestedChange = (section, key, value) => {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    };

    const handleAmenityChange = (key, type, value) => {
        setFormData(prev => ({ ...prev, amenities: { ...prev.amenities, [key]: value } }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const validateStep = (step) => {
        const newErrors = {};
        if (step === 0) { // Basic Info
            if (!formData.name) newErrors.name = "Property Name is required";
            if (!formData.location) newErrors.location = "Location is required";
            if (!formData.cityName) newErrors.cityName = "City is required";
            if (!formData.address) newErrors.address = "Address is required";
            if (!formData.mobileNo) newErrors.mobileNo = "Mobile Number is required";
            else if (!/^\d{10}$/.test(formData.mobileNo.replace(/\D/g, ''))) newErrors.mobileNo = "Invalid Mobile Number";
        }
        if (step === 3) { // Pricing
            if (!formData.priceMonFri) newErrors.priceMonFri = "Price required";
            else if (isNaN(formData.priceMonFri)) newErrors.priceMonFri = "The price field must be a number.";

            if (!formData.priceSatSun) newErrors.priceSatSun = "Price required";
            else if (isNaN(formData.priceSatSun)) newErrors.priceSatSun = "The price field must be a number.";

            if (formData.childPriceMonFri && isNaN(formData.childPriceMonFri)) newErrors.childPriceMonFri = "Must be a number";
            if (formData.childPriceSatSun && isNaN(formData.childPriceSatSun)) newErrors.childPriceSatSun = "Must be a number";
        }

        return newErrors;
    };

    const handleNext = () => {
        const stepErrors = validateStep(currentStep);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            const firstErrorKey = Object.keys(stepErrors)[0];
            setTimeout(() => {
                const element = document.getElementsByName(firstErrorKey)[0];
                if (element) {
                    element.focus();
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        setErrors({});
        setCurrentStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        try {
            const apiData = new FormData();
            // Mapping existing fields
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
            apiData.append('LongDescription', formData.description);

            apiData.append('Price', formData.priceMonFri);
            apiData.append('price_mon_thu', formData.priceMonFri);
            apiData.append('price_fri_sun', formData.priceSatSun);
            apiData.append('price_sat', formData.priceSatSun);

            const onboardingData = {
                amenities: formData.amenities,
                rules: formData.rules,
                paymentMethods: formData.paymentMethods,
                childCriteria: formData.childCriteria,
                inclusions: formData.inclusions,
                childPricing: { monFri: formData.childPriceMonFri, satSun: formData.childPriceSatSun },
                foodOptions: formData.foodOptions
            };

            apiData.append('onboarding_data', JSON.stringify(onboardingData));
            apiData.append('video_url', formData.videoUrl);
            apiData.append('_method', 'PUT'); // Needed for Laravel Update

            formData.images.forEach((file, index) => {
                apiData.append(`images[${index}]`, file);
            });

            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            await axios.post(`${baseURL}/api/vendor/properties/${id}`, apiData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            showSuccess('Property Updated', 'Your property details have been successfully updated.');
            navigate('/properties');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update property");
        } finally {
            setSaving(false);
        }
    };



    if (loading) return <Loader />;

    return (
        <div className="max-w-4xl mx-auto pb-32 pt-10 px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 z-0" />

                <div className="relative z-10 text-left">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Edit Asset</h1>
                    <p className="text-gray-500 font-medium text-lg">Step {currentStep + 1}: <span className="text-black font-bold">{STEPS[currentStep]}</span></p>
                    <div className="flex mt-6 gap-2">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? 'w-8 bg-black' : 'w-2 bg-gray-200'}`} />
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completion</p>
                        <p className={`font-bold ${completion === 100 ? 'text-green-500' : 'text-gray-900'}`}>{completion === 100 ? 'Ready to Publish' : 'In Progress'}</p>
                    </div>
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="#f3f4f6" strokeWidth="8" fill="transparent" />
                            <circle cx="40" cy="40" r="36" stroke={completion === 100 ? "#22c55e" : "#000"} strokeWidth="8" fill="transparent" strokeDasharray={`${(completion * 226) / 100} 226`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">{completion}%</div>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium text-center">{error}</div>}

            <div className="bg-white mb-8 min-h-[500px]">
                {currentStep === 0 && <Step0 formData={formData} setFormData={setFormData} handleInputChange={handleInputChange} errors={errors} />}
                {currentStep === 1 && <Step1 formData={formData} handleAmenityChange={handleAmenityChange} handleNestedChange={handleNestedChange} />}
                {currentStep === 2 && <Step2 formData={formData} handleNestedChange={handleNestedChange} />}
                {currentStep === 3 && <Step3 formData={formData} handleInputChange={handleInputChange} handleNestedChange={handleNestedChange} errors={errors} />}
                {currentStep === 4 && <Step4 formData={formData} handleInputChange={handleInputChange} handleImageUpload={handleImageUpload} existingImages={existingImages} setExistingImages={setExistingImages} setFormData={setFormData} />}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 p-6 flex justify-between items-center z-50 md:static md:bg-transparent md:border-0 md:p-0">
                <button onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition disabled:opacity-30 disabled:hover:bg-transparent">
                    <FaArrowLeft /> Back
                </button>

                {currentStep < STEPS.length - 1 ? (
                    <button onClick={handleNext} className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-xl hover:shadow-2xl hover:-translate-y-1">
                        Next Step <FaArrowRight />
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-[#FF385C] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#D90B3E] transition shadow-xl hover:shadow-red-200 hover:-translate-y-1 disabled:opacity-70">
                        {saving ? 'Updating...' : 'Update Property'} <FaSave />
                    </button>
                )}
            </div>

            <style>{`
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}
