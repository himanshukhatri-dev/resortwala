import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaCheckCircle, FaTimesCircle, FaClock, FaDownload, FaWhatsapp, FaPhone, FaArrowLeft, FaReceipt, FaBuilding, FaInfoCircle } from 'react-icons/fa';
import QRCode from 'react-qr-code';

export default function BookingDetails() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                // Determine endpoint based on auth or public token (future)
                // For now assuming logged in user via UserBookings
                const res = await axios.get(`${API_BASE_URL}/customer/bookings/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBooking(res.data);
            } catch (error) {
                console.error("Failed to load booking", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBooking();
    }, [id]);

    const handleDownloadInvoice = async () => {
        setDownloading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/customer/invoices/${booking.BookingId}/download`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${booking.booking_reference}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed", error);
            alert("Failed to download invoice. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleSupport = () => {
        const msg = `Hi Support, I have a question about my booking ${booking.booking_reference}`;
        window.open(`https://wa.me/919136276555?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;
    if (!booking) return <div className="min-h-screen flex items-center justify-center">Booking not found</div>;

    const statusColors = {
        'Confirmed': 'text-green-600 bg-green-50 border-green-200',
        'Pending': 'text-amber-600 bg-amber-50 border-amber-200',
        'Cancelled': 'text-red-600 bg-red-50 border-red-200'
    };

    return (
        <div className="bg-gray-50 min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-5xl">

                {/* Header / Nav */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/bookings" className="text-gray-500 hover:text-black transition">
                        <FaArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-serif">Ticket Details</h1>
                        <p className="text-gray-500 text-sm">Ref: {booking.booking_reference}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[booking.Status] || 'text-gray-600 bg-gray-100'}`}>
                            {booking.Status}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - MAIN TICKET INFO */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Property Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="relative h-48 bg-gray-200">
                                {booking.property?.images?.[0] ? (
                                    <img src={booking.property.images[0].image_url} alt={booking.property.Name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><FaBuilding size={40} /></div>
                                )}
                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                                    {booking.property?.PropertyType || 'Stay'}
                                </div>
                            </div>
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{booking.property?.Name}</h2>
                                <p className="text-gray-500 flex items-center gap-2 mb-4">
                                    <FaMapMarkerAlt className="text-red-500" /> {booking.property?.Location}, {booking.property?.City}
                                </p>
                                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Check-in</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {booking.CheckInDate ? format(new Date(booking.CheckInDate), 'dd MMM yyyy') : 'TBA'}
                                        </p>
                                        <p className="text-sm text-gray-500">02:00 PM</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Check-out</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {booking.CheckOutDate ? format(new Date(booking.CheckOutDate), 'dd MMM yyyy') : 'TBA'}
                                        </p>
                                        <p className="text-sm text-gray-500">11:00 AM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Guest & Inclusions */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaUserFriends className="text-indigo-500" /> Guest Details</h3>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm text-gray-500">Registered Guest</p>
                                    <p className="font-bold">{booking.CustomerName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Total Guests</p>
                                    <p className="font-bold">{booking.Guests} Adults</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Payment Breakdown */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FaReceipt className="text-gray-500" /> Payment Breakdown</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Base Rate</span>
                                    <span>₹{Number(booking.base_amount || booking.TotalAmount).toLocaleString()}</span>
                                </div>
                                {Number(booking.tax_amount) > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Taxes & GST</span>
                                        <span>₹{Number(booking.tax_amount).toLocaleString()}</span>
                                    </div>
                                )}
                                {Number(booking.discount_amount) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>- ₹{Number(booking.discount_amount).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-900">
                                    <span>Total Paid</span>
                                    <span>₹{Number(booking.TotalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - VALIDITY & ACTIONS */}
                    <div className="space-y-6">

                        {/* QR Code Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
                            <div className="mb-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                <QRCode value={`REF:${booking.booking_reference}`} size={120} />
                            </div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Entry Ticket</p>
                            <p className="text-lg font-bold text-gray-900">{booking.booking_reference}</p>
                            <p className="text-xs text-gray-500 mt-2">Show this QR code at reception for check-in.</p>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-3">
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={downloading}
                                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition"
                            >
                                {downloading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : <FaDownload />}
                                Download Invoice
                            </button>

                            <button
                                onClick={handleSupport}
                                className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 py-3 rounded-xl font-bold hover:bg-green-100 transition"
                            >
                                <FaWhatsapp /> Contact Support
                            </button>
                        </div>

                        {/* Vendor Info */}
                        <div className="bg-gray-100 rounded-3xl p-6 text-sm text-gray-600">
                            <p className="font-bold text-gray-900 mb-2">Need Help?</p>
                            <p>Call Vendor: +91 {booking.property?.vendor?.phone || '9136276555'}</p>
                            <p className="mt-2 text-xs text-gray-500">
                                Policies: Cancellations are subject to property rules.
                                <Link to="/policy/refund" className="underline ml-1">Read Policy</Link>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
