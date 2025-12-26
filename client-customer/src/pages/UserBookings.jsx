import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQrcode, FaShareAlt, FaPlus, FaMinus, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaMoneyBillWave, FaCheck, FaWhatsapp, FaDownload, FaTicketAlt } from 'react-icons/fa';
import Layout from '../layouts/MainLayout';
import QRCode from 'react-qr-code';

export default function UserBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'date'

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check for success state from navigation
    const [successState, setSuccessState] = useState(null);

    useEffect(() => {
        if (location.state?.success) {
            setSuccessState({
                newBookingId: location.state.newBookingId,
                property_name: location.state.property_name,
                email_sent: location.state.email_sent,
                booking_reference: location.state.booking_reference
            });
            // Clear state so it doesn't persist on reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchBookings = async () => {
            const email = user?.email || localStorage.getItem('user_email');
            const mobile = user?.phone || localStorage.getItem('user_mobile');

            if (!email && !mobile) {
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(`${API_BASE_URL}/bookings/search`, {
                    params: { email, mobile }
                });

                const bookingData = res.data.bookings || [];
                setBookings(bookingData);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
                if (error.response && error.response.status === 401) {
                    // Unauthorized - likely token expired
                    logout();
                    navigate('/login', { state: { message: 'Session expired. Please login again.' } });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();

        // Polling Logic: Check every 10s if any booking is Pending
        const interval = setInterval(() => {
            fetchBookings(); // Just refresh regardless to keep status updated
        }, 10000);

        return () => clearInterval(interval);

    }, [user]);

    const handleChatWithAdmin = () => {
        const id = successState?.booking_reference || successState?.newBookingId || 'New';
        const propName = successState?.property_name || 'the property';
        const msg = `Hi ResortWala, I'm waiting for confirmation on my booking ${id} for ${propName}. Can you please update me?`;
        window.open(`https://wa.me/919870646548?text=${encodeURIComponent(msg)}`, '_blank');
    };

    // Sorting Logic
    const sortedBookings = [...bookings].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(a.CheckInDate) - new Date(b.CheckInDate);
        } else {
            return b.BookingId - a.BookingId;
        }
    });

    const handleCancel = async (id) => {
        if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;

        try {
            await axios.post(`${API_BASE_URL}/bookings/${id}/cancel`);
            // Update UI locally
            const updatedBookings = bookings.map(b => b.BookingId === id ? { ...b, Status: 'Cancelled' } : b);
            setBookings(updatedBookings);
            alert("Booking cancelled successfully.");
        } catch (error) {
            console.error("Cancel failed", error);
            alert("Failed to cancel booking. Please try again.");
        }
    };

    const handleDownloadInvoice = (booking) => {
        const ref = booking.booking_reference || booking.BookingId;
        const invoiceContent = `
            <html>
                <head>
                    <title>Invoice - ${ref}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                        .container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; }
                        .invoice-title { text-align: right; }
                        .details { margin-bottom: 30px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .label { font-weight: bold; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
                        td { padding: 10px; border-bottom: 1px solid #eee; }
                        .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
                        .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">ResortWala</div>
                            <div class="invoice-title">
                                <h2>INVOICE</h2>
                                <p>Ref: ${ref}</p>
                                <p>Date: ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div class="details">
                            <div class="row">
                                <div>
                                    <p class="label">Bill To:</p>
                                    <p>${booking.CustomerName}</p>
                                    <p>${booking.CustomerMobile}</p>
                                    <p>${booking.CustomerEmail || ''}</p>
                                </div>
                                <div style="text-align: right;">
                                    <p class="label">Property:</p>
                                    <p>${booking.property?.Name}</p>
                                    <p>${booking.property?.Location}</p>
                                </div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        Accommodation - ${booking.property?.Name}<br>
                                        <small>${format(new Date(booking.CheckInDate), 'MMM dd')} to ${format(new Date(booking.CheckOutDate), 'MMM dd, yyyy')} (${booking.Guests} Guests)</small>
                                    </td>
                                    <td style="text-align: right;">₹${Number(booking.base_amount || booking.TotalAmount).toLocaleString()}</td>
                                </tr>
                                ${Number(booking.tax_amount) > 0 ? `
                                <tr>
                                    <td>Taxes & Fees</td>
                                    <td style="text-align: right;">₹${Number(booking.tax_amount).toLocaleString()}</td>
                                </tr>` : ''}
                                ${Number(booking.discount_amount) > 0 ? `
                                <tr>
                                    <td style="color: green;">Discount</td>
                                    <td style="text-align: right; color: green;">- ₹${Number(booking.discount_amount).toLocaleString()}</td>
                                </tr>` : ''}
                            </tbody>
                        </table>

                        <div class="total">
                            Total Paid: ₹${Number(booking.TotalAmount).toLocaleString()}
                        </div>

                        <div class="footer">
                            <p>Thank you for choosing ResortWala!</p>
                            <p>Support: +91 9870646548 | support@resortwala.com</p>
                        </div>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
    };

    const handleShare = async (booking) => {
        const origin = window.location.origin;
        // Ideally link to a "Verify Booking" or "Public Trip" page. 
        // Since we don't have a public trip page yet, we can share the property link with details text.
        const shareUrl = `${origin}/stay/${booking.property?.share_token || booking.PropertyId}`;
        const ref = booking.booking_reference || booking.BookingId;

        const checkIn = format(new Date(booking.CheckInDate), 'EEE, MMM dd');
        const checkOut = format(new Date(booking.CheckOutDate), 'EEE, MMM dd');

        const text = `I'm going to ${booking.property?.Name} via ResortWala! 🌴\n\nBooking Ref: ${ref}\nDates: ${checkIn} - ${checkOut}\nLocation: ${booking.property?.Location}\n\nCheck it out: ${shareUrl}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Trip to ${booking.property?.Name}`,
                    text: text,
                    url: shareUrl,
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                alert("Trip details copied! Share via WhatsApp.");
            } catch (err) {
                alert("Copy failed");
            }
        }
    };

    return (
        <Layout>
            <div className="pt-28 pb-20 min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold font-serif text-gray-900">My Trips</h1>
                            <p className="text-gray-500 mt-1">Manage your upcoming and past getaways</p>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 font-medium">Sort by:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 shadow-sm outline-none cursor-pointer"
                            >
                                <option value="recent">Recently Booked</option>
                                <option value="date">Trip Date (Soonest)</option>
                            </select>
                        </div>
                    </div>

                    {/* SUCCESS BANNER */}
                    <AnimatePresence>
                        {successState && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                className="mb-8"
                            >
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-green-500 text-white rounded-full p-2 mt-1">
                                            <FaCheck size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-green-900">Booking Confirmed!</h3>
                                            <p className="text-green-700 text-sm mt-1">Your trip to <strong>{successState.property_name}</strong> is confirmed.</p>
                                            <p className="text-green-600 text-xs mt-1">Ref: <strong>{successState.booking_reference || ('#' + successState.newBookingId)}</strong></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                const booking = bookings.find(b => b.BookingId == successState.newBookingId);
                                                if (booking) handleDownloadInvoice(booking);
                                            }}
                                            className="bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-green-50 transition"
                                        >
                                            <FaDownload className="inline mr-1" /> Invoice
                                        </button>
                                        <button
                                            onClick={handleChatWithAdmin}
                                            className="bg-[#25D366] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-[#20be5c] transition"
                                        >
                                            <FaWhatsapp className="inline mr-1" /> Support
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">No trips booked... yet!</h2>
                            <Link to="/" className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                                Explore Stays
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedBookings.map((booking, index) => (
                                <div
                                    key={booking.BookingId}
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all group"
                                >
                                    {/* Ticket Header */}
                                    <div className={`h-2 ${booking.Status === 'Confirmed' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                        booking.Status === 'Pending' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                            'bg-gray-300'
                                        }`}></div>

                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row justify-between gap-8">
                                            {/* LEFT: Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${booking.Status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                                        booking.Status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {booking.Status}
                                                    </span>
                                                    <span className="text-gray-400 font-mono text-sm font-bold">
                                                        {booking.booking_reference || booking.BookingId}
                                                    </span>
                                                </div>

                                                <h3 className="text-2xl font-extrabold text-gray-900 mb-1">{booking.property?.Name || 'Unknown Property'}</h3>
                                                <div className="flex items-center gap-1 text-gray-500 text-sm mb-6">
                                                    <FaMapMarkerAlt /> {booking.property?.Location}
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-In</p>
                                                        <p className="font-bold text-gray-900">{format(new Date(booking.CheckInDate), 'MMM dd')}</p>
                                                        <p className="text-xs text-gray-500">2:00 PM</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-Out</p>
                                                        <p className="font-bold text-gray-900">{format(new Date(booking.CheckOutDate), 'MMM dd')}</p>
                                                        <p className="text-xs text-gray-500">11:00 AM</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Guests</p>
                                                        <p className="font-bold text-gray-900">{booking.Guests}</p>
                                                        <p className="text-xs text-gray-500">Adults</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                                                        <p className="font-bold text-indigo-600">₹{Number(booking.TotalAmount).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT: Actions & QR */}
                                            <div className="flex flex-col items-center justify-center min-w-[220px] bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <div className="bg-white p-2 rounded-xl shadow-sm mb-4">
                                                    <QRCode
                                                        value={`REF:${booking.booking_reference || booking.BookingId}`}
                                                        size={80}
                                                    />
                                                </div>

                                                <div className="w-full space-y-2">
                                                    <button
                                                        onClick={() => handleShare(booking)}
                                                        className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-sm"
                                                    >
                                                        <FaShareAlt /> Share Ticket
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(booking)}
                                                        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
                                                    >
                                                        <FaDownload /> Invoice
                                                    </button>
                                                    {booking.Status !== 'Cancelled' && (
                                                        <button
                                                            onClick={() => handleCancel(booking.BookingId)}
                                                            className="w-full text-red-500 text-xs font-bold hover:text-red-700 py-1"
                                                        >
                                                            Cancel Booking
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ticket Cutouts */}
                                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border-r border-gray-200"></div>
                                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border-l border-gray-200"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
