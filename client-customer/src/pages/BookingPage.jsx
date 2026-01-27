import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaStar, FaGoogle, FaCreditCard, FaHotel, FaShieldAlt, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { format, differenceInDays, addDays, isValid } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PAY_NOW_PERCENT = 0.1; // 10% Token Amount

export default function BookingPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state || {};
    const { user, loading } = useAuth();

    // -- HELPER: Safe Dates --
    const safeDate = (input, defaultDate) => {
        if (!input) return defaultDate;
        const d = new Date(input);
        return isValid(d) ? d : defaultDate;
    };

    // -- STATE --
    const [property, setProperty] = useState(null);
    const [holidays, setHolidays] = useState([]);

    // Dates (Initialize safely)
    const [dateRange] = useState({
        from: safeDate(locationState.dateRange?.from || locationState.checkIn, new Date()),
        to: safeDate(locationState.dateRange?.to || locationState.checkOut, addDays(new Date(), 1))
    });

    // Guests
    const [guests, setGuests] = useState(locationState.guests || { adults: 2, children: 0, infants: 0 });
    const guestCount = (guests.adults || 0) + (guests.children || 0) + (guests.infants || 0);

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
    const [bookingStatus, setBookingStatus] = useState('idle');

    // -- EFFECTS --

    // Pre-fill form on auth load
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', {
                replace: true,
                state: {
                    returnTo: location.pathname,
                    bookingState: locationState // Preserve booking context (dates, guests, etc.)
                }
            });
        } else if (user) {
            setForm(prev => ({
                ...prev,
                CustomerName: user.name || prev.CustomerName,
                CustomerEmail: user.email || prev.CustomerEmail,
                CustomerMobile: user.phone || prev.CustomerMobile
            }));
        }
    }, [user, loading, location.pathname, locationState, navigate]);

    // Fetch Data
    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/properties/${slug}`);
                setProperty(response.data);

                // Fetch Holidays after property is loaded using the real ID
                const propId = response.data.PropertyId || response.data.id;
                const hRes = await axios.get(`${API_BASE_URL}/holidays?property_id=${propId}`);
                setHolidays(hRes.data);
            } catch (error) { console.error("Error fetching property/holidays", error); }
        };
        fetchProperty();
    }, [slug]);

    // -- ACTIONS --

    // "Edit" Action -> Go back to Property Page
    const handleEdit = () => {
        navigate(`/property/${slug}`, {
            state: {
                ...locationState,
                // Preserve current search if needed, or let PropertyPage handle it
                checkIn: dateRange.from,
                checkOut: dateRange.to,
                guests: guests
            }
        });
    };

    const handleCouponApply = async () => {
        if (!couponCode) return;
        setBookingStatus('loading'); setCouponError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/coupons/check`, { code: couponCode });
            setAppliedCoupon(res.data.coupon);
            setBookingStatus('idle');
        } catch (err) {
            setAppliedCoupon(null); setCouponError(err.response?.data?.message || 'Invalid coupon'); setBookingStatus('idle');
        }
    };

    // -- PRICING --
    const getPricingDetails = () => {
        if (!property) return null;
        // Basic date validation
        if (!isValid(dateRange.from)) return null;

        // Waterpark check early to handle single date
        const checkIsWaterpark = (p) => {
            if (!p) return false;
            const type = (p.PropertyType || p.property_type || p.display_type || '').toLowerCase();
            const name = (p.Name || '').toLowerCase();
            return type.includes('water') || name.includes('water') || type.includes('resort');
        };
        const isWaterpark = checkIsWaterpark(property);

        let nights = 0;
        if (isValid(dateRange.to)) {
            nights = differenceInDays(dateRange.to, dateRange.from);
        }

        // For Waterparks, if nights=0 (same day) or just 'from' is valid, treat as 1 day visit
        if (isWaterpark && nights === 0) nights = 1;

        if (nights < 1) return null;

        const ob = property.onboarding_data && typeof property.onboarding_data === 'string'
            ? JSON.parse(property.onboarding_data)
            : (property.onboarding_data || {});

        const onboardingPricing = ob.pricing || {};
        const adminPricing = property.admin_pricing || {};

        // Safe Access Helpers
        const safeFloat = (val, def = 0) => { const n = parseFloat(val); return isNaN(n) ? def : n; };

        // Helper: Get value from nested path, treat 0/"" as invalid to allow fallback
        const getPrice = (path) => {
            const val = path?.villa?.final;
            return (val && parseFloat(val) > 0) ? parseFloat(val) : 0;
        };

        // Fallback Logic: AdminPricing -> LegacyMonThu -> ResortWalaRate -> Price
        const PRICE_WEEKDAY = getPrice(adminPricing?.mon_thu) || parseFloat(property.price_mon_thu) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0;
        const PRICE_FRISUN = getPrice(adminPricing?.fri_sun) || parseFloat(property.price_fri_sun) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0;
        const PRICE_SATURDAY = getPrice(adminPricing?.sat) || parseFloat(property.price_sat) || parseFloat(property.ResortWalaRate) || parseFloat(property.Price) || 0;

        const EXTRA_GUEST_CHARGE = safeFloat(onboardingPricing?.extraGuestCharge || 0, 1000);
        const GST_PERCENTAGE = safeFloat(property.gst_percentage, 18);

        let totalVillaRate = 0;

        // isWaterpark is already calculated above

        if (isWaterpark) {
            const adminPricing = property.admin_pricing || {};
            const ob = property.onboarding_data || {};
            let totalAdultTicket = 0;
            let totalChildTicket = 0;

            for (let i = 0; i < nights; i++) {
                const d = new Date(dateRange.from);
                d.setDate(d.getDate() + i);
                if (!isValid(d)) continue;
                const w = d.getDay();
                const isWeekend = (w === 0 || w === 6 || w === 5); // Fri, Sat, Sun based on logic
                const typeSuffix = isWeekend ? 'weekend' : 'weekday';

                // Adult Rate Logic
                let aRate = parseFloat(adminPricing[`adult_${typeSuffix}`]?.final || adminPricing[`adult_${typeSuffix}`] || (isWeekend ? (PRICE_SATURDAY || PRICE_FRISUN) : PRICE_WEEKDAY));

                // Child Rate Logic
                let cRate = parseFloat(adminPricing[`child_${typeSuffix}`]?.final || adminPricing[`child_${typeSuffix}`] || ob.childCriteria?.[`${typeSuffix}Price`] || ob.childCriteria?.price || 500);

                totalAdultTicket += (aRate * (guests.adults || 0));
                totalChildTicket += (cRate * (guests.children || 0));
            }

            totalVillaRate = totalAdultTicket + totalChildTicket;

            // Populate breakdown for consistency (though local)
            // Note: BookingPage doesn't write back to locationState, but details.base needs to reflect this total.
        } else {
            // Loop through each night for Villas
            for (let i = 0; i < nights; i++) {
                const d = new Date(dateRange.from);
                d.setDate(d.getDate() + i);
                if (!isValid(d)) continue;
                const w = d.getDay();

                const holiday = property.holidays?.find(h => {
                    if (!h.from_date || !h.to_date) return false;
                    const dStr = format(d, 'yyyy-MM-dd');
                    const hStart = h.from_date.substring(0, 10);
                    const hEnd = h.to_date.substring(0, 10);
                    return dStr >= hStart && dStr <= hEnd;
                });

                if (holiday) {
                    totalVillaRate += parseFloat(holiday.base_price || 0);
                } else {
                    if (w === 6) totalVillaRate += (PRICE_SATURDAY || PRICE_FRISUN || PRICE_WEEKDAY);
                    else if (w === 0 || w === 5) totalVillaRate += (PRICE_FRISUN || PRICE_WEEKDAY);
                    else totalVillaRate += PRICE_WEEKDAY;
                }
            }
        }

        // Fix: Children are exempt from capacity in Villas. Only Adults count towards limits/extra charges.
        const totalGuests = (guests.adults || 0);
        const baseGuestLimit = parseInt(property?.Occupancy || onboardingPricing?.extraGuestLimit || 12);
        const extraPeople = Math.max(0, totalGuests - baseGuestLimit);
        const totalExtra = isWaterpark ? 0 : (extraPeople * EXTRA_GUEST_CHARGE * nights);
        const totalFood = locationState.breakdown?.totalFood || 0;

        let taxable = totalVillaRate + totalExtra + totalFood;

        // Coupon
        let discountVal = 0;
        if (appliedCoupon) {
            const val = parseFloat(appliedCoupon.value) || 0;
            if (appliedCoupon.discount_type === 'percentage') discountVal = (taxable * val) / 100;
            else discountVal = val;
        }
        taxable -= discountVal;

        const gstAmount = (taxable * GST_PERCENTAGE) / 100;
        const grantTotal = Math.max(0, taxable + gstAmount);
        return {
            nights,
            base: totalVillaRate,
            extra: totalExtra,
            food: totalFood,
            gst: gstAmount,
            discount: discountVal,
            total: grantTotal,
            isWaterpark
        };
    };

    const details = getPricingDetails();

    // WATERPARK TOKEN: Try to get from locationState (passed from details), then fallback to 50
    const wpTokenAmount = locationState.breakdown?.tokenAmountPerGuest || 50;

    const payNowAmount = (details?.isWaterpark || locationState.breakdown?.isWaterpark)
        ? (locationState.breakdown?.tokenAmount || (guestCount * wpTokenAmount))
        : (details ? Math.ceil((details.total - details.gst) * PAY_NOW_PERCENT) : 0);

    const balanceAmount = details ? details.total - payNowAmount : 0;

    // -- SUBMIT --
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login', { state: { returnTo: location.pathname, bookingState: locationState } });
            return;
        }
        if (!details) return;
        setBookingStatus('submitting');

        const payload = {
            PropertyId: property.PropertyId || property.id,
            CustomerName: form.CustomerName,
            CustomerMobile: form.CustomerMobile,
            CustomerEmail: form.CustomerEmail,
            CheckInDate: format(dateRange.from, 'yyyy-MM-dd'),
            CheckOutDate: format(dateRange.to, 'yyyy-MM-dd'),
            Guests: guestCount,
            TotalAmount: details.total,
            paid_amount: payNowAmount,
            base_amount: details.base,
            tax_amount: details.gst,
            extra_guest_charge: details.extra,
            food_charge: details.food,
            discount_amount: details.discount,
            coupon_code: appliedCoupon?.code || null,
            payment_method: 'upi',
            SpecialRequest: form.SpecialRequest,
            booking_source: 'customer_app',
            Status: 'Pending',
            metadata: {
                isTokenPayment: true,
                totalPropertyPrice: details.total,
                balanceAmount: balanceAmount,
                breakdown: details
            }
        };

        try {
            const res = await axios.post(`${API_BASE_URL}/bookings`, payload);

            if (res.data.payment_required && res.data.redirect_url) {
                window.location.href = res.data.redirect_url;
            } else {
                const bookingId = res.data.booking?.BookingId || res.data.booking?.id;
                navigate(`/booking/${bookingId}/success`);
            }
        } catch (error) {
            console.error(error);
            alert(`Booking Failed: ${error.response?.data?.message || "Unknown error"}`);
            setBookingStatus('idle');
        }
    };

    // Render Loading State Safe Guard
    if (!property) return <div className="pt-32 text-center">Loading Property...</div>;
    if (!isValid(dateRange.from) || !isValid(dateRange.to)) return <div className="pt-32 text-center">Invalid Dates Selection</div>;

    return (
        <div className="pt-32 pb-24 min-h-screen bg-gray-50 font-outfit">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-black transition">
                        <FaArrowLeft /> Back
                    </button>
                    <span>/</span>
                    <span className="font-semibold text-black">Confirm and Pay</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

                    {/* LEFT COLUMN: DETAILS & FORM (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. TRIP DETAILS (EDITABLE) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Your Trip</h2>

                            {/* DATES */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Dates</h3>
                                    <p className="text-gray-600 text-sm">
                                        {format(dateRange.from, 'MMM dd, yyyy')}
                                        {/* Show end date only if different from start (for Villas) or if range explicitly selected */}
                                        {differenceInDays(dateRange.to, dateRange.from) > 1 && ` – ${format(dateRange.to, 'MMM dd, yyyy')}`}
                                    </p>
                                </div>
                                {/* EDIT ACTION - Simply navigate back for dates for now as full calendar is complex to inline here without huge refactor */}
                                <button
                                    onClick={handleEdit}
                                    className="text-black font-semibold text-sm underline decoration-gray-300 underline-offset-4 hover:decoration-black transition"
                                >
                                    Change Date
                                </button>
                            </div>

                            {/* GUESTS - NOT EDITABLE INLINE */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Guests</h3>
                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adults</span>
                                                <span className="text-sm font-bold text-gray-900">{guests.adults}</span>
                                            </div>
                                            <div className="w-px h-6 bg-gray-200"></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kids</span>
                                                <span className="text-sm font-bold text-gray-900">{guests.children}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleEdit}
                                    className="text-black font-semibold text-sm underline decoration-gray-300 underline-offset-4 hover:decoration-black transition"
                                >
                                    Change Guests
                                </button>
                            </div>
                        </div>

                        {/* 2. GUEST INFO (FORM) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Contact Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.CustomerName}
                                        onChange={e => setForm({ ...form, CustomerName: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-black outline-none transition"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={form.CustomerMobile}
                                            onChange={e => setForm({ ...form, CustomerMobile: e.target.value })}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-black outline-none transition"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={form.CustomerEmail}
                                            onChange={e => setForm({ ...form, CustomerEmail: e.target.value })}
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:border-black outline-none transition"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Special Request (Optional)</label>
                                    <textarea
                                        rows="3"
                                        value={form.SpecialRequest}
                                        onChange={e => setForm({ ...form, SpecialRequest: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:border-black outline-none transition"
                                        placeholder="Early check-in needed..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. PAYMENT METHOD (Read Only / Hidden selection) */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4 text-gray-900">Payment Method</h2>
                            <div className="p-4 border border-teal-200 bg-teal-50 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                        <FaGoogle />
                                    </div>
                                    <div>
                                        <p className="font-bold text-teal-900">Online Payment</p>
                                        <p className="text-xs text-teal-700">UPI / GPay / PhonePe</p>
                                    </div>
                                </div>
                                <FaCheck className="text-teal-600" />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 px-1">
                                <FaShieldAlt className="inline mr-1" />
                                Secure database encryption. We do not store card details.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PRICE SUMMARY (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-6">

                            {/* Property Mini */}
                            <div className="flex gap-4 border-b border-gray-100 pb-6">
                                <img src={property.image_url || property?.images?.[0]?.image_url} className="w-20 h-20 rounded-xl object-cover" alt="Property" />
                                <div>
                                    <div className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-1">Luxury</div>
                                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">{property.Name}</h3>
                                    <div className="text-xs text-gray-500 mt-1">{property.City}</div>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            {details && (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600 text-sm">
                                        <span>₹{calculatePerNight(details).toLocaleString()} x {details.nights} nights</span>
                                        <span>₹{details.base.toLocaleString()}</span>
                                    </div>
                                    {details.extra > 0 && (
                                        <div className="flex justify-between text-gray-600 text-sm">
                                            <span>Extra Guests Charge</span>
                                            <span>₹{details.extra.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {/* Taxes line removed as per request to show only info */}
                                    <div className="border-t border-gray-100 my-2 pt-2 flex flex-col gap-1">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total Amount</span>
                                            <span>₹{(details.total - details.gst).toLocaleString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 text-right">
                                            + GST Applicable
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Token Block */}
                            <div className="bg-black text-white p-4 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-full -mr-4 -mt-4"></div>
                                <div className="relative z-10">
                                    <div className="text-xs text-gray-300 uppercase tracking-widest font-bold mb-1">Pay Now to Book</div>
                                    <div className="text-2xl font-black">₹{payNowAmount.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        <div className="text-xs text-gray-400 mt-1">
                                            {details?.isWaterpark
                                                ? `Per Ticket Charge`
                                                : '10% Token Amount'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Input */}
                            <div className="bg-gray-50 p-3 rounded-xl flex gap-2 border border-gray-200">
                                <input
                                    type="text"
                                    placeholder="COUPON CODE"
                                    className="flex-1 bg-transparent outline-none text-sm font-bold uppercase placeholder:font-medium placeholder:text-gray-400"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <button onClick={handleCouponApply} className="text-xs font-black bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-80 transition">{appliedCoupon ? 'APPLIED' : 'APPLY'}</button>
                            </div>
                            {couponError && <div className="text-red-500 text-xs font-bold">{couponError}</div>}
                            {appliedCoupon && <div className="text-green-600 text-xs font-bold">Code applied! Discount: ₹{details?.discount}</div>}


                            <button
                                onClick={handleSubmit}
                                disabled={bookingStatus === 'submitting' || !details}
                                className="w-full bg-[#FF385C] hover:bg-[#D9324E] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 hover:shadow-red-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bookingStatus === 'submitting' ? 'Processing...' : 'Proceed to Pay'}
                            </button>

                        </div>
                    </div>

                </div>

                {/* MOBILE STICKY FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold uppercase">Pay Now {details?.isWaterpark ? '(Ticket Charge)' : '(10%)'}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-900">₹{payNowAmount.toLocaleString()}</span>
                                <span className="text-xs text-gray-400 line-through">₹{details?.total.toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={bookingStatus === 'submitting'}
                            className="bg-[#FF385C] hover:bg-[#d9324e] text-white px-8 py-3 rounded-xl font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {bookingStatus === 'submitting' ? 'Processing...' : 'Proceed to Pay'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Helper to avoid division by zero in render
function calculatePerNight(details) {
    if (!details || details.nights === 0) return 0;
    return Math.round(details.base / details.nights);
}
