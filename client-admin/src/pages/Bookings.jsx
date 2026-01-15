import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { API_BASE_URL } from '../config';

import { FaBuilding, FaLink } from 'react-icons/fa';
import AdminTable from '../components/ui/AdminTable';
import StatusBadge from '../components/ui/StatusBadge';

export default function Bookings() {
    const { token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(res.data);
        } catch (error) {
            console.error(error);
            showError('Error', 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        const action = status === 'confirmed' ? 'Approve' : 'Disapprove';
        const confirmed = await showConfirm(
            `${action} Booking`,
            `Are you sure you want to ${action.toLowerCase()} this booking?`,
            action,
            'Cancel',
            status === 'confirmed' ? 'confirm' : 'danger'
        );

        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/admin/bookings/${id}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBookings(); // Refresh list
            showSuccess('Success', `Booking ${status} successfully`);
        } catch (error) {
            console.error(error);
            showError('Error', `Failed to ${action.toLowerCase()} booking`);
        }
    };

    const handleResendEmail = async (id) => {
        const confirmed = await showConfirm(
            'Resend Email',
            'Send booking confirmation email to customer again?',
            'Send',
            'Cancel',
            'confirm'
        );

        if (!confirmed) return;

        try {
            await axios.post(`${API_BASE_URL}/admin/bookings/${id}/resend-email`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showSuccess('Success', 'Email resent successfully');
        } catch (error) {
            console.error(error);
            showError('Error', 'Failed to send email');
        }
    };

    // Filter Logic
    const filteredBookings = bookings.filter(booking =>
        booking.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.property?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.BookingId.toString().includes(searchTerm)
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const displayedBookings = filteredBookings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );



    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <AdminTable
                    title="Booking Management"
                    subtitle="Manage reservations, approvals, and confirmations"
                    searchTerm={searchTerm}
                    onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
                    loading={loading}
                    pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
                    mobileRenderer={() => (
                        <div>
                            {displayedBookings.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">No bookings found.</div>
                            ) : (
                                displayedBookings.map(booking => (
                                    <div key={booking.BookingId} className="p-5 space-y-4 border-b border-gray-50 last:border-none">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xs font-mono text-gray-400 mb-1">#{booking.BookingId}</div>
                                                <div className="font-bold text-gray-900 text-lg">{booking.property?.Name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{booking.property?.Location}</div>
                                            </div>
                                            <StatusBadge status={booking.Status} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</div>
                                                <div className="font-semibold text-gray-800 text-sm">{booking.CustomerName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Amount</div>
                                                <div className="font-extrabold text-indigo-600">₹{booking.TotalAmount}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In</div>
                                                <div className="font-semibold text-gray-800 text-sm">{new Date(booking.CheckInDate).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out</div>
                                                <div className="font-semibold text-gray-800 text-sm">{new Date(booking.CheckOutDate).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {(booking.Status === 'pending') && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                        className="flex-1 py-3 rounded-xl text-sm font-bold shadow-sm transition-all bg-emerald-500 text-white active:scale-95"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                        className="flex-1 py-3 rounded-xl text-sm font-bold shadow-sm transition-all bg-rose-500 text-white active:scale-95"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                >
                    <thead>
                        <tr className="bg-gray-50/50 border-bottom-2 border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Property</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Dates</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedBookings.map(booking => (
                            <tr key={booking.BookingId} className="border-b border-gray-50 hover:bg-indigo-50/10 transition">
                                <td className="px-6 py-5 font-mono text-sm text-gray-400">#{booking.BookingId}</td>
                                <td className="px-6 py-5">
                                    <div className="font-bold text-gray-900">{booking.property?.Name || 'Unknown'}</div>
                                    <div className="text-xs text-gray-400">{booking.property?.Location}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-semibold text-gray-900">{booking.CustomerName}</div>
                                    <div className="text-xs text-gray-400">{booking.CustomerMobile}</div>
                                    {booking.CustomerEmail && <div className="text-xs text-gray-400">{booking.CustomerEmail}</div>}
                                    <BookingSourceBadge source={booking.booking_source} />
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="text-sm font-semibold text-gray-900">{new Date(booking.CheckInDate).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">To {new Date(booking.CheckOutDate).toLocaleDateString()}</div>
                                </td>
                                <td className="px-6 py-5 font-extrabold text-indigo-600">₹{booking.TotalAmount}</td>
                                <td className="px-6 py-5 text-center"><StatusBadge status={booking.Status} /></td>
                                <td className="px-6 py-5">
                                    <div className="flex justify-center gap-2">
                                        {(booking.Status === 'pending') && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.BookingId, 'confirmed')}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105 active:scale-95"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.BookingId, 'rejected')}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all bg-rose-50 text-rose-700 hover:bg-rose-100 hover:scale-105 active:scale-95"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleResendEmail(booking.BookingId)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105 active:scale-95 shadow-sm transition-all"
                                            title="Resend Confirmation Email"
                                        >
                                            Email
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </AdminTable>
            </div>
        </div>
    );
}

// Booking Source Badge Component
function BookingSourceBadge({ source }) {
    const badges = {
        'customer_app': { label: 'ResortWala', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FaBuilding className="text-[8px]" /> },
        'public_calendar': { label: 'Public Link', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <FaLink className="text-[8px]" /> },
        'vendor_manual': { label: 'Manual', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: null },
        'admin_manual': { label: 'Admin', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: null },
    };

    const badge = badges[source] || badges['customer_app'];

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border mt-1 ${badge.color}`}>
            {badge.icon} {badge.label}
        </span>
    );
}
