import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../services/api';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await bookingAPI.getMyBookings();
                setBookings(data);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

            {bookings.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h2>
                    <p className="text-gray-500 mb-6">Time to dust off your bags and start planning your next adventure</p>
                    <Link to="/" className="inline-block bg-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-600 transition-colors">
                        Start exploring
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                            <div className="md:w-1/3 h-48 md:h-auto relative">
                                <img
                                    src={booking.Property?.images?.[0] || 'https://via.placeholder.com/400x300'}
                                    alt={booking.Property?.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{booking.Property?.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-500 mb-4">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {booking.Property?.location}
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {format(new Date(booking.checkInDate), 'MMM dd, yyyy')} - {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                                        </div>
                                        <div>
                                            <span className="font-semibold">{booking.guests}</span> guests
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">Total Price</div>
                                    <div className="text-xl font-bold text-gray-900">₹{parseFloat(booking.totalPrice).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Bookings;
