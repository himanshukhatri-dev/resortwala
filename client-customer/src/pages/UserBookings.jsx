import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { format } from 'date-fns';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaFileInvoice, FaArrowRight, FaWhatsapp, FaPhone } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const UserBookings = () => {
    const { user, token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // upcoming, past, cancelled

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/customer/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle various likely response structures
            const incoming = res.data;
            const bookingsList = Array.isArray(incoming) ? incoming : (incoming.data || []);

            if (Array.isArray(bookingsList)) {
                setBookings(bookingsList);
            } else {
                console.error("Unexpected booking data format:", incoming);
                setBookings([]);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to load bookings", error);
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (booking) => {
        const toastId = toast.loading("Generating Invoice...");
        try {
            const response = await axios.get(`${API_BASE_URL}/customer/invoices/${booking.BookingId}/download`, {
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf'
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${booking.BookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Invoice Downloaded", { id: toastId });
        } catch (error) {
            console.error("Download failed", error);
            toast.error("Failed to download invoice", { id: toastId });
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            'Confirmed': 'bg-green-100 text-green-700 border-green-200',
            'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'Cancelled': 'bg-red-50 text-red-500 border-red-100',
            'Completed': 'bg-gray-100 text-gray-600 border-gray-200'
        };
        const style = styles[status] || styles['Pending'];

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style} uppercase tracking-wide`}>
                {status}
            </span>
        );
    };

    const filteredBookings = bookings.filter(b => {
        // Robust filtering: handle case-insensitive status and missing dates
        const status = (b.Status || '').toLowerCase();
        const checkIn = b.CheckInDate ? new Date(b.CheckInDate) : new Date();
        const now = new Date();

        if (filter === 'upcoming') return checkIn >= now && status !== 'cancelled';
        if (filter === 'past') return checkIn < now && status !== 'cancelled';
        if (filter === 'cancelled') return status === 'cancelled';
        return true;
    }).sort((a, b) => new Date(b.BookingDate || 0) - new Date(a.BookingDate || 0));

    console.log("Bookings Data:", { all: bookings, filtered: filteredBookings, filter });

    return (
        <div className="pt-36 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-5xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-serif">My Trips</h1>
                        <p className="text-gray-500 mt-1">Manage all your getaways in one place</p>
                    </div>

                    {/* Filters */}
                    <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                        {['upcoming', 'past', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === f ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredBookings.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="text-6xl mb-4">✈️</div>
                        <h3 className="text-xl font-bold text-gray-900">No {filter} trips found</h3>
                        <p className="text-gray-500 mt-2 mb-6">Time to plan your next adventure?</p>
                        <Link to="/" className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition">
                            Explore Properties
                        </Link>
                    </div>
                )}

                {/* Booking Cards */}
                <div className="space-y-6">
                    {filteredBookings.map(booking => (
                        <div key={booking.BookingId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                            <div className="flex flex-col md:flex-row">
                                {/* Image Section */}
                                <div className="md:w-1/3 bg-gray-200 relative min-h-[200px]">
                                    {booking.property?.image_url ? (
                                        <img src={booking.property.image_url} alt={booking.property.Name} className="w-full h-full object-cover absolute inset-0" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <StatusBadge status={booking.Status} />
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                                                    {booking.property?.Name || 'Unknown Property'}
                                                </h3>
                                                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                                    <FaMapMarkerAlt className="text-gray-400" />
                                                    {booking.property?.Location || 'Location N/A'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-900">₹{Number(booking.TotalAmount).toLocaleString()}</div>
                                                <div className="text-xs text-gray-400">Total Paid</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Check-in</div>
                                                <div className="font-medium text-gray-800 flex items-center gap-2">
                                                    <FaCalendarAlt className="text-blue-500" />
                                                    {booking.CheckInDate ? format(new Date(booking.CheckInDate), 'EEE, MMM dd') : 'TBA'}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Guests</div>
                                                <div className="font-medium text-gray-800 flex items-center gap-2">
                                                    <FaUserFriends className="text-purple-500" />
                                                    {booking.NoofGuests} Guests
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleDownloadInvoice(booking)}
                                                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition"
                                            >
                                                <FaFileInvoice /> Invoice
                                            </button>
                                            <a href={`tel:+919136276555`} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition">
                                                <FaPhone /> Support
                                            </a>
                                        </div>

                                        <Link
                                            to={`/bookings/${booking.BookingId}`}
                                            className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            View Details <FaArrowRight />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-400 text-sm">Need help with a booking? <a href="https://wa.me/919136276555" className="text-green-600 font-medium hover:underline">Chat with us</a></p>
                </div>
            </div>
        </div>
    );
};

export default UserBookings;
