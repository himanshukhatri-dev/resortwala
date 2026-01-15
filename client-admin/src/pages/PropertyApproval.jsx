import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { AMENITY_TYPES } from '../constants/propertyConstants';
import { FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaBed, FaUtensils, FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave, FaStar, FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake, FaCouch, FaRestroom, FaDoorOpen, FaUsers, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaConciergeBell, FaHotTub, FaTrash, FaPlus, FaTv, FaWind } from 'react-icons/fa';
import { MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdMusicNote, MdBalcony, MdSportsEsports, MdRestaurant, MdOutlineOutdoorGrill } from 'react-icons/md';
import ConnectorAssignment from '../components/connectors/ConnectorAssignment';

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

const Toggle = ({ active, onChange, color = "blue" }) => {
    const activeColor = color === "blue" ? "bg-blue-600" : (color === "green" ? "bg-green-500" : "bg-blue-600");
    return (
        <button
            type="button"
            onClick={() => onChange(!active)}
            className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 ${active ? activeColor : 'bg-gray-300'}`}
        >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${active ? 'translate-x-6' : ''}`} />
        </button>
    );
};

const Counter = ({ value = 0, onChange }) => (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
        <button type="button" onClick={() => onChange(Math.max(0, parseInt(value || 0) - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold">-</button>
        <span className="w-6 text-center font-bold">{value || 0}</span>
        <button type="button" onClick={() => onChange(parseInt(value || 0) + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm font-bold">+</button>
    </div>
);

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

const ConfirmationModal = ({ isOpen, title, message, type = 'confirm', onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 scale-100">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${isDanger ? 'bg-red-100 text-red-600' : (type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600')}`}>
                    {isDanger ? <FaTrash /> : (type === 'success' ? <FaCheck /> : <FaTv />)}
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
                <p className="text-gray-500 text-center mb-6 text-sm">{message}</p>

                <div className="flex gap-3 justify-center">
                    {type === 'confirm' && (
                        <button
                            onClick={onCancel}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors flex-1"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg flex-1 ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        {confirmText}
                    </button>
                    {activeTab === 'connectors' && (
                        <ConnectorAssignment propertyId={id} />
                    )}
                </div>
            </div>

        </div>
    );
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

    // Pricing validation errors
    const [pricingErrors, setPricingErrors] = useState({});

    // Pricing Matrix State
    const [pricing, setPricing] = useState(() => {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const types = ['villa', 'extra_person', 'meal_person', 'jain_meal_person'];
        const initial = {};

        days.forEach(day => {
            initial[day] = {};
            types.forEach(type => {
                initial[day][type] = {
                    current: 0,
                    discounted: 0,
                    final: 0,
                    vendorDiscountPercentage: 0,
                    ourMarginPercentage: 0
                };
            });
        });
        return initial;
    });

    // Waterpark Ticket Pricing State
    const [waterparkPricing, setWaterparkPricing] = useState({
        adult_weekday: { current: 0, discounted: 0, final: 0 },
        adult_weekend: { current: 0, discounted: 0, final: 0 },
        child_weekday: { current: 0, discounted: 0, final: 0 },
        child_weekend: { current: 0, discounted: 0, final: 0 }
    });

    // Track deleted images
    const [deletedImages, setDeletedImages] = useState([]);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm', // confirm, alert, success
        isDanger: false,
        onConfirm: () => { },
        onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });

    const showModal = ({ title, message, type = 'confirm', isDanger = false, onConfirm }) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type,
            isDanger,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
    };

    const showAlert = (message, title = "Notice") => {
        showModal({
            title,
            message,
            type: 'alert',
            confirmText: 'OK'
        });
    };

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
                    rules: ob.rules || {}, // Hydrate structured rules
                    PropertyRules: prop.PropertyRules || prop.rules?.custom || ob.rules?.custom || '', // Try to find legacy or custom rules text
                    BookingSpecailMessage: prop.BookingSpecailMessage || '',
                    Amenities: ob.amenities || {},
                    ContactPerson: prop.ContactPerson || '',
                    MobileNo: prop.MobileNo || '',
                    Email: prop.Email || ob.email || '',
                    Address: prop.Address || '',
                    PropertyType: prop.PropertyType || '',
                    Website: prop.Website || '',
                    GoogleMapLink: prop.GoogleMapLink || '',
                    latitude: ob.latitude || '',
                    longitude: ob.longitude || '',
                    otherAmenities: Array.isArray(ob.otherAmenities) ? ob.otherAmenities : (ob.otherAmenities ? ob.otherAmenities.split(/,\s*/) : []), // Hydrate as Array
                    otherAttractions: Array.isArray(ob.otherAttractions) ? ob.otherAttractions : (ob.otherAttractions ? [ob.otherAttractions] : []), // Hydrate as Array
                    otherRules: Array.isArray(ob.otherRules) ? ob.otherRules : (ob.otherRules ? ob.otherRules.split(',') : []), // Hydrate as Array
                    RoomConfig: {
                        livingRoom: ob.roomConfig?.livingRoom || { bedType: 'Sofa', ac: false, bathroom: false, toiletType: 'Western' },
                        bedrooms: ob.roomConfig?.bedrooms || []
                    },
                });
                initializePricing(prop);
                if (prop.PropertyType === 'Waterpark') {
                    initializeWaterparkPricing(prop);
                }
            } catch (err) {
                console.error(err);
                showAlert("Failed to load property details. Please try again.", "Error");
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const initializePricing = (prop) => {
        try {
            const ob = prop.onboarding_data || {};
            const existing = prop.admin_pricing || {};
            const pricingData = ob.pricing || {};

            // Helper to get existing admin price or fallback to legacy 3-bucket
            const getVal = (day, type, field) => {
                // Return new granular if exists
                if (existing[day]?.[type]?.[field]) return existing[day][type][field];

                // Fallback to legacy buckets
                const bucketMap = {
                    monday: 'mon_thu', tuesday: 'mon_thu', wednesday: 'mon_thu', thursday: 'mon_thu',
                    friday: 'fri_sun', saturday: 'sat', sunday: 'fri_sun'
                };
                return existing[bucketMap[day]]?.[type]?.[field] || null;
            };

            const getLegacyBase = (day) => {
                if (['monday', 'tuesday', 'wednesday', 'thursday'].includes(day)) return prop.price_mon_thu || prop.Price || 0;
                if (['friday', 'sunday'].includes(day)) return prop.price_fri_sun || prop.Price || 0;
                if (day === 'saturday') return prop.price_sat || prop.Price || 0;
                return 0;
            };

            const getVendorDiscountPercentage = (current, discounted) => {
                if (!current || !discounted) return 0;
                const c = parseFloat(current);
                const d = parseFloat(discounted);
                if (c === 0) return 0;
                return (((c - d) / c) * 100).toFixed(2);
            };

            const getOurMarginPercentage = (discounted, final) => {
                if (!discounted || !final) return 0;
                const d = parseFloat(discounted);
                const f = parseFloat(final);
                if (d === 0) return 0;
                return (((f - d) / d) * 100).toFixed(2);
            };

            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const newPricing = {};

            days.forEach(day => {
                const legacyBase = parseFloat(getLegacyBase(day));
                const currentVilla = parseFloat(getVal(day, 'villa', 'current') || legacyBase);
                const finalVilla = parseFloat(getVal(day, 'villa', 'final') || legacyBase); // Default to base if no final set
                const discountedVilla = parseFloat(getVal(day, 'villa', 'discounted') || currentVilla); // Default to current if no discount

                // Extra Person
                let extra = 0;
                // ... (Logic to extract Extra Guest similar to before but per day)
                // specific simplified logic for brevity, mapping legacy
                // ...
                if (pricingData.extraGuestLimit && pricingData.extraGuestCharge) {
                    // ... complex legacy extraction ...
                    // simplified:
                    const val = parseFloat(pricingData.extraGuestCharge?.week || 0); // basic fallback
                    extra = val;
                }
                // Override with existing admin value
                extra = parseFloat(getVal(day, 'extra_person', 'current') || extra);


                // Meal
                const mt_meal = parseFloat(ob.foodRates?.veg || 0);
                const currentMeal = parseFloat(getVal(day, 'meal_person', 'current') || mt_meal);

                // Jain
                const jain_meal = parseFloat(ob.foodRates?.jain || 0);
                const currentJain = parseFloat(getVal(day, 'jain_meal_person', 'current') || jain_meal);

                newPricing[day] = {
                    villa: {
                        current: currentVilla,
                        discounted: discountedVilla,
                        final: finalVilla,
                        vendorDiscountPercentage: getVendorDiscountPercentage(currentVilla, discountedVilla),
                        ourMarginPercentage: getOurMarginPercentage(discountedVilla, finalVilla)
                    },
                    extra_person: {
                        current: extra,
                        discounted: parseFloat(getVal(day, 'extra_person', 'discounted') || extra),
                        final: parseFloat(getVal(day, 'extra_person', 'final') || extra),
                        vendorDiscountPercentage: 0,
                        ourMarginPercentage: 0
                    },
                    meal_person: { // ... similarly populate ... 
                        current: currentMeal,
                        discounted: parseFloat(getVal(day, 'meal_person', 'discounted') || currentMeal),
                        final: parseFloat(getVal(day, 'meal_person', 'final') || currentMeal),
                        vendorDiscountPercentage: 0,
                        ourMarginPercentage: 0
                    },
                    jain_meal_person: {
                        current: currentJain,
                        discounted: parseFloat(getVal(day, 'jain_meal_person', 'discounted') || currentJain),
                        final: parseFloat(getVal(day, 'jain_meal_person', 'final') || currentJain),
                        vendorDiscountPercentage: 0,
                        ourMarginPercentage: 0
                    }
                };
            });

            setPricing(newPricing);
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
        if (isNaN(num)) num = 0;

        setPricing(prev => {
            const current = parseFloat(prev[day][type].current || 0);
            let newDiscounted = parseFloat(prev[day][type].discounted || 0);
            let newFinal = parseFloat(prev[day][type].final || 0);
            let newVendorDiscountPercentage = parseFloat(prev[day][type].vendorDiscountPercentage || 0);
            let newOurMarginPercentage = parseFloat(prev[day][type].ourMarginPercentage || 0);

            // Handle vendorDiscountPercentage change: vendor → us
            if (field === 'vendorDiscountPercentage') {
                newVendorDiscountPercentage = num;
                newDiscounted = current - (current * newVendorDiscountPercentage / 100);
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
            }
            // Handle current (Vendor Ask) change: recalculate discounted/final based on EXISTING percentages
            else if (field === 'current') {
                const newCurrent = num;
                // If vendor ask changes, we keep percentages same and update downstream values
                newDiscounted = newCurrent - (newCurrent * newVendorDiscountPercentage / 100);
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);

                return {
                    ...prev,
                    [day]: {
                        ...prev[day],
                        [type]: {
                            ...prev[day][type],
                            current: newCurrent,
                            discounted: newDiscounted,
                            final: newFinal
                        }
                    }
                };
            }
            // Handle ourMarginPercentage change: us → customer
            else if (field === 'ourMarginPercentage') {
                newOurMarginPercentage = num;
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
            }
            // Handle discounted (our rate) change
            else if (field === 'discounted') {
                newDiscounted = num;
                if (current !== 0) {
                    newVendorDiscountPercentage = ((current - newDiscounted) / current * 100);
                }
                newFinal = newDiscounted + (newDiscounted * newOurMarginPercentage / 100);
            }
            // Handle final (customer price) change
            else if (field === 'final') {
                newFinal = num;
                if (newDiscounted !== 0) {
                    newOurMarginPercentage = ((newFinal - newDiscounted) / newDiscounted * 100);
                }
            }

            // Validation
            const errorKey = `${day}-${type}`;
            let error = null;
            if (false) {
                // Validation removed
            } else if (false) {
                // Validation removed
            }

            setPricingErrors(prevErrors => ({
                ...prevErrors,
                [errorKey]: error
            }));

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

    const handleApprove = async () => {
        if (saving) return;
        setSaving(true);
        try {
            const payload = {
                admin_pricing: pricing,
                PropertyType: formData.PropertyType,
                Website: formData.Website,
                GoogleMapLink: formData.GoogleMapLink,
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
                BookingSpecailMessage: formData.BookingSpecailMessage,
                RoomConfig: formData.RoomConfig,
                Amenities: formData.Amenities,
                ContactPerson: formData.ContactPerson,
                MobileNo: formData.MobileNo,
                Email: formData.Email,

                Address: formData.Address,
                otherAmenities: formData.otherAmenities || [], // Submit
                otherAttractions: formData.otherAttractions || [], // Submit
                otherRules: formData.otherRules || [], // Submit
                latitude: formData.latitude,
                longitude: formData.longitude,
                deletedImages: deletedImages,
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
            showAlert('Approval Failed: ' + errorMsg, "Approval Error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!property) return <div className="p-8 text-red-500">Property not found.</div>;

    const obData = property.onboarding_data || {};

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen pb-20">
            <ConfirmationModal {...modalConfig} />
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
                        { id: 'rules', label: 'Rules', icon: <FaUtensils />, show: true },
                        { id: 'pricing', label: property.PropertyType === 'Waterpark' ? 'Ticket Pricing' : 'Pricing Matrix', icon: <FaMoneyBillWave />, show: true },
                        { id: 'connectors', label: 'Connectors', icon: <FaUsers />, show: true }
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
                                    <InputGroup label="Property Type" value={formData.PropertyType} onChange={(e) => setFormData({ ...formData, PropertyType: e.target.value })} />
                                    <InputGroup label="Property Name" value={formData.Name} onChange={(e) => setFormData({ ...formData, Name: e.target.value })} />
                                    <InputGroup label="Location / City" value={formData.Location} onChange={(e) => setFormData({ ...formData, Location: e.target.value })} />
                                    <InputGroup label="Website" value={formData.Website} onChange={(e) => setFormData({ ...formData, Website: e.target.value })} />
                                    <InputGroup label="Google Map Link" value={formData.GoogleMapLink} onChange={(e) => setFormData({ ...formData, GoogleMapLink: e.target.value })} onBlur={handleMapLinkBlur} />
                                    <div className="flex gap-4">
                                        <InputGroup label="Latitude" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
                                        <InputGroup label="Longitude" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
                                    </div>
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

                            {/* Rules & Policies Card */}
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b">Rules & Policies</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Property Rules</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition h-32 resize-none"
                                            value={formData.PropertyRules || ''}
                                            onChange={(e) => setFormData({ ...formData, PropertyRules: e.target.value })}
                                            placeholder="No rules provided"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Booking Special Message</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition h-20 resize-none"
                                            value={formData.BookingSpecailMessage || ''}
                                            onChange={(e) => setFormData({ ...formData, BookingSpecailMessage: e.target.value })}
                                            placeholder="No special message"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amenities Tab */}
                    {activeTab === 'amenities' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in pb-10">
                            {AMENITY_TYPES.map(item => {
                                const val = formData.Amenities?.[item.key];
                                const isActive = !!val && (item.type === 'bool' ? val === true : val > 0);

                                return (
                                    <div key={item.key} className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${isActive ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                                {getAmenityIcon(item.key)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm leading-tight text-gray-800">{item.label}</p>
                                            </div>
                                        </div>
                                        {item.type === 'number' ? (
                                            <Counter
                                                value={val}
                                                onChange={(newVal) => setFormData(prev => ({
                                                    ...prev,
                                                    Amenities: { ...prev.Amenities, [item.key]: newVal }
                                                }))}
                                            />
                                        ) : (
                                            <Toggle
                                                active={isActive}
                                                onChange={(newVal) => setFormData(prev => ({
                                                    ...prev,
                                                    Amenities: { ...prev.Amenities, [item.key]: newVal }
                                                }))}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            <div className="col-span-4 mt-6">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaUserShield className="text-blue-500" /> Safety & Security</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Fire Extinguisher', 'Security System', 'First Aid Kit', 'Window Guards', 'Caretaker'].map(safety => {
                                        const key = safety; // Use exact key as stored in Vendor
                                        const isActive = !!formData.Amenities?.[key];
                                        return (
                                            <div key={safety} className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${isActive ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60 grayscale'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                                        <FaUserShield />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm leading-tight text-gray-800">{safety}</p>
                                                    </div>
                                                </div>
                                                <Toggle
                                                    active={isActive}
                                                    onChange={(newVal) => setFormData(prev => ({
                                                        ...prev,
                                                        Amenities: { ...prev.Amenities, [key]: newVal }
                                                    }))}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="col-span-4 mt-6">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Additional Amenities</label>
                                <div className="space-y-3">
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
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-black outline-none"
                                                placeholder="Enter amenity..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newAmenities = formData.otherAmenities.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, otherAmenities: newAmenities }));
                                                }}
                                                className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, otherAmenities: [...(formData.otherAmenities || []), ''] }))}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-2 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors w-max"
                                    >
                                        <span className="text-lg">+</span> Add Amenity
                                    </button>
                                </div>
                            </div>
                            <div className="col-span-4 mt-6">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Other Attractions Nearby</label>
                                <div className="space-y-3">
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
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:border-black outline-none"
                                                placeholder="Enter attraction..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newAttractions = formData.otherAttractions.filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, otherAttractions: newAttractions }));
                                                }}
                                                className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, otherAttractions: [...(formData.otherAttractions || []), ''] }))}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-2 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors w-max"
                                    >
                                        <span className="text-lg">+</span> Add Attraction
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rooms Tab */}
                    {activeTab === 'rooms' && property.PropertyType === 'Villa' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Living Rooms */}
                            {/* Living Rooms */}
                            {(formData.RoomConfig?.livingRooms || (formData.RoomConfig?.livingRoom ? [formData.RoomConfig.livingRoom] : [])).map((room, idx) => (
                                <div key={idx} className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm mb-4 group hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs"><FaCouch /></span>
                                            Living Room {idx + 1}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                showModal({
                                                    title: 'Remove Living Room?',
                                                    message: 'Are you sure you want to remove this living room?',
                                                    isDanger: true,
                                                    confirmText: 'Remove',
                                                    onConfirm: () => {
                                                        const updated = [...(formData.RoomConfig?.livingRooms || [])];
                                                        updated.splice(idx, 1);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            RoomConfig: { ...prev.RoomConfig, livingRooms: updated }
                                                        }));
                                                    }
                                                });
                                            }}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                            title="Remove Living Room"
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bed Type</label>
                                                <select
                                                    value={room.bedType || 'Sofa'}
                                                    onChange={(e) => {
                                                        const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])].filter(Boolean);
                                                        if (!formData.RoomConfig?.livingRooms && updatedRooms.length === 0) updatedRooms[0] = formData.RoomConfig.livingRoom;

                                                        updatedRooms[idx] = { ...updatedRooms[idx], bedType: e.target.value };
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:bg-white outline-none transition-colors"
                                                >
                                                    <option value="Sofa">Sofa</option>
                                                    <option value="Sofa cum Bed">Sofa cum Bed</option>
                                                    <option value="None">None</option>
                                                </select>
                                            </div>

                                            {room.bathroom && (
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Toilet Type</label>
                                                    <select
                                                        value={room.toiletType || 'Western'}
                                                        onChange={(e) => {
                                                            const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])].filter(Boolean);
                                                            updatedRooms[idx] = { ...updatedRooms[idx], toiletType: e.target.value };
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                            }));
                                                        }}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:bg-white outline-none transition-colors"
                                                    >
                                                        <option value="Western">Western</option>
                                                        <option value="Indian">Indian</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { key: 'ac', label: 'AC', icon: <FaSnowflake /> },
                                                { key: 'tv', label: 'TV', icon: <FaTv /> },
                                                { key: 'bathroom', label: 'Private Bathroom', icon: <FaRestroom /> },
                                                { key: 'balcony', label: 'Balcony', icon: <FaWind /> }
                                            ].map(feat => {
                                                const isActive = !!room[feat.key];
                                                return (
                                                    <button
                                                        key={feat.key}
                                                        onClick={() => {
                                                            const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])].filter(Boolean);
                                                            updatedRooms[idx] = { ...updatedRooms[idx], [feat.key]: !isActive };
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                            }));
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${isActive
                                                            ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <span className={isActive ? 'text-amber-500' : 'text-gray-400'}>{feat.icon}</span>
                                                        {feat.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const currentRooms = formData.RoomConfig?.livingRooms || (formData.RoomConfig?.livingRoom ? [formData.RoomConfig.livingRoom] : []);
                                    setFormData(prev => ({
                                        ...prev,
                                        RoomConfig: {
                                            ...prev.RoomConfig,
                                            livingRooms: [
                                                ...currentRooms,
                                                { bedType: 'Sofa', ac: false, tv: false, bathroom: false, toiletType: 'Western' }
                                            ]
                                        }
                                    }));
                                }}
                                className="w-full py-4 border-2 border-dashed border-amber-300 rounded-2xl text-amber-600 font-bold hover:bg-amber-50 hover:border-amber-400 transition flex items-center justify-center gap-2"
                            >
                                <FaPlus /> Add Another Living Room
                            </button>

                            {/* Bedrooms */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.RoomConfig?.bedrooms?.length > 0 ? formData.RoomConfig.bedrooms.map((room, idx) => (
                                    <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                                            Bedroom {idx + 1}
                                        </h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Bed Type</label>
                                                <select
                                                    value={room.bedType || 'Queen'}
                                                    onChange={(e) => {
                                                        const updated = [...formData.RoomConfig.bedrooms];
                                                        updated[idx] = { ...updated[idx], bedType: e.target.value };
                                                        setFormData(prev => ({ ...prev, RoomConfig: { ...prev.RoomConfig, bedrooms: updated } }));
                                                    }}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                                >
                                                    <option value="Single">Single</option>
                                                    <option value="Double">Double</option>
                                                    <option value="Queen">Queen</option>
                                                    <option value="King">King</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['ac', 'tv', 'geyser', 'wardrobe', 'bathroom', 'balcony'].map((feature) => (
                                                    <div key={feature} className={`flex items-center justify-between p-2 rounded border ${!!room[feature] ? 'bg-white border-blue-100' : 'bg-gray-50'}`}>
                                                        <span className="text-xs font-semibold capitalize">{feature}</span>
                                                        <Toggle
                                                            active={!!room[feature]}
                                                            onChange={(val) => {
                                                                const updated = [...formData.RoomConfig.bedrooms];
                                                                updated[idx] = { ...updated[idx], [feature]: val };
                                                                setFormData(prev => ({ ...prev, RoomConfig: { ...prev.RoomConfig, bedrooms: updated } }));
                                                            }}
                                                            color="green"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {room.bathroom && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Toilet Type</label>
                                                    <select
                                                        value={room.toiletType || 'Western'}
                                                        onChange={(e) => {
                                                            const updated = [...formData.RoomConfig.bedrooms];
                                                            updated[idx] = { ...updated[idx], toiletType: e.target.value };
                                                            setFormData(prev => ({ ...prev, RoomConfig: { ...prev.RoomConfig, bedrooms: updated } }));
                                                        }}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm"
                                                    >
                                                        <option value="Western">Western</option>
                                                        <option value="Indian">Indian</option>
                                                    </select>
                                                </div>
                                            )}
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
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rules Tab */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b">Standard Rules</h3>
                                <div className="space-y-2">
                                    {PROPERTY_RULES.map((rule, idx) => (
                                        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                                            <span className="font-medium text-gray-700 text-sm">{rule}</span>
                                            <Toggle
                                                active={!!formData.rules[idx]}
                                                onChange={(val) => setFormData(prev => ({
                                                    ...prev,
                                                    rules: { ...prev.rules, [idx]: val }
                                                }))}
                                                color="green"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b">Custom Rules</h3>
                                <div className="space-y-3">
                                    {(formData.otherRules || []).map((rule, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={rule}
                                                onChange={(e) => {
                                                    const newRules = [...(formData.otherRules || [])];
                                                    newRules[idx] = e.target.value;
                                                    setFormData(prev => ({ ...prev, otherRules: newRules }));
                                                }}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 text-sm font-medium"
                                                placeholder="Enter rule..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newRules = (formData.otherRules || []).filter((_, i) => i !== idx);
                                                    setFormData(prev => ({ ...prev, otherRules: newRules }));
                                                }}
                                                className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, otherRules: [...(formData.otherRules || []), ''] }))}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2 mt-2 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors w-max"
                                    >
                                        <span className="text-lg font-normal bg-blue-50 w-6 h-6 flex items-center justify-center rounded-full leading-none">+</span> Add Rule
                                    </button>
                                </div>
                            </div>
                            {/* Other Rules (already handled in Basic Info, but duplicating or moving logic might be confusing. User asked for control. The 'PropertyRules' textarea logic is in Basic Info. We could move it here or keep it there.) */}
                        </div>
                    )}

                    {/* Pricing Matrix Tab */}



                    {/* Media Tab */}
                    {
                        activeTab === 'media' && (
                            <div className="space-y-8 animate-in fade-in">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-800">Photos</h3>
                                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors">
                                            <FaCamera /> Add Photos
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files);
                                                    if (files.length === 0) return;

                                                    const uploadFormData = new FormData();
                                                    files.forEach(file => uploadFormData.append('images[]', file));

                                                    try {
                                                        setSaving(true);
                                                        const res = await axios.post(`${API_BASE_URL}/admin/properties/${id}/photos`, uploadFormData, {
                                                            headers: {
                                                                Authorization: `Bearer ${token}`,
                                                                'Content-Type': 'multipart/form-data'
                                                            }
                                                        });
                                                        // Refresh property data
                                                        const updatedRes = await axios.get(`${API_BASE_URL}/admin/properties/${id}`, {
                                                            headers: { Authorization: `Bearer ${token}` }
                                                        });
                                                        setProperty(updatedRes.data);
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                        alert("Failed to upload photos");
                                                    } finally {
                                                        setSaving(false);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {(() => {
                                            // Deduplicate photos by ID or URL
                                            const seen = new Set();
                                            const uniqueImages = (property.images || []).filter(img => {
                                                const id = img.id || img.image_url;
                                                if (seen.has(id)) return false;
                                                seen.add(id);
                                                return true;
                                            }).filter(img => !deletedImages.includes(img.id));

                                            if (uniqueImages.length === 0) return <div className="col-span-4 p-10 text-center text-gray-400">No images</div>;

                                            return uniqueImages.map(img => (
                                                <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                                                    <img src={img.image_url} alt="Property" className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                                    {img.is_primary && <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Cover</div>}
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            showModal({
                                                                title: 'Delete Photo?',
                                                                message: 'Are you sure you want to remove this photo? It will be deleted upon approval.',
                                                                isDanger: true,
                                                                confirmText: 'Delete',
                                                                onConfirm: () => setDeletedImages(prev => [...prev, img.id])
                                                            });
                                                        }}
                                                        className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all z-10"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4">Videos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {property.videos?.length > 0 ? (
                                            property.videos.map(vid => (
                                                <div key={vid.id} className="aspect-video rounded-2xl overflow-hidden border border-gray-100 bg-black">
                                                    <video src={vid.video_url} controls className="w-full h-full" />
                                                </div>
                                            ))
                                        ) : <div className="col-span-2 p-10 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed">No videos uploaded</div>}
                                    </div>
                                </div>
                            </div>
                        )
                    }


                    {/* Pricing Tab */}
                    {
                        activeTab === 'pricing' && (
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
                                    /* Villa Pricing Matrix (New 7-Day) */
                                    <div className="space-y-8">
                                        {[
                                            { label: 'Villa Base Price', type: 'villa', icon: '🏡', color: 'blue' },
                                            { label: 'Extra Person', type: 'extra_person', icon: '👤', color: 'purple' },
                                            { label: 'Meal per Person', type: 'meal_person', icon: '🍽️', color: 'orange' },
                                            { label: 'Jain Meal per Person', type: 'jain_meal_person', icon: '🥕', color: 'green' }
                                        ].map((cat) => (
                                            <div key={cat.type} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                                <div className={`bg-${cat.color}-50 px-6 py-4 border-b border-${cat.color}-100 flex items-center justify-between`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg shadow-sm border border-${cat.color}-100 text-${cat.color}-600`}>
                                                            {cat.icon}
                                                        </span>
                                                        <h3 className={`font-black text-sm uppercase tracking-widest text-${cat.color}-800`}>{cat.label}</h3>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className={`border-b border-${cat.color}-100 bg-${cat.color}-50/30 text-xs uppercase tracking-wider text-${cat.color}-800/60 font-bold`}>
                                                                <th className="px-6 py-4 rounded-tl-lg w-32">Day</th>
                                                                <th className="px-4 py-4 text-right">Vendor Ask</th>
                                                                <th className="px-4 py-4 text-right">Vendor Disc %</th>
                                                                <th className="px-4 py-4 text-right">Our Rate</th>
                                                                <th className="px-4 py-4 text-right">Our Margin %</th>
                                                                <th className="px-4 py-4 text-right rounded-tr-lg">Customer Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                                                                const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
                                                                const isWeekend = ['friday', 'saturday', 'sunday'].includes(day);
                                                                const rowData = pricing[day]?.[cat.type] || {};

                                                                return (
                                                                    <tr key={day} className={`group hover:bg-gray-50 transition-colors duration-200 ${isWeekend ? 'bg-amber-50/30' : ''}`}>
                                                                        <td className="px-6 py-4 font-bold text-gray-700 capitalize">
                                                                            {dayLabel}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-right">
                                                                            <div className="relative w-24 ml-auto">
                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none text-xs">₹</span>
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full pl-5 pr-2 py-1.5 bg-white border border-gray-200 rounded text-right text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 outline-none"
                                                                                    value={rowData.current ?? ''}
                                                                                    onChange={(e) => handlePriceChange(day, cat.type, 'current', e.target.value)}
                                                                                    placeholder="0"
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-right">
                                                                            <div className="relative w-20 ml-auto">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full pr-6 pl-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-right text-sm text-gray-500 focus:bg-white outline-none"
                                                                                    value={rowData.vendorDiscountPercentage ?? ''}
                                                                                    onChange={(e) => handlePriceChange(day, cat.type, 'vendorDiscountPercentage', e.target.value)}
                                                                                    placeholder="0"
                                                                                />
                                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-right">
                                                                            <div className="relative w-24 ml-auto">
                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none text-xs">₹</span>
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full pl-5 pr-2 py-1.5 bg-gray-50 border border-gray-100 rounded text-right text-sm text-gray-600 focus:bg-white outline-none"
                                                                                    value={rowData.discounted ?? ''}
                                                                                    onChange={(e) => handlePriceChange(day, cat.type, 'discounted', e.target.value)}
                                                                                    placeholder="0"
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-right">
                                                                            <div className="relative w-20 ml-auto">
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full pr-6 pl-2 py-1.5 bg-blue-50 border border-blue-100 rounded text-right text-sm font-bold text-blue-700 focus:bg-white outline-none"
                                                                                    value={rowData.ourMarginPercentage ?? ''}
                                                                                    onChange={(e) => handlePriceChange(day, cat.type, 'ourMarginPercentage', e.target.value)}
                                                                                    placeholder="0"
                                                                                />
                                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 text-xs">%</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 text-right">
                                                                            <div className="relative w-28 ml-auto">
                                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-600 font-bold pointer-events-none text-xs">₹</span>
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-full pl-5 pr-2 py-1.5 bg-green-50 border border-green-200 rounded text-right text-sm font-black text-green-700 focus:bg-white shadow-sm outline-none"
                                                                                    value={rowData.final ?? ''}
                                                                                    onChange={(e) => handlePriceChange(day, cat.type, 'final', e.target.value)}
                                                                                    placeholder="0"
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                                }
                            </div>
                        )
                    }


                    {/* Rules Tab */}
                    {
                        activeTab === 'rules' && (
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

                    {activeTab === 'connectors' && (
                        <ConnectorAssignment propertyId={id} />
                    )}
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

const InputGroup = ({ label, value, onChange, type = 'text', readOnly = false, placeholder, onBlur }) => (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
        <label className="text-sm font-semibold text-gray-600 w-40 flex-shrink-0">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
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
