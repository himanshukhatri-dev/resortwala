import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';
import {
    FaUser, FaBuilding, FaMapMarkerAlt, FaTag, FaImage, FaArrowRight, FaArrowLeft, FaCheck,
    FaHome, FaWater, FaUtensils, FaGlassMartiniAlt, FaUserShield, FaSearch, FaTrash,
    FaBed, FaCouch, FaUsers, FaMoneyBillWave, FaChild, FaVideo, FaTimes, FaCamera, FaStar
} from 'react-icons/fa';
import { STEPS_VILLA, STEPS_WATERPARK, AMENITY_TYPES } from '../constants/propertyConstants';
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
const InputField = ({ label, name, type = "text", placeholder, className, value, onChange, required }) => (
    <div className={`space-y-1.5 group ${className}`}>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 group-focus-within:text-black transition-colors">
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value !== undefined ? value : ''}
            onChange={onChange}
            className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:bg-white focus:border-black outline-none transition-all ${required && !value ? 'border-orange-100' : ''}`}
            placeholder={placeholder}
        />
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
            livingRoom: { bedType: 'Sofa', ac: false, bathroom: false, toiletType: '', balcony: false },
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

        idProofs: [], otherAttractions: '', otherRules: '',
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                otherAttractions: formData.otherAttractions
            };

            apiData.append('onboarding_data', JSON.stringify(onboardingData));
            apiData.append('video_url', formData.videoUrl);

            if (formData.images) formData.images.forEach(file => apiData.append('images[]', file));
            if (formData.videos) formData.videos.forEach(file => apiData.append('videos[]', file));

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

    const updateLiving = (field, value) => {
        setFormData(prev => ({
            ...prev,
            roomConfig: { ...prev.roomConfig, livingRoom: { ...prev.roomConfig.livingRoom, [field]: value } }
        }));
    };

    // --- RENDER FUNCTIONS ---

    const renderVendorSelection = () => {
        const filtered = vendors.filter(v =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.business_name && v.business_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-bold">Select Property Owner</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search vendors..."
                        className="w-full pl-10 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                {loadingVendors ? <Loader message="Loading Vendors..." /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                        {filtered.map(v => (
                            <div key={v.id} onClick={() => setSelectedVendor(v)}
                                className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 hover:bg-gray-50 ${selectedVendor?.id === v.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{v.name.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-gray-800">{v.business_name || v.name}</p>
                                    <p className="text-xs text-gray-500">{v.email}</p>
                                </div>
                                {selectedVendor?.id === v.id && <FaCheck className="ml-auto text-blue-600" />}
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-end">
                    <button disabled={!selectedVendor} onClick={() => setStep(1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 font-bold">Next Step &rarr;</button>
                </div>
            </div>
        );
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setFormData({ ...formData, propertyType: 'Villa' })} className={`p-4 border rounded-xl cursor-pointer text-center ${formData.propertyType === 'Villa' ? 'border-purple-500 bg-purple-50' : ''}`}>
                    <FaHome className="mx-auto mb-2 text-xl" /> <span className="font-bold">Villa / Resort</span>
                </div>
                <div onClick={() => setFormData({ ...formData, propertyType: 'Waterpark' })} className={`p-4 border rounded-xl cursor-pointer text-center ${formData.propertyType === 'Waterpark' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <FaWater className="mx-auto mb-2 text-xl" /> <span className="font-bold">Waterpark</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} required />
                <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} />
                <InputField label="City" name="cityName" value={formData.cityName} onChange={handleInputChange} />
                <InputField label="Location (Landmark)" name="location" value={formData.location} onChange={handleInputChange} />
            </div>
            <InputField label="Full Address" name="address" value={formData.address} onChange={handleInputChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
                <InputField label="Mobile No" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} required />
                <InputField label="Email" name="email" value={formData.email} onChange={handleInputChange} />
                <InputField label="Website" name="website" value={formData.website} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Google Map Link" name="googleMapLink" value={formData.googleMapLink} onChange={handleInputChange} />
                <div className="flex gap-2">
                    <InputField label="Lat" name="latitude" value={formData.latitude} onChange={handleInputChange} />
                    <InputField label="Lng" name="longitude" value={formData.longitude} onChange={handleInputChange} />
                </div>
            </div>
            <InputField label="Description" name="description" value={formData.description} onChange={handleInputChange} />
        </div>
    );

    const renderStep2Features = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AMENITY_TYPES.filter(a => !a.scope || a.scope.includes(formData.propertyType)).map(item => (
                <div key={item.key} className="p-3 border rounded-lg flex items-center justify-between">
                    <span className="text-sm font-bold">{item.label}</span>
                    {item.type === 'number'
                        ? <Counter value={formData.amenities[item.key]} onChange={v => handleAmenityChange(item.key, 'number', v)} />
                        : <Toggle active={!!formData.amenities[item.key]} onChange={v => handleAmenityChange(item.key, 'bool', v)} />
                    }
                </div>
            ))}
        </div>
    );

    const renderStepRoomConfig = () => (
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
                <h3 className="text-xl font-bold flex items-center gap-2"><FaBed /> Bedrooms ({formData.noofRooms || 0})</h3>
                {formData.roomConfig.bedrooms.map((room, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200">
                        <div className="mb-4 font-bold text-blue-600">Bedroom {idx + 1}</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Bed Type</label>
                                <select className="w-full p-2 rounded border" value={room.bedType} onChange={(e) => updateRoom(idx, 'bedType', e.target.value)}>
                                    <option value="King">King</option>
                                    <option value="Queen">Queen</option>
                                    <option value="Double">Double</option>
                                    <option value="Single">Single</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between border p-2 rounded"><span className="text-sm">AC</span> <Toggle active={room.ac} onChange={v => updateRoom(idx, 'ac', v)} /></div>
                            <div className="flex items-center justify-between border p-2 rounded"><span className="text-sm">TV</span> <Toggle active={room.tv} onChange={v => updateRoom(idx, 'tv', v)} /></div>
                            <div className="flex items-center justify-between border p-2 rounded"><span className="text-sm">Private Bath</span> <Toggle active={room.bathroom} onChange={v => updateRoom(idx, 'bathroom', v)} /></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPolicies = () => (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-xl font-bold">Rules and Policies</h3>
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
                <InputField label="Check-in Time" name="checkInTime" value={formData.checkInTime} onChange={handleInputChange} type="time" />
                <InputField label="Check-out Time" name="checkOutTime" value={formData.checkOutTime} onChange={handleInputChange} type="time" />
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaUtensils className="text-orange-500" /> Food & Dietary</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span>Outside food allowed?</span>
                        <Toggle active={!!formData.rules[3]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 3: v } }))} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Non-veg food allowed?</span>
                        <Toggle active={!!formData.rules[8]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 8: v } }))} />
                    </div>
                </div>
            </div>
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaGlassMartiniAlt className="text-purple-500" /> Smoking & Alcohol</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span>Smoking allowed?</span>
                        <Toggle active={!!formData.rules[6]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 6: v } }))} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Alcohol allowed?</span>
                        <Toggle active={!!formData.rules[7]} onChange={v => setFormData(p => ({ ...p, rules: { ...p.rules, 7: v } }))} />
                    </div>
                </div>
            </div>

            {/* General Rules Loop - Corrected */}
            <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">General House Rules</h4>
                <div className="space-y-3">
                    {PROPERTY_RULES.map((rule, idx) => {
                        if ([3, 8, 6, 7].includes(idx)) return null; // Skip customized ones
                        return (
                            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="font-medium text-gray-600 text-sm">{rule}</span>
                                <Toggle active={!!formData.rules[idx]} onChange={(val) => setFormData(p => ({ ...p, rules: { ...p.rules, [idx]: val } }))} />
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <h4 className="font-bold mb-2">Accepted ID Proofs</h4>
                    <div className="flex flex-wrap gap-3">
                        {['Passport', 'Driving License', 'PAN Card', 'Aadhar Card'].map(id => (
                            <button key={id} type="button"
                                onClick={() => setFormData(p => ({ ...p, idProofs: p.idProofs.includes(id) ? p.idProofs.filter(x => x !== id) : [...p.idProofs, id] }))}
                                className={`px-4 py-2 rounded-lg border text-sm font-bold ${formData.idProofs.includes(id) ? 'bg-black text-white' : 'bg-white'}`}
                            >
                                {id}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-xl p-6">
                <h4 className="font-bold mb-2">Other Rules</h4>
                <textarea value={formData.otherRules} onChange={e => setFormData(p => ({ ...p, otherRules: e.target.value }))} className="w-full border rounded-lg p-3 h-24" placeholder="Enter any additional rules..." />
            </div>
        </div>
    );

    const renderPricing = () => (
        <div className="space-y-8 animate-fade-in-up">
            {formData.propertyType === 'Villa' ? (
                <>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><FaUsers /> Capacity & Usage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Standard Occupancy (Base)" name="occupancy" value={formData.occupancy} onChange={handleInputChange} placeholder="Ex: 10" type="number" className="bg-white" required />
                            <InputField label="Max Capacity (Total)" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} placeholder="Ex: 20" type="number" className="bg-white" required />
                        </div>
                    </div>

                    <div className="border border-orange-100 p-6 rounded-2xl bg-orange-50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-orange-800"><FaMoneyBillWave /> Base Pricing</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Mon-Thu (Per Night)" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} type="number" className="bg-white" required />
                            <InputField label="Fri & Sun (Per Night)" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} type="number" className="bg-white" required />
                            <InputField label="Saturday (Per Night)" name="priceSaturday" value={formData.priceSaturday} onChange={handleInputChange} type="number" className="bg-white" required />
                        </div>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                        <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2"><FaChild /> Extra Person Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InputField label="Mon-Thu (Per Person)" name="extraGuestPriceMonThu" value={formData.extraGuestPriceMonThu} onChange={handleInputChange} type="number" className="bg-white" />
                            <InputField label="Fri & Sun (Per Person)" name="extraGuestPriceFriSun" value={formData.extraGuestPriceFriSun} onChange={handleInputChange} type="number" className="bg-white" />
                            <InputField label="Saturday (Per Person)" name="extraGuestPriceSaturday" value={formData.extraGuestPriceSaturday} onChange={handleInputChange} type="number" className="bg-white" />
                        </div>
                    </div>

                    <div className="border border-green-100 p-6 rounded-2xl bg-green-50/50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-green-800"><FaUtensils /> Meal Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField label="Veg Package" value={formData.foodRates?.veg} onChange={(e) => handleNestedChange('foodRates', 'veg', e.target.value)} type="number" className="bg-white" />
                            <InputField label="Non-Veg Package" value={formData.foodRates?.nonVeg} onChange={(e) => handleNestedChange('foodRates', 'nonVeg', e.target.value)} type="number" className="bg-white" />
                            <InputField label="Jain Package" value={formData.foodRates?.jain} onChange={(e) => handleNestedChange('foodRates', 'jain', e.target.value)} type="number" className="bg-white" />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="border border-blue-100 p-6 rounded-2xl bg-blue-50">
                        <h4 className="flex items-center gap-2 mb-4 font-bold text-blue-800"><FaMoneyBillWave /> Ticket Pricing</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                                <h5 className="font-bold text-sm">Adult Tickets</h5>
                                <InputField label="Mon-Fri Rate" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} className="bg-white" required />
                                <InputField label="Sat-Sun Rate" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} className="bg-white" required />
                            </div>
                            <div className="space-y-3">
                                <h5 className="font-bold text-sm">Child Tickets</h5>
                                <InputField label="Mon-Fri Rate" value={formData.childCriteria?.monFriPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'monFriPrice', e.target.value)} className="bg-white" required />
                                <InputField label="Sat-Sun Rate" value={formData.childCriteria?.satSunPrice || ''} onChange={(e) => handleNestedChange('childCriteria', 'satSunPrice', e.target.value)} className="bg-white" required />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaChild className="text-blue-500" /> Child Pricing Policy</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                <h5 className="text-xs font-bold text-green-600 uppercase mb-3">FREE ENTRY (Infants)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Max Height (FT)" value={formData.childCriteria?.freeHeight} onChange={e => handleNestedChange('childCriteria', 'freeHeight', e.target.value)} />
                                    <InputField label="Max Age (Yrs)" value={formData.childCriteria?.freeAge} onChange={e => handleNestedChange('childCriteria', 'freeAge', e.target.value)} />
                                </div>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <h5 className="text-xs font-bold text-blue-600 uppercase mb-3">CHILD RATE APPLICABLE</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Height Range To (FT)" value={formData.childCriteria?.heightTo} onChange={e => handleNestedChange('childCriteria', 'heightTo', e.target.value)} />
                                    <InputField label="Age Range To (Yrs)" value={formData.childCriteria?.ageTo} onChange={e => handleNestedChange('childCriteria', 'ageTo', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border p-6 rounded-2xl">
                        <h4 className="font-bold mb-4">Ticket Inclusions</h4>
                        <div className="space-y-4">
                            {['Breakfast', 'Lunch', 'Tea and coffee'].map(meal => (
                                <div key={meal} className="flex items-center justify-between border-b pb-2">
                                    <span>{meal}</span>
                                    <div className="flex gap-2">
                                        {['Not Included', 'Veg', 'Non-Veg', 'Both'].map(opt => (
                                            <button key={opt} type="button" onClick={() => handleNestedChange('inclusions', meal.toLowerCase(), opt)}
                                                className={`px-3 py-1 text-xs rounded-full border ${formData.inclusions?.[meal.toLowerCase()] === opt ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="font-bold mb-4">Facilities Included</h4>
                        <div className="flex flex-wrap gap-3">
                            {INCLUSIONS.map(inc => (
                                <button key={inc} type="button" onClick={() => handleNestedChange('inclusions', inc, !formData.inclusions?.[inc])}
                                    className={`px-4 py-2 rounded-full text-sm font-bold border ${formData.inclusions?.[inc] ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white'}`}>
                                    {formData.inclusions?.[inc] && <FaCheck className="inline mr-2" />} {inc}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="border border-gray-200 p-6 rounded-2xl bg-white mt-8">
                <h4 className="font-bold mb-4 flex items-center gap-2"><FaMoneyBillWave className="text-green-600" /> Accepted Payment Methods</h4>
                <div className="flex gap-4 flex-wrap">
                    {['Cash', 'UPI', 'Debit Card', 'Credit Card'].map(method => {
                        const key = method.toLowerCase().replace(' card', '');
                        return (
                            <button key={method} type="button" onClick={() => handleNestedChange('paymentMethods', key, !formData.paymentMethods?.[key])}
                                className={`px-6 py-3 rounded-lg font-bold border-2 ${formData.paymentMethods?.[key] ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200'}`}>
                                {formData.paymentMethods?.[key] && <FaCheck className="inline mr-2" />} {method}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );

    const renderGallery = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaVideo className="text-red-500" /> Property Video</h4>
                <InputField label="YouTube URL (Optional)" name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} placeholder="https://youtube.com/..." />
                <div className="mt-4 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-white" onClick={() => videoInputRef.current?.click()}>
                    <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" multiple />
                    <FaVideo className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm font-bold">Upload New Video</p>
                </div>
                {formData.videos.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4">
                        {formData.videos.map((file, idx) => (
                            <div key={idx} className="relative w-32 h-32 bg-black rounded-lg overflow-hidden">
                                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                <button onClick={() => handleDeleteVideo(idx)} className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1"><FaTimes /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div className="mb-4 font-bold flex items-center gap-2"><FaCamera className="text-blue-500" /> Property Photos</div>
                <div onClick={() => fileInputRef.current?.click()} className="border-3 border-dashed border-blue-200 rounded-3xl p-12 text-center hover:bg-white cursor-pointer group">
                    <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition"><FaCamera /></div>
                    <p className="font-bold text-xl text-gray-800">Add Property Photos</p>
                </div>
                {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {formData.images.map((file, idx) => (
                            <div key={idx} className={`relative rounded-xl overflow-hidden aspect-square ${idx === 0 ? 'ring-4 ring-yellow-400' : ''}`}>
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                {idx === 0 && <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full"><FaStar /> Cover</div>}

                                {/* Make Cover Button */}
                                {idx !== 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMakeCover(idx); }} className="absolute top-2 right-10 bg-white text-yellow-500 p-1 rounded-full shadow hover:scale-110" title="Make Cover"><FaStar /></button>
                                )}

                                <button onClick={() => handleDeleteNewImage(idx)} className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow hover:scale-110"><FaTimes /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const validateStep = (step) => {
        const isVilla = formData.propertyType === 'Villa';
        let errors = [];
        if (step === 0) {
            if (!formData.name) errors.push('Name is required');
            if (!formData.location) errors.push('Location is required');
        }
        if (step === 2 && isVilla && !formData.noofRooms) errors.push('No of Rooms required');

        // Simplified validation for Speed - can be expanded
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] p-6">
                    {step === 0 ? renderVendorSelection() : (
                        <div className="flex gap-8">
                            {/* Sidebar */}
                            <div className="w-64 flex-shrink-0 space-y-2 border-r border-gray-100 pr-6 hidden md:block">
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

                                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
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
