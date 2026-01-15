import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import {
    FaUser, FaBuilding, FaMapMarkerAlt, FaTag, FaImage, FaArrowRight, FaArrowLeft, FaCheck,
    FaHome, FaWater, FaUtensils, FaGlassMartiniAlt, FaUserShield, FaSearch, FaTrash,
    FaBed, FaCouch, FaUsers, FaMoneyBillWave, FaChild, FaVideo, FaTimes, FaCamera, FaStar, FaTv, FaPlus
} from 'react-icons/fa';
import { STEPS_VILLA, STEPS_WATERPARK, AMENITY_TYPES, PROPERTY_TYPES } from '../constants/propertyConstants';
import Loader from '../components/Loader';

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

// Reuse Vendor Components
const InputField = ({ label, name, type = "text", placeholder, className, value, onChange, onBlur, required }) => (
    <div className={`space-y-1 group ${className}`}>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 group-focus-within:text-black transition-colors">
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value !== undefined ? value : ''}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:bg-white focus:border-black outline-none transition-all ${required && !value ? 'border-orange-100' : ''}`}
            placeholder={placeholder}
        />
    </div>
);

const Toggle = ({ active, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!active)}
        className={`w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${active ? 'bg-green-500' : ''}`}
    >
        <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${active ? 'translate-x-5' : ''}`} />
    </button>
);

const Counter = ({ value = 0, onChange }) => (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
        <button type="button" onClick={() => onChange(Math.max(0, parseInt(value || 0) - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold">-</button>
        <span className="w-6 text-center font-bold">{value || 0}</span>
        <button type="button" onClick={() => onChange(parseInt(value || 0) + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold">+</button>
    </div>
);

export default function AddProperty() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { showSuccess, showError, showConfirm } = useModal();
    const [step, setStep] = useState(0); // 0 = Vendor Selection, 1...N = Property Steps
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // --- STEP 0: VENDOR SELECTION ---
    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);

    const [pricing, setPricing] = useState(() => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const types = ['villa', 'extra_person', 'meal_person', 'jain_meal_person'];
        const initial = {};
        days.forEach(day => {
            initial[day] = {};
            types.forEach(type => {
                initial[day][type] = { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 };
            });
        });
        return initial;
    });

    const [deletedImages, setDeletedImages] = useState([]); // Track deletions if needed

    // --- PROPERTY FORM DATA ---
    const [formData, setFormData] = useState({
        name: '', displayName: '', propertyType: 'Villa',
        location: '', cityName: '', address: '',
        contactPerson: '', mobileNo: '', email: '', website: '',
        description: '', shortDescription: '',

        // Excel Fields
        maxCapacity: '', noofRooms: '', occupancy: '',

        amenities: {}, rules: {}, paymentMethods: { cash: false, upi: false, debit: false, credit: false },

        // Room Config
        roomConfig: {
            livingRooms: [{ bedType: 'Sofa', ac: false, tv: false, bathroom: false, toiletType: '', balcony: false }],
            bedrooms: []
        },

        childCriteria: { freeAge: 5, freeHeight: 3, chargeAgeFrom: 6, chargeAgeTo: 12, chargeHeightFrom: 3, chargeHeightTo: 5 },
        inclusions: {},

        // Pricing
        priceMonThu: '', priceFriSun: '', priceSaturday: '',
        foodRates: { veg: '', nonVeg: '', jain: '', perPerson: '' },

        extraGuestLimit: '15',
        extraGuestPriceMonThu: '', extraGuestPriceFriSun: '', extraGuestPriceSaturday: '',
        extraMattressCharge: '',

        ticketPrices: { adult: '', child: '', includesEntry: false, includesFood: false },
        foodOptions: { breakfast: 'Not Included', lunch: 'Not Included', hiTea: 'Not Included', dinner: 'Not Included' },

        videoUrl: '', images: [], videos: [],
        googleMapLink: '', latitude: '', longitude: '',

        idProofs: [], otherAttractions: [], otherRules: '', otherAmenities: [],
        checkInTime: '14:00', checkOutTime: '11:00'
    });

    useEffect(() => {
        if (step === 0) fetchVendors();
    }, [step]);

    // Sync Room Config with No of Rooms (Crucial for Villa)
    useEffect(() => {
        if (formData.propertyType !== 'Villa') return;
        const count = parseInt(formData.noofRooms || 0);

        setFormData(prev => {
            const current = prev.roomConfig?.bedrooms || [];
            if (current.length === count) return prev;

            const newRooms = [...current];
            if (count > current.length) {
                for (let i = current.length; i < count; i++) {
                    newRooms.push({
                        id: i + 1,
                        bedType: 'Queen',
                        ac: false,
                        tv: false,
                        geyser: false,
                        wardrobe: false,
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
    }, [formData.noofRooms, formData.propertyType]);

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/vendors`, { headers: { Authorization: `Bearer ${token}` } });
            setVendors(res.data);
        } catch (err) { console.error(err); } finally { setLoadingVendors(false); }
    };

    const handlePriceChange = (day, type, field, value) => {
        let num = parseFloat(value);
        if (isNaN(num)) num = 0;

        setPricing(prev => {
            const current = parseFloat(prev[day][type].current || 0);
            let newDiscounted = parseFloat(prev[day][type].discounted || 0);
            let newFinal = parseFloat(prev[day][type].final || 0);
            let newVendorDiscountPercentage = parseFloat(prev[day][type].vendorDiscountPercentage || 0);
            let newOurMarginPercentage = parseFloat(prev[day][type].ourMarginPercentage || 0);

            if (field === 'vendorDiscountPercentage') {
                newVendorDiscountPercentage = num;
                newDiscounted = current - (current * newVendorDiscountPercentage / 100);
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
            }
            else if (field === 'current') {
                const newCurrent = num;
                newDiscounted = newCurrent - (newCurrent * newVendorDiscountPercentage / 100);
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
                return { ...prev, [day]: { ...prev[day], [type]: { ...prev[day][type], current: newCurrent, discounted: newDiscounted, final: newFinal } } };
            }
            else if (field === 'ourMarginPercentage') {
                newOurMarginPercentage = num;
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
            }
            else if (field === 'discounted') {
                newDiscounted = num;
                if (current !== 0) newVendorDiscountPercentage = ((current - newDiscounted) / current * 100);
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
            }
            else if (field === 'final') {
                newFinal = num;
                if (newDiscounted !== 0) newOurMarginPercentage = ((newFinal - newDiscounted) / newDiscounted * 100);
            }

            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    [type]: {
                        ...prev[day][type],
                        discounted: newDiscounted,
                        final: newFinal,
                        vendorDiscountPercentage: newVendorDiscountPercentage,
                        ourMarginPercentage: newOurMarginPercentage
                    }
                }
            };
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // SYNC PRICING MATRIX
        if (['priceMonThu', 'priceFriSun', 'priceSaturday'].includes(name)) {
            const val = parseFloat(value) || 0;
            const days = name === 'priceMonThu' ? ['monday', 'tuesday', 'wednesday', 'thursday'] :
                name === 'priceFriSun' ? ['friday', 'sunday'] : ['saturday'];

            setPricing(prev => {
                const next = { ...prev };
                days.forEach(d => {
                    next[d] = {
                        ...next[d],
                        villa: {
                            ...next[d].villa,
                            current: val,
                            // Simplistic fallback: reset discounts or keep them? 
                            // Resetting is safer for new entry.
                            discounted: val,
                            final: val,
                            vendorDiscountPercentage: 0,
                            ourMarginPercentage: 0
                        }
                    };
                });
                return next;
            });
        }
    };

    const handleNestedChange = (section, key, value) => {
        setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    };

    const handleAmenityChange = (key, type, value) => {
        setFormData(prev => ({ ...prev, amenities: { ...prev.amenities, [key]: value } }));
    };

    const handleImageUpload = (e) => {
        if (e.target.files) setFormData(prev => ({ ...prev, images: [...prev.images, ...Array.from(e.target.files)] }));
    };

    const handleVideoUpload = (e) => {
        if (e.target.files) setFormData(prev => ({ ...prev, videos: [...prev.videos, ...Array.from(e.target.files)] }));
    };

    const handleDeleteVideo = (idx) => {
        setFormData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }));
    };

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

    const handleSubmit = async () => {
        if (!selectedVendor) return showError("Error", "Please select a vendor.");

        const { valid, msgs } = validateStep(step);
        if (!valid) {
            showError('Missing Details', (
                <ul className="list-disc ml-5 text-left space-y-1">
                    {msgs.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
            ));
            return;
        }

        setSaving(true);
        try {
            // Waterpark Price Sync
            if (formData.propertyType === 'Waterpark' && formData.priceMonThu) {
                // Keep the priceMonThu as proper value
            }

            const apiData = new FormData();
            apiData.append('vendor_id', selectedVendor.id);
            apiData.append('Name', formData.name);
            apiData.append('PropertyType', formData.propertyType);
            apiData.append('Price', formData.priceMonThu || 0);
            apiData.append('Location', formData.location);
            apiData.append('description', formData.description);

            // Sync legacy columns
            apiData.append('price_mon_thu', formData.priceMonThu);
            apiData.append('price_fri_sun', formData.priceFriSun);
            apiData.append('price_sat', formData.priceSaturday);
            apiData.append('MaxCapacity', formData.maxCapacity);
            apiData.append('NoofRooms', formData.noofRooms);
            apiData.append('Occupancy', formData.occupancy);
            apiData.append('CityName', formData.cityName);
            apiData.append('Address', formData.address);
            apiData.append('ContactPerson', formData.contactPerson);
            apiData.append('MobileNo', formData.mobileNo);
            apiData.append('Email', formData.email);
            apiData.append('Website', formData.website);
            apiData.append('ShortDescription', formData.shortDescription);

            const onboardingData = {
                amenities: formData.amenities,
                rules: formData.rules,
                otherRules: formData.otherRules,
                paymentMethods: formData.paymentMethods,
                childCriteria: formData.childCriteria,
                inclusions: formData.inclusions,
                foodOptions: formData.foodOptions,
                checkInTime: formData.checkInTime,
                checkOutTime: formData.checkOutTime,
                idProofs: formData.idProofs,
                roomConfig: formData.roomConfig,
                foodRates: formData.foodRates,
                ticketPrices: formData.ticketPrices,
                pricing: {
                    weekday: formData.priceMonThu,
                    weekend: formData.priceFriSun,
                    saturday: formData.priceSaturday,
                    extraGuestLimit: formData.extraGuestLimit,
                    extraGuestCharge: { week: formData.extraGuestPriceMonThu, weekend: formData.extraGuestPriceFriSun, saturday: formData.extraGuestPriceSaturday },
                    extraMattressCharge: formData.extraMattressCharge
                },
                googleMapLink: formData.googleMapLink,
                latitude: formData.latitude,
                longitude: formData.longitude,
                otherAttractions: formData.otherAttractions,
                otherAmenities: formData.otherAmenities || [], // New
                shortDescription: formData.shortDescription, // Ensure backup
                description: formData.description // Ensure backup
            };

            apiData.append('onboarding_data', JSON.stringify(onboardingData));
            apiData.append('video_url', formData.videoUrl);

            if (formData.images) formData.images.forEach(file => apiData.append('images[]', file));
            if (formData.videos) formData.videos.forEach(file => apiData.append('videos[]', file));

            // Append Admin Pricing
            apiData.append('admin_pricing', JSON.stringify(pricing));

            const res = await axios.post(`${API_BASE_URL}/admin/properties`, apiData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            showSuccess("Success", "Property Created! Redirecting to pricing review...");
            navigate(`/properties/${res.data.property.PropertyId}/approve`);

        } catch (error) {
            console.error(error);
            showError("Failed", error.response?.data?.message || "Failed to create property");
        } finally {
            setSaving(false);
        }
    };

    // --- HELPER LOGIC ---
    const handleMapLinkBlur = (e) => {
        const url = e.target.value;
        if (!url) return;

        const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        const searchRegex = /search\/(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
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

    const updateLiving = (idx, key, val) => {
        setFormData(prev => {
            const updated = [...(prev.roomConfig.livingRooms || [])];
            updated[idx] = { ...updated[idx], [key]: val };
            return {
                ...prev,
                roomConfig: { ...prev.roomConfig, livingRooms: updated }
            };
        });
    };

    const addLivingRoom = () => {
        setFormData(prev => ({
            ...prev,
            roomConfig: {
                ...prev.roomConfig,
                livingRooms: [...(prev.roomConfig.livingRooms || []), { bedType: 'Sofa', ac: false, tv: false, bathroom: false, toiletType: '', balcony: false }]
            }
        }));
    };

    const removeLivingRoom = (idx) => {
        setFormData(prev => ({
            ...prev,
            roomConfig: {
                ...prev.roomConfig,
                livingRooms: prev.roomConfig.livingRooms.filter((_, i) => i !== idx)
            }
        }));
    };

    const updateRoom = (idx, key, val) => {
        setFormData(prev => {
            const updated = [...prev.roomConfig.bedrooms];
            updated[idx] = { ...updated[idx], [key]: val };
            return {
                ...prev,
                roomConfig: { ...prev.roomConfig, bedrooms: updated }
            };
        });
    };

    const renderVendorSelection = () => {
        const filteredVendors = vendors.filter(v =>
            v.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.phone?.includes(searchTerm)
        );

        return (
            <div className="max-w-3xl mx-auto py-8 space-y-6 animate-fade-in-up">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Select Property Owner</h2>
                    <p className="text-gray-500">Choose the vendor/owner for this property</p>
                </div>

                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, business, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    />
                </div>

                {loadingVendors ? (
                    <div className="text-center py-12">
                        <Loader />
                        <p className="text-gray-500 mt-4">Loading vendors...</p>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <FaUser className="mx-auto text-4xl text-gray-300 mb-3" />
                        <p className="text-gray-500">No vendors found</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {filteredVendors.map((vendor) => (
                            <button
                                key={vendor.id}
                                onClick={() => {
                                    setSelectedVendor(vendor);
                                    setStep(1);
                                }}
                                className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-black hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 group-hover:text-black">
                                            {vendor.business_name || vendor.name}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            {vendor.phone && <span>📞 {vendor.phone}</span>}
                                            {vendor.email && <span>📧 {vendor.email}</span>}
                                        </div>
                                    </div>
                                    <FaArrowRight className="text-gray-400 group-hover:text-black transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FaBuilding className="text-blue-500" /> Property Type
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {PROPERTY_TYPES.map(type => (
                        <button key={type.value} type="button"
                            onClick={() => setFormData(p => ({ ...p, propertyType: type.value }))}
                            className={`p-4 rounded-xl border-2 font-bold text-center transition-all ${formData.propertyType === type.value
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300'}`}>
                            {type.value === 'Villa' ? <FaHome className="mx-auto text-2xl mb-1" /> : <FaWater className="mx-auto text-2xl mb-1" />}
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FaTag className="text-green-500" /> Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Sunset Villa" required />
                    <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} placeholder="Ex: Royal Sunset Villa & Resort" />
                    <InputField label="City/Location" name="location" value={formData.location} onChange={handleInputChange} placeholder="Ex: Ahmedabad" required />
                    <InputField label="City Name (Search)" name="cityName" value={formData.cityName} onChange={handleInputChange} placeholder="Ex: Ahmedabad" />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" /> Address & Location
                </h3>
                <div className="space-y-3">
                    <InputField label="Full Address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street address, landmark..." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <InputField label="Google Maps Link" name="googleMapLink" value={formData.googleMapLink} onChange={handleInputChange} onBlur={handleMapLinkBlur} placeholder="https://maps.google.com/..." />
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="Latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="23.0225" />
                            <InputField label="Longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="72.5714" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <FaUser className="text-purple-500" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Manager Name" />
                    <InputField label="Mobile Number" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} placeholder="9876543210" required />
                    <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="contact@property.com" />
                    <InputField label="Website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://..." />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Descriptions</h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Short Description</label>
                        <textarea name="shortDescription" value={formData.shortDescription} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg p-3 focus:border-black focus:ring-2 focus:ring-black/10 outline-none h-16 resize-none text-sm"
                            placeholder="Brief tagline or highlight..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Long Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange}
                            className="w-full border border-gray-200 rounded-lg p-3 focus:border-black focus:ring-2 focus:ring-black/10 outline-none h-24 resize-none text-sm"
                            placeholder="Detailed description of the property..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Other Attractions Nearby</label>
                        <div className="space-y-2">
                            {Array.isArray(formData.otherAttractions) && formData.otherAttractions.map((attraction, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={attraction}
                                        onChange={(e) => {
                                            const newAttractions = [...formData.otherAttractions];
                                            newAttractions[idx] = e.target.value;
                                            setFormData(prev => ({ ...prev, otherAttractions: newAttractions }));
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-black outline-none"
                                        placeholder="Enter attraction..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newAttractions = formData.otherAttractions.filter((_, i) => i !== idx);
                                            setFormData(prev => ({ ...prev, otherAttractions: newAttractions }));
                                        }}
                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, otherAttractions: [...(formData.otherAttractions || []), ''] }))}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors w-max"
                            >
                                <span className="text-lg">+</span> Add Attraction
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2Features = () => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {AMENITY_TYPES.filter(a => !a.scope || a.scope.includes(formData.propertyType)).map(item => (
                    <div key={item.key} className="p-2 border rounded-lg flex items-center justify-between">
                        <span className="text-xs font-bold">{item.label}</span>
                        {item.type === 'number'
                            ? <Counter value={formData.amenities[item.key]} onChange={v => handleAmenityChange(item.key, 'number', v)} />
                            : <Toggle active={!!formData.amenities[item.key]} onChange={v => handleAmenityChange(item.key, 'bool', v)} />
                        }
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><FaUserShield /> Safety & Security (Other Amenities)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {['Fire Extinguisher', 'Security System', 'First Aid Kit', 'Window Guards', 'Caretaker'].map(safety => (
                        <label key={safety} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.amenities[safety?.toLowerCase().replace(/\s/g, '')] || formData.amenities[safety] || false}
                                onChange={(e) => handleAmenityChange(safety, 'bool', e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-xs font-bold text-gray-700">{safety}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Additional Amenities</label>
                <div className="space-y-2">
                    {Array.isArray(formData.otherAmenities) && formData.otherAmenities.map((amenity, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input
                                type="text"
                                value={amenity}
                                onChange={(e) => {
                                    const newAmenities = [...formData.otherAmenities];
                                    newAmenities[idx] = e.target.value;
                                    setFormData(prev => ({ ...prev, otherAmenities: newAmenities }));
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-black outline-none"
                                placeholder="Enter amenity..."
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newAmenities = formData.otherAmenities.filter((_, i) => i !== idx);
                                    setFormData(prev => ({ ...prev, otherAmenities: newAmenities }));
                                }}
                                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, otherAmenities: [...(prev.otherAmenities || []), ''] }))}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors w-max"
                    >
                        <span className="text-lg">+</span> Add Amenity
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStepRoomConfig = () => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2"><FaBed /> Room Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.propertyType === 'Villa' && (
                        <InputField label="No. of Rooms" name="noofRooms" value={formData.noofRooms} onChange={handleInputChange} placeholder="Ex: 3" type="number" className="bg-white" />
                    )}
                    <div className="flex items-center text-xs text-blue-800 bg-blue-100/50 p-2 rounded-lg">
                        Please set the number of rooms to configure bedroom details below.
                    </div>
                </div>
            </div>

            {/* Living Rooms Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-amber-900"><FaCouch /> Living Rooms</h3>
                    <button type="button" onClick={addLivingRoom} className="text-xs font-bold text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-amber-200 transition-all flex items-center gap-2">
                        <FaPlus /> Add Living Room
                    </button>
                </div>

                {(formData.roomConfig.livingRooms || []).map((room, idx) => (
                    <div key={idx} className="bg-amber-50 rounded-xl p-4 border border-amber-100 relative group">
                        <div className="absolute top-2 right-2">
                            <button onClick={() => removeLivingRoom(idx)} className="text-amber-300 hover:text-red-500 transition-colors p-1">
                                <FaTrash size={12} />
                            </button>
                        </div>
                        <h4 className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-wide">Living Room {idx + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Bed Type</label>
                                <select className="w-full p-1.5 rounded border focus:border-amber-500 outline-none text-sm" value={room.bedType} onChange={(e) => updateLiving(idx, 'bedType', e.target.value)}>
                                    <option value="Sofa">Sofa</option>
                                    <option value="Sofa cum Bed">Sofa cum Bed</option>
                                    <option value="None">None</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-bold text-xs">AC</span>
                                <Toggle active={room.ac} onChange={(v) => updateLiving(idx, 'ac', v)} />
                            </div>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-bold text-xs">TV</span>
                                <Toggle active={room.tv} onChange={(v) => updateLiving(idx, 'tv', v)} />
                            </div>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-bold text-xs">Bathroom</span>
                                <Toggle active={room.bathroom} onChange={(v) => updateLiving(idx, 'bathroom', v)} />
                            </div>
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                                <span className="font-bold text-xs">Balcony</span>
                                <Toggle active={room.balcony} onChange={(v) => updateLiving(idx, 'balcony', v)} />
                            </div>
                            {room.bathroom && (
                                <div className="md:col-span-2 lg:col-span-1 animate-in fade-in">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Toilet Style</label>
                                    <select className="w-full p-1.5 rounded border focus:border-amber-500 outline-none text-sm" value={room.toiletType} onChange={(e) => updateLiving(idx, 'toiletType', e.target.value)}>
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

            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><FaBed /> Bedrooms ({formData.noofRooms || 0})</h3>
                {formData.roomConfig.bedrooms.map((room, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="mb-2 font-bold text-blue-600">Bedroom {idx + 1}</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Bed Type</label>
                                <select className="w-full p-1.5 rounded border text-sm" value={room.bedType} onChange={(e) => updateRoom(idx, 'bedType', e.target.value)}>
                                    <option value="King">King</option>
                                    <option value="Queen">Queen</option>
                                    <option value="Double">Double</option>
                                    <option value="Single">Single</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between border p-1.5 rounded"><span className="text-xs font-bold text-gray-700">AC</span> <Toggle active={room.ac} onChange={v => updateRoom(idx, 'ac', v)} /></div>
                            <div className="flex items-center justify-between border p-1.5 rounded"><span className="text-xs font-bold text-gray-700">TV</span> <Toggle active={room.tv} onChange={v => updateRoom(idx, 'tv', v)} /></div>
                            <div className="flex items-center justify-between border p-1.5 rounded"><span className="text-xs font-bold text-gray-700">Geyser</span> <Toggle active={room.geyser} onChange={v => updateRoom(idx, 'geyser', v)} /></div>
                            <div className="flex items-center justify-between border p-1.5 rounded"><span className="text-xs font-bold text-gray-700">Wardrobe</span> <Toggle active={room.wardrobe} onChange={v => updateRoom(idx, 'wardrobe', v)} /></div>
                            <div className="flex items-center justify-between border p-1.5 rounded"><span className="text-xs font-bold text-gray-700">Balcony</span> <Toggle active={room.balcony} onChange={v => updateRoom(idx, 'balcony', v)} /></div>
                            <div className="flex items-center justify-between border p-1.5 rounded"><span className="text-xs font-bold text-gray-700">Bath</span> <Toggle active={room.bathroom} onChange={v => updateRoom(idx, 'bathroom', v)} /></div>

                            {room.bathroom && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Toilet</label>
                                    <select className="w-full p-1.5 rounded border text-sm" value={room.toiletType} onChange={(e) => updateRoom(idx, 'toiletType', e.target.value)}>
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
    );

    const renderPolicies = () => (
        <div className="space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-bold">Rules and Policies</h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                <InputField label="Check-in Time" name="checkInTime" value={formData.checkInTime} onChange={handleInputChange} type="time" />
                <InputField label="Check-out Time" name="checkOutTime" value={formData.checkOutTime} onChange={handleInputChange} type="time" />
            </div>

            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><FaUtensils className="text-orange-500" /> Food & Dietary</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>Outside food allowed?</span>
                        <Toggle active={!!formData.rules[3]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 3: v } }))} />
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>Non-veg food allowed?</span>
                        <Toggle active={!!formData.rules[8]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 8: v } }))} />
                    </div>
                </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><FaGlassMartiniAlt className="text-purple-500" /> Smoking & Alcohol</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>Smoking allowed?</span>
                        <Toggle active={!!formData.rules[6]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 6: v } }))} />
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>Alcohol allowed?</span>
                        <Toggle active={!!formData.rules[7]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 7: v } }))} />
                    </div>
                </div>
            </div>

            {/* General Rules Loop - Corrected */}
            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-2">General House Rules</h4>
                <div className="space-y-1">
                    {PROPERTY_RULES.map((rule, idx) => {
                        if ([3, 8, 6, 7].includes(idx)) return null; // Skip customized ones
                        return (
                            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                <span className="font-medium text-gray-600 text-sm">{rule}</span>
                                <Toggle active={!!formData.rules[idx]} onChange={(val) => setFormData(p => ({ ...p, rules: { ...p.rules, [idx]: val } }))} />
                            </div>
                        );
                    })}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                    <h4 className="font-bold mb-1 text-sm">Accepted ID Proofs</h4>
                    <div className="flex flex-wrap gap-2">
                        {['Passport', 'Driving License', 'PAN Card', 'Aadhar Card'].map(id => (
                            <button key={id} type="button"
                                onClick={() => setFormData(p => ({ ...p, idProofs: p.idProofs.includes(id) ? p.idProofs.filter(x => x !== id) : [...p.idProofs, id] }))}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${formData.idProofs.includes(id) ? 'bg-black text-white' : 'bg-white'}`}
                            >
                                {id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
                <h4 className="font-bold mb-2">Other Rules</h4>
                <textarea value={formData.otherRules} onChange={e => setFormData(p => ({ ...p, otherRules: e.target.value }))} className="w-full border rounded-lg p-3 h-20 text-sm" placeholder="Enter any additional rules..." />
            </div>
        </div>
    );

    const renderPricing = () => (
        <div className="space-y-4 animate-fade-in-up">
            {formData.propertyType === 'Villa' ? (
                <>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2"><FaUsers /> Capacity & Usage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Standard Occupancy (Base)" name="occupancy" value={formData.occupancy} onChange={handleInputChange} placeholder="Ex: 10" type="number" className="bg-white" required />
                            <InputField label="Max Capacity (Total)" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} placeholder="Ex: 20" type="number" className="bg-white" required />
                        </div>
                    </div>

                    <div className="border border-orange-100 p-4 rounded-xl bg-orange-50">
                        <h4 className="flex items-center gap-2 mb-2 font-bold text-orange-800"><FaMoneyBillWave /> Base Pricing (Auto-fills Matrix)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <InputField label="Mon-Thu (Per Night)" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} type="number" className="bg-white" required />
                            <InputField label="Fri & Sun (Per Night)" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} type="number" className="bg-white" required />
                            <InputField label="Saturday (Per Night)" name="priceSaturday" value={formData.priceSaturday} onChange={handleInputChange} type="number" className="bg-white" required />
                        </div>
                    </div>

                    {/* NEW: Pricing Matrix */}
                    <div className="border border-gray-200 p-3 rounded-xl bg-white overflow-x-auto">
                        <h4 className="font-bold text-gray-800 mb-2">Detailed Pricing Matrix (7-Day)</h4>
                        <table className="w-full min-w-[800px] text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-3 py-2">Day</th>
                                    <th className="px-3 py-2 bg-blue-50 text-blue-700">Vendor Ask (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.keys(pricing).map(day => (
                                    <tr key={day} className="hover:bg-gray-50">
                                        <td className="px-3 py-1 font-bold capitalize">{day}</td>
                                        <td className="px-3 py-1 bg-blue-50/30">
                                            <input type="number" value={pricing[day].villa.current || ''} onChange={e => handlePriceChange(day, 'villa', 'current', e.target.value)}
                                                className="w-24 p-1 border rounded bg-white focus:border-blue-500 outline-none" placeholder="0" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2"><FaChild /> Extra Person Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <InputField label="Mon-Thu (Per Person)" name="extraGuestPriceMonThu" value={formData.extraGuestPriceMonThu} onChange={handleInputChange} type="number" className="bg-white" />
                            <InputField label="Fri & Sun (Per Person)" name="extraGuestPriceFriSun" value={formData.extraGuestPriceFriSun} onChange={handleInputChange} type="number" className="bg-white" />
                            <InputField label="Saturday (Per Person)" name="extraGuestPriceSaturday" value={formData.extraGuestPriceSaturday} onChange={handleInputChange} type="number" className="bg-white" />
                        </div>
                    </div>

                    <div className="border border-green-100 p-4 rounded-xl bg-green-50/50">
                        <h4 className="flex items-center gap-2 mb-2 font-bold text-green-800"><FaUtensils /> Meal Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Veg Package" value={formData.foodRates?.veg} onChange={(e) => handleNestedChange('foodRates', 'veg', e.target.value)} type="number" className="bg-white" />
                            <InputField label="Non-Veg Package" value={formData.foodRates?.nonVeg} onChange={(e) => handleNestedChange('foodRates', 'nonVeg', e.target.value)} type="number" className="bg-white" />
                            <InputField label="Jain Package" value={formData.foodRates?.jain} onChange={(e) => handleNestedChange('foodRates', 'jain', e.target.value)} type="number" className="bg-white" />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="border border-blue-100 p-4 rounded-xl bg-blue-50">
                        <h4 className="flex items-center gap-2 mb-3 font-bold text-blue-800"><FaMoneyBillWave /> Ticket Pricing</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                                <h5 className="font-bold text-xs">Adult Tickets</h5>
                                <InputField label="Mon-Fri Rate" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} className="bg-white" required />
                                <InputField label="Sat-Sun Rate" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} className="bg-white" required />
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-bold text-xs">Child Tickets</h5>
                                <InputField label="Mon-Fri Rate" value={formData.childCriteria?.monFriPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'monFriPrice', e.target.value)} className="bg-white" required />
                                <InputField label="Sat-Sun Rate" value={formData.childCriteria?.satSunPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'satSunPrice', e.target.value)} className="bg-white" required />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><FaChild className="text-blue-500" /> Child Pricing Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50/50 p-3 rounded-lg border border-green-100">
                                <h5 className="text-[10px] font-bold text-green-600 uppercase mb-2">FREE ENTRY (Infants)</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Max Height (FT)" value={formData.childCriteria?.freeHeight} onChange={e => handleNestedChange('childCriteria', 'freeHeight', e.target.value)} />
                                    <InputField label="Max Age (Yrs)" value={formData.childCriteria?.freeAge} onChange={e => handleNestedChange('childCriteria', 'freeAge', e.target.value)} />
                                </div>
                            </div>
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <h5 className="text-[10px] font-bold text-blue-600 uppercase mb-2">CHILD RATE APPLICABLE</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <InputField label="Height Range To (FT)" value={formData.childCriteria?.heightTo} onChange={e => handleNestedChange('childCriteria', 'heightTo', e.target.value)} />
                                    <InputField label="Age Range To (Yrs)" value={formData.childCriteria?.ageTo} onChange={e => handleNestedChange('childCriteria', 'ageTo', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border p-4 rounded-xl">
                        <h4 className="font-bold mb-3">Ticket Inclusions</h4>
                        <div className="space-y-2">
                            {['Breakfast', 'Lunch', 'Tea and coffee'].map(meal => (
                                <div key={meal} className="flex items-center justify-between border-b pb-1">
                                    <span className="text-sm">{meal}</span>
                                    <div className="flex gap-2">
                                        {['Not Included', 'Veg', 'Non-Veg', 'Both'].map(opt => (
                                            <button key={opt} type="button" onClick={() => handleNestedChange('inclusions', meal.toLowerCase(), opt)}
                                                className={`px-3 py-1 text-[10px] rounded-full border ${formData.inclusions?.[meal.toLowerCase()] === opt ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="font-bold mb-3">Facilities Included</h4>
                        <div className="flex flex-wrap gap-2">
                            {INCLUSIONS.map(inc => (
                                <button key={inc} type="button" onClick={() => handleNestedChange('inclusions', inc, !formData.inclusions?.[inc])}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${formData.inclusions?.[inc] ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white'}`}>
                                    {formData.inclusions?.[inc] && <FaCheck className="inline mr-1" />} {inc}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="border border-gray-200 p-4 rounded-xl bg-white mt-6">
                <h4 className="font-bold mb-3 flex items-center gap-2"><FaMoneyBillWave className="text-green-600" /> Accepted Payment Methods</h4>
                <div className="flex gap-3 flex-wrap">
                    {['Cash', 'UPI', 'Debit Card', 'Credit Card'].map(method => {
                        const key = method.toLowerCase().replace(' card', '');
                        return (
                            <button key={method} type="button" onClick={() => handleNestedChange('paymentMethods', key, !formData.paymentMethods?.[key])}
                                className={`px-4 py-2 rounded-lg font-bold border-2 text-sm ${formData.paymentMethods?.[key] ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200'}`}>
                                {formData.paymentMethods?.[key] && <FaCheck className="inline mr-1" />} {method}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );

    const renderGallery = () => (
        <div className="space-y-4 animate-fade-in-up">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><FaVideo className="text-red-500" /> Property Video</h4>
                <InputField label="YouTube URL (Optional)" name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} placeholder="https://youtube.com/..." />
                <div className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white" onClick={() => videoInputRef.current?.click()}>
                    <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" multiple />
                    <FaVideo className="mx-auto text-2xl text-gray-400 mb-1" />
                    <p className="text-xs font-bold">Upload New Video</p>
                </div>
                {formData.videos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {formData.videos.map((file, idx) => (
                            <div key={idx} className="relative w-24 h-24 bg-black rounded-lg overflow-hidden">
                                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                <button onClick={() => handleDeleteVideo(idx)} className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1"><FaTimes /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="mb-2 font-bold flex items-center gap-2"><FaCamera className="text-blue-500" /> Property Photos</div>
                <div onClick={() => fileInputRef.current?.click()} className="border-3 border-dashed border-blue-200 rounded-2xl p-6 text-center hover:bg-white cursor-pointer group">
                    <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-2 mx-auto group-hover:scale-110 transition"><FaCamera /></div>
                    <p className="font-bold text-lg text-gray-800">Add Property Photos</p>
                </div>
                {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                        {formData.images.map((file, idx) => (
                            <div key={idx} className={`relative rounded-lg overflow-hidden aspect-square ${idx === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                {idx === 0 && <div className="absolute top-1 left-1 bg-yellow-400 text-black text-[8px] font-bold px-1.5 py-0.5 rounded-full"><FaStar /> Cover</div>}

                                {/* Make Cover Button */}
                                {idx !== 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMakeCover(idx); }} className="absolute top-1 right-8 bg-white text-yellow-500 p-0.5 rounded-full shadow hover:scale-110" title="Make Cover"><FaStar className="text-xs" /></button>
                                )}

                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteNewImage(idx); }} className="absolute top-1 right-1 bg-white text-red-500 p-0.5 rounded-full shadow hover:scale-110"><FaTimes className="text-xs" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const validateStep = (step) => {
        const isVilla = formData.propertyType === 'Villa';
        const errors = [];

        // Note: step is the CURRENT step index (0-based) that we are trying to LEAVE.
        // 0: Vendor | 1: Info | 2: Features | 3: Room(V)/Pol(W) | 4: Pol(V)/Pric(W) | 5: Pric(V)/Gal(W) | 6: Gal(V)

        // Step 1: Basic Info Check (Fixed Index)
        if (step === 1) {
            if (!formData.name?.trim()) errors.push('Property Name is required');
            if (!formData.location?.trim()) errors.push('Location (Landmark) is required');
            if (!formData.cityName?.trim()) errors.push('City Name is required');
            if (!formData.mobileNo?.trim()) errors.push('Mobile Number is required');
        }

        // Step 3 (Villa): Room Configuration Check
        if (isVilla && step === 3) {
            const rooms = parseInt(formData.noofRooms || 0);
            if (rooms < 1) errors.push('Please enter number of rooms.');
            // We can add check for bedrooms configuration here if needed
        }

        // Step 4 (Villa) or Step 3 (Waterpark): Policies Check
        const policiesStep = isVilla ? 4 : 3;
        if (step === policiesStep) {
            // Optional: Force ID proofs or timing?
            // We can be lenient or strict. Let's strictly require Check In/Out
            if (!formData.checkInTime) errors.push('Check-in time is required');
            if (!formData.checkOutTime) errors.push('Check-out time is required');
        }

        // Step 5 (Villa) or Step 4 (Waterpark): Pricing Check
        const pricingStep = isVilla ? 5 : 4;
        if (step === pricingStep) {
            if (isVilla) {
                if (!formData.priceMonThu) errors.push('Mon-Thu Price is required.');
                if (!formData.priceFriSun) errors.push('Fri-Sun Price is required.');
                if (!formData.priceSaturday) errors.push('Saturday Price is required.');
                if (!formData.maxCapacity) errors.push('Max Capacity is required.');
            } else {
                if (!formData.priceMonThu) errors.push('Adult Mon-Fri Price is required.');
                if (!formData.priceFriSun) errors.push('Adult Sat-Sun Price is required.');
            }
        }

        return { valid: errors.length === 0, msgs: errors };
    };

    const handleNext = () => {
        const { valid, msgs } = validateStep(step);
        if (!valid) {
            showError('Error', msgs.join(', '));
            return;
        }
        setStep(p => p + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <button onClick={() => navigate('/properties')} className="text-gray-500 hover:text-black mb-1">&larr; Back</button>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] p-4">
                    {step === 0 ? renderVendorSelection() : (
                        <div className="flex gap-4">
                            {/* Sidebar */}
                            <div className="w-64 flex-shrink-0 space-y-2 border-r border-gray-100 pr-4 hidden md:block">
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold mb-4">
                                    Owner: {selectedVendor?.business_name || selectedVendor?.name}
                                </div>
                                {(formData.propertyType === 'Villa' ? STEPS_VILLA : STEPS_WATERPARK).map((label, i) => (
                                    <button key={i} onClick={() => setStep(i + 1)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${step === i + 1 ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100 block'}`}>
                                        {i + 1}. {label}
                                    </button>
                                ))}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                {(() => {
                                    if (step === 1) return renderStep1();
                                    if (step === 2) return formData.propertyType === 'Villa' ? renderStep2Features() : renderStep2Features(); // Features shared (mostly)
                                    // Step 3: Villa=RoomConfig, Waterpark=Policies
                                    if (step === 3) return formData.propertyType === 'Villa' ? renderStepRoomConfig() : renderPolicies();
                                    // Step 4: Villa=Policies, Waterpark=Pricing
                                    if (step === 4) return formData.propertyType === 'Villa' ? renderPolicies() : renderPricing();
                                    // Step 5: Villa=Pricing, Waterpark=Gallery
                                    if (step === 5) return formData.propertyType === 'Villa' ? renderPricing() : renderGallery();
                                    // Step 6: Villa=Gallery
                                    if (step === 6) return renderGallery();
                                })()}

                                <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                                    <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 bg-gray-100 rounded-lg font-bold">Previous</button>

                                    {(step < (formData.propertyType === 'Villa' ? 6 : 5)) ? (
                                        <button onClick={handleNext} className="px-6 py-2 bg-black text-white rounded-lg font-bold">Next</button>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                                            {saving ? 'Creating...' : 'Create Listing'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Styles for animations */}
                <style>{`
                    @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
                `}</style>
            </div>
        </div>
    );
}
