import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UserBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth(); // Get auth user

    useEffect(() => {
        const fetchBookings = async () => {
            // Prioritize logged-in user data, fall back to localStorage (Guest)
            const email = user?.email || localStorage.getItem('user_email');
            const mobile = user?.phone || localStorage.getItem('user_mobile');

            if (!email && !mobile) {
                setLoading(false);
                return;
            }

            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                const res = await axios.get(`${baseURL}/api/bookings/search`, {
                    params: { email, mobile }
                });
                setBookings(res.data.bookings || []);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    return (
        <div className="pt-32 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">My Trips</h1>

                {loading ? (
                    <div className="text-center py-10">Loading your adventures...</div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">No trips booked... yet!</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Time to dust off your bags and start planning your next adventure. Our resorts are waiting.</p>
                        <Link to="/" className="bg-[#FF385C] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-[#d90b3e] transition transform hover:-translate-y-0.5">
                            Start Exploring
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => (
                            <div key={booking.BookingId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition duration-300">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {booking.property?.Name || "Unknown Property"}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono">ID: #{booking.BookingId}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${booking.Status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                        booking.Status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                        {booking.Status}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                        {/* Date & Guests */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Check-in</span>
                                                    <span className="text-lg font-semibold text-gray-800">
                                                        {format(new Date(booking.CheckInDate), 'EEE, MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                                <div className="h-full w-px bg-gray-200 mx-4 hidden md:block"></div>
                                                <div className="text-right md:text-left">
                                                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Check-out</span>
                                                    <span className="text-lg font-semibold text-gray-800">
                                                        {format(new Date(booking.CheckOutDate), 'EEE, MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 pt-2">
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Guests</span>
                                                    <span className="font-medium">{booking.Guests} Adults</span>
                                                </div>
                                                {/* Calculate Nights */}
                                                <div>
                                                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Duration</span>
                                                    <span className="font-medium">
                                                        {Math.ceil((new Date(booking.CheckOutDate) - new Date(booking.CheckInDate)) / (1000 * 60 * 60 * 24))} Nights
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment & Financials */}
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Base Price</span>
                                                <span>₹{(Number(booking.base_amount || booking.TotalAmount)).toLocaleString()}</span>
                                            </div>
                                            {Number(booking.tax_amount) > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Taxes & Fees</span>
                                                    <span>+ ₹{Number(booking.tax_amount).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {Number(booking.discount_amount) > 0 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Discount</span>
                                                    <span>- ₹{Number(booking.discount_amount).toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold text-base">
                                                <span>Total Paid</span>
                                                <span>₹{Number(booking.TotalAmount).toLocaleString()}</span>
                                            </div>

                                            <div className="pt-2 flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Method: <span className="capitalize text-gray-700 font-medium">{booking.payment_method || 'N/A'}</span></span>
                                                <span className={`capitalize font-bold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                                                    {booking.payment_status || 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.SpecialRequest && (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                                            <span className="font-bold block mb-1">Special Request:</span>
                                            "{booking.SpecialRequest}"
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <a
                                            href="mailto:support@resortwala.com"
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                        >
                                            Contact Support
                                        </a>
                                        <Link
                                            to={`/property/${booking.PropertyId}`}
                                            className="px-4 py-2 text-sm font-bold text-[#FF385C] border border-[#FF385C] rounded-lg hover:bg-[#FF385C] hover:text-white transition"
                                        >
                                            View Property
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
