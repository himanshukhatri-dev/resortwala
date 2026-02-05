import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaArrowLeft, FaShieldAlt, FaTicketAlt, FaCalendarAlt, FaUserFriends, FaCheckCircle, FaPercentage, FaReceipt, FaLock, FaUtensils } from 'react-icons/fa';
import { format, differenceInDays, addDays, isValid } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const PAY_NOW_PERCENT = 0.1; // 10% Token Amount for Villas

export default function BookingPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state || {};
    const { user, loading } = useAuth();

    // -- STATE --
    const [property, setProperty] = useState(null);
    const [bookingStatus, setBookingStatus] = useState('idle');

    // Dates
    const [dateRange] = useState({
        from: locationState.dateRange?.from ? new Date(locationState.dateRange.from) : (locationState.checkIn ? new Date(locationState.checkIn) : new Date()),
        to: locationState.dateRange?.to ? new Date(locationState.dateRange.to) : (locationState.checkOut ? new Date(locationState.checkOut) : addDays(new Date(), 1))
    });

    // Guests
    const [guests] = useState(locationState.guests || { adults: 2, children: 0, infants: 0 });
    const guestCount = (guests.adults || 0) + (guests.children || 0);

    // Form
    const [form, setForm] = useState({
        CustomerName: user?.name || '',
        CustomerMobile: user?.phone || '',
        CustomerEmail: user?.email || '',
        SpecialRequest: ''
    });

    // Coupons
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    // -- AUTH CHECK --
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true, state: { returnTo: location.pathname, bookingState: locationState } });
        } else if (user) {
            setForm(prev => ({
                ...prev,
                CustomerName: user.name || prev.CustomerName,
                CustomerEmail: user.email || prev.CustomerEmail,
                CustomerMobile: user.phone || prev.CustomerMobile
            }));
        }
    }, [user, loading, navigate, location.pathname, locationState]);

    // -- FETCH PROPERTY --
    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/properties/${slug}`);
                setProperty(response.data);
            } catch (error) { console.error("Error fetching property", error); }
        };
        fetchProperty();
    }, [slug]);

    // -- CALCULATIONS --
    const getPricingDetails = () => {
        if (!property || !dateRange.from) return null;

        const checkIsWaterpark = (p) => {
            const type = (p.PropertyType || p.property_type || p.display_type || '').toLowerCase();
            const name = (p.Name || '').toLowerCase();
            return type.includes('water') || name.includes('water') || type.includes('resort');
        };
        const isWaterpark = checkIsWaterpark(property);
        if (!isWaterpark && !dateRange.to) return null;

        const effectiveTo = dateRange.to || dateRange.from;
        let nights = differenceInDays(effectiveTo, dateRange.from);
        if (isWaterpark && nights === 0) nights = 1;

        // Use passed breakdown if available and it matches current logic requirements
        if (locationState.breakdown && locationState.breakdown.nights === nights) {
            // return { ...locationState.breakdown, isWaterpark }; // Keep it for now or recalculate
        }

        const safeFloat = (val, def = 0) => {
            const n = parseFloat(val);
            return isNaN(n) ? def : n;
        };

        const ob = property.onboarding_data || {};
        const obPricing = ob.pricing || {};
        const adminPricing = property.admin_pricing || {};

        const getPriceBase = (path) => {
            const val = path?.villa?.final || path;
            return (val && parseFloat(val) > 0) ? parseFloat(val) : 0;
        };

        const PRICE_WEEKDAY = property ? (property.display_price || getPriceBase(adminPricing?.mon_thu) || parseFloat(property.price_mon_thu) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0) : 0;
        const PRICE_FRISUN = property ? (property.display_price || getPriceBase(adminPricing?.fri_sun) || parseFloat(property.price_fri_sun) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0) : 0;
        const PRICE_SATURDAY = property ? (property.display_price || getPriceBase(adminPricing?.sat) || parseFloat(property.price_sat) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0) : 0;

        const EXTRA_GUEST_CHARGE = safeFloat(obPricing?.extraGuestCharge, 1000);
        const GST_PERCENTAGE = safeFloat(property?.gst_percentage, 18);
        const FOOD_CHARGE = safeFloat(ob.foodRates?.perPerson || ob.foodRates?.veg, 1000);

        let totalVillaRate = 0;
        let totalExtra = 0;
        let totalFood = 0;
        let nightDetails = [];

        // Meal Rates
        const mealSelection = locationState.mealSelection || 0;
        const VEG_RATE = safeFloat(ob.foodRates?.veg || FOOD_CHARGE, 1000);
        const NONVEG_RATE = safeFloat(ob.foodRates?.nonVeg || ob.foodRates?.nonveg || FOOD_CHARGE, 1200);
        const JAIN_RATE = safeFloat(ob.foodRates?.jain || VEG_RATE, 1000);
        const MAX_MEAL_RATE = Math.max(VEG_RATE, NONVEG_RATE, JAIN_RATE);

        const baseLimit = parseInt(property?.Occupancy || ob.pricing?.extraGuestLimit || 12);

        for (let i = 0; i < nights; i++) {
            const d = new Date(dateRange.from);
            d.setDate(d.getDate() + i);
            const w = d.getDay();

            // Check for Holiday Override
            const holiday = property.holidays?.find(h => {
                const dStr = format(d, 'yyyy-MM-dd');
                const hStart = h.from_date ? h.from_date.substring(0, 10) : '';
                const hEnd = h.to_date ? h.to_date.substring(0, 10) : '';
                return dStr >= hStart && dStr <= hEnd;
            });

            // 1. Base Rate
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayKey = dayNames[w];
            const dayPricing = adminPricing?.[dayKey];

            let rate = 0;
            if (holiday) {
                rate = parseFloat(holiday.base_price);
            } else {
                if (dayPricing?.villa?.final) {
                    rate = parseFloat(dayPricing.villa.final);
                } else {
                    if (w === 6) rate = parseFloat(PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY);
                    else if (w === 0 || w === 5) rate = parseFloat(PRICE_FRISUN || PRICE_WEEKDAY);
                    else rate = parseFloat(PRICE_WEEKDAY);
                }
            }
            if (isNaN(rate)) rate = 0;
            totalVillaRate += rate;

            // 2. Extra Guest (Day-wise)
            let dailyExtraCharge = EXTRA_GUEST_CHARGE;
            if (dayPricing?.extra_person?.final) {
                dailyExtraCharge = parseFloat(dayPricing.extra_person.final);
            }
            const currentTotalGuests = (guests.adults || 0) + (guests.children || 0);
            const extraCount = Math.max(0, currentTotalGuests - baseLimit);
            const dailyExtraTotal = extraCount * dailyExtraCharge;
            totalExtra += dailyExtraTotal;

            // 3. Food (Max of Veg/NonVeg/Jain vs Daily DB Rates)
            let dailyVeg = VEG_RATE;
            let dailyJain = JAIN_RATE;

            if (dayPricing?.meal_person?.final) {
                dailyVeg = parseFloat(dayPricing.meal_person.final);
            }
            if (dayPricing?.jain_meal_person?.final) {
                dailyJain = parseFloat(dayPricing.jain_meal_person.final);
            }
            const dailyMaxMeal = Math.max(dailyVeg, NONVEG_RATE, dailyJain);
            const dailyFoodTotal = mealSelection * dailyMaxMeal;
            totalFood += dailyFoodTotal;

            nightDetails.push({
                date: format(d, 'MMM dd'),
                rate,
                extra: dailyExtraTotal,
                food: dailyFoodTotal
            });
        }

        if (isWaterpark) {
            let totalAdultTicket = 0;
            let totalChildTicket = 0;
            let adultTicketRate = 0;
            let adultMarketRate = 0;
            let childTicketRate = 0;
            let childMarketRate = 0;

            for (let i = 0; i < nights; i++) {
                const d = new Date(dateRange.from); d.setDate(d.getDate() + i);
                const w = d.getDay();
                const isW = (w === 0 || w === 6 || w === 5);
                const suffix = isW ? 'weekend' : 'weekday';

                let aRate = parseFloat(adminPricing[`adult_${suffix}`]?.final || adminPricing[`adult_${suffix}`] || (isW ? (PRICE_SATURDAY || PRICE_FRISUN || 700) : (PRICE_WEEKDAY || 600)));
                let cRate = parseFloat(adminPricing[`child_${suffix}`]?.final || adminPricing[`child_${suffix}`] || 500);

                totalAdultTicket += (aRate * guests.adults);
                totalChildTicket += (cRate * guests.children);

                if (i === 0) {
                    adultTicketRate = aRate;
                    adultMarketRate = parseFloat(adminPricing[`adult_${suffix}`]?.current || aRate);
                    childTicketRate = cRate;
                    childMarketRate = parseFloat(adminPricing[`child_${suffix}`]?.current || cRate);
                }
                nightDetails.push({ date: format(d, 'MMM dd'), rate: aRate });
            }

            const grantTotal = totalAdultTicket + totalChildTicket;
            const tokenAmount = (guestCount * (locationState.breakdown?.tokenAmountPerGuest || 50));

            return {
                nights,
                base: grantTotal,
                total: grantTotal,
                totalAdultTicket,
                totalChildTicket,
                adultTicketRate,
                adultMarketRate,
                childTicketRate,
                childMarketRate,
                tokenAmount,
                gst: 0,
                isWaterpark: true,
                nightDetails
            };
        }

        // Legacy Calculation Removed - Now Calculated in Loop
        // const extraGuests = Math.max(0, guests.adults - baseLimit);
        // const totalExtra = extraGuests * EXTRA_GUEST_CHARGE * nights; --> Replaced by totalExtra

        // const mealSelection = locationState.mealSelection || 0;
        // const VEG_RATE = ... --> Replaced by totalFood logic in loop

        const taxable = totalVillaRate + totalExtra + totalFood;
        const gst = (taxable * GST_PERCENTAGE) / 100;

        return {
            nights,
            base: totalVillaRate,
            extra: totalExtra,
            food: totalFood,
            gst,
            total: taxable + gst,
            tokenAmount: Math.ceil(taxable * PAY_NOW_PERCENT),
            nightDetails,
            isWaterpark: false
        };
    };

    const details = getPricingDetails();

    // Coupon Logic
    const handleCouponApply = async () => {
        if (!couponCode) return;
        setBookingStatus('checking_coupon'); setCouponError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/coupons/check`, { code: couponCode });
            setAppliedCoupon(res.data.coupon);
            setBookingStatus('idle');
        } catch (err) {
            setAppliedCoupon(null); setCouponError('Invalid Coupon Code'); setBookingStatus('idle');
        }
    };

    const discountAmount = (appliedCoupon && details)
        ? (appliedCoupon.discount_type === 'percentage'
            ? ((details.total - (details.gst || 0)) * appliedCoupon.value / 100)
            : parseFloat(appliedCoupon.value))
        : 0;

    const finalTotal = details ? Math.max(0, details.total - discountAmount - (details.gst || 0)) : 0;

    const payNowAmount = details?.tokenAmount || 0;
    const balanceAmount = Math.max(0, finalTotal - payNowAmount);

    const handleSubmit = async () => {
        if (!form.CustomerName || !form.CustomerMobile) {
            alert("Please fill in your details.");
            return;
        }
        setBookingStatus('submitting');
        const payload = {
            PropertyId: property.PropertyId || property.id,
            CustomerName: form.CustomerName,
            CustomerMobile: form.CustomerMobile,
            CustomerEmail: form.CustomerEmail,
            CheckInDate: format(dateRange.from, 'yyyy-MM-dd'),
            CheckOutDate: format(dateRange.to, 'yyyy-MM-dd'),
            Guests: guestCount,
            TotalAmount: finalTotal,
            paid_amount: payNowAmount,
            base_amount: details.base,
            tax_amount: details.gst,
            discount_amount: discountAmount,
            coupon_code: appliedCoupon?.code,
            payment_method: 'upi',
            SpecialRequest: form.SpecialRequest,
            booking_source: 'web_direct',
            Status: 'Pending',
            metadata: { isTokenPayment: true, breakdown: details, balanceAmount }
        };
        try {
            const res = await axios.post(`${API_BASE_URL}/bookings`, payload);
            if (res.data.payment_required && res.data.redirect_url) {
                window.location.href = res.data.redirect_url;
            } else {
                const bookingId = res.data.booking?.BookingId || res.data.booking?.id;
                navigate(`/booking/${bookingId}/success`);
            }
        } catch (e) {
            console.error(e);
            alert("Booking failed. Please try again.");
            setBookingStatus('idle');
        }
    };

    if (!property || !details) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    const getBackUrl = () => {
        const params = new URLSearchParams();
        if (dateRange.from) params.set('start', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange.to) params.set('end', format(dateRange.to, 'yyyy-MM-dd'));
        params.set('adults', guests.adults || 2);
        params.set('children', guests.children || 0);
        params.set('meals', locationState.mealSelection || 0);
        return `/property/${slug}?${params.toString()}`;
    };

    const handleBackToChange = () => {
        navigate(getBackUrl(), {
            state: {
                ...locationState,
                guests,
                dateRange,
                mealSelection: locationState.mealSelection,
                openDatePicker: true
            }
        });
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-32 pt-28 font-outfit">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header with Back */}
                <div className="mb-8 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition">
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Confirm and Pay</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] gap-8">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">

                        {/* 1. YOUR TRIP */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FaCalendarAlt className="text-blue-500" /> Your Trip
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-gray-900">
                                            {format(dateRange.from, 'dd MMM yyyy')}
                                            {!details.isWaterpark && dateRange.to && ` - ${format(dateRange.to, 'dd MMM yyyy')}`}
                                        </div>
                                    </div>
                                    <button onClick={handleBackToChange} className="text-xs font-bold text-blue-600 hover:underline">Change Date</button>
                                </div>

                                {/* Mobile-friendly context for changes */}
                                <div className="lg:hidden bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse"></div>
                                    <p className="text-[10px] text-blue-700 font-bold leading-tight">Price and availability may change if you select different dates.</p>
                                </div>

                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Guests</div>
                                        <div className="font-bold text-gray-900">{guests.adults} Adult, {guests.children} Child</div>
                                    </div>
                                    <button onClick={handleBackToChange} className="text-xs font-bold text-blue-600 hover:underline">Change Guests</button>
                                </div>
                            </div>
                        </div>

                        {/* 2. CONTACT DETAILS */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FaUserFriends className="text-green-500" /> Contact Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.CustomerName}
                                        onChange={e => setForm({ ...form, CustomerName: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-bold text-gray-900 focus:outline-none focus:border-black focus:bg-white transition"
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={form.CustomerMobile}
                                            onChange={e => setForm({ ...form, CustomerMobile: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-bold text-gray-900 focus:outline-none focus:border-black focus:bg-white transition"
                                            placeholder="+91 98765 00000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={form.CustomerEmail}
                                            onChange={e => setForm({ ...form, CustomerEmail: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-bold text-gray-900 focus:outline-none focus:border-black focus:bg-white transition"
                                            placeholder="rahul@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Special Request (Optional)</label>
                                    <textarea
                                        rows="2"
                                        value={form.SpecialRequest}
                                        onChange={e => setForm({ ...form, SpecialRequest: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-medium text-gray-900 focus:outline-none focus:border-black focus:bg-white transition resize-none"
                                        placeholder="Early check-in needed..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. PAYMENT METHOD */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FaLock className="text-purple-500" /> Payment Method
                            </h2>
                            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                            <img src="https://cdn.worldvectorlogo.com/logos/upi-logo.svg" alt="UPI" className="w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">Online Payment</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">UPI / GPay / PhonePe</p>
                                        </div>
                                    </div>
                                    <FaCheckCircle className="text-green-500" />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-white p-3 rounded-xl border border-gray-100 mt-2">
                                    <FaShieldAlt className="text-blue-400" />
                                    <span>Secure database encryption. We do not store card details.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PAYMENT SUMMARY */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative overflow-hidden">

                            {/* Property Card */}
                            <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                                    <img
                                        src={property.images?.[0]?.Image || property.Image || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800"}
                                        alt={property.Name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Property</div>
                                    <h4 className="font-black text-gray-900 leading-tight mb-1">{property.Name || "Luxury Villa"}</h4>
                                    <div className="flex items-center gap-1">
                                        <div className="flex text-yellow-400 text-[10px]"><FaTicketAlt size={8} /></div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{details.isWaterpark ? 'Waterpark' : (property.PropertyType || "Villa")}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {/* Detailed Night-wise Breakdown */}
                                {details.nightDetails?.length > 1 && !details.isWaterpark && (
                                    <div className="space-y-1 mb-2">
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Nightly Rates</div>
                                        {details.nightDetails.map((night, idx) => (
                                            <div key={idx} className="flex justify-between text-[11px] text-gray-600">
                                                <span>{night.date}</span>
                                                <span className="font-bold text-gray-900">₹{night.rate.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {details.isWaterpark ? (
                                    <div className="space-y-3">
                                        <div className="text-[10px] uppercase font-bold text-gray-400 border-b border-gray-50 pb-1">Booking Summary</div>
                                        <div className="flex justify-between items-center text-gray-600 text-[13px]">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">Adult ({guests.adults})</span>
                                                <div className="flex items-center gap-1.5">
                                                    {details.adultMarketRate > details.adultTicketRate && (
                                                        <span className="text-[10px] text-gray-400 line-through">₹{details.adultMarketRate?.toLocaleString()}</span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400">₹{details.adultTicketRate?.toLocaleString()} x {guests.adults}</span>
                                                </div>
                                            </div>
                                            <span className="font-black text-gray-900">₹{details.totalAdultTicket?.toLocaleString()}</span>
                                        </div>
                                        {guests.children > 0 && (
                                            <div className="flex justify-between items-center text-gray-600 text-[13px]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">Child ({guests.children})</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {details.childMarketRate > details.childTicketRate && (
                                                            <span className="text-[10px] text-gray-400 line-through">₹{details.childMarketRate?.toLocaleString()}</span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400">₹{details.childTicketRate?.toLocaleString()} x {guests.children}</span>
                                                    </div>
                                                </div>
                                                <span className="font-black text-gray-900">₹{details.totalChildTicket?.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center text-gray-600 text-sm">
                                            <span className="font-medium text-gray-900">
                                                {details.nights > 1 ? `Villa Rental (${details.nights} nights)` : 'Villa Rental'}
                                            </span>
                                            <span className="font-black text-gray-900">₹{details.base?.toLocaleString()}</span>
                                        </div>
                                        {details.food > 0 && (
                                            <div className="flex justify-between items-center text-gray-600 text-sm">
                                                <span className="font-medium">Meal Charges × {locationState.mealSelection} person</span>
                                                <span className="font-black text-gray-900">₹{details.food?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {details.extra > 0 && (
                                            <div className="flex justify-between items-center text-gray-600 text-sm">
                                                <span className="font-medium">Extra Guest Charges</span>
                                                <span className="font-black text-gray-900">₹{details.extra?.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="flex justify-between items-center text-gray-900 pt-4 border-t border-gray-100 mt-4">
                                    <span className="text-base font-black uppercase tracking-tight">Total Amount</span>
                                    <span className="text-2xl font-black">₹{finalTotal.toLocaleString()} {!details.isWaterpark && <span className="text-xs text-gray-400 font-bold">+ GST</span>}</span>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 my-6"></div>

                            {/* Amount to Book Section */}
                            <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 mb-8">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Amount to Book</span>
                                </div>
                                <div className="text-4xl font-black text-gray-900 mb-1">₹{payNowAmount.toLocaleString()}</div>
                                <div className="flex justify-between items-center">
                                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        {details.isWaterpark ? 'Registration Amount' : 'Booking Amount'}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                                        Pay at {details.isWaterpark ? 'Park' : 'Villa'}: <span className="text-gray-900 font-black">₹{balanceAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Input */}
                            <div className="mb-6">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">COUPON CODE (IF ANY)</div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="ENTER CODE"
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-black uppercase outline-none focus:border-blue-600 focus:bg-white transition"
                                    />
                                    <button
                                        onClick={handleCouponApply}
                                        disabled={!couponCode || bookingStatus === 'checking_coupon'}
                                        className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-black transition-colors disabled:opacity-50"
                                    >
                                        APPLY
                                    </button>
                                </div>
                                {couponError && <div className="text-red-500 text-[10px] font-bold mt-2 ml-1">{couponError}</div>}
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={bookingStatus === 'submitting'}
                                className="w-full bg-[#FF385C] hover:bg-[#D9324E] text-white h-16 rounded-2xl font-black text-lg shadow-xl shadow-red-100 items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 flex mb-4 mt-8"
                            >
                                {bookingStatus === 'submitting' ? 'Processing...' : `Pay ₹${payNowAmount.toLocaleString()} Now`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Sticky Footer */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] lg:hidden z-50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <button
                                onClick={handleBackToChange}
                                className="text-[10px] font-bold text-blue-600 uppercase tracking-wider text-left hover:underline mb-1 flex items-center gap-1"
                            >
                                Edit Details
                            </button>
                            <span className="text-2xl font-black text-gray-900">₹{payNowAmount.toLocaleString()}</span>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                                Total: ₹{finalTotal.toLocaleString()} {details.isWaterpark ? '' : '+ GST'}
                            </span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={bookingStatus === 'submitting'}
                            className="bg-[#FF385C] hover:bg-[#d9324e] text-white h-14 px-8 rounded-2xl font-black text-base shadow-xl shadow-red-200 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {bookingStatus === 'submitting' ? 'Processing...' : (
                                <><span>Pay Now</span> <FaArrowLeft className="rotate-180 text-sm" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
