import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { AMENITY_TYPES } from '../constants/propertyConstants';
import { FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaBed, FaUtensils, FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave, FaStar, FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake, FaCouch, FaRestroom, FaDoorOpen, FaUsers, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaConciergeBell, FaHotTub } from 'react-icons/fa';
import { MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdMusicNote, MdBalcony, MdSportsEsports, MdRestaurant, MdOutlineOutdoorGrill } from 'react-icons/md';

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

export default function PropertyApproval() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    // Editable state for the property details
    const [formData, setFormData] = useState({});

    // Pricing Matrix State
    const [pricing, setPricing] = useState({
        mon_thu: {
            villa: { current: 0, discounted: 0, final: 0 },
            extra_person: { current: 0, discounted: 0, final: 0 },
            meal_person: { current: 0, discounted: 0, final: 0 },
            jain_meal_person: { current: 0, discounted: 0, final: 0 }
        },
        fri_sun: {
            villa: { current: 0, discounted: 0, final: 0 },
            extra_person: { current: 0, discounted: 0, final: 0 },
            meal_person: { current: 0, discounted: 0, final: 0 },
            jain_meal_person: { current: 0, discounted: 0, final: 0 }
        },
        sat: {
            villa: { current: 0, discounted: 0, final: 0 },
            extra_person: { current: 0, discounted: 0, final: 0 },
            meal_person: { current: 0, discounted: 0, final: 0 },
            jain_meal_person: { current: 0, discounted: 0, final: 0 }
        }
    });

    // Waterpark Ticket Pricing State
    const [waterparkPricing, setWaterparkPricing] = useState({
        adult_weekday: { current: 0, discounted: 0, final: 0 },
        adult_weekend: { current: 0, discounted: 0, final: 0 },
        child_weekday: { current: 0, discounted: 0, final: 0 },
        child_weekend: { current: 0, discounted: 0, final: 0 }
    });

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/admin/properties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const prop = res.data;
                const ob = prop.onboarding_data || {};

                setProperty(prop);
                setFormData({
                    Name: prop.Name || '',
                    Location: prop.Location || '',
                    ShortDescription: prop.ShortDescription || ob.shortDescription || '',
                    LongDescription: prop.LongDescription || ob.description || '',
                    Occupancy: prop.Occupancy || 0,
                    MaxCapacity: prop.MaxCapacity || 0,
                    NoofRooms: prop.NoofRooms || 0,
                    checkInTime: prop.checkInTime || ob.checkInTime || '',
                    checkOutTime: prop.checkOutTime || ob.checkOutTime || '',
                    PropertyRules: prop.PropertyRules || '',
                    BookingSpecailMessage: prop.BookingSpecailMessage || '',
                    Amenities: ob.amenities || {},
                    ContactPerson: prop.ContactPerson || '',
                    MobileNo: prop.MobileNo || '',
                    Email: prop.Email || ob.email || '',
                    Address: prop.Address || '',
                });
                initializePricing(prop);
                if (prop.PropertyType === 'Waterpark') {
                    initializeWaterparkPricing(prop);
                }
            } catch (err) {
                console.error(err);
                alert("Failed to load property");
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const initializePricing = (prop) => {
        try {
            const ob = prop.onboarding_data || {};
            // Extract existing admin pricing if available
            const existing = prop.admin_pricing || {};
            const pricingData = ob.pricing || {};

            // Helper to get existing admin price or empty string (NO PRE-FILL from vendor price)
            const getVal = (day, type, field) => {
                return existing[day]?.[type]?.[field] ?? '';
            };

            let mt_villa, mt_extra, fs_villa, fs_extra, sat_villa, sat_extra;

            mt_villa = parseFloat(prop.price_mon_thu || prop.Price || 0);

            // Logic to extract Extra Guest Charges
            if (pricingData.extraGuestLimit && pricingData.extraGuestCharge) {
                if (typeof pricingData.extraGuestCharge === 'object') {
                    mt_extra = parseFloat(pricingData.extraGuestCharge.week || 0);
                    fs_extra = parseFloat(pricingData.extraGuestCharge.weekend || 0);
                    sat_extra = parseFloat(pricingData.extraGuestCharge.saturday || 0);
                } else {
                    const val = parseFloat(pricingData.extraGuestCharge || 0);
                    mt_extra = val; fs_extra = val; sat_extra = val;
                }
            } else if (pricingData.extraGuestCharge) {
                if (typeof pricingData.extraGuestCharge === 'object') {
                    mt_extra = parseFloat(pricingData.extraGuestCharge.week || pricingData.extraGuestCharge.weekday || 0);
                    fs_extra = parseFloat(pricingData.extraGuestCharge.weekend || 0);
                    sat_extra = parseFloat(pricingData.extraGuestCharge.saturday || 0);
                } else {
                    const val = parseFloat(pricingData.extraGuestCharge || 0);
                    mt_extra = val; fs_extra = val; sat_extra = val;
                }
            }

            const foodRates = ob.foodRates || {};
            const mt_meal = parseFloat(foodRates.veg || foodRates.nonVeg || 0);
            const jain_meal = parseFloat(foodRates.jain || 0); // Extract Jain

            const fs_fs_villa = parseFloat(prop.price_fri_sun || 0);
            const sat_sat_villa = parseFloat(prop.price_sat || 0);

            setPricing({
                mon_thu: {
                    villa: { current: mt_villa, discounted: getVal('mon_thu', 'villa', 'discounted'), final: getVal('mon_thu', 'villa', 'final') },
                    extra_person: { current: mt_extra, discounted: getVal('mon_thu', 'extra_person', 'discounted'), final: getVal('mon_thu', 'extra_person', 'final') },
                    meal_person: { current: mt_meal, discounted: getVal('mon_thu', 'meal_person', 'discounted'), final: getVal('mon_thu', 'meal_person', 'final') },
                    jain_meal_person: { current: jain_meal, discounted: getVal('mon_thu', 'jain_meal_person', 'discounted'), final: getVal('mon_thu', 'jain_meal_person', 'final') }
                },
                fri_sun: {
                    villa: { current: fs_fs_villa, discounted: getVal('fri_sun', 'villa', 'discounted'), final: getVal('fri_sun', 'villa', 'final') },
                    extra_person: { current: fs_extra, discounted: getVal('fri_sun', 'extra_person', 'discounted'), final: getVal('fri_sun', 'extra_person', 'final') },
                    meal_person: { current: mt_meal, discounted: getVal('fri_sun', 'meal_person', 'discounted'), final: getVal('fri_sun', 'meal_person', 'final') },
                    jain_meal_person: { current: jain_meal, discounted: getVal('fri_sun', 'jain_meal_person', 'discounted'), final: getVal('fri_sun', 'jain_meal_person', 'final') }
                },
                sat: {
                    villa: { current: sat_sat_villa, discounted: getVal('sat', 'villa', 'discounted'), final: getVal('sat', 'villa', 'final') },
                    extra_person: { current: sat_extra, discounted: getVal('sat', 'extra_person', 'discounted'), final: getVal('sat', 'extra_person', 'final') },
                    meal_person: { current: mt_meal, discounted: getVal('sat', 'meal_person', 'discounted'), final: getVal('sat', 'meal_person', 'final') },
                    jain_meal_person: { current: jain_meal, discounted: getVal('sat', 'jain_meal_person', 'discounted'), final: getVal('sat', 'jain_meal_person', 'final') }
                }
            });
        } catch (e) {
            console.error("Error initializing pricing:", e);
        }
    };

    const initializeWaterparkPricing = (prop) => {
        try {
            const ob = prop.onboarding_data || {};
            const existing = prop.admin_pricing || {};

            const adultWeek = parseFloat(ob.pricing?.waterparkPrices?.adult?.week || prop.price_mon_thu || prop.Price || 0);
            const adultWeekend = parseFloat(ob.pricing?.waterparkPrices?.adult?.weekend || prop.price_fri_sun || 0);
            const childWeek = parseFloat(ob.pricing?.waterparkPrices?.child?.week || ob.childCriteria?.price || 0);
            const childWeekend = parseFloat(ob.pricing?.waterparkPrices?.child?.weekend || ob.childCriteria?.price || 0);

            setWaterparkPricing({
                adult_weekday: {
                    current: adultWeek,
                    discounted: existing.adult_weekday?.discounted ?? '',
                    final: existing.adult_weekday?.final ?? ''
                },
                adult_weekend: {
                    current: adultWeekend,
                    discounted: existing.adult_weekend?.discounted ?? '',
                    final: existing.adult_weekend?.final ?? ''
                },
                child_weekday: {
                    current: childWeek,
                    discounted: existing.child_weekday?.discounted ?? '',
                    final: existing.child_weekday?.final ?? ''
                },
                child_weekend: {
                    current: childWeekend,
                    discounted: existing.child_weekend?.discounted ?? '',
                    final: existing.child_weekend?.final ?? ''
                }
            });
        } catch (e) {
            console.error("Error initializing waterpark pricing:", e);
        }
    };

    const handlePriceChange = (day, type, field, value) => {
        let num = parseFloat(value);
        if (isNaN(num) || num < 0) num = 0;
        setPricing(prev => ({
            ...prev,
            [day]: { ...prev[day], [type]: { ...prev[day][type], [field]: num } }
        }));
    };

    const handleWaterparkPriceChange = (ticketType, field, value) => {
        let num = parseFloat(value);
        if (isNaN(num) || num < 0) num = 0;
        setWaterparkPricing(prev => ({
            ...prev,
            [ticketType]: {
                ...prev[ticketType],
                [field]: num
            }
        }));
    };

    const handleApprove = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = {
                admin_pricing: pricing,
                Name: formData.Name,
                Location: formData.Location,
                ShortDescription: formData.ShortDescription,
                LongDescription: formData.LongDescription,
                Occupancy: formData.Occupancy,
                MaxCapacity: formData.MaxCapacity,
                NoofRooms: formData.NoofRooms,
                checkInTime: formData.checkInTime,
                checkOutTime: formData.checkOutTime,
                PropertyRules: formData.PropertyRules,
                BookingSpecailMessage: formData.BookingSpecailMessage
            };

            const res = await axios.put(`${API_BASE_URL}/admin/properties/${id}/approve`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.property) setProperty(res.data.property);
            setShowSuccessModal(true);
            setTimeout(() => navigate('/properties'), 2000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            alert('Approval Failed: ' + errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!property) return <div className="p-8 text-red-500">Property not found.</div>;

    const obData = property.onboarding_data || {};

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen pb-20">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-6 bg-white border-b flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-black text-gray-900 leading-tight">Review: {property.Name}</h1>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${property.is_approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {property.is_approved ? 'Live' : 'Pending'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mt-2">
                            <span className="flex items-center gap-1"><FaUserShield className="text-blue-500" /> {property.vendor?.business_name || property.vendor?.name}</span>
                            <span className="flex items-center gap-1"><FaUsers className="text-emerald-500" /> {formData.ContactPerson || 'N/A'} ({formData.MobileNo || 'N/A'})</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 max-w-2xl">{formData.Address || 'No address provided'}</div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={() => navigate('/properties')} className="px-6 py-2.5 rounded-xl border font-bold hover:bg-gray-50">Cancel</button>
                        <button onClick={handleApprove} disabled={saving} className="bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50">
                            {saving ? 'Processing...' : 'Approve & Go Live'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto bg-gray-50 px-4 border-b">
                    {[
                        { id: 'basic', label: 'Basic Info', icon: <FaHome />, show: true },
                        { id: 'amenities', label: 'Amenities', icon: <FaStar />, show: true },
                        { id: 'rooms', label: 'Rooms', icon: <FaBed />, show: property.PropertyType === 'Villa' },
                        { id: 'food', label: 'Food & Dining', icon: <FaUtensils />, show: obData.mealPlans && Object.values(obData.mealPlans).some(m => m.available) },
                        { id: 'media', label: 'Media', icon: <FaCamera />, show: true },
                        { id: 'rules', label: 'Rules', icon: <FaUtensils />, show: true },
                        { id: 'pricing', label: property.PropertyType === 'Waterpark' ? 'Ticket Pricing' : 'Pricing Matrix', icon: <FaMoneyBillWave />, show: true }
                    ].filter(tab => tab.show).map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Property Details Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b">Property Details</h3>
                                <div className="space-y-0">
                                    <InputGroup label="Property Type" value={property.PropertyType} readOnly />
                                    <InputGroup label="Property Name" value={formData.Name} onChange={(e) => setFormData({ ...formData, Name: e.target.value })} />
                                    <InputGroup label="Location / City" value={formData.Location} onChange={(e) => setFormData({ ...formData, Location: e.target.value })} />
                                    <InputGroup label="Website" value={property.Website || 'N/A'} readOnly />
                                </div>
                            </div>

                            {/* Capacity Card - Only for Villa */}
                            {property.PropertyType === 'Villa' && (
                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b">Capacity & Rooms</h3>
                                    <div className="space-y-0">
                                        <InputGroup label="Occupancy" type="number" value={formData.Occupancy} onChange={(e) => setFormData({ ...formData, Occupancy: e.target.value })} />
                                        <InputGroup label="Max Capacity" type="number" value={formData.MaxCapacity} onChange={(e) => setFormData({ ...formData, MaxCapacity: e.target.value })} />
                                        <InputGroup label="Total Rooms" type="number" value={formData.NoofRooms} onChange={(e) => setFormData({ ...formData, NoofRooms: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {/* Descriptions Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b">Descriptions</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Short Description</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition h-20 resize-none"
                                            value={formData.ShortDescription}
                                            onChange={(e) => setFormData({ ...formData, ShortDescription: e.target.value })}
                                            placeholder="No description provided"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Long Description</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition h-32 resize-none"
                                            value={formData.LongDescription}
                                            onChange={(e) => setFormData({ ...formData, LongDescription: e.target.value })}
                                            placeholder="No description provided"
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>
                    )}

                    {/* Amenities Tab */}
                    {activeTab === 'amenities' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
                            {AMENITY_TYPES.map(item => {
                                const val = obData.amenities?.[item.key];
                                const isActive = !!val && (item.type === 'bool' ? val === true : val > 0);

                                return (
                                    <div key={item.key} className={`border rounded-xl p-4 flex items-center gap-3 transition-colors ${isActive ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                            {getAmenityIcon(item.key)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm leading-tight text-gray-800">{item.label}</p>
                                            <p className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {isActive ? (item.type === 'number' ? `${val} Units` : 'Available') : 'Not Added'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Safety & Security manual list */}
                            {['Fire Extinguisher', 'Security System', 'First Aid Kit', 'Window Guards', 'Caretaker'].map(safety => {
                                // Check key (removed spaces, lower case for storage key)
                                const key = safety.toLowerCase().replace(/\s/g, '');
                                const val = obData.amenities?.[key] || obData.amenities?.[safety];
                                const isActive = !!val;
                                return (
                                    <div key={safety} className={`border rounded-xl p-4 flex items-center gap-3 transition-colors ${isActive ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                            <FaUserShield />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm leading-tight text-gray-800">{safety}</p>
                                            <p className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{isActive ? 'Available' : 'Not Added'}</p>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="col-span-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                <h4 className="font-bold text-yellow-800 text-sm mb-1">Other Attractions</h4>
                                <p className="text-sm">{obData.otherAttractions || 'None provided'}</p>
                            </div>
                        </div>
                    )}

                    {/* Rooms Tab */}
                    {activeTab === 'rooms' && property.PropertyType === 'Villa' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Living Room */}
                            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2"><FaCouch /> Living Room</h3>
                                {obData.roomConfig?.livingRoom ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Badge label="Bed Type" value={obData.roomConfig.livingRoom.bedType} />
                                        <Badge label="AC" value={obData.roomConfig.livingRoom.ac ? 'Yes' : 'No'} />
                                        <Badge label="Bathroom" value={obData.roomConfig.livingRoom.bathroom ? 'Yes' : 'No'} />
                                        <Badge label="Toilet" value={obData.roomConfig.livingRoom.toiletType || 'N/A'} />
                                    </div>
                                ) : (
                                    <div className="text-amber-800 italic">No living room configuration provided.</div>
                                )}
                            </div>

                            {/* Bedrooms */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {obData.roomConfig?.bedrooms?.length > 0 ? obData.roomConfig.bedrooms.map((room, idx) => (
                                    <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                                            Bedroom {idx + 1}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Bed Type</span> <span className="font-medium">{room.bedType}</span></div>
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">AC</span> <span className="font-medium">{room.ac ? 'Yes' : 'No'}</span></div>
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">TV</span> <span className="font-medium">{room.tv ? 'Yes' : 'No'}</span></div>
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Bathroom</span> <span className="font-medium">{room.bathroom ? 'Yes' : 'No'}</span></div>
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Geyser</span> <span className="font-medium">{room.geyser ? 'Yes' : 'No'}</span></div>
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Wardrobe</span> <span className="font-medium">{room.wardrobe ? 'Yes' : 'No'}</span></div>
                                            <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Toilet</span> <span className="font-medium">{room.toiletType || 'N/A'}</span></div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">No bedrooms configured.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Food Tab */}
                    {activeTab === 'food' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-white border rounded-xl p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Meal Plans Offered</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {obData.mealPlans ? Object.entries(obData.mealPlans).map(([key, plan]) => (
                                        <div key={key} className={`border p-4 rounded-lg ${plan.available ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-blue-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                {!plan.available && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">Unavailable</span>}
                                            </div>
                                            {plan.available ? (
                                                <div className="text-sm space-y-1">
                                                    {plan.vegRate && <p>Veg: ₹{plan.vegRate}</p>}
                                                    {plan.nonVegRate && <p>Non-Veg: ₹{plan.nonVegRate}</p>}
                                                    {plan.rate && <p>Rate: ₹{plan.rate}</p>}
                                                    {plan.includes?.length > 0 && <p className="text-gray-500 text-xs mt-1">Includes: {plan.includes.join(', ')}</p>}
                                                </div>
                                            ) : <p className="text-xs text-gray-400 italic">Vendor has not enabled this plan.</p>}
                                        </div>
                                    )) : <div className="text-gray-400">No meal plan data found.</div>}
                                </div>
                            </div>
                            <div className="bg-white border rounded-xl p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Food Rates (Per Person)</h3>
                                <div className="flex gap-6">
                                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-600 font-bold uppercase">Veg</p>
                                        <p className="text-lg font-black">{obData.foodRates?.veg ? `₹${obData.foodRates.veg}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-600 font-bold uppercase">Non-Veg</p>
                                        <p className="text-lg font-black">{obData.foodRates?.nonVeg ? `₹${obData.foodRates.nonVeg}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                    <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-yellow-600 font-bold uppercase">Jain</p>
                                        <p className="text-lg font-black">{obData.foodRates?.jain ? `₹${obData.foodRates.jain}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        /* ... (pricing code unchanged) ... */
                        <div className="space-y-8 animate-in fade-in">
                            {/* ... */}
                            {property.PropertyType === 'Waterpark' ? (
                                /* ... */
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    {/* ... */}
                                </div>
                            ) : (
                                ['mon_thu', 'fri_sun', 'sat'].map((day) => {
                                    const titles = { mon_thu: 'Monday to Thursday', fri_sun: 'Friday & Sunday', sat: 'Saturday' };
                                    const colors = { mon_thu: 'blue', fri_sun: 'purple', sat: 'orange' };
                                    const color = colors[day];
                                    return (
                                        <div key={day} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            {/* ... */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    {/* ... */}
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4">Photos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {property.images?.length > 0 ? (
                                        property.images.map(img => (
                                            <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                                <img src={img.image_url} alt="Property" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                                {img.is_primary && <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Cover</div>}
                                                <button onClick={(e) => { e.preventDefault(); /* Add delete logic if needed here or handle in parent component for manual delete if required */ }} className="absolute top-2 right-2 bg-white text-red-500 p-1 rounded-full shadow hover:scale-110 hidden group-hover:block"><FaTimes /></button>
                                            </div>
                                        ))
                                    ) : <div className="col-span-4 p-10 text-center text-gray-400">No images</div>}
                                </div>
                            </div>
                            {/* ... (videos unchanged) ... */}
                        </div>
                    )}


                    {/* Food Tab */}
                    {activeTab === 'food' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-white border rounded-xl p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Meal Plans Offered</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {obData.mealPlans ? Object.entries(obData.mealPlans).map(([key, plan]) => (
                                        <div key={key} className={`border p-4 rounded-lg ${plan.available ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-blue-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                {!plan.available && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">Unavailable</span>}
                                            </div>
                                            {plan.available ? (
                                                <div className="text-sm space-y-1">
                                                    {plan.vegRate && <p>Veg: ₹{plan.vegRate}</p>}
                                                    {plan.nonVegRate && <p>Non-Veg: ₹{plan.nonVegRate}</p>}
                                                    {plan.rate && <p>Rate: ₹{plan.rate}</p>}
                                                    {plan.includes?.length > 0 && <p className="text-gray-500 text-xs mt-1">Includes: {plan.includes.join(', ')}</p>}
                                                </div>
                                            ) : <p className="text-xs text-gray-400 italic">Vendor has not enabled this plan.</p>}
                                        </div>
                                    )) : <div className="text-gray-400">No meal plan data found.</div>}
                                </div>
                            </div>
                            <div className="bg-white border rounded-xl p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Food Rates (Per Person)</h3>
                                <div className="flex gap-6">
                                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                                        <p className="text-xs text-green-600 font-bold uppercase">Veg</p>
                                        <p className="text-lg font-black">{obData.foodRates?.veg ? `₹${obData.foodRates.veg}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-600 font-bold uppercase">Non-Veg</p>
                                        <p className="text-lg font-black">{obData.foodRates?.nonVeg ? `₹${obData.foodRates.nonVeg}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                    <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-yellow-600 font-bold uppercase">Jain</p>
                                        <p className="text-lg font-black">{obData.foodRates?.jain ? `₹${obData.foodRates.jain}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing Tab */}
                    {activeTab === 'pricing' && (
                        <div className="space-y-8 animate-in fade-in">
                            {/* What's Included Section (for Waterparks) */}
                            {property.PropertyType === 'Waterpark' && obData.inclusions && (
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="text-blue-600">✓</span> What's Included
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {Object.entries(obData.inclusions).map(([key, value]) => value && (
                                            <div key={key} className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg border border-blue-100">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {property.PropertyType === 'Waterpark' ? (
                                /* Waterpark Ticket Pricing - Editable Table */
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
                                        <h3 className="font-black text-sm uppercase tracking-widest text-blue-800">Waterpark Ticket Pricing</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-400 font-bold">
                                                    <th className="px-6 py-4 rounded-tl-lg">Ticket Type</th>
                                                    <th className="px-6 py-4 text-right">Vendor Ask</th>
                                                    <th className="px-6 py-4 text-right">Our Discounted</th>
                                                    <th className="px-6 py-4 text-right rounded-tr-lg">Final Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {[
                                                    { label: 'Adult - Weekday', type: 'adult_weekday', icon: '👨' },
                                                    { label: 'Adult - Weekend', type: 'adult_weekend', icon: '👨' },
                                                    { label: 'Child - Weekday', type: 'child_weekday', icon: '👶' },
                                                    { label: 'Child - Weekend', type: 'child_weekend', icon: '👶' }
                                                ].map((item) => (
                                                    <tr key={item.type} className="group hover:bg-blue-50/30 transition-colors duration-200">
                                                        <td className="px-6 py-4 font-bold text-gray-700 flex items-center gap-3">
                                                            <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-lg shadow-sm border border-blue-100">
                                                                {item.icon}
                                                            </span>
                                                            {item.label}
                                                        </td>
                                                        <td className="px-6 py-4 text-right tabular-nums text-gray-500 font-medium">
                                                            {waterparkPricing[item.type].current ? `₹${waterparkPricing[item.type].current.toLocaleString()}` : '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end">
                                                                <div className="relative w-32 group-hover:w-36 transition-all duration-300">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-right font-medium text-gray-800 placeholder-gray-300"
                                                                        value={waterparkPricing[item.type].discounted}
                                                                        onChange={(e) => handleWaterparkPriceChange(item.type, 'discounted', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end">
                                                                <div className="relative w-32 group-hover:w-36 transition-all duration-300">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold pointer-events-none">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full pl-7 pr-3 py-2 bg-blue-50/50 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-right font-black text-blue-700 placeholder-blue-300 shadow-sm"
                                                                        value={waterparkPricing[item.type].final}
                                                                        onChange={(e) => handleWaterparkPriceChange(item.type, 'final', e.target.value)}
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {obData.childCriteria && (
                                        <div className="p-6 bg-yellow-50 border-t border-yellow-100">
                                            <h5 className="font-bold text-yellow-800 text-sm mb-2">Child Ticket Criteria</h5>
                                            <div className="text-sm text-gray-700 space-y-1">
                                                <p>✓ Free Entry: Age ≤ {obData.childCriteria.freeAge} years or Height ≤ {obData.childCriteria.freeHeight} ft</p>
                                                <p>✓ Child Rate: Age {obData.childCriteria.chargeAgeFrom}-{obData.childCriteria.chargeAgeTo} years or Height {obData.childCriteria.chargeHeightFrom}-{obData.childCriteria.chargeHeightTo} ft</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Villa Pricing Matrix */
                                ['mon_thu', 'fri_sun', 'sat'].map((day) => {
                                    const titles = { mon_thu: 'Monday to Thursday', fri_sun: 'Friday & Sunday', sat: 'Saturday' };
                                    const colors = { mon_thu: 'blue', fri_sun: 'purple', sat: 'orange' };
                                    const color = colors[day];
                                    return (
                                        <div key={day} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                            <div className={`bg-${color}-50 px-6 py-4 border-b border-${color}-100 flex items-center gap-3`}>
                                                <span className={`w-3 h-3 rounded-full bg-${color}-500 animate-pulse`}></span>
                                                <h3 className={`font-black text-sm uppercase tracking-widest text-${color}-800`}>{titles[day]}</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className={`border-b border-${color}-100 bg-${color}-50/30 text-xs uppercase tracking-wider text-${color}-800/60 font-bold`}>
                                                            <th className="px-6 py-4 rounded-tl-lg">Service Type</th>
                                                            <th className="px-6 py-4 text-right">Vendor Ask</th>
                                                            <th className="px-6 py-4 text-right">Our Discounted</th>
                                                            <th className="px-6 py-4 text-right rounded-tr-lg">Final Customer Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {[
                                                            { label: 'Villa Base Price', type: 'villa', icon: '🏡' },
                                                            { label: 'Extra Person', type: 'extra_person', icon: '👤' },
                                                            { label: 'Meal per Person', type: 'meal_person', icon: '🍽️' },
                                                            { label: 'Jain Meal per Person', type: 'jain_meal_person', icon: '🥕' }
                                                        ].map((item) => (
                                                            <tr key={item.type} className={`group hover:bg-${color}-50/30 transition-colors duration-200`}>
                                                                <td className="px-6 py-4 font-bold text-gray-700 flex items-center gap-3">
                                                                    <span className={`w-8 h-8 rounded-full bg-${color}-50 flex items-center justify-center text-lg shadow-sm border border-${color}-100 text-${color}-600`}>
                                                                        {item.icon}
                                                                    </span>
                                                                    {item.label}
                                                                </td>
                                                                <td className="px-6 py-4 text-right tabular-nums text-gray-500 font-medium">
                                                                    {pricing[day][item.type].current ? `₹${pricing[day][item.type].current.toLocaleString()}` : '--'}
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end">
                                                                        <div className="relative w-32 group-hover:w-36 transition-all duration-300">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₹</span>
                                                                            <input type="number"
                                                                                className={`w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-${color}-400 focus:bg-white focus:ring-4 focus:ring-${color}-100 transition-all text-right font-medium text-gray-800 placeholder-gray-300`}
                                                                                value={pricing[day][item.type].discounted || ''}
                                                                                onChange={(e) => handlePriceChange(day, item.type, 'discounted', e.target.value)}
                                                                                placeholder="0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end">
                                                                        <div className="relative w-32 group-hover:w-36 transition-all duration-300">
                                                                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-${color}-500 font-bold pointer-events-none`}>₹</span>
                                                                            <input type="number"
                                                                                className={`w-full pl-7 pr-3 py-2 bg-${color}-50/50 border border-${color}-200 rounded-lg outline-none focus:border-${color}-500 focus:bg-white focus:ring-4 focus:ring-${color}-100 transition-all text-right font-black text-${color}-700 placeholder-${color}-300 shadow-sm`}
                                                                                value={pricing[day][item.type].final || ''}
                                                                                onChange={(e) => handlePriceChange(day, item.type, 'final', e.target.value)}
                                                                                placeholder="0"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4">Photos</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {property.images?.length > 0 ? (
                                        property.images.map(img => (
                                            <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                                <img src={img.image_url} alt="Property" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                                {img.is_primary && <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Cover</div>}
                                            </div>
                                        ))
                                    ) : <div className="col-span-4 p-10 text-center text-gray-400">No images</div>}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4">Videos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {property.videos?.length > 0 ? (
                                        property.videos.map(vid => (
                                            <div key={vid.id} className="aspect-video bg-black rounded-xl overflow-hidden">
                                                <video src={vid.video_url} controls className="w-full h-full object-cover" />
                                            </div>
                                        ))
                                    ) : (
                                        // Fallback for legacy 'video_url' field
                                        property.video_url ? (
                                            <div className="aspect-video bg-black rounded-xl overflow-hidden">
                                                {property.video_url.includes('youtube') || property.video_url.includes('youtu.be') ?
                                                    <iframe src={property.video_url.replace('watch?v=', 'embed/')} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                                                    : <video src={property.video_url} controls className="w-full h-full object-cover" />
                                                }
                                            </div>
                                        ) : <div className="col-span-3 p-10 text-center text-gray-400 bg-gray-50 border border-dashed rounded-xl">No videos uploaded by vendor</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rules Tab */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-gray-50 p-6 rounded-2xl grid grid-cols-2 gap-6">
                                <InputGroup label="Check-in Time" value={formData.checkInTime} onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} />
                                <InputGroup label="Check-out Time" value={formData.checkOutTime} onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border p-6 rounded-xl">
                                    <h3 className="font-bold text-gray-800 mb-4">Allowed</h3>
                                    <div className="space-y-2">
                                        <CheckRow label="Outside Food" value={obData.rules?.[3]} />
                                        <CheckRow label="Non-Veg Food" value={obData.rules?.[8]} />
                                        <CheckRow label="Smoking" value={obData.rules?.[6]} />
                                        <CheckRow label="Alcohol" value={obData.rules?.[7]} />
                                        <CheckRow label="Pets" value={obData.rules?.[2]} />
                                    </div>
                                </div>
                                <div className="bg-white border p-6 rounded-xl">
                                    <h3 className="font-bold text-gray-800 mb-4">General House Rules</h3>
                                    <div className="space-y-2">
                                        <CheckRow label="Primary guest must be 18+" value={obData.rules?.[0]} />
                                        <CheckRow label="Valid ID proof required" value={obData.rules?.[1]} />
                                        <CheckRow label="No show no refund" value={obData.rules?.[4]} />
                                        <CheckRow label="Offers cannot be combined" value={obData.rules?.[5]} />
                                        <CheckRow label="Wheelchair accessible" value={!obData.rules?.[10]} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="bg-white border p-6 rounded-xl">
                                    <h3 className="font-bold text-gray-800 mb-4">Documents Required</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {obData.idProofs?.map(id => (
                                            <span key={id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100">{id}</span>
                                        ))}
                                        {(!obData.idProofs || obData.idProofs.length === 0) && <span className="text-gray-400 text-sm">No ID proofs specified</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border p-6 rounded-xl">
                                <h3 className="font-bold text-gray-800 mb-4">Other Rules & Policies</h3>
                                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                                    {obData.otherRules || obData.policies || obData.policy || 'No additional rules providing.'}
                                </div>
                            </div>
                        </div>
                    )
                    }
                </div >
            </div >
            {
                showSuccessModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm animate-in zoom-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🎉</div>
                            <h2 className="text-xl font-black mb-2">Property Live!</h2>
                            <p className="text-gray-500">The property has been approved and is now visible to customers.</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

const InputGroup = ({ label, value, onChange, type = 'text', readOnly = false, placeholder }) => (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
        <label className="text-sm font-semibold text-gray-600 w-40 flex-shrink-0">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            className={`flex-1 px-4 py-2 rounded-lg border transition-all ${readOnly
                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none'
                }`}
        />
    </div>
);

const Badge = ({ label, value }) => (
    <div className="flex justify-between bg-white p-3 rounded-lg border border-amber-100">
        <span className="text-xs text-gray-500 font-bold uppercase">{label}</span>
        <span className="font-bold text-gray-800">{value}</span>
    </div>
);

const CheckRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
        <span className="font-medium text-gray-600">{label}</span>
        {value ? <FaCheck className="text-green-500" /> : <FaTimes className="text-red-200" />}
    </div>
);
