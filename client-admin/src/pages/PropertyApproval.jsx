import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { AMENITY_TYPES } from '../constants/propertyConstants';
import { FaHome, FaWater, FaCheck, FaTimes, FaCamera, FaBed, FaUtensils, FaSwimmingPool, FaChild, FaBan, FaMoneyBillWave, FaArrowRight, FaArrowLeft, FaSave, FaStar, FaParking, FaWifi, FaMusic, FaTree, FaGlassMartiniAlt, FaSnowflake, FaCouch, FaRestroom, FaDoorOpen, FaUsers, FaTshirt, FaVideo, FaWheelchair, FaMedkit, FaUmbrellaBeach, FaChair, FaUserShield, FaConciergeBell, FaHotTub } from 'react-icons/fa';
import { MdPool, MdWater, MdOutlineDeck, MdChildCare, MdWaterfallChart, MdMusicNote, MdBalcony, MdSportsEsports, MdRestaurant, MdOutlineOutdoorGrill } from 'react-icons/md';

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
    const [pricing, setPricing] = useState({
        mon_thu: {
            villa: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            extra_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            meal_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            jain_meal_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 }
        },
        fri_sun: {
            villa: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            extra_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            meal_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            jain_meal_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 }
        },
        sat: {
            villa: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            extra_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            meal_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 },
            jain_meal_person: { current: 0, discounted: 0, final: 0, vendorDiscountPercentage: 0, ourMarginPercentage: 0 }
        }
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
                    PropertyType: prop.PropertyType || '',
                    Website: prop.Website || '',
                    GoogleMapLink: prop.GoogleMapLink || '',
                    latitude: ob.latitude || '',
                    longitude: ob.longitude || '',
                    otherAmenities: (Array.isArray(ob.otherAmenities) ? ob.otherAmenities : (ob.otherAmenities ? [ob.otherAmenities] : [])).join(', '), // Hydrate
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

            let mt_villa, mt_extra, fs_villa, fs_extra, sat_villa, sat_extra;

            mt_villa = parseFloat(getVal('mon_thu', 'villa', 'current') || prop.price_mon_thu || prop.Price || 0);

            // Logic to extract Extra Guest Charges
            // Use saved current if available, else fallback to vendor price/criteria
            if (pricingData.extraGuestLimit && pricingData.extraGuestCharge) {
                if (typeof pricingData.extraGuestCharge === 'object') {
                    mt_extra = parseFloat(getVal('mon_thu', 'extra_person', 'current') || pricingData.extraGuestCharge.week || 0);
                    fs_extra = parseFloat(getVal('fri_sun', 'extra_person', 'current') || pricingData.extraGuestCharge.weekend || 0);
                    sat_extra = parseFloat(getVal('sat', 'extra_person', 'current') || pricingData.extraGuestCharge.saturday || 0);
                } else {
                    const val = parseFloat(pricingData.extraGuestCharge || 0);
                    mt_extra = parseFloat(getVal('mon_thu', 'extra_person', 'current') || val);
                    fs_extra = parseFloat(getVal('fri_sun', 'extra_person', 'current') || val);
                    sat_extra = parseFloat(getVal('sat', 'extra_person', 'current') || val);
                }
            } else if (pricingData.extraGuestCharge) {
                if (typeof pricingData.extraGuestCharge === 'object') {
                    mt_extra = parseFloat(getVal('mon_thu', 'extra_person', 'current') || pricingData.extraGuestCharge.week || pricingData.extraGuestCharge.weekday || 0);
                    fs_extra = parseFloat(getVal('fri_sun', 'extra_person', 'current') || pricingData.extraGuestCharge.weekend || 0);
                    sat_extra = parseFloat(getVal('sat', 'extra_person', 'current') || pricingData.extraGuestCharge.saturday || 0);
                } else {
                    const val = parseFloat(pricingData.extraGuestCharge || 0);
                    mt_extra = parseFloat(getVal('mon_thu', 'extra_person', 'current') || val);
                    fs_extra = parseFloat(getVal('fri_sun', 'extra_person', 'current') || val);
                    sat_extra = parseFloat(getVal('sat', 'extra_person', 'current') || val);
                }
            }

            const foodRates = ob.foodRates || {};
            const mt_meal = parseFloat(getVal('mon_thu', 'meal_person', 'current') || foodRates.veg || foodRates.nonVeg || 0);
            const jain_meal = parseFloat(getVal('mon_thu', 'jain_meal_person', 'current') || foodRates.jain || 0); // Extract Jain

            const fs_fs_villa = parseFloat(getVal('fri_sun', 'villa', 'current') || prop.price_fri_sun || 0);
            const sat_sat_villa = parseFloat(getVal('sat', 'villa', 'current') || prop.price_sat || 0);

            setPricing({
                mon_thu: {
                    villa: {
                        current: mt_villa,
                        discounted: getVal('mon_thu', 'villa', 'discounted'),
                        final: getVal('mon_thu', 'villa', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(mt_villa, getVal('mon_thu', 'villa', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('mon_thu', 'villa', 'discounted'), getVal('mon_thu', 'villa', 'final'))
                    },
                    extra_person: {
                        current: mt_extra,
                        discounted: getVal('mon_thu', 'extra_person', 'discounted'),
                        final: getVal('mon_thu', 'extra_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(mt_extra, getVal('mon_thu', 'extra_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('mon_thu', 'extra_person', 'discounted'), getVal('mon_thu', 'extra_person', 'final'))
                    },
                    meal_person: {
                        current: mt_meal,
                        discounted: getVal('mon_thu', 'meal_person', 'discounted'),
                        final: getVal('mon_thu', 'meal_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(mt_meal, getVal('mon_thu', 'meal_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('mon_thu', 'meal_person', 'discounted'), getVal('mon_thu', 'meal_person', 'final'))
                    },
                    jain_meal_person: {
                        current: jain_meal,
                        discounted: getVal('mon_thu', 'jain_meal_person', 'discounted'),
                        final: getVal('mon_thu', 'jain_meal_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(jain_meal, getVal('mon_thu', 'jain_meal_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('mon_thu', 'jain_meal_person', 'discounted'), getVal('mon_thu', 'jain_meal_person', 'final'))
                    }
                },
                fri_sun: {
                    villa: {
                        current: fs_fs_villa,
                        discounted: getVal('fri_sun', 'villa', 'discounted'),
                        final: getVal('fri_sun', 'villa', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(fs_fs_villa, getVal('fri_sun', 'villa', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('fri_sun', 'villa', 'discounted'), getVal('fri_sun', 'villa', 'final'))
                    },
                    extra_person: {
                        current: fs_extra,
                        discounted: getVal('fri_sun', 'extra_person', 'discounted'),
                        final: getVal('fri_sun', 'extra_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(fs_extra, getVal('fri_sun', 'extra_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('fri_sun', 'extra_person', 'discounted'), getVal('fri_sun', 'extra_person', 'final'))
                    },
                    meal_person: {
                        current: mt_meal,
                        discounted: getVal('fri_sun', 'meal_person', 'discounted'),
                        final: getVal('fri_sun', 'meal_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(mt_meal, getVal('fri_sun', 'meal_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('fri_sun', 'meal_person', 'discounted'), getVal('fri_sun', 'meal_person', 'final'))
                    },
                    jain_meal_person: {
                        current: jain_meal,
                        discounted: getVal('fri_sun', 'jain_meal_person', 'discounted'),
                        final: getVal('fri_sun', 'jain_meal_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(jain_meal, getVal('fri_sun', 'jain_meal_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('fri_sun', 'jain_meal_person', 'discounted'), getVal('fri_sun', 'jain_meal_person', 'final'))
                    }
                },
                sat: {
                    villa: {
                        current: sat_sat_villa,
                        discounted: getVal('sat', 'villa', 'discounted'),
                        final: getVal('sat', 'villa', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(sat_sat_villa, getVal('sat', 'villa', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('sat', 'villa', 'discounted'), getVal('sat', 'villa', 'final'))
                    },
                    extra_person: {
                        current: sat_extra,
                        discounted: getVal('sat', 'extra_person', 'discounted'),
                        final: getVal('sat', 'extra_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(sat_extra, getVal('sat', 'extra_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('sat', 'extra_person', 'discounted'), getVal('sat', 'extra_person', 'final'))
                    },
                    meal_person: {
                        current: mt_meal,
                        discounted: getVal('sat', 'meal_person', 'discounted'),
                        final: getVal('sat', 'meal_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(mt_meal, getVal('sat', 'meal_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('sat', 'meal_person', 'discounted'), getVal('sat', 'meal_person', 'final'))
                    },
                    jain_meal_person: {
                        current: jain_meal,
                        discounted: getVal('sat', 'jain_meal_person', 'discounted'),
                        final: getVal('sat', 'jain_meal_person', 'final'),
                        vendorDiscountPercentage: getVendorDiscountPercentage(jain_meal, getVal('sat', 'jain_meal_person', 'discounted')),
                        ourMarginPercentage: getOurMarginPercentage(getVal('sat', 'jain_meal_person', 'discounted'), getVal('sat', 'jain_meal_person', 'final'))
                    }
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
                otherAmenities: formData.otherAmenities ? formData.otherAmenities.split(',').map(s => s.trim()).filter(Boolean) : [], // Submit
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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Additional Amenities (Other)</label>
                                <textarea
                                    value={formData.otherAmenities || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, otherAmenities: e.target.value }))}
                                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 outline-none h-24 resize-none"
                                    placeholder="E.g. Gym, Spa, Yoga Center..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Rooms Tab */}
                    {activeTab === 'rooms' && property.PropertyType === 'Villa' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Living Rooms */}
                            {(formData.RoomConfig?.livingRooms || (formData.RoomConfig?.livingRoom ? [formData.RoomConfig.livingRoom] : [])).map((room, idx) => (
                                <div key={idx} className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6">
                                    <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                                        <FaCouch /> Living Room {idx + 1}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Bed Type</label>
                                            <select
                                                value={room.bedType || 'Sofa'}
                                                onChange={(e) => {
                                                    const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])];
                                                    updatedRooms[idx] = { ...updatedRooms[idx], bedType: e.target.value };
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms } // Always save as livingRooms array
                                                    }));
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                            >
                                                <option value="Sofa">Sofa</option>
                                                <option value="Sofa cum Bed">Sofa cum Bed</option>
                                                <option value="None">None</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                            <span className="text-sm font-semibold">AC</span>
                                            <Toggle
                                                active={!!room.ac}
                                                onChange={(val) => {
                                                    const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])];
                                                    updatedRooms[idx] = { ...updatedRooms[idx], ac: val };
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                    }));
                                                }}
                                                color="green"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                            <span className="text-sm font-semibold">TV</span>
                                            <Toggle
                                                active={!!room.tv}
                                                onChange={(val) => {
                                                    const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])];
                                                    updatedRooms[idx] = { ...updatedRooms[idx], tv: val };
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                    }));
                                                }}
                                                color="green"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                            <span className="text-sm font-semibold">Bathroom</span>
                                            <Toggle
                                                active={!!room.bathroom}
                                                onChange={(val) => {
                                                    const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])];
                                                    updatedRooms[idx] = { ...updatedRooms[idx], bathroom: val };
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                    }));
                                                }}
                                                color="green"
                                            />
                                        </div>
                                        {room.bathroom && (
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Toilet Type</label>
                                                <select
                                                    value={room.toiletType || 'Western'}
                                                    onChange={(e) => {
                                                        const updatedRooms = [...(formData.RoomConfig?.livingRooms || [formData.RoomConfig?.livingRoom])];
                                                        updatedRooms[idx] = { ...updatedRooms[idx], toiletType: e.target.value };
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            RoomConfig: { ...prev.RoomConfig, livingRooms: updatedRooms }
                                                        }));
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                                >
                                                    <option value="Western">Western</option>
                                                    <option value="Indian">Indian</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

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
                                                    <div key={feature} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
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
                                    <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-yellow-600 font-bold uppercase">Jain</p>
                                        <p className="text-lg font-black">{obData.foodRates?.jain ? `₹${obData.foodRates.jain}` : <span className="text-gray-400 text-sm">--</span>}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Media Tab */}
                    {activeTab === 'media' && (
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
                                                        if (window.confirm("Are you sure you want to delete this photo?")) {
                                                            setDeletedImages(prev => [...prev, img.id]);
                                                        }
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
                                                            <th className="px-6 py-4 text-right">Vendor Disc %</th>
                                                            <th className="px-6 py-4 text-right">Our Rate</th>
                                                            <th className="px-6 py-4 text-right">Our Margin %</th>
                                                            <th className="px-6 py-4 text-right rounded-tr-lg">Customer Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {[
                                                            { label: 'Villa Base Price', type: 'villa', icon: '🏡' },
                                                            { label: 'Extra Person', type: 'extra_person', icon: '👤' },
                                                            { label: 'Meal per Person', type: 'meal_person', icon: '🍽️' },
                                                            { label: 'Jain Meal per Person', type: 'jain_meal_person', icon: '🥕' }
                                                        ].map((item) => {
                                                            const errorKey = `${day}-${item.type}`;
                                                            const hasError = pricingErrors[errorKey];
                                                            return (
                                                                <React.Fragment key={item.type}>
                                                                    <tr className={`group hover:bg-${color}-50/30 transition-colors duration-200 ${hasError ? 'bg-red-50' : ''}`}>
                                                                        <td className="px-6 py-4 font-bold text-gray-700 flex items-center gap-3">
                                                                            <span className={`w-8 h-8 rounded-full bg-${color}-50 flex items-center justify-center text-lg shadow-sm border border-${color}-100 text-${color}-600`}>
                                                                                {item.icon}
                                                                            </span>
                                                                            {item.label}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right tabular-nums text-gray-500 font-medium">
                                                                            <div className="flex justify-end">
                                                                                <div className="relative w-24">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₹</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-right font-medium text-gray-800 placeholder-gray-300"
                                                                                        value={pricing[day][item.type].current ?? ''}
                                                                                        onChange={(e) => handlePriceChange(day, item.type, 'current', e.target.value)}
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end">
                                                                                <div className="relative w-24">
                                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">%</span>
                                                                                    <input type="number"
                                                                                        className={`w-full pr-7 pl-3 py-2 bg-gray-50 border rounded-lg outline-none focus:border-${color}-400 focus:bg-white focus:ring-4 focus:ring-${color}-100 transition-all text-right font-medium text-gray-800 placeholder-gray-300 ${hasError ? 'border-red-300' : 'border-gray-200'}`}
                                                                                        value={pricing[day][item.type].vendorDiscountPercentage || ''}
                                                                                        onChange={(e) => handlePriceChange(day, item.type, 'vendorDiscountPercentage', e.target.value)}
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end">
                                                                                <div className="relative w-36">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">₹</span>
                                                                                    <input type="number"
                                                                                        className={`w-full pl-7 pr-3 py-2 bg-gray-50 border rounded-lg outline-none focus:border-${color}-400 focus:bg-white focus:ring-4 focus:ring-${color}-100 transition-all text-right font-medium text-gray-800 placeholder-gray-300 ${hasError ? 'border-red-300' : 'border-gray-200'}`}
                                                                                        value={pricing[day][item.type].discounted || ''}
                                                                                        onChange={(e) => handlePriceChange(day, item.type, 'discounted', e.target.value)}
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end">
                                                                                <div className="relative w-24">
                                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">%</span>
                                                                                    <input type="number"
                                                                                        className={`w-full pr-7 pl-3 py-2 bg-gray-50 border rounded-lg outline-none focus:border-${color}-400 focus:bg-white focus:ring-4 focus:ring-${color}-100 transition-all text-right font-medium text-gray-800 placeholder-gray-300 ${hasError ? 'border-red-300' : 'border-gray-200'}`}
                                                                                        value={pricing[day][item.type].ourMarginPercentage || ''}
                                                                                        onChange={(e) => handlePriceChange(day, item.type, 'ourMarginPercentage', e.target.value)}
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-right">
                                                                            <div className="flex justify-end">
                                                                                <div className="relative w-36">
                                                                                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-${color}-500 font-bold pointer-events-none`}>₹</span>
                                                                                    <input type="number"
                                                                                        className={`w-full pl-7 pr-3 py-2 bg-${color}-50/50 border rounded-lg outline-none focus:border-${color}-500 focus:bg-white focus:ring-4 focus:ring-${color}-100 transition-all text-right font-black text-${color}-700 placeholder-${color}-300 shadow-sm ${hasError ? 'border-red-400' : `border-${color}-200`}`}
                                                                                        value={pricing[day][item.type].final || ''}
                                                                                        onChange={(e) => handlePriceChange(day, item.type, 'final', e.target.value)}
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    {hasError && (
                                                                        <tr>
                                                                            <td colSpan="6" className="px-6 py-2 text-right">
                                                                                <span className="text-xs text-red-600 font-medium">{hasError}</span>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
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
