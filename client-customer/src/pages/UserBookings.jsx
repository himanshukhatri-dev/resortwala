import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function UserBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            const email = localStorage.getItem('user_email');
            const mobile = localStorage.getItem('user_mobile');

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
    }, []);

    return (
        <div className="pt-32 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

                {loading ? (
                    <div>Loading...</div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                        <h2 className="text-xl font-bold mb-4">No trips booked... yet!</h2>
                        <p className="text-gray-500 mb-8">Time to dust off your bags and start planning your next adventure.</p>
                        <Link to="/" className="bg-[#FF385C] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#d90b3e]">
                            Start searching
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{booking.property?.Name || "Booking #" + booking.id}</h3>
                                    <div className="text-gray-600 flex gap-4 text-sm mb-4">
                                        <div>
                                            <span className="font-semibold block">Check-in</span>
                                            {format(new Date(booking.CheckInDate), 'MMM dd, yyyy')}
                                        </div>
                                        <div>
                                            <span className="font-semibold block">Check-out</span>
                                            {format(new Date(booking.CheckOutDate), 'MMM dd, yyyy')}
                                        </div>
                                    </div>
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.Status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.Status}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-between">
                                    <div className="text-xl font-bold">₹{Number(booking.TotalAmount).toLocaleString()}</div>
                                    <Link to={`/property/${booking.PropertyId}`} className="text-[#FF385C] font-semibold hover:underline">
                                        View Property
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
