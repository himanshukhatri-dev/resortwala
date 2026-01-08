import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext'; // Assuming context availability
import { API_BASE_URL } from '../config';
import {
    FaUser, FaBuilding, FaMapMarkerAlt, FaTag, FaImage, FaArrowRight, FaArrowLeft, FaCheck,
    FaHome, FaWater, FaUtensils, FaGlassMartiniAlt, FaUserShield, FaSearch, FaTrash
} from 'react-icons/fa';
import { STEPS_VILLA, STEPS_WATERPARK, AMENITY_TYPES } from '../constants/propertyConstants';
import Loader from '../components/Loader';

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

    // --- STEP 0: VENDOR SELECTION ---
    const [vendors, setVendors] = useState([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVendor, setSelectedVendor] = useState(null);

    // --- PROPERTY FORM DATA (Unified with Vendor) ---
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

        idProofs: [], otherAttractions: '',
        checkInTime: '14:00', checkOutTime: '11:00'
    });

    useEffect(() => {
        if (step === 0) fetchVendors();
    }, [step]);

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

    const handleAmenityChange = (key, type, value) => {
        setFormData(prev => ({ ...prev, amenities: { ...prev.amenities, [key]: value } }));
    };

    const handleImageUpload = (e) => {
        if (e.target.files) setFormData(prev => ({ ...prev, images: [...prev.images, ...Array.from(e.target.files)] }));
    };

    const handleSubmit = async () => {
        if (!selectedVendor) return showError("Error", "Please select a vendor.");

        // Basic Validation
        if (!formData.name || !formData.priceMonThu) return showError("Missing Fields", "Please populate Name and Base Price (Mon-Thu).");

        setLoading(true);
        try {
            const apiData = new FormData();
            apiData.append('vendor_id', selectedVendor.id);
            apiData.append('Name', formData.name);
            apiData.append('PropertyType', formData.propertyType);
            apiData.append('Price', formData.priceMonThu); // Use Mon-Thu as Base Price
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

            if (formData.images) formData.images.forEach(file => apiData.append('images[]', file));

            const res = await axios.post(`${API_BASE_URL}/admin/properties`, apiData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            showSuccess("Success", "Property Created! Redirecting to pricing review...");
            // Redirect to Approval Page for final check
            navigate(`/properties/${res.data.property.PropertyId}/approve`);

        } catch (error) {
            console.error(error);
            showError("Failed", error.response?.data?.message || "Failed to create property");
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERERS ---
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

    const renderBasicInfo = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => setFormData({ ...formData, propertyType: 'Villa' })} className={`p-4 border rounded-xl cursor-pointer text-center ${formData.propertyType === 'Villa' ? 'border-purple-500 bg-purple-50' : ''}`}>
                    <FaHome className="mx-auto mb-2 text-xl" /> <span className="font-bold">Villa / Resort</span>
                </div>
                <div onClick={() => setFormData({ ...formData, propertyType: 'Waterpark' })} className={`p-4 border rounded-xl cursor-pointer text-center ${formData.propertyType === 'Waterpark' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <FaWater className="mx-auto mb-2 text-xl" /> <span className="font-bold">Waterpark</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Property Name" name="name" value={formData.name} onChange={handleInputChange} required />
                <InputField label="Display Name" name="displayName" value={formData.displayName} onChange={handleInputChange} />
                <InputField label="City" name="cityName" value={formData.cityName} onChange={handleInputChange} />
                <InputField label="Location (Landmark)" name="location" value={formData.location} onChange={handleInputChange} />
            </div>
            <InputField label="Full Address" name="address" value={formData.address} onChange={handleInputChange} />
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
                <InputField label="Mobile No" name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} required />
                <InputField label="Email" name="email" value={formData.email} onChange={handleInputChange} />
                <InputField label="Website" name="website" value={formData.website} onChange={handleInputChange} />
            </div>
            <InputField label="Description" name="description" value={formData.description} onChange={handleInputChange} />
        </div>
    );

    const renderFeatures = () => (
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

    const renderPricing = () => (
        <div className="space-y-6">
            <h3 className="font-bold text-lg border-b pb-2">Base Tariff</h3>
            <div className="grid grid-cols-3 gap-4">
                <InputField label="Mon-Thu Price" name="priceMonThu" value={formData.priceMonThu} onChange={handleInputChange} type="number" required />
                <InputField label="Fri & Sun Price" name="priceFriSun" value={formData.priceFriSun} onChange={handleInputChange} type="number" />
                <InputField label="Saturday Price" name="priceSaturday" value={formData.priceSaturday} onChange={handleInputChange} type="number" />
            </div>

            <h3 className="font-bold text-lg border-b pb-2 mt-4">Capacity & Extra Guest</h3>
            <div className="grid grid-cols-3 gap-4">
                <InputField label="Max Capacity" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} type="number" />
                <InputField label="Normal Occupancy" name="occupancy" value={formData.occupancy} onChange={handleInputChange} type="number" />
                <InputField label="Extra Guest Limit" name="extraGuestLimit" value={formData.extraGuestLimit} onChange={handleInputChange} type="number" />
            </div>

            <h3 className="font-bold text-lg border-b pb-2 mt-4">Food Rates (Per Person)</h3>
            <div className="grid grid-cols-3 gap-4">
                <InputField label="Veg Rate" value={formData.foodRates.veg} onChange={e => setFormData({ ...formData, foodRates: { ...formData.foodRates, veg: e.target.value } })} type="number" />
                <InputField label="Non-Veg Rate" value={formData.foodRates.nonVeg} onChange={e => setFormData({ ...formData, foodRates: { ...formData.foodRates, nonVeg: e.target.value } })} type="number" />
            </div>
        </div>
    );

    const renderGallery = () => (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 relative">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <FaImage className="mx-auto text-4xl text-gray-300 mb-2" />
                <p>Click to upload photos</p>
            </div>
            {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, i) => (
                        <div key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-2">
                            {img.name} <button onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 transition-all flex justify-center items-center gap-2">
                {loading ? <Loader size="sm" color="white" /> : <><FaCheck /> Submit Property</>}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <button onClick={() => navigate('/properties')} className="text-gray-500 hover:text-black mb-1">&larr; Back</button>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] p-6">
                    {step === 0 ? renderVendorSelection() : (
                        <div className="flex gap-8">
                            {/* Sidebar Steps */}
                            <div className="w-64 flex-shrink-0 space-y-2 border-r border-gray-100 pr-6">
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold mb-4">
                                    Owner: {selectedVendor?.business_name || selectedVendor?.name}
                                </div>
                                {['Basic Info', 'Features', 'Room Config', 'Policies', 'Pricing', 'Gallery'].map((label, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setStep(i + 1)}
                                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all ${step === i + 1 ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {i + 1}. {label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1">
                                {step === 1 && renderBasicInfo()}
                                {step === 2 && renderFeatures()}
                                {step === 3 && <div className="text-center text-gray-400 py-10">Room Config UI (Simplified for now)</div>}
                                {step === 4 && <div className="text-center text-gray-400 py-10">Policies UI (Simplified for now)</div>}
                                {step === 5 && renderPricing()}
                                {step === 6 && renderGallery()}

                                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                                    <button onClick={() => setStep(s => s - 1)} className="px-6 py-2 bg-gray-100 rounded-lg font-bold">Previous</button>
                                    {step < 6 && <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 bg-black text-white rounded-lg font-bold">Next</button>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
