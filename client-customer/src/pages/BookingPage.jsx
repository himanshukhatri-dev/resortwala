import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaStar, FaGoogle, FaMapMarkerAlt, FaCreditCard, FaHotel, FaShieldAlt } from 'react-icons/fa';
import { format } from 'date-fns';

export default function BookingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const locationState = useLocation().state || {};

    const [form, setForm] = useState({
        CustomerName: '',
        CustomerMobile: '',
        CustomerEmail: '',
        payment_method: 'hotel', // hotel, card, upi
        SpecialRequest: ''
    });

    const [property, setProperty] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [bookingStatus, setBookingStatus] = useState('idle'); // idle, loading, success, error

    // Defaults from location state or mock
    const checkIn = locationState.checkIn ? new Date(locationState.checkIn) : new Date();
    const checkOut = locationState.checkOut ? new Date(locationState.checkOut) : new Date(new Date().setDate(new Date().getDate() + 1));
    const guests = locationState.guests || 2;
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    useEffect(() => {
        // Fetch Property Details
        const fetchProperty = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const response = await axios.get(`${baseURL}/api/properties/${id}`);
                setProperty(response.data);
            } catch (error) {
                console.error("Error fetching property", error);
            }
        };
        fetchProperty();
    }, [id]);

    const handleCouponApply = async () => {
        if (!couponCode) return;
        setBookingStatus('loading');
        setCouponError('');
        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const res = await axios.post(`${baseURL}/api/coupons/check`, { code: couponCode });
            setAppliedCoupon(res.data.coupon);
            setBookingStatus('idle');
        } catch (err) {
            setAppliedCoupon(null);
            setCouponError(err.response?.data?.message || 'Invalid coupon');
            setBookingStatus('idle');
        }
    };

    const calculateTotal = () => {
        const basePrice = (property?.PricePerNight || 5000) * nights;
        const taxes = basePrice * 0.18; // 18% GST Mock
        let discount = 0;

        if (appliedCoupon) {
            if (appliedCoupon.discount_type === 'percentage') {
                discount = (basePrice * appliedCoupon.value) / 100;
            } else {
                discount = Number(appliedCoupon.value);
            }
        }

        return {
            basePrice,
            taxes,
            discount,
            total: Math.max(0, basePrice + taxes - discount)
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBookingStatus('submitting');
        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const { basePrice, taxes, discount, total } = calculateTotal();

            const payload = {
                PropertyId: id,
                CustomerName: form.CustomerName,
                CustomerMobile: form.CustomerMobile,
                CustomerEmail: form.CustomerEmail,
                CheckInDate: format(checkIn, 'yyyy-MM-dd'),
                CheckOutDate: format(checkOut, 'yyyy-MM-dd'),
                Guests: guests,
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                discount_amount: discount,
                tax_amount: taxes,
                base_amount: basePrice,
                TotalAmount: total,
                payment_method: form.payment_method,
                SpecialRequest: form.SpecialRequest
            };

            const res = await axios.post(`${baseURL}/api/bookings`, payload);
            // alert(`Booking Confirmed! ID: ${res.data.booking.id}`);

            // Store user identity for "My Bookings" (Guest Mode)
            if (form.CustomerEmail) localStorage.setItem('user_email', form.CustomerEmail);
            if (form.CustomerMobile) localStorage.setItem('user_mobile', form.CustomerMobile);

            // Navigate with state for Success Toast/Message
            navigate('/bookings', { state: { bookingSuccess: true } });
        } catch (err) {
            console.error(err);
            alert("Booking Failed. Please try again.");
            setBookingStatus('idle');
        }
    };

    if (!property) return <div className="pt-32 text-center">Loading...</div>;

    const { basePrice, taxes, discount, total } = calculateTotal();

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
                        {/* ... (Form Content Same) ... */}

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
                                    <div className="text-gray-600">{guests} guests</div>
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

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={bookingStatus === 'submitting' || !form.CustomerName || !form.CustomerMobile}
                            className="w-full bg-[#FF385C] hover:bg-[#d9324e] text-white py-4 rounded-xl text-lg font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {bookingStatus === 'submitting' ? 'Processing...' : 'Confirm and pay'}
                        </button>

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
                                    <span>₹{property.PricePerNight || 5000} x {nights} nights</span>
                                    <span>₹{basePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Taxes (18% GST)</span>
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

                            {/* Map Widget (Static Placeholder) */}
                            <div className="pt-4">
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><FaMapMarkerAlt /> Location</h4>
                                <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden relative group cursor-pointer">
                                    <img 
                                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop" 
                                        className="w-full h-full object-cover" 
                                        alt="Map Placeholder" 
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-white/90 p-2 text-center text-xs font-bold text-black backdrop-blur-sm">
                                        View on Maps
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
