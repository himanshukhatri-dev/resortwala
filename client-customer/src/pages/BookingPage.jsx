import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaEdit, FaStar, FaGoogle, FaMapMarkerAlt, FaCreditCard, FaHotel, FaShieldAlt } from 'react-icons/fa';
import { format, eachDayOfInterval, startOfDay, subDays, getDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state || {};
    const { user, loading } = useAuth(); // Auth Context

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', {
                state: {
                    returnTo: location.pathname,
                    bookingState: locationState // Pass booking details forward
                }
            });
        }
    }, [user, loading, navigate, location.pathname, locationState]);

    const [form, setForm] = useState({
        CustomerName: '',
        CustomerMobile: '',
        CustomerEmail: '',
        payment_method: 'hotel', // hotel, card, upi
        SpecialRequest: ''
    });

    // Pre-fill form if logged in
    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                CustomerName: user.name || '',
                CustomerEmail: user.email || '',
                CustomerMobile: user.phone || ''
            }));
        }
    }, [user]);

    const [property, setProperty] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success, error
    const [holidays, setHolidays] = useState([]);

    // Defaults from location state or mock
    // Defaults from location state or mock
    const [checkIn, setCheckIn] = useState(
        locationState.dateRange?.from ? new Date(locationState.dateRange.from) :
            (locationState.checkIn ? new Date(locationState.checkIn) : new Date())
    );
    const [checkOut, setCheckOut] = useState(
        locationState.dateRange?.to ? new Date(locationState.dateRange.to) :
            (locationState.checkOut ? new Date(locationState.checkOut) : new Date(new Date().setDate(new Date().getDate() + 1)))
    );

    // Ensure CheckOut > CheckIn
    useEffect(() => {
        if (checkOut <= checkIn) {
            const nextDay = new Date(checkIn);
            nextDay.setDate(nextDay.getDate() + 1);
            setCheckOut(nextDay);
        }
    }, [checkIn, checkOut]);

    // Handle guests - can be number or object
    const guestsFromState = locationState.guests || 2;
    const guests = typeof guestsFromState === 'object'
        ? (guestsFromState.adults || 0) + (guestsFromState.children || 0) + (guestsFromState.infants || 0)
        : guestsFromState;
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    useEffect(() => {
        // Fetch Property Details
        const fetchProperty = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/properties/${id}`);
                setProperty(response.data);
            } catch (error) {
                console.error("Error fetching property", error);
            }
        };
        fetchProperty();

        // Fetch Holidays
        const fetchHolidays = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/holidays?property_id=${id}`);
                setHolidays(res.data);
            } catch (err) { console.error("Error fetching holidays", err); }
        };
        if (id) fetchHolidays();
    }, [id]);

    const handleCouponApply = async () => {
        if (!couponCode) return;
        setBookingStatus('loading');
        setCouponError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/coupons/check`, { code: couponCode });
            setAppliedCoupon(res.data.coupon);
            setBookingStatus('idle');
        } catch (err) {
            setAppliedCoupon(null);
            setCouponError(err.response?.data?.message || 'Invalid coupon');
            setBookingStatus('idle');
        }
    };

    const getPricingDetails = () => {
        let base = 0;
        let extraGuestCost = 0;
        let foodCost = 0;
        let nightsCount = nights;
        let childTicketCost = 0;
        let isWaterparkBreakdown = false;

        // 1. Try use passed breakdown (High Fidelity)
        if (locationState.breakdown) {
            const b = locationState.breakdown;
            if (b.totalAdultTicket !== undefined) {
                // Waterpark Logic
                base = b.totalAdultTicket || 0;
                childTicketCost = b.totalChildTicket || 0;
                isWaterparkBreakdown = true;
            } else {
                // Villa Logic
                base = b.totalVillaRate || 0;
            }
            extraGuestCost = b.totalExtra || 0;
            foodCost = b.totalFood || 0;
            nightsCount = b.nights || nights;
        }
        // 2. Fallback Calculation (Basic)
        else if (property) {
            // Logic: Iterate through dates...
            const start = startOfDay(checkIn);
            const end = startOfDay(checkOut);
            const nightDates = eachDayOfInterval({ start, end: subDays(end, 1) });

            nightDates.forEach(date => {
                const dayOfWeek = getDay(date);
                let nightlyRate = Number(property.PricePerNight) || 5000;
                let appliedHoliday = holidays.find(h => {
                    const from = new Date(h.from_date); from.setHours(0, 0, 0, 0);
                    const to = new Date(h.to_date); to.setHours(23, 59, 59, 999);
                    const d = new Date(date); d.setHours(12, 0, 0, 0);
                    return d >= from && d <= to;
                });

                if (appliedHoliday) {
                    nightlyRate = Number(appliedHoliday.base_price);
                } else {
                    if (dayOfWeek >= 1 && dayOfWeek <= 4 && property.price_mon_thu) nightlyRate = Number(property.price_mon_thu);
                    else if ((dayOfWeek === 5 || dayOfWeek === 0) && property.price_fri_sun) nightlyRate = Number(property.price_fri_sun);
                    else if (dayOfWeek === 6 && property.price_sat) nightlyRate = Number(property.price_sat);
                }
                base += nightlyRate;
            });
        } else {
            base = 5000 * nights;
        }

        // Coupon Logic
        let discountVal = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discount_type === 'percentage') {
                discountVal = (base * appliedCoupon.value) / 100;
            } else {
                discountVal = Number(appliedCoupon.value);
            }
        }

        // Tax Logic
        const taxable = base + extraGuestCost + foodCost + childTicketCost - discountVal;
        const gstPercent = property?.gst_percentage ? parseFloat(property.gst_percentage) : 18;
        const taxVal = (taxable * gstPercent) / 100;

        return {
            basePrice: base,
            childTicketCost,
            extraGuestCost,
            foodCost,
            taxes: taxVal,
            discount: discountVal,
            total: Math.max(0, taxable + taxVal),
            nights: nightsCount,
            isWaterparkBreakdown
        };
    };

    const { basePrice, childTicketCost, extraGuestCost, foodCost, taxes, discount, total, nights: nightsDisplay, isWaterparkBreakdown } = getPricingDetails();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBookingStatus('submitting');

        const payload = {
            PropertyId: id,
            CustomerName: form.CustomerName,
            CustomerMobile: form.CustomerMobile,
            CustomerEmail: form.CustomerEmail,
            CheckInDate: format(checkIn, 'yyyy-MM-dd'),
            CheckOutDate: format(checkOut, 'yyyy-MM-dd'),
            Guests: guests,
            TotalAmount: total,
            base_amount: basePrice,
            tax_amount: taxes,
            discount_amount: discount,
            extra_guest_charge: extraGuestCost,
            food_charge: foodCost,
            coupon_code: appliedCoupon?.code || null,
            payment_method: form.payment_method,
            SpecialRequest: form.SpecialRequest,
            booking_source: 'customer_app',
            Status: 'Pending',
            metadata: {
                breakdown: locationState.breakdown,
                foodIncluded: locationState.breakdown?.totalFood > 0,
                childTicketCost
            }
        };

        try {
            const res = await axios.post(`${API_BASE_URL}/bookings`, payload);
            if (form.payment_method === 'hotel') {
                // Standard Offline Flow
                if (form.CustomerEmail) localStorage.setItem('user_email', form.CustomerEmail);
                if (form.CustomerMobile) localStorage.setItem('user_mobile', form.CustomerMobile);
                navigate('/bookings', {
                    state: {
                        bookingSuccess: true,
                        message: "Booking Request Sent! Waiting for Approval.",
                        newBookingId: res.data.bookingId || res.data.id || res.data.booking?.BookingId || null,
                        property_name: property.Name
                    }
                });
            } else {
                // Online Payment Flow (PhonePe)
                const bookingId = res.data.bookingId || res.data.id || res.data.booking?.BookingId || res.data.booking?.id; // Robust ID extraction

                try {
                    const payRes = await axios.post(`${API_BASE_URL}/payment/initiate`, {
                        booking_id: bookingId,
                        redirect_url: window.location.origin + '/booking/success' // Unused by backend currently but good practice
                    });

                    if (payRes.data.success && payRes.data.redirect_url) {
                        window.location.href = payRes.data.redirect_url;
                    } else {
                        alert("Payment Initiation Failed. Please try again or pay at hotel.");
                    }
                } catch (payErr) {
                    console.error("Payment Error", payErr);
                    alert("Payment Gateway Error: " + (payErr.response?.data?.message || payErr.message));
                }
            }
        } catch (err) {
            console.error(err);
            console.error(error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Unknown error";
            alert(`Booking Failed: ${errMsg}`);
            setBookingStatus('idle');
        }
    };

    if (!property) return <div className="pt-32 text-center">Loading...</div>;

    return (
        <div className="pt-32 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">

                {/* Header */}
                <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
                    <span className="cursor-pointer hover:text-black" onClick={() => navigate(-1)}>&larr; Back</span>
                    <span>/</span>
                    <span className="font-semibold text-black">Confirm and pay</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* LEFT COLUMN: FORM */}
                    <div className="space-y-8">

                        {/* 1. Trip Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Your Trip</h2>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <div className="font-semibold">Dates</div>
                                    <div className="text-gray-600">{format(checkIn, 'MMM dd')} – {format(checkOut, 'MMM dd, yyyy')}</div>
                                </div>
                                <button className="text-black font-semibold underline text-sm">Edit</button>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">Guests</div>
                                    <div className="text-gray-600">
                                        {typeof guestsFromState === 'object' ? (
                                            <>
                                                {guestsFromState.adults} Adults
                                                {guestsFromState.children > 0 && `, ${guestsFromState.children} Children`}
                                            </>
                                        ) : (
                                            `${guests} guests`
                                        )}
                                    </div>
                                </div>
                                <button className="text-black font-semibold underline text-sm">Edit</button>
                            </div>
                        </div>

                        {/* 2. Pay With */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Pay with</h2>
                            <div className="space-y-4">
                                {/* Credit Card */}
                                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${form.payment_method === 'card' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <FaCreditCard className="text-gray-600" />
                                        <span className="font-medium">Credit or Debit Card</span>
                                    </div>
                                    <input type="radio" name="payment" value="card" checked={form.payment_method === 'card'} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
                                </label>

                                {/* UPI */}
                                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${form.payment_method === 'upi' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <FaGoogle className="text-gray-600" />
                                        <span className="font-medium">UPI / GPay / PhonePe</span>
                                    </div>
                                    <input type="radio" name="payment" value="upi" checked={form.payment_method === 'upi'} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
                                </label>

                                {/* Pay at Hotel */}
                                <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${form.payment_method === 'hotel' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <FaHotel className="text-gray-600" />
                                        <span className="font-medium">Pay at Hotel</span>
                                    </div>
                                    <input type="radio" name="payment" value="hotel" checked={form.payment_method === 'hotel'} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} />
                                </label>
                            </div>
                        </div>

                        {/* 3. Guest Details */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Required for your trip</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                        placeholder="Same as on ID"
                                        value={form.CustomerName}
                                        onChange={(e) => setForm({ ...form, CustomerName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            placeholder="+91"
                                            value={form.CustomerMobile}
                                            onChange={(e) => setForm({ ...form, CustomerMobile: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                            placeholder="For confirmation"
                                            value={form.CustomerEmail}
                                            onChange={(e) => setForm({ ...form, CustomerEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                        rows="3"
                                        placeholder="Early check-in, dietary needs, etc."
                                        value={form.SpecialRequest}
                                        onChange={(e) => setForm({ ...form, SpecialRequest: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>



                    </div>

                    {/* RIGHT COLUMN: STICKY SUMMARY */}
                    <div className="hidden lg:block">
                        <div className="sticky top-32 border border-gray-200 rounded-xl shadow-lg p-6 bg-white space-y-6">

                            {/* Property Mini Header */}
                            <div className="flex gap-4 border-b pb-6">
                                <img
                                    src={property.image_url || property.image_path || "https://images.unsplash.com/photo-1512918760532-3ed64bc80e89"}
                                    className="w-24 h-24 object-cover rounded-lg"
                                    alt="Property"
                                />
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wide">Plus</div>
                                    <h3 className="font-bold text-gray-800 line-clamp-2">{property.Name}</h3>
                                    <div className="flex items-center gap-1 text-sm mt-1">
                                        <FaStar className="text-sm" /> <span>4.92</span> <span className="text-gray-500">(120 reviews)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold mb-4">Price details</h3>
                                <div className="flex justify-between text-gray-600">
                                    <span>{isWaterparkBreakdown ? 'Adult Tickets' : `Total Base Price (${nightsDisplay} nights)`}</span>
                                    <span>₹{basePrice.toLocaleString()}</span>
                                </div>
                                {childTicketCost > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Children Tickets</span>
                                        <span>₹{childTicketCost.toLocaleString()}</span>
                                    </div>
                                )}
                                {extraGuestCost > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Extra Guest Charges</span>
                                        <span>₹{extraGuestCost.toLocaleString()}</span>
                                    </div>
                                )}
                                {foodCost > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Food Charges</span>
                                        <span>₹{foodCost.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxes ({property.gst_percentage || 18}% GST)</span>
                                    <span>₹{taxes.toLocaleString()}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount ({appliedCoupon.code})</span>
                                        <span>-₹{discount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                                <span>Total (INR)</span>
                                <span>₹{total.toLocaleString()}</span>
                            </div>

                            {/* Coupon Input */}
                            <div className="bg-gray-50 p-4 rounded-lg flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter coupon code"
                                    className="flex-1 bg-transparent outline-none text-sm font-medium uppercase placeholder:normal-case"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    className="text-black font-bold text-sm underline"
                                    onClick={handleCouponApply}
                                >
                                    Apply
                                </button>
                            </div>
                            {couponError && <div className="text-red-500 text-xs mt-1">{couponError}</div>}
                            {appliedCoupon && <div className="text-green-600 text-xs mt-1">Code applied successfully!</div>}

                            {/* Confirm Button Moved Here */}
                            <button
                                onClick={handleSubmit}
                                disabled={bookingStatus === 'submitting' || !form.CustomerName || !form.CustomerMobile}
                                className="w-full bg-[#FF385C] hover:bg-[#d9324e] text-white py-4 rounded-xl text-lg font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                            >
                                {bookingStatus === 'submitting' ? (
                                    <>Processing...</>
                                ) : (
                                    <>Confirm and pay</>
                                )}
                            </button>

                            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1 mt-2">
                                <FaShieldAlt /> Secure Payment via Razorpay/UPI
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
