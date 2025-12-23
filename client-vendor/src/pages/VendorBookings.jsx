import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import Sidebar from '../components/Sidebar';
import { useModal } from '../context/ModalContext';
import { FaSearch, FaCalendarAlt, FaFilter, FaCheck, FaTimes, FaBan, FaBars, FaBuilding, FaLink } from 'react-icons/fa';

export default function VendorBookings() {
    const { user, token } = useAuth();
    const { showConfirm, showSuccess, showError } = useModal();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Filter States
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('upcoming');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            // FIXED: API Path
            const response = await axios.get(`${API_BASE_URL}/vendor/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        const confirmed = await showConfirm(
            'Update Status',
            `Are you sure you want to ${newStatus} this booking?`,
            'Yes, Update',
            'Cancel',
            newStatus === 'rejected' || newStatus === 'cancelled' ? 'danger' : 'confirm'
        );

        if (!confirmed) return;

        try {
            // FIXED: API Path
            await axios.post(`${API_BASE_URL}/vendor/bookings/${bookingId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchBookings();
            await showSuccess('Status Updated', `Booking ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Update Failed', 'Failed to update booking status');
        }
    };

    // Filter Logic
    const filteredBookings = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bookings.filter(booking => {
            // 1. Search Filter
            const matchesSearch = (
                (booking.CustomerName?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
                (booking.BookingId?.toString() || '').includes(searchText) ||
                (booking.property?.Name?.toLowerCase() || '').includes(searchText.toLowerCase())
            );

            // 2. Date Range Filter (Global)
            const bookingDate = new Date(booking.CheckInDate);
            if (bookingDate) bookingDate.setHours(0, 0, 0, 0);

            const fromDate = dateFrom ? new Date(dateFrom) : null;
            if (fromDate) fromDate.setHours(0, 0, 0, 0);

            const toDate = dateTo ? new Date(dateTo) : null;
            if (toDate) toDate.setHours(0, 0, 0, 0);

            let matchesDate = true;
            if (fromDate && bookingDate < fromDate) matchesDate = false;
            if (toDate && bookingDate > toDate) matchesDate = false;

            // 3. Tab Filter
            let matchesTab = true;
            const status = booking.Status?.toLowerCase() || 'pending';

            if (statusFilter === 'upcoming') {
                // Upcoming: Future dates AND not cancelled/rejected
                matchesTab = bookingDate >= today && !['cancelled', 'rejected'].includes(status);
            } else if (statusFilter === 'history') {
                // History: Past dates OR completed status (and not cancelled if past)
                matchesTab = (bookingDate < today && !['cancelled', 'rejected'].includes(status)) || status === 'completed';
            } else if (statusFilter === 'cancelled') {
                matchesTab = ['cancelled', 'rejected'].includes(status);
            }

            return matchesSearch && matchesDate && matchesTab;
        });
    }, [bookings, searchText, dateFrom, dateTo, statusFilter]);

    // Status Badge Helper
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading bookings...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar
                activePage="vendor-bookings"
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 md:ml-[70px] transition-all duration-300 w-full">
                {/* 1. Header Area - Sticky */}
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden text-2xl" onClick={() => setIsMobileMenuOpen(true)}>
                                <FaBars />
                            </button>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bookings</h1>
                                <p className="text-sm text-gray-500 hidden md:block">Manage your reservations</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                                <div className="font-bold text-gray-900 text-sm">{user?.name || 'Vendor'}</div>
                                <div className="text-xs text-gray-500">Property Owner</div>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* 2. Tabs & Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Tabs */}
                        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                            {['upcoming', 'history', 'cancelled'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab)}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${statusFilter === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Search & Date */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search guest or ID..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            {/* Simple Date Trigger (could be expanded) */}
                            <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg">
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-24" />
                                <span className="text-gray-400">-</span>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent text-xs font-bold outline-none w-24" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Content Area */}
                <div className="p-4 md:p-6">
                    {filteredBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl">📅</div>
                            <p className="text-gray-500 font-medium">No bookings found in {statusFilter}.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                                            <th className="p-4 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Details</th>
                                            <th className="p-4 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Guest</th>
                                            <th className="p-4 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide">Payment</th>
                                            <th className="p-4 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Total</th>
                                            <th className="p-4 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Status</th>
                                            <th className="p-4 py-5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredBookings.map((booking) => (
                                            <tr key={booking.BookingId} className="hover:bg-gray-50/30 transition">
                                                {/* Details: ID, Property, Dates */}
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-400 mb-1">#{booking.BookingId}</span>
                                                        <span className="font-bold text-gray-900 text-sm line-clamp-1">{booking.property?.Name || 'Unknown Property'}</span>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                            <FaCalendarAlt size={10} />
                                                            <span>{new Date(booking.CheckInDate).toLocaleDateString()}</span>
                                                            <span className="text-gray-300">➜</span>
                                                            <span>{new Date(booking.CheckOutDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Guest Info */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                            {(booking.CustomerName || 'G').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm">{booking.CustomerName || 'Guest'}</div>
                                                            <div className="text-xs text-gray-400">{booking.CustomerMobile}</div>
                                                            {booking.CustomerEmail && <div className="text-xs text-gray-400">{booking.CustomerEmail}</div>}
                                                            <BookingSourceBadge source={booking.booking_source} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Payment Status (Mocked for now) */}
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                                                            Paid
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">Via Razorpay</span>
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="p-4 text-right">
                                                    <div className="font-bold text-gray-900">₹{Math.round(booking.TotalAmount || 0).toLocaleString()}</div>
                                                    <div className="text-[10px] text-gray-400">inc. taxes</div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(booking.Status || 'pending')}`}>
                                                        {booking.Status || 'Pending'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end">
                                                        <ActionButtons booking={booking} onUpdate={handleStatusUpdate} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-3">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.BookingId} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">#{booking.BookingId}</span>
                                                <h3 className="font-bold text-gray-900">{booking.property?.Name}</h3>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusColor(booking.Status || 'pending')}`}>
                                                {booking.Status || 'Pending'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50">
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500 mb-0.5">Guest</div>
                                                <div className="font-semibold text-sm">{booking.CustomerName}</div>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="text-xs text-gray-500 mb-0.5">Dates</div>
                                                <div className="font-semibold text-sm">{new Date(booking.CheckInDate).toLocaleDateString()}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-xs text-gray-400">Total Amount</div>
                                                <div className="font-bold text-lg">₹{booking.TotalAmount?.toLocaleString()}</div>
                                            </div>
                                            <ActionButtons booking={booking} onUpdate={handleStatusUpdate} isMobile />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
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

function ActionButtons({ booking, onUpdate, isMobile }) {
    if (!booking.Status || booking.Status === 'pending') {
        return (
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'confirmed')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm ${isMobile ? 'flex-1' : ''}`}>
                    <FaCheck /> Confirm
                </button>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'rejected')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-xl text-xs font-bold transition ${isMobile ? 'flex-1' : ''}`}>
                    <FaTimes /> Reject
                </button>
            </div>
        );
    }
    if (booking.Status === 'confirmed') {
        return (
            <div className={isMobile ? 'flex w-full' : ''}>
                <button
                    onClick={() => onUpdate(booking.BookingId, 'cancelled')}
                    className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition ${isMobile ? 'flex-1' : ''}`}>
                    <FaBan /> Cancel Booking
                </button>
            </div>
        );
    }
    return null;
}
