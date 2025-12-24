import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQrcode, FaShareAlt, FaPlus, FaMinus, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaMoneyBillWave } from 'react-icons/fa';

export default function UserBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'date'

    const { user } = useAuth(); // Get auth user

    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const successState = useLocation().state;

    useEffect(() => {
        if (successState?.bookingSuccess) {
            setShowSuccessBanner(true);
            // Clear state after 10s or keep it until dismissed? Keeping for visibility.
        }
    }, [successState]);

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
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();

        // Polling Logic: Check every 10s if any booking is Pending
        const interval = setInterval(() => {
            const hasPending = bookings.some(b => b.Status === 'Pending');
            if (hasPending) {
                fetchBookings();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [user, bookings.length]); // Re-run if bookings length changes to update polling context if needed

    const handleChatWithAdmin = () => {
        const id = successState?.newBookingId || 'New';
        const propName = successState?.property_name || 'the property';
        const msg = `Hi ResortWala, I'm waiting for confirmation on my booking #${id} for ${propName}. Can you please update me?`;
        window.open(`https://wa.me/919999999999?text=${encodeURIComponent(msg)}`, '_blank'); // Replace with actual Admin/Support Number
    };

    // Sorting Logic
    const sortedBookings = [...bookings].sort((a, b) => {
        if (sortBy === 'date') {
            // Trip Date: Ascending (Soonest first)
            return new Date(a.CheckInDate) - new Date(b.CheckInDate);
        } else {
            // Recently Booked: Descending by ID (Latest first)
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
        const invoiceContent = `
            <html>
                <head>
                    <title>Invoice #${booking.BookingId}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                        .details { margin-bottom: 20px; }
                        .total { font-size: 20px; font-weight: bold; margin-top: 20px; text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div><h1>ResortWala</h1></div>
                        <div style="text-align:right">
                            <h3>Invoice</h3>
                            <p>ID: #${booking.BookingId}</p>
                            <p>Date: ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="details">
                        <p><strong>Property:</strong> ${booking.property?.Name}</p>
                        <p><strong>Guest:</strong> ${booking.CustomerName}</p>
                        <p><strong>Dates:</strong> ${format(new Date(booking.CheckInDate), 'MMM dd')} - ${format(new Date(booking.CheckOutDate), 'MMM dd, yyyy')}</p>
                        <p><strong>Guests:</strong> ${booking.Guests}</p>
                    </div>
                    <table style="width:100%; text-align:left; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #ddd;">
                            <th style="padding: 10px 0;">Description</th>
                            <th style="padding: 10px 0; text-align:right">Amount</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0;">Accommodation Charges</td>
                            <td style="padding: 10px 0; text-align:right">₹${Number(booking.base_amount || booking.TotalAmount).toLocaleString()}</td>
                        </tr>
                        ${Number(booking.tax_amount) > 0 ? `
                        <tr>
                            <td style="padding: 10px 0;">Taxes & Fees</td>
                            <td style="padding: 10px 0; text-align:right">₹${Number(booking.tax_amount).toLocaleString()}</td>
                        </tr>` : ''}
                        ${Number(booking.discount_amount) > 0 ? `
                        <tr>
                            <td style="padding: 10px 0; color: green;">Discount</td>
                            <td style="padding: 10px 0; text-align:right; color: green;">- ₹${Number(booking.discount_amount).toLocaleString()}</td>
                        </tr>` : ''}
                    </table>
                    <div class="total">
                        Total Paid: ₹${Number(booking.TotalAmount).toLocaleString()}
                    </div>
                    <div style="margin-top: 50px; text-align: center; color: #777; font-size: 12px;">
                        Thank you for choosing ResortWala! <br>
                        This is a computer generated invoice.
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
    };

    const handleRules = (booking) => {
        alert(`Resort Rules for ${booking.property?.Name}:\n\n1. Check-in time: 2:00 PM\n2. Check-out time: 11:00 AM\n3. No smoking inside rooms.\n4. Pool timings: 7 AM - 7 PM.\n5. Keep noise levels low after 10 PM.`);
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleShare = async (booking) => {
        const origin = window.location.origin;
        // Construct deep link to property details or a dedicated "share trip" page if it existed.
        // For now, linking to the property page is safest.
        const shareUrl = `${origin}/property/${booking.PropertyId}`;

        const checkIn = format(new Date(booking.CheckInDate), 'EEE, MMM dd');
        const checkOut = format(new Date(booking.CheckOutDate), 'EEE, MMM dd');

        const text = `Hey! I'm going to *${booking.property?.Name}* in ${booking.property?.Location || 'Paradise'}! 🌴✨\n\n📅 *Dates:* ${checkIn} - ${checkOut}\n🏡 *Stay:* Luxury Villa\n\nCheck it out here: ${shareUrl}\n\nBooked via ResortWala 🚀`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Trip to ${booking.property?.Name}`,
                    text: text,
                    url: shareUrl,
                });
            } catch (err) {
                console.error("Share failed/cancelled", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                alert("Trip details copied to clipboard! Share it on WhatsApp or Instagram. 📋✨");
            } catch (err) {
                console.error("Clipboard failed", err);
                alert("Could not copy to clipboard. Please manually copy the link.");
            }
        }
    };

    return (
        <div className="pt-28 pb-20 min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold font-serif text-gray-900">My Trips</h1>
                        <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm inline-block mt-2">
                            {bookings.length} Adventures
                        </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-black focus:border-black block p-2.5 shadow-sm outline-none cursor-pointer hover:border-gray-300 transition-colors"
                        >
                            <option value="recent">Recently Booked</option>
                            <option value="date">Trip Date (Soonest)</option>
                        </select>
                    </div>
                </div>

                {/* SUCCESS BANNER */}
                <AnimatePresence>
                    {showSuccessBanner && (
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
                                        <h3 className="text-lg font-bold text-green-900">Booking Request Sent Successfully!</h3>
                                        <p className="text-green-700 text-sm mt-1">Your booking is currently <strong>Pending</strong>. You will receive a confirmation once the vendor approves it.</p>
                                        <p className="text-green-600 text-xs mt-2">Booking ID: <span className="font-mono font-bold">#{successState?.newBookingId || 'N/A'}</span></p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleChatWithAdmin}
                                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20be5c] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                                >
                                    <FaWhatsapp size={20} /> Chat with Admin
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                        <div className="text-gray-400 animate-pulse">Loading your journeys...</div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">No trips booked... yet!</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Time to dust off your bags and start planning your next adventure.</p>
                        <Link to="/" className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                            Start Exploring
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedBookings.map((booking, index) => (
                            <motion.div
                                key={booking.BookingId}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all group"
                            >
                                {/* COMPACT HEADER */}
                                <div
                                    onClick={() => toggleExpand(booking.BookingId)}
                                    className="p-5 flex items-center justify-between cursor-pointer relative overflow-hidden"
                                >
                                    {/* Subtle hover background */}
                                    <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${booking.Status === 'Confirmed' ? 'bg-green-50 text-green-600 border-green-100' :
                                            booking.Status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                booking.Status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                            {booking.Status === 'Confirmed' ? '✈️' : booking.Status === 'Pending' ? '⏳' : booking.Status === 'Cancelled' ? '🚫' : '❌'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                {booking.property?.Name || "Unknown Property"}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 font-medium">
                                                <span className="flex items-center gap-1"><FaCalendarAlt className="text-gray-400" /> {format(new Date(booking.CheckInDate), 'MMM dd')} - {format(new Date(booking.CheckOutDate), 'MMM dd')}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{booking.Guests} Guests</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`hidden sm:block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${booking.Status === 'Confirmed' ? 'bg-green-50 text-green-700' :
                                            booking.Status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                                                booking.Status === 'Cancelled' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'
                                            }`}>
                                            {booking.Status}
                                        </div>
                                        <button className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                                            {expandedId === booking.BookingId ? <FaMinus size={10} /> : <FaPlus size={10} />}
                                        </button>
                                    </div>
                                </div>

                                {/* EXPANDED DETAILS */}
                                <AnimatePresence>
                                    {expandedId === booking.BookingId && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-gray-100 bg-gray-50/50"
                                        >
                                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                                                {/* DATA COLUMN */}
                                                <div className="md:col-span-2 space-y-4">

                                                    {/* Quick Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">Booking ID</div>
                                                            <div className="font-mono text-gray-700">#{booking.BookingId}</div>
                                                        </div>
                                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-bold">Total Paid</div>
                                                            <div className="flex items-center gap-2 font-bold text-gray-900">
                                                                ₹{Number(booking.TotalAmount).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Location Card */}
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group/loc cursor-pointer hover:border-blue-200 transition-colors">
                                                        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">
                                                            <FaMapMarkerAlt className="text-secondary" /> Location
                                                        </div>
                                                        <div className="text-gray-900 font-medium mb-2">
                                                            {booking.property?.Location || "ResortWala Destination"}
                                                        </div>
                                                        <a
                                                            href={`https://maps.google.com/?q=${booking.property?.Location}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                                                        >
                                                            Get Directions ↗
                                                        </a>
                                                    </div>

                                                    {/* Additional Links/Anchors */}
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(booking); }}
                                                            className="text-xs font-medium text-gray-500 hover:text-gray-900 underline decoration-gray-300"
                                                        >
                                                            Download Invoice
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRules(booking); }}
                                                            className="text-xs font-medium text-gray-500 hover:text-gray-900 underline decoration-gray-300"
                                                        >
                                                            Resort Rules
                                                        </button>
                                                        {booking.Status !== 'Cancelled' && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCancel(booking.BookingId); }}
                                                                className="text-xs font-medium text-red-400 hover:text-red-600 underline decoration-red-200"
                                                            >
                                                                Cancel Booking
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* QR & ACTIONS COLUMN */}
                                                <div className="flex flex-col items-center justify-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-widest">Mobile Check-in</div>

                                                    <div className="bg-gray-900 p-2 rounded-lg mb-4 shadow-lg">
                                                        <img
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=RW-${booking.BookingId}&bgcolor=255-255-255`}
                                                            alt="QR Code"
                                                            className="w-28 h-28 rounded-md bg-white border-4 border-white"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col w-full gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleShare(booking); }}
                                                            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-all border border-gray-200 hover:border-gray-300"
                                                        >
                                                            <FaShareAlt /> Share Trip
                                                        </button>
                                                        <Link
                                                            to={`/stay/${booking.property?.share_token || booking.PropertyId}`}
                                                            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                                        >
                                                            View Property ↗
                                                        </Link>
                                                    </div>
                                                </div>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
